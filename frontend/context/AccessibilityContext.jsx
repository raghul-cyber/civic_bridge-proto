import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

/**
 * @typedef {object} AccessibilityState
 * @property {number}   fontSize       – Body font scale, 100–150 (percentage).
 * @property {boolean}  highContrast   – Whether high-contrast mode is on.
 * @property {string}   language       – App-wide language code (e.g. "en-US").
 * @property {boolean}  voiceInput     – Global mic input toggle.
 * @property {Function} setFontSize    – Set font scale (100–150).
 * @property {Function} setHighContrast
 * @property {Function} setLanguage
 * @property {Function} setVoiceInput
 * @property {Function} speak          – TTS speak function.
 * @property {Function} stop           – TTS stop function.
 * @property {boolean}  isSpeaking     – Whether TTS is currently playing.
 * @property {Function} readPage       – Extracts visible DOM text and reads it aloud.
 */

const AccessibilityContext = createContext(null);

const STORAGE_KEY = 'civicbridge_a11y';

/** Read persisted settings from localStorage. */
function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

/** Write settings to localStorage. */
function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
}

/**
 * AccessibilityProvider — wraps the entire application to expose
 * accessibility preferences via React Context.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function AccessibilityProvider({ children }) {
    const saved = loadSettings();

    const [fontSize, setFontSizeRaw] = useState(saved?.fontSize ?? 100);
    const [highContrast, setHighContrast] = useState(saved?.highContrast ?? false);
    const [language, setLanguage] = useState(saved?.language ?? 'en-US');
    const [voiceInput, setVoiceInput] = useState(saved?.voiceInput ?? false);

    const { speak, stop, isSpeaking } = useTextToSpeech();

    // ── Persist every change ──
    useEffect(() => {
        saveSettings({ fontSize, highContrast, language, voiceInput });
    }, [fontSize, highContrast, language, voiceInput]);

    // ── Apply font-size to <html> ──
    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
    }, [fontSize]);

    // ── Toggle .high-contrast class on <body> ──
    useEffect(() => {
        if (highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }, [highContrast]);

    // ── Bounded font-size setter (100–150) ──
    const setFontSize = useCallback((val) => {
        setFontSizeRaw(Math.min(150, Math.max(100, val)));
    }, []);

    // ── Read Page: extract visible text and speak it ──
    const readPage = useCallback(() => {
        const main = document.querySelector('main') || document.body;
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    return NodeFilter.FILTER_REJECT;
                }
                const tag = parent.tagName;
                if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tag)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });

        let text = '';
        while (walker.nextNode()) {
            text += walker.currentNode.textContent.trim() + '. ';
        }

        if (text.trim()) {
            speak(text.substring(0, 3000)); // Polly 3 000 char limit
        }
    }, [speak]);

    /** @type {AccessibilityState} */
    const value = {
        fontSize,
        highContrast,
        language,
        voiceInput,
        setFontSize,
        setHighContrast,
        setLanguage,
        setVoiceInput,
        speak,
        stop,
        isSpeaking,
        readPage
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

/**
 * Hook to access accessibility settings from any component.
 * @returns {AccessibilityState}
 */
export function useAccessibility() {
    const ctx = useContext(AccessibilityContext);
    if (!ctx) throw new Error('useAccessibility must be used within an AccessibilityProvider');
    return ctx;
}
