import { useState, useEffect, useRef } from 'react';

export default function useVoice({ language = 'en-US', onTranscript }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // 1. Check for SpeechRecognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        // 2. Create recognition instance ONCE
        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognitionRef.current = recognition;
        }

        // Update language dynamically if it changes
        recognitionRef.current.lang = language;

        const recognition = recognitionRef.current;

        const handleStart = () => setIsListening(true);

        const handleResult = (event) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);
        };

        const handleError = (event) => {
            let errorMsg = event.error;
            if (errorMsg === 'network') {
                errorMsg = "Browser blocked Speech API. Please disable Brave Shields/AdBlock, or use 'Type' mode.";
            } else if (errorMsg === 'not-allowed') {
                errorMsg = "Microphone access denied.";
            } else if (errorMsg === 'no-speech') {
                errorMsg = "No speech detected. Please try again.";
            } else if (errorMsg === 'aborted') {
                errorMsg = "Speech recognition aborted.";
            }
            setError(new Error(errorMsg));
            setIsListening(false);
        };

        const handleEnd = () => {
            setIsListening(false);
            // Callback with final transcript on end
            if (onTranscript && transcript) {
                onTranscript(transcript);
            }
        };

        recognition.addEventListener('start', handleStart);
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', handleEnd);

        return () => {
            recognition.removeEventListener('start', handleStart);
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('error', handleError);
            recognition.removeEventListener('end', handleEnd);
        };
    }, [language, onTranscript, transcript]);

    const startListening = async () => {
        setError(null);
        setTranscript('');

        const isSecure = window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        if (!isSecure) {
            setError(new Error('Voice requires HTTPS. Please use text input.'));
            return;
        }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
        } catch (err) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                setError(new Error('Microphone permission denied. Click the mic icon in your browser address bar.'));
            } else if (err.name === 'NetworkError' || err.message.includes('network')) {
                setError(new Error('Voice requires HTTPS. Please type your question instead.'));
            } else {
                setError(new Error('Could not start voice. Please type your question.'));
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return { isListening, transcript, error, isSupported, startListening, stopListening };
}
