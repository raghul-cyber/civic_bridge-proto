import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
    const { language, setLanguage, INDIAN_LANGUAGES } = useLanguage();

    return (
        <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide py-2 px-1">
            <div className="flex gap-3">
                {INDIAN_LANGUAGES.map((lang) => {
                    const isActive = language.code === lang.code;
                    return (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang)}
                            className={`relative px-4 py-1.5 rounded-full text-sm transition-colors ${isActive ? 'text-black font-bold' : 'text-cyan-400 border border-cyan-400/40 hover:bg-cyan-900/20'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeLang"
                                    className="absolute inset-0 bg-cyan-400 rounded-full"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{lang.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
