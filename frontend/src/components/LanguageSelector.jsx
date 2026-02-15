import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'kn', name: 'Kannada', native: 'कन्नड़' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
];

export default function LanguageSelector({ selectedLang, onSelect }) {
    return (
        <div className="flex gap-2 p-2 overflow-x-auto scrollbar-none">
            {languages.map((lang) => (
                <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(lang.code)}
                    className={`
            relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all shrink-0
            ${selectedLang === lang.code
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-transparent text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'}
          `}
                >
                    <span className="text-xs font-medium">{lang.native}</span>
                    {selectedLang === lang.code && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-white rounded-full p-0.5"
                        >
                            <Check className="w-2 h-2 text-blue-600" />
                        </motion.div>
                    )}
                </motion.button>
            ))}
        </div>
    );
}
