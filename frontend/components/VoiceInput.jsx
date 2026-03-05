import React, { useState } from 'react';
import { Mic, Square, Check, AlertCircle } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechToText'; // Import specific hook logic

const SUPPORTED_LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'es-US', name: 'Spanish (US)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' }
];

export default function VoiceInput({ onTranscriptConfirm }) {
    const { transcript, isListening, startListening, stopListening, error } = useSpeechToText();
    const [selectedLang, setSelectedLang] = useState('en-US');

    const handleConfirm = () => {
        if (transcript.trim() && onTranscriptConfirm) {
            onTranscriptConfirm(transcript.trim());
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mt-6 pb-4 pt-2">

            {/* Header controls: Language Selector */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-slate-700 font-semibold tracking-wide">
                    Voice Dictation
                </h3>
                <div className="flex items-center space-x-2">
                    <label htmlFor="language" className="text-sm font-medium text-slate-500">Language:</label>
                    <select
                        id="language"
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        disabled={isListening}
                        className="p-1.5 text-sm rounded bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Content Body: Live Transcription Area */}
            <div className="p-6">
                <div className="relative">
                    <textarea
                        readOnly
                        value={transcript}
                        placeholder={isListening ? "Listening... Please speak." : "Tap the microphone icon to begin dictation."}
                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none resize-none"
                    />

                    {/* Listening overlay pulse indicator logic */}
                    {isListening && (
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-xs text-red-500 font-medium tracking-wide uppercase">Recording</span>
                        </div>
                    )}
                </div>

                {/* Footer Controls: Microphones & Accept */}
                <div className="mt-6 flex items-center justify-between">

                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`
                            flex items-center justify-center space-x-2 px-6 py-2.5 rounded-full font-medium transition-all duration-200
                            ${isListening
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'}
                        `}
                    >
                        {isListening ? (
                            <>
                                <Square className="w-4 h-4" />
                                <span>Stop Recording</span>
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5" />
                                <span>Start Dictation</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={!transcript.trim() || isListening}
                        className={`
                            flex items-center space-x-2 px-6 py-2.5 rounded border border-slate-200 font-medium transition-colors
                            ${(!transcript.trim() || isListening) ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'}
                        `}
                    >
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span>Use this text</span>
                    </button>

                </div>
            </div>
        </div>
    );
}
