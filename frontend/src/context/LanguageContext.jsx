import React, { createContext, useContext, useState } from 'react';

export const LANGUAGES = [
    { code: 'en-US', label: 'EN', name: 'English' },
    { code: 'hi-IN', label: 'HI', name: 'Hindi' },
    { code: 'ta-IN', label: 'TA', name: 'Tamil' },
    { code: 'te-IN', label: 'TE', name: 'Telugu' },
    { code: 'bn-IN', label: 'BN', name: 'Bengali' },
];

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(LANGUAGES[0]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
