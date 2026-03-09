import React, { createContext, useContext, useState } from 'react';

export const INDIAN_LANGUAGES = [
    { code: 'en-IN', label: 'EN', name: 'English', welcome: 'Hello! How can I help?' },
    { code: 'hi-IN', label: 'HI', name: 'Hindi', welcome: 'Namaste! Main kaise madad kar sakta hoon?' },
    { code: 'ta-IN', label: 'TA', name: 'Tamil', welcome: 'Vanakkam! Naan eppadi udhava?' },
    { code: 'te-IN', label: 'TE', name: 'Telugu', welcome: 'Namaskaram! Nenu ela sahayapadali?' },
    { code: 'kn-IN', label: 'KN', name: 'Kannada', welcome: 'Namaskara! Naanu hege sahaya?' },
    { code: 'bn-IN', label: 'BN', name: 'Bengali', welcome: 'Namaskar! Ami ki vabe sahajya korte pari?' },
    { code: 'mr-IN', label: 'MR', name: 'Marathi', welcome: 'Namaskar! Mi kashi madad karu shakto?' },
    { code: 'gu-IN', label: 'GU', name: 'Gujarati', welcome: 'Kem cho! Hu kevi rite madad kari shaku?' },
];

const LangCtx = createContext(null);

export function LanguageProvider({ children }) {
    const saved = localStorage.getItem('cb_lang');
    const initial = INDIAN_LANGUAGES.find(l => l.code === saved) || INDIAN_LANGUAGES[0];
    const [language, setLanguageState] = useState(initial);

    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem('cb_lang', lang.code);
    };

    return (
        <LangCtx.Provider value={{ language, setLanguage, INDIAN_LANGUAGES }}>
            {children}
        </LangCtx.Provider>
    );
}

export const useLanguage = () => useContext(LangCtx);
