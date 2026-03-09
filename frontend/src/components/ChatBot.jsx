import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, VolumeX, Map as MapIcon, X, Info, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../hooks/useVoice';
import { speakIndian } from '../utils/speakIndian';
import LanguageSelector from './LanguageSelector';

// Lazy load IndiaMap to avoid heavy bundle if not used immediately
const IndiaMap = React.lazy(() => import('./IndiaMap'));

/* ────────────────────────────────────────────────────────────
   1. WEATHER CARD
   ──────────────────────────────────────────────────────────── */
const WeatherCard = ({ data, city }) => {
    if (!data) return null;
    return (
        <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl p-5 w-[300px] text-white shadow-xl">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold" style={{ fontFamily: '"Clash Display", sans-serif' }}>{city}</h3>
                    <p className="text-sm text-blue-200">{data.description || 'Sunny'}</p>
                </div>
                <div className="text-4xl font-bold" style={{ fontFamily: '"Clash Display", sans-serif' }}>
                    {data.temp_c}°C
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-lg p-2 flex flex-col items-center border border-white/5">
                    <span className="text-blue-300 text-xs">Humidity</span>
                    <span className="font-semibold">{data.humidity}%</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 flex flex-col items-center border border-white/5">
                    <span className="text-blue-300 text-xs">Wind</span>
                    <span className="font-semibold">{data.wind_kmph} km/h</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 flex flex-col items-center border border-white/5">
                    <span className="text-blue-300 text-xs">UV Index</span>
                    <span className="font-semibold">{data.uv_index || 0}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 flex flex-col items-center border border-white/5">
                    <span className="text-blue-300 text-xs">Feels Like</span>
                    <span className="font-semibold">{data.feels_like}°C</span>
                </div>
            </div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   2. AQI CARD
   ──────────────────────────────────────────────────────────── */
const AQICard = ({ data }) => {
    if (!data) return null;
    // Get main AQI value (using pm2.5 as proxy if overall 'aqi' is missing)
    const valText = data.aqi || data.pm25 || data['pm2.5'] || '50';
    const val = parseInt(String(valText).replace(/[^0-9]/g, ''), 10) || 50;

    let color = '#22C55E'; let status = 'Good';
    if (val > 50) { color = '#EAB308'; status = 'Moderate'; }
    if (val > 100) { color = '#F97316'; status = 'Poor'; }
    if (val > 200) { color = '#EF4444'; status = 'Very Poor'; }
    if (val > 300) { color = '#7C3AED'; status = 'Severe'; }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-[300px] text-white">
            <div className="flex items-center gap-4 mb-4">
                {/* Simple Ring Gauge */}
                <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700" />
                        <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="8" fill="transparent" strokeDasharray={`${Math.min(val / 5, 100) * 2.51} 251.2`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold" style={{ color }}>{val}</span>
                        <span className="text-[10px] text-gray-400">AQI</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold" style={{ color }}>{status}</h3>
                    <p className="text-xs text-gray-400 mt-1">Status as per national standards</p>
                </div>
            </div>
            <div className="flex gap-2 justify-center">
                {Object.entries(data).slice(0, 3).map(([k, v]) => {
                    if (k === 'source') return null;
                    return (
                        <div key={k} className="px-2 py-1 bg-black/40 rounded border border-white/10 text-xs">
                            <span className="text-gray-400 capitalize">{k.replace('.', '')}</span> {String(v).substring(0, 8)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   3. LAW CARD
   ──────────────────────────────────────────────────────────── */
const LawCard = ({ data }) => {
    if (!data || !data.results || data.results.length === 0) return null;
    const doc = data.results[0]; // main result
    return (
        <div className="bg-[#111] border border-yellow-600/30 rounded-2xl p-4 w-[320px] text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Legal Reference</span>
            </div>
            <h4 className="text-sm font-bold text-cyan-300 bg-cyan-900/30 px-2 py-1 rounded inline-block mb-2">
                {doc.title.substring(0, 50)}...
            </h4>
            <p className="text-xs text-gray-300 mb-3 line-clamp-4" dangerouslySetInnerHTML={{ __html: doc.headline }}></p>
            <a href={`https://indiankanoon.org/doc/${doc.tid}/`} target="_blank" rel="noreferrer"
                className="text-yellow-500 text-xs hover:underline flex items-center gap-1 font-semibold">
                View on IndiaKanoon <span aria-hidden="true">→</span>
            </a>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   4. SCHEME CARD
   ──────────────────────────────────────────────────────────── */
const SchemeCard = ({ schemes }) => {
    if (!schemes || schemes.length === 0) return null;
    const s = schemes[0];
    return (
        <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border border-green-500/30 rounded-2xl p-4 w-[320px] text-white">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm leading-snug">{s.basicDetails?.schemeName || 'Govt Scheme'}</h4>
                    <span className="text-[10px] text-green-300 uppercase tracking-wider">{s.basicDetails?.nodalMinistryName}</span>
                </div>
            </div>
            <p className="text-xs text-gray-300 line-clamp-3 mb-4">{s.basicDetails?.schemeDescription}</p>
            <div className="flex gap-2">
                <button className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                    Apply Now
                </button>
            </div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   5. MANDI CARD
   ──────────────────────────────────────────────────────────── */
const MandiCard = ({ data }) => {
    if (!data || !data.prices || data.prices.length === 0) return null;
    const item = data.prices[0];
    return (
        <div className="bg-[#1f1d10] border border-amber-500/30 rounded-2xl p-4 w-[300px] text-white">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-amber-500 capitalize flex items-center gap-2">
                    <span>🌾</span> {item.commodity}
                </h4>
                <span className="text-[10px] bg-amber-900/40 text-amber-300 px-2 py-1 rounded">{item.arrival_date}</span>
            </div>
            <div className="text-sm font-medium mb-1">{item.market}, {item.state}</div>
            <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-black/40 rounded p-2 text-center">
                    <div className="text-[10px] text-gray-500">Min</div>
                    <div className="text-xs font-bold font-mono">₹{item.min_price}</div>
                </div>
                <div className="bg-amber-900/20 rounded p-2 text-center border border-amber-500/20">
                    <div className="text-[10px] text-amber-400">Modal</div>
                    <div className="text-sm font-bold text-amber-500 font-mono">₹{item.modal_price}</div>
                </div>
                <div className="bg-black/40 rounded p-2 text-center">
                    <div className="text-[10px] text-gray-500">Max</div>
                    <div className="text-xs font-bold font-mono">₹{item.max_price}</div>
                </div>
            </div>
            <div className="text-center text-[10px] text-gray-500 mt-2">Prices in Rs/Quintal</div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────
   6. ISSUES CARD
   ──────────────────────────────────────────────────────────── */
const IssuesCard = ({ data, onShowMap }) => {
    if (!data || !data.issues) return null;
    const count = data.count || data.issues.length;
    return (
        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-2xl p-4 w-[320px] text-white">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold">{count} Open Issues Found</h4>
            </div>
            <div className="space-y-2 mb-4">
                {data.issues.slice(0, 3).map((issue, idx) => (
                    <div key={idx} className="bg-black/30 rounded px-3 py-2 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${issue.priority === 'High' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                        <div className="truncate">
                            <div className="text-xs font-semibold truncate">{issue.title || 'Civic Issue'}</div>
                            <div className="text-[10px] text-cyan-400">{issue.category || 'General'}</div>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={onShowMap}
                className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-bold py-2 rounded-lg transition-colors border border-cyan-500/30 flex justify-center items-center gap-2">
                <MapIcon className="w-3 h-3" /> See on Map
            </button>
        </div>
    );
};


/* ────────────────────────────────────────────────────────────
   MAIN CHATBOT COMPONENT
   ──────────────────────────────────────────────────────────── */
export default function ChatBot() {
    const { user, token, logout } = useAuth();
    const { language, setLanguage, INDIAN_LANGUAGES } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('cb_autoSpeak') !== 'false');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Modals / Maps
    const [showFullMap, setShowFullMap] = useState(false);
    const [mapMarkers, setMapMarkers] = useState([]);

    const messagesEndRef = useRef(null);

    // Voice Hook Integration 
    const {
        isListening, transcript, error: voiceError, startListening, stopListening, isSupported
    } = useVoice({
        language: language.code,
        onTranscript: (t) => {
            // Auto-send fully recognized transcript after short delay
            if (t.trim()) {
                setInput(t);
                setTimeout(() => handleSend(t), 800);
            }
        }
    });

    // Welcome Message Initialization
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'bot',
                type: 'welcome',
                lang: language.code
            }]);
        }
    }, [language.code, messages.length]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, transcript]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+M: Toggle Mic
            if (e.ctrlKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                isListening ? stopListening() : startListening();
            }
            // Ctrl+L: Clear Chat
            if (e.ctrlKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                setMessages([]);
            }
            // Esc: Stop speaking
            if (e.key === 'Escape' && isSpeaking) {
                window.speechSynthesis?.cancel();
                setIsSpeaking(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isListening, startListening, stopListening, isSpeaking]);

    const toggleAutoSpeak = () => {
        const next = !autoSpeak;
        setAutoSpeak(next);
        localStorage.setItem('cb_autoSpeak', String(next));
        if (!next) window.speechSynthesis?.cancel();
    };

    const handleSend = async (textToSend = input) => {
        if (!textToSend.trim()) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        if (isListening) stopListening();
        setIsTyping(true);

        try {
            const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    message: textToSend,
                    city: localStorage.getItem('cb_city') || 'Mumbai',
                    language: language.code
                })
            });

            if (res.status === 401) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', content: 'Session expired. Please sign in again.' }]);
                setTimeout(logout, 2000);
                return;
            }

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();

            // Auto-switch language if backend detected a different one
            if (data.detected_language && data.detected_language !== language.code) {
                const matched = INDIAN_LANGUAGES.find(l => l.code === data.detected_language);
                if (matched) setLanguage(matched);
            }

            const botMsg = {
                id: Date.now().toString() + 'b',
                role: 'bot',
                content: data.reply,
                intent: data.intent,
                data: data.data,
                map_markers: data.map_markers || [],
                suggestions: data.suggestions || [],
                lang: data.detected_language || language.code
            };

            setMessages(prev => [...prev, botMsg]);

            // Auto-speak response
            if (autoSpeak && data.reply) {
                setIsSpeaking(true);
                speakIndian(data.reply, data.detected_language || language.code, {
                    onEnd: () => setIsSpeaking(false)
                });
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(), role: 'error',
                content: 'Server offline or taking too long. Please check connection.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const currentSuggestions = messages.length > 0 && messages[messages.length - 1].suggestions
        ? messages[messages.length - 1].suggestions
        : ['Check Air Quality', 'Report Pothole', 'Learn About RTI', 'Mandi Prices'];

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0a0f1d] font-sans overflow-hidden">

            {/* ────────────────────────────────────────────────────────────
          CHAT HEADER
          ──────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-cyan-900/50 border border-cyan-400/50 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0f1d] rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-white font-bold" style={{ fontFamily: '"Clash Display", sans-serif' }}>CivicBridge AI</h1>
                        <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold tracking-wider">
                            ONLINE & ACTIVE
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleAutoSpeak}
                        className={`p-2 rounded-lg transition-colors ${autoSpeak ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        title="Toggle Auto Speak"
                    >
                        {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => { setMessages([]); window.speechSynthesis?.cancel(); }}
                        className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Clear Chat (Ctrl+L)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-black/20 border-b border-white/5">
                <LanguageSelector />
            </div>

            {/* ────────────────────────────────────────────────────────────
          MESSAGES AREA
          ──────────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 space-y-6 scrollbar-hide">
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'bot' && (
                                <div className="w-8 h-8 rounded-lg bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center mr-3 mt-1 shrink-0">
                                    <span className="text-cyan-400 text-xs font-bold">AI</span>
                                </div>
                            )}

                            <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>

                                {/* Regular Text Bubble */}
                                {msg.type !== 'welcome' && msg.role !== 'error' && (
                                    <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-cyan-600 text-white rounded-br-none shadow-lg shadow-cyan-900/20'
                                            : 'bg-white/10 text-gray-100 rounded-bl-none border border-white/10'
                                        }`}>
                                        {msg.content}
                                    </div>
                                )}

                                {/* Multilingual Welcome Bubble */}
                                {msg.type === 'welcome' && (
                                    <div className="px-5 py-4 rounded-2xl bg-white/10 text-gray-100 rounded-bl-none border border-white/10 flex flex-col gap-2 shadow-xl">
                                        <p className="font-semibold text-lg text-amber-400">Namaste! Main aapka CivicBridge AI hoon.</p>
                                        <p className="font-medium text-cyan-300">Vanakkam! Naan CivicBridge AI.</p>
                                        <p className="text-gray-300 text-sm">Hello! Ask me anything about India's civic data, weather, laws, or report an issue.</p>
                                    </div>
                                )}

                                {/* Error Bubble */}
                                {msg.role === 'error' && (
                                    <div className="px-4 py-3 rounded-2xl bg-red-900/50 text-red-200 border border-red-500/30 rounded-bl-none flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-sm">{msg.content}</span>
                                    </div>
                                )}

                                {/* Rich Cards based on intent */}
                                {msg.role === 'bot' && msg.intent && msg.data && (
                                    <div className="mt-1">
                                        {msg.intent === 'weather' && <WeatherCard data={msg.data} city={localStorage.getItem('cb_city') || 'Delhi'} />}
                                        {msg.intent === 'air_quality' && <AQICard data={msg.data} />}
                                        {msg.intent === 'law' && <LawCard data={msg.data} />}
                                        {msg.intent === 'budget' && <SchemeCard schemes={msg.data} />}
                                        {msg.intent === 'agriculture' && <MandiCard data={msg.data?.prices ? msg.data : { prices: msg.data }} />}
                                        {msg.intent === 'civic_issues' && (
                                            <IssuesCard
                                                data={msg.data}
                                                onShowMap={() => { setMapMarkers(msg.map_markers || []); setShowFullMap(true); }}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Mini Map Inline */}
                                {msg.role === 'bot' && msg.map_markers?.length > 0 && msg.intent !== 'civic_issues' && (
                                    <div className="mt-2 bg-black/50 border border-white/10 rounded-xl overflow-hidden shadow-lg w-[300px]">
                                        <div className="h-[150px] w-full relative">
                                            <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500"><Loader className="animate-spin" /></div>}>
                                                <IndiaMap
                                                    markers={msg.map_markers}
                                                    showUserLocation={false}
                                                    height="150px"
                                                    activeToggle="Civic Issues"
                                                />
                                            </Suspense>
                                        </div>
                                        <button
                                            onClick={() => { setMapMarkers(msg.map_markers); setShowFullMap(true); }}
                                            className="w-full py-2 text-xs font-bold text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/40 transition-colors"
                                        >
                                            View Full Map
                                        </button>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="w-8 h-8 rounded-lg bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center mr-3 shrink-0">
                            <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white/5 rounded-bl-none border border-white/5 flex items-center gap-2 text-gray-400 text-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span>Thinking in {language.name}...</span>
                        </div>
                    </motion.div>
                )}

                {/* Stop Speaking Button overlay if active */}
                {isSpeaking && (
                    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50">
                        <button
                            onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
                            className="bg-black/80 backdrop-blur-md border border-red-500/50 text-red-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl hover:bg-red-900/50"
                        >
                            <VolumeX className="w-4 h-4" /> Stop Audio
                        </button>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ────────────────────────────────────────────────────────────
          INPUT AREA & CHIPS
          ──────────────────────────────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0f1d] via-[#0a0f1d] to-transparent pt-10 pb-4 px-4 md:px-8">

                {/* Suggestion Chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
                    {currentSuggestions.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(chip)}
                            className="px-4 py-1.5 bg-white/5 hover:bg-cyan-900/30 border border-white/10 hover:border-cyan-500/30 text-cyan-100 text-xs rounded-full whitespace-nowrap transition-all flex-shrink-0"
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Input Bar */}
                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 shadow-2xl backdrop-blur-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? 'Listening...' : `Ask anything in ${language.name}...`}
                        className="flex-1 bg-transparent text-white px-4 py-3 outline-none placeholder-gray-500 text-sm md:text-base"
                        disabled={isListening}
                    />

                    {/* Interim transcript display overlay inside input */}
                    {transcript && input === '' && (
                        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 italic pointer-events-none truncate max-w-[60%] text-sm">
                            {transcript}
                        </div>
                    )}

                    <div className="flex items-center gap-1 pr-1">
                        {/* Voice Mic Button */}
                        {isSupported && (
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isListening
                                        ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse'
                                        : voiceError
                                            ? 'border-2 border-red-500 text-red-500 bg-red-900/20'
                                            : 'border border-cyan-400/50 text-cyan-400 hover:bg-cyan-900/30'
                                    }`}
                                title={voiceError || (isListening ? 'Stop Listening' : 'Use Voice (Ctrl+M)')}
                            >
                                {voiceError ? <X className="w-5 h-5" /> : isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
                            </button>
                        )}

                        {/* Send Button */}
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping || isListening}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${input.trim() && !isTyping && !isListening
                                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg'
                                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-4 h-4 translate-x-px translate-y-px" />
                        </button>
                    </div>
                </div>

                {/* Voice Error Note */}
                {voiceError && (
                    <div className="text-center mt-2 text-xs text-red-400 animate-pulse">{voiceError}</div>
                )}
            </div>

            {/* ────────────────────────────────────────────────────────────
          FULL MAP MODAL
          ──────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showFullMap && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col p-4 md:p-8"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MapIcon className="text-cyan-400" /> Civic Map View
                            </h2>
                            <button onClick={() => setShowFullMap(false)} className="p-2 bg-white/10 hover:bg-red-500/20 text-white rounded-full">
                                <X />
                            </button>
                        </div>
                        <div className="flex-1 rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative">
                            <Suspense fallback={<div className="flex h-full items-center justify-center text-cyan-400"><Loader className="w-10 h-10 animate-spin" /></div>}>
                                <IndiaMap markers={mapMarkers} showUserLocation={true} height="100%" />
                            </Suspense>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
