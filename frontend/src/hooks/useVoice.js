import { useState, useEffect, useRef } from 'react';

export function useVoice({ onTranscript, language = 'en-IN' }) {
    const recRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);
        const r = new SR();
        r.continuous = false;
        r.interimResults = true;
        r.maxAlternatives = 3;
        r.lang = language;

        r.onresult = (e) => {
            const t = Array.from(e.results).map(x => x[0].transcript).join('');
            setTranscript(t);
            if (e.results[e.results.length - 1].isFinal) {
                onTranscript && onTranscript(t);
            }
        };

        r.onerror = (e) => {
            const msgs = {
                'network': 'Voice needs HTTPS. Please type your question.',
                'not-allowed': 'Microphone permission denied. Allow mic in browser settings.',
                'no-speech': 'No speech detected. Please speak clearly.',
            };
            setError(msgs[e.error] || 'Voice error: ' + e.error);
            setIsListening(false);
        };

        r.onend = () => setIsListening(false);
        recRef.current = r;
    }, [language, onTranscript]);

    const startListening = async () => {
        setError(null);
        setTranscript('');
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recRef.current.lang = language;
            recRef.current.start();
            setIsListening(true);
        } catch (e) {
            setError(e.name === 'NotAllowedError'
                ? 'Please allow microphone access in your browser.'
                : e.message);
        }
    };

    const stopListening = () => {
        recRef.current?.stop();
        setIsListening(false);
    };

    return { isListening, transcript, error, isSupported, startListening, stopListening };
}
