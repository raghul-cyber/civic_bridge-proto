import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook to handle Speech-To-Text processing.
 * Dual-Mode Strategy:
 * 1. Leverages the browser Web Speech API for real-time dictation if supported.
 * 2. Falls back to recording Audio Blobs and POSTing to backend for AWS Transcribe / local Whisper.
 */
export function useSpeechToText() {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Initialize Web Speech API
    const initSpeechRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPart = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        currentTranscript += transcriptPart + ' ';
                    } else {
                        currentTranscript += transcriptPart;
                    }
                }
                setTranscript((prev) => prev + currentTranscript);
            };

            recognition.onerror = (event) => {
                setError(`Speech recognition error: ${event.error}`);
                stopListening();
            };

            return recognition;
        }
        return null;
    }, []);

    // Fallback: Upload Audio Blob to Backend
    const processFallaudio = async (blob, language = 'en-US') => {
        const formData = new FormData();
        // Send as generic webm
        formData.append('file', blob, 'recording.webm');
        formData.append('language', language);
        formData.append('mode', 'aws'); // fallback to backend server AWS pipeline

        try {
            // Assumes Vite dev port 5173 proxies to FastAPI server, or direct link
            const response = await axios.post('http://localhost:8000/stt/transcribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setTranscript((prev) => prev + ' ' + response.data.transcript);
        } catch (err) {
            setError(`Backend transcription failed: ${err.message}`);
        }
    };

    const startListening = async () => {
        setError(null);
        setTranscript('');
        setIsListening(true);
        audioChunksRef.current = [];

        // Attempt browser API
        if (!recognitionRef.current) {
            recognitionRef.current = initSpeechRecognition();
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (err) {
                // Ignore DOMException if already started
                console.warn(err);
            }
        }

        // Always dual-record Audio BLOB as fallback incase Web Speech API aborts prematurely or isn't supported
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // If Web Speech API wasn't supported, send blob to backend
                if (!recognitionRef.current) {
                    processFallaudio(audioBlob);
                }
                // Cleanup tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
        } catch (err) {
            setError(`Microphone access denied: ${err.message}`);
            setIsListening(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    };

    const stopListening = () => {
        setIsListening(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    return {
        transcript,
        isListening,
        startListening,
        stopListening,
        error
    };
}
