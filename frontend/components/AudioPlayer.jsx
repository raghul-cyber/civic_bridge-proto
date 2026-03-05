import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Loader2, AlertCircle, Languages } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const LANGUAGES = [
    { code: 'en-US', label: 'English' },
    { code: 'es-US', label: 'Spanish' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'fr-FR', label: 'French' },
    { code: 'pt-BR', label: 'Portuguese' }
];

/**
 * AudioPlayer component for CivicBridge.
 * Props:
 *   text        — the text to speak
 *   language    — language code (default: en-US)
 *   mode        — "polly" | "gtts" (default: polly)
 *   label       — optional button label override
 *   compact     — if true, renders as a small icon button
 */
export default function AudioPlayer({
    text = '',
    language = 'en-US',
    mode = 'polly',
    label,
    compact = false
}) {
    const { speak, stop, cleanup, isSpeaking, isLoading, error } = useTextToSpeech();
    const [selectedLang, setSelectedLang] = useState(language);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const handleToggle = () => {
        if (isSpeaking) {
            stop();
        } else {
            speak(text, selectedLang, mode);
        }
    };

    // ── Compact mode: single icon button ──
    if (compact) {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading || !text.trim()}
                title={isSpeaking ? 'Stop' : 'Listen'}
                className={`
                    inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
                    ${isSpeaking
                        ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}
                    disabled:opacity-40 disabled:cursor-not-allowed
                `}
            >
                {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : isSpeaking
                        ? <VolumeX className="w-4 h-4" />
                        : <Volume2 className="w-4 h-4" />
                }
            </button>
        );
    }

    // ── Full mode: card with controls ──
    return (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Audio Playback</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Languages className="w-3.5 h-3.5 text-slate-400" />
                    <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        disabled={isSpeaking || isLoading}
                        className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">

                {/* Text Preview */}
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100 max-h-24 overflow-y-auto">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {text || <span className="italic text-slate-400">No text provided</span>}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-3 flex items-center space-x-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Audio Waveform Animation */}
                {isSpeaking && (
                    <div className="mb-4 flex items-end justify-center space-x-1 h-8">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-blue-400 rounded-full"
                                style={{
                                    animation: `audioWave 0.8s ease-in-out infinite`,
                                    animationDelay: `${i * 0.07}s`,
                                    height: `${Math.random() * 80 + 20}%`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Play / Stop Button */}
                <button
                    onClick={handleToggle}
                    disabled={isLoading || !text.trim()}
                    className={`
                        w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-medium transition-all duration-200
                        ${isSpeaking
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating audio...</span>
                        </>
                    ) : isSpeaking ? (
                        <>
                            <VolumeX className="w-5 h-5" />
                            <span>Stop Playing</span>
                        </>
                    ) : (
                        <>
                            <Volume2 className="w-5 h-5" />
                            <span>{label || 'Read Aloud'}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Inline CSS for waveform animation */}
            <style>{`
                @keyframes audioWave {
                    0%, 100% { transform: scaleY(0.3); }
                    50% { transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
}
