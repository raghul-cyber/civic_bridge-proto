import React, { useState } from 'react';
import {
    Accessibility, X, Volume2, VolumeX, Mic, MicOff,
    Type, Contrast, Languages, BookOpen, Loader2
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const LANGUAGES = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'es-US', label: 'Spanish (US)' },
    { code: 'hi-IN', label: 'Hindi (India)' },
    { code: 'fr-FR', label: 'French (France)' },
    { code: 'pt-BR', label: 'Portuguese (Brazil)' }
];

/**
 * AccessibilityPanel — A floating a11y button (bottom-right) that opens
 * a slide-in settings panel. All settings persist via localStorage
 * through the AccessibilityContext.
 */
export default function AccessibilityPanel() {
    const [isOpen, setIsOpen] = useState(false);

    const {
        fontSize, setFontSize,
        highContrast, setHighContrast,
        language, setLanguage,
        voiceInput, setVoiceInput,
        readPage, stop, isSpeaking
    } = useAccessibility();

    return (
        <>
            {/* ── Floating Trigger Button ── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Accessibility settings"
                className={`
                    fixed bottom-6 right-6 z-50
                    w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center
                    transition-all duration-300 outline-none
                    focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2
                    ${isOpen
                        ? 'bg-slate-700 text-white rotate-0'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:scale-105'}
                `}
            >
                {isOpen
                    ? <X className="w-6 h-6" />
                    : <Accessibility className="w-6 h-6" />
                }
            </button>

            {/* ── Backdrop ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ── Slide-in Panel ── */}
            <div
                className={`
                    fixed right-0 top-0 h-full w-80 z-50
                    bg-white shadow-2xl border-l border-slate-200
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
                role="dialog"
                aria-label="Accessibility settings panel"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2">
                        <Accessibility className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-800">Accessibility</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        aria-label="Close panel"
                        className="p-1 rounded hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Settings Body */}
                <div className="px-5 py-6 space-y-6 overflow-y-auto h-[calc(100%-64px)]">

                    {/* 1. Read Page */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            Read Page Aloud
                        </label>
                        <button
                            onClick={isSpeaking ? stop : readPage}
                            className={`
                                w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all
                                ${isSpeaking
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
                            `}
                        >
                            {isSpeaking
                                ? <><VolumeX className="w-4 h-4" /><span>Stop Reading</span></>
                                : <><Volume2 className="w-4 h-4" /><span>Read Page</span></>
                            }
                        </button>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 2. Voice Input Toggle */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            {voiceInput
                                ? <Mic className="w-4 h-4 text-emerald-500" />
                                : <MicOff className="w-4 h-4 text-slate-400" />
                            }
                            Voice Input
                        </label>
                        <button
                            onClick={() => setVoiceInput(!voiceInput)}
                            className={`
                                w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                                ${voiceInput
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}
                            `}
                        >
                            <span>{voiceInput ? 'Enabled — mic active for forms' : 'Disabled'}</span>
                            <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${voiceInput ? 'bg-emerald-400' : 'bg-slate-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${voiceInput ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 3. Font Size Slider */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Type className="w-4 h-4 text-indigo-500" />
                            Font Size
                            <span className="ml-auto text-xs font-normal text-slate-400">{fontSize}%</span>
                        </label>
                        <input
                            type="range"
                            min={100}
                            max={150}
                            step={5}
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>100%</span>
                            <span>125%</span>
                            <span>150%</span>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 4. High Contrast Toggle */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Contrast className="w-4 h-4 text-amber-500" />
                            High Contrast
                        </label>
                        <button
                            onClick={() => setHighContrast(!highContrast)}
                            className={`
                                w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                                ${highContrast
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}
                            `}
                        >
                            <span>{highContrast ? 'On — enhanced visibility' : 'Off — default colors'}</span>
                            <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${highContrast ? 'bg-amber-400' : 'bg-slate-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 5. Language Selector */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Languages className="w-4 h-4 text-teal-500" />
                            Language
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Footer hint */}
                    <p className="text-xs text-slate-400 text-center pt-4">
                        Settings are saved automatically.
                    </p>
                </div>
            </div>
        </>
    );
}
