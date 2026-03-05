import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2, ChevronDown } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

/**
 * Available Polly voices — kept in sync with the backend catalogue.
 * @type {Array<{id: string, label: string, lang: string}>}
 */
const VOICES = [
    { id: 'Joanna', label: 'Joanna (EN-US)', lang: 'en-US' },
    { id: 'Miguel', label: 'Miguel (ES-US)', lang: 'es-US' },
    { id: 'Aditi', label: 'Aditi (HI-IN)', lang: 'hi-IN' },
    { id: 'Celine', label: 'Celine (FR-FR)', lang: 'fr-FR' },
    { id: 'Vitoria', label: 'Vitoria (PT-BR)', lang: 'pt-BR' }
];

/**
 * TextToSpeech — a small, reusable speaker-icon button that can be
 * placed next to any text block. On click it fetches audio from the
 * TTS API and plays it. While playing it shows a 5-bar CSS waveform.
 *
 * Keyboard accessible: Space / Enter to toggle playback.
 *
 * @param {object}  props
 * @param {string}  props.text         – The text to read aloud.
 * @param {string}  [props.voiceId]    – Override default Polly voice.
 * @param {boolean} [props.showVoiceSelector] – If true, show a popover to pick voice.
 * @param {string}  [props.className]  – Extra wrapper classes.
 */
export default function TextToSpeech({
    text = '',
    voiceId,
    showVoiceSelector = false,
    className = ''
}) {
    const { isSpeaking, isLoading, error, selectedVoice, setVoice, speak, stop } = useTextToSpeech();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const popoverRef = useRef(null);

    // Close popover on outside click
    useEffect(() => {
        const handler = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /** Toggle playback on click or keyboard Enter/Space. */
    const handleToggle = () => {
        if (isSpeaking) {
            stop();
        } else {
            speak(text, voiceId || selectedVoice);
        }
    };

    /** Keyboard handler for a11y. */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <div className={`inline-flex items-center gap-1.5 relative ${className}`}>

            {/* ── Main Button ── */}
            <button
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={isLoading || !text.trim()}
                aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
                title={error || (isSpeaking ? 'Stop' : 'Read aloud')}
                className={`
                    inline-flex items-center justify-center
                    w-8 h-8 rounded-full transition-all duration-200 outline-none
                    focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
                    ${isSpeaking
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}
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

            {/* ── Waveform: 5 animated bars ── */}
            {isSpeaking && (
                <div className="flex items-end gap-[2px] h-5" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <span
                            key={i}
                            className="inline-block w-[3px] rounded-full bg-blue-400"
                            style={{
                                animation: 'ttsWave 0.9s ease-in-out infinite',
                                animationDelay: `${i * 0.12}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── Voice selector popover ── */}
            {showVoiceSelector && (
                <div className="relative" ref={popoverRef}>
                    <button
                        type="button"
                        onClick={() => setPopoverOpen(!popoverOpen)}
                        aria-label="Select voice"
                        className="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1"
                    >
                        <span>{selectedVoice}</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {popoverOpen && (
                        <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                            {VOICES.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => { setVoice(v.id); setPopoverOpen(false); }}
                                    className={`
                                        w-full text-left px-3 py-1.5 text-sm transition-colors
                                        ${selectedVoice === v.id
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Waveform keyframe CSS ── */}
            <style>{`
                @keyframes ttsWave {
                    0%, 100% { height: 4px; }
                    50%      { height: 16px; }
                }
            `}</style>
        </div>
    );
}
