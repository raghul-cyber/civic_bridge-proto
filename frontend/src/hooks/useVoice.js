import { useState, useCallback, useRef, useEffect } from 'react';

const useVoice = (options = {}) => {
    const {
        language = 'en-US',
        onStart,
        onStop,
        onResult,
        onError
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState({ final: '', interim: '' });
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech recognition not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
            setIsListening(true);
            onStart?.();
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = transcript.final;

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            const newTranscript = { final, interim };
            setTranscript(newTranscript);
            onResult?.(newTranscript);
        };

        recognition.onerror = (event) => {
            setError(event.error);
            onError?.(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            onStop?.();
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [language, onStart, onStop, onResult, onError, transcript.final]);

    const start = useCallback(() => {
        setError(null);
        setTranscript({ final: '', interim: '' });
        try {
            recognitionRef.current?.start();
        } catch (e) {
            console.error(e);
        }
    }, []);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const reset = useCallback(() => {
        setTranscript({ final: '', interim: '' });
    }, []);

    return {
        isListening,
        transcript,
        error,
        start,
        stop,
        reset
    };
};

export default useVoice;
