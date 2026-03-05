import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

/**
 * Custom React hook for Text-to-Speech playback.
 *
 * Calls POST /tts/synthesize (returns audio/mpeg stream),
 * creates a Blob URL and plays it through HTML5 Audio.
 *
 * @returns {{
 *   isSpeaking:    boolean,
 *   isLoading:     boolean,
 *   error:         string | null,
 *   selectedVoice: string,
 *   setVoice:      (v: string) => void,
 *   speak:         (text: string, voiceId?: string) => Promise<void>,
 *   stop:          () => void
 * }}
 */
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVoice, setVoice] = useState('Joanna');
    const audioRef = useRef(null);
    const blobUrlRef = useRef(null);

    /**
     * Fetches audio from the TTS API and plays it.
     * @param {string}  text     – The text to speak.
     * @param {string} [voiceId] – Polly voice ID override.
     */
    const speak = useCallback(async (text, voiceId) => {
        if (!text?.trim()) return;

        // Stop any existing playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }

        setIsLoading(true);
        setError(null);
        setIsSpeaking(false);

        try {
            const response = await axios.post(
                `${API_BASE}/tts/synthesize`,
                {
                    text,
                    voice: voiceId || selectedVoice,
                    language: 'en-US',
                    mode: 'polly'
                },
                { responseType: 'blob' }
            );

            const blob = new Blob([response.data], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onplay = () => {
                setIsSpeaking(true);
                setIsLoading(false);
            };

            audio.onended = () => {
                setIsSpeaking(false);
            };

            audio.onerror = () => {
                setError('Audio playback failed.');
                setIsSpeaking(false);
                setIsLoading(false);
            };

            await audio.play();
        } catch (err) {
            setError(`TTS request failed: ${err.message}`);
            setIsLoading(false);
        }
    }, [selectedVoice]);

    /** Stops current playback immediately. */
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsSpeaking(false);
    }, []);

    return { isSpeaking, isLoading, error, selectedVoice, setVoice, speak, stop };
}
