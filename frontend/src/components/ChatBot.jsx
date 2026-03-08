import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, Keyboard, Cloud, Leaf, Flag, Coins, Users, AlertCircle, Volume2, Square } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

const initialWelcomeMessage = {
    role: 'bot',
    content: 'Hello! I am your CivicBridge AI. Ask me about weather, air quality, civic issues, city budget, or population data. I understand English, Hindi, and Tamil!',
    id: 'welcome'
};

const ChatBot = () => {
    const [messages, setMessages] = useState([initialWelcomeMessage]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const { language, setLanguage } = useLanguage();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSpeaking]);

    const speakText = (text, langCode) => {
        if (!window.speechSynthesis) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode || 'en-US';
        utterance.rate = 0.9;  // slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a specific voice for the language
        const voices = window.speechSynthesis.getVoices();
        const matchVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
        if (matchVoice) {
            utterance.voice = matchVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMessageId = Date.now();
        setMessages(prev => [...prev, { role: 'user', content: text, id: userMessageId }]);
        setInputText('');
        setIsLoading(true);

        // Add typing indicator
        setMessages(prev => [...prev, { role: 'bot', content: '', id: 'typing', isTyping: true }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    language: language.code,
                    city: 'Chicago',
                    session_id: sessionStorage.getItem('chat_session') || ''
                })
            });

            const data = await res.json();

            // Auto-switch language if backend detected different language
            if (data.detected_language && data.detected_language !== language.code) {
                const detected = LANGUAGES.find(l => l.code === data.detected_language);
                if (detected) setLanguage(detected);
            }

            // Remove typing indicator, add real reply
            setMessages(prev => [
                ...prev.filter(m => m.id !== 'typing'),
                {
                    role: 'bot',
                    content: data.reply,
                    id: Date.now(),
                    intent: data.intent,
                    detectedLang: data.detected_language
                }
            ]);

            // Speak the reply if speak=true
            if (data.speak && data.reply) {
                speakText(data.reply, data.detected_language || language.code);
            }

        } catch (err) {
            setMessages(prev => [
                ...prev.filter(m => m.id !== 'typing'),
                {
                    role: 'bot',
                    content: 'Sorry, I could not connect to the server. Please try again.',
                    id: Date.now(),
                    isError: true
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const getIntentBadge = (intent) => {
        switch (intent) {
            case 'weather':
                return <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20"><Cloud className="w-3 h-3" /> Weather</span>;
            case 'air_quality':
            case 'air':
                return <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20"><Leaf className="w-3 h-3" /> Air Quality</span>;
            case 'issues':
                return <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20"><Flag className="w-3 h-3" /> Civic Issue</span>;
            case 'budget':
                return <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20"><Coins className="w-3 h-3" /> City Budget</span>;
            case 'census':
                return <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20"><Users className="w-3 h-3" /> Census Data</span>;
            default:
                return null;
        }
    };

    // Quick chips logic based on current language
    const getQuickChips = () => {
        if (language.code === 'hi-IN') {
            return ['Aaj ka mausam', 'Vayu guna', 'Nagarik samasya', 'Shahar bajat'];
        } else if (language.code === 'ta-IN') {
            return ['Indru vanilam', 'Kaatrru tharam', 'Nagarik pirachanai', 'Nagar bajett'];
        }
        return ['Weather today', 'Air quality', 'Recent issues', 'City budget', 'Population'];
    };

    return (
        <div className="flex flex-col h-full bg-[#0b101e] rounded-3xl overflow-hidden border border-[var(--border)] relative shadow-2xl">
            {/* Header / Stop Speaking Overlay */}
            <AnimatePresence>
                {isSpeaking && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 left-0 right-0 z-20 flex justify-center p-3"
                    >
                        <button
                            onClick={stopSpeaking}
                            className="glass flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-white text-sm shadow-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all font-medium"
                        >
                            <Square className="w-4 h-4 fill-red-500 text-red-500" />
                            Stop Speaking
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-cyan)]/20 flex items-center justify-center text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold font-display text-sm tracking-wide">CivicBridge AI</h3>
                        <p className="text-[10px] text-[var(--caption)] uppercase tracking-widest text-[var(--accent-cyan)] flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse shadow-[0_0_5px_rgba(0,212,255,0.8)]" />
                            Online & Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 pb-4">
                {messages.map((msg) => {
                    if (msg.role === 'user') {
                        return (
                            <div key={msg.id} className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-white/10 border-white/20 text-white shadow-lg">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="p-4 bg-[#1a2744] text-white rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                            </div>
                        );
                    } else {
                        // Bot bubble logic
                        return (
                            <div key={msg.id} className="flex gap-3 max-w-[85%] relative group">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] shadow-lg pt-[1px]">
                                    <Bot className="w-4 h-4" />
                                </div>

                                <div className="flex flex-col gap-1.5 min-w-0">
                                    {msg.isTyping ? (
                                        <div className="p-4 glass text-white rounded-2xl rounded-tl-sm w-20 flex items-center justify-center gap-1.5 h-[52px]">
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce" style={{ animationDelay: '0s' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    ) : msg.isError ? (
                                        <div className="p-4 glass text-white rounded-2xl rounded-tl-sm border-red-500/50 flex gap-2 items-start text-sm">
                                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                            <span className="text-red-200">{msg.content}</span>
                                        </div>
                                    ) : (
                                        <div className="p-4 glass text-white rounded-2xl rounded-tl-sm shadow-[0_4px_20px_rgba(0,212,255,0.03)] text-sm leading-relaxed whitespace-pre-wrap relative border border-[var(--border)] group-hover:border-[var(--accent-cyan)]/20 transition-colors">
                                            {msg.content}

                                            {/* Speaking Waveform Indicator (only on bottom-most bot msg if speaking) */}
                                            {isSpeaking && messages[messages.length - 1]?.id === msg.id && (
                                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                                                    <Volume2 className="w-3 h-3 text-[var(--accent-cyan)]" />
                                                    <div className="flex items-end gap-[1px] h-3">
                                                        <motion.div animate={{ height: ['30%', '100%', '40%'] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} className="w-0.5 bg-[var(--accent-cyan)] rounded-t-sm" />
                                                        <motion.div animate={{ height: ['60%', '30%', '90%'] }} transition={{ duration: 0.5, delay: 0.1, repeat: Infinity, ease: 'easeInOut' }} className="w-0.5 bg-[var(--accent-cyan)] rounded-t-sm" />
                                                        <motion.div animate={{ height: ['80%', '50%', '30%'] }} transition={{ duration: 0.5, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }} className="w-0.5 bg-[var(--accent-cyan)] rounded-t-sm" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Intent Badge */}
                                    {msg.intent && !msg.isError && (
                                        <div className="flex pl-1">
                                            {getIntentBadge(msg.intent)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-[var(--border)] shrink-0 flex flex-col gap-3">
                {/* Quick Suggestion Chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {getQuickChips().map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setInputText(chip);
                                sendMessage(chip);
                            }}
                            className="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 hover:border-[var(--accent-cyan)]/30 transition-colors shrink-0"
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 w-full relative">
                    <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors shrink-0 hidden sm:flex">
                        <Keyboard className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                        placeholder="Ask about weather, air quality, civic issues..."
                        className="flex-1 h-12 bg-[#111827] border border-[rgba(255,255,255,0.08)] text-white rounded-xl pl-4 pr-12 text-sm focus:border-[var(--accent-cyan)]/50 focus:ring-1 focus:ring-[var(--accent-cyan)]/50 outline-none placeholder:text-gray-500"
                    />

                    <button
                        onClick={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || isLoading}
                        className="absolute right-1 top-1 w-10 h-10 rounded-lg bg-[var(--accent-cyan)] text-black flex items-center justify-center disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 transition-colors hover:scale-105 active:scale-95"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
