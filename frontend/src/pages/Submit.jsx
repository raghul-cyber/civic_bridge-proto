import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Keyboard, FileText, MapPin, Tag, Sparkles, CheckCircle2, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import VoiceButton from '../components/VoiceButton';
import PriorityBadge from '../components/PriorityBadge';
import CategoryIcon from '../components/CategoryIcon';
import SectionHeader from '../components/SectionHeader';
import SkeletonCard from '../components/SkeletonCard';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import useToast from '../hooks/useToast';
import { mockIssues, mockStats, mockDatasets } from '../data/mockData';

const Submit = () => {
    const { language, setLanguage } = useLanguage();
    const { showToast } = useToast();

    const [inputMode, setInputMode] = useState('type'); // 'voice' | 'type'
    const [textInput, setTextInput] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, role: 'ai', text: "Hello! I am your CivicBridge AI Assistant. I can help you report an issue, or you can ask me questions about current city data (like air quality, weather, or open issues). How can I help you today?" }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    // Right panel data extraction states
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const chatEndRef = useRef(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = (text = textInput) => {
        if (!text.trim()) return;

        const newMsg = { id: Date.now(), role: 'user', text };
        setMessages(prev => [...prev, newMsg]);
        setTextInput('');

        processChat(text);
    };

    const processChat = (userText) => {
        setIsTyping(true);
        const lower = userText.toLowerCase();

        // Simulate network delay
        setTimeout(() => {
            let aiResponse = "";
            let triggerExtraction = false;

            // Simple NLP Dataset Matching
            if (lower.includes('air quality') || lower.includes('aqi') || lower.includes('pollution')) {
                aiResponse = `The current Air Quality Index is ${mockDatasets.airQuality.aqi} (${mockDatasets.airQuality.status}). The trend over the last 12 hours stands at: ${mockDatasets.airQuality.trend.join(', ')}.`;
            }
            else if (lower.includes('weather') || lower.includes('temperature') || lower.includes('rain')) {
                aiResponse = `The current weather is ${mockDatasets.weather.temp}°F with a humidity of ${mockDatasets.weather.humidity}%. It is ${mockDatasets.weather.condition}.`;
            }
            else if (lower.includes('how many issues') || lower.includes('total issues') || lower.includes('stats')) {
                aiResponse = `There are currently ${mockStats.openIssues.toLocaleString()} open issues out of ${mockStats.totalIssues.toLocaleString()} total reports. Our resolution rate is ${mockStats.resolutionRate}%, spanning across ${mockStats.activeWards} wards in the city!`;
            }
            else if (lower.includes('pothole')) {
                const similar = mockIssues.find(i => i.category === 'pothole');
                aiResponse = `I see you are reporting a pothole. I've found a similar active issue: "${similar.title}" in ${similar.ward}. I am extracting your details to log a new report ticket for the Department of Transportation.`;
                triggerExtraction = true;
            }
            else if (lower.includes('streetlight') || lower.includes('darking') || lower.includes('light')) {
                aiResponse = `I understand you're reporting a streetlight outage. Streetlight maintenance is a high priority for public safety. I'm extracting your report for the Electrical Department.`;
                triggerExtraction = true;
            }
            else if (lower.includes('flood') || lower.includes('water')) {
                aiResponse = `Flooding is a critical issue that requires immediate attention from Public Works. I'm extracting this data immediately!`;
                triggerExtraction = true;
            }
            else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste')) {
                aiResponse = `I'm logging your sanitation complaint regarding garbage collection. Extracting the location for Sanitation Services.`;
                triggerExtraction = true;
            }
            else {
                aiResponse = "I've received your message. Let me extract the key details so we can log this as an official civic report ticket.";
                triggerExtraction = true;
            }

            setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: aiResponse }]);
            setIsTyping(false);

            if (triggerExtraction) {
                runExtractionPipeline(userText);
            }
        }, 1500);
    };

    const runExtractionPipeline = (text) => {
        setIsExtracting(true);
        setExtractedData(null);

        let predictedCategory = 'Other';
        let suggestedDept = 'General Support';
        let customPriority = 'medium';
        const lower = text.toLowerCase();

        if (lower.includes('pothole')) {
            predictedCategory = 'pothole';
            suggestedDept = 'Department of Transportation';
        } else if (lower.includes('light')) {
            predictedCategory = 'streetlight';
            suggestedDept = 'Electrical Maintenance';
            customPriority = 'high';
        } else if (lower.includes('flood') || lower.includes('water')) {
            predictedCategory = 'flooding';
            suggestedDept = 'Public Works & Water Management';
            customPriority = 'critical';
        }

        setTimeout(() => {
            setExtractedData({
                category: predictedCategory,
                priority: customPriority,
                location: 'Dynamically Extracted from Chat',
                ward: 'Assigned by AI Engine',
                description: text,
                suggestedDept: suggestedDept,
                confidence: Math.floor(Math.random() * 10) + 90
            });
            setIsExtracting(false);
            showToast({ title: 'Extraction Complete', message: 'Report fields parsed. Please review and submit.', type: 'success' });
        }, 2000);
    };

    // Callback from VoiceButton
    const handleVoiceTranscript = (data) => {
        // If final transcript is sent from voice
        if (data.final) {
            handleSendMessage(data.final);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass p-12 rounded-3xl text-center max-w-lg border-[var(--accent-green)]/30"
                >
                    <div className="w-20 h-20 bg-[var(--accent-green)]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-10 h-10 text-[var(--accent-green)]" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-4">Report Submitted</h2>
                    <p className="text-[var(--text-secondary)] mb-8">
                        Your issue has been logged as <span className="text-white font-mono">#CB-2024-{Math.floor(Math.random() * 90000) + 10000}</span>.
                        Officers have been notified.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
                    >
                        Submit Another Report
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <SectionHeader
                eyebrow="Report Issue"
                title="AI Civic Assistant"
                description="Chat with our AI to query city datasets, or simply describe an issue to automatically generate a report ticket."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">

                {/* Left Panel: Chatbot Interface */}
                <div className="glass rounded-3xl overflow-hidden flex flex-col h-[650px] relative border-[var(--border)] shadow-2xl">
                    <div className="absolute inset-0 bg-radial-gradient from-[var(--accent-cyan)]/5 to-transparent pointer-events-none" />

                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent-cyan)]/20 flex items-center justify-center text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold font-display text-sm">CivicBridge AI</h3>
                                <p className="text-[10px] text-[var(--caption)] uppercase tracking-widest text-[var(--accent-cyan)] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                                    Online
                                </p>
                            </div>
                        </div>

                        {/* Language Selector built into header */}
                        <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10 hidden sm:flex">
                            {LANGUAGES.slice(0, 3).map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang)}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[9px] font-bold transition-all flex items-center gap-1",
                                        lang.code === language.code
                                            ? "bg-[var(--accent-cyan)] text-black"
                                            : "text-[var(--text-muted)] hover:text-white"
                                    )}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Message Feed */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-thin scrollbar-thumb-white/10">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                        msg.role === 'user'
                                            ? "bg-white/10 border-white/20 text-white"
                                            : "bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-white/10 text-white rounded-tr-sm border border-white/10"
                                            : "bg-[#111827] text-[var(--text-secondary)] rounded-tl-sm border border-[var(--accent-cyan)]/20 shadow-[0_4px_20px_rgba(0,212,255,0.05)]"
                                    )}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3 max-w-[85%]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[var(--accent-cyan)]/20 border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)]">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="p-4 bg-[#111827] rounded-2xl rounded-tl-sm border border-[var(--accent-cyan)]/20 flex gap-1.5 items-center">
                                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-[var(--accent-cyan)] rounded-full" />
                                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--accent-cyan)] rounded-full" />
                                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--accent-cyan)] rounded-full" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-4 bg-black/60 border-t border-white/10 z-10 shrink-0 backdrop-blur-md">

                        {/* Voice & Type Controls wrapper */}
                        <div className="flex gap-3 items-end">

                            {/* Mode Toggle Column */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <button
                                    onClick={() => setInputMode(prev => prev === 'type' ? 'voice' : 'type')}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                                    title={`Switch to ${inputMode === 'type' ? 'Voice' : 'Type'} Mode`}
                                >
                                    {inputMode === 'type' ? <Mic className="w-5 h-5" /> : <Keyboard className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Active Input Component */}
                            <div className="flex-1 flex justify-center items-center h-12">
                                <AnimatePresence mode="popLayout">
                                    {inputMode === 'voice' ? (
                                        <motion.div
                                            key="voice-mode"
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                            className="w-full h-full flex items-center justify-center"
                                        >
                                            {/* Minimal footprint VoiceButton wrapper */}
                                            <div className="relative w-full h-full transform scale-75 origin-center -mt-6">
                                                <VoiceButton
                                                    language={language.code}
                                                    onTranscript={handleVoiceTranscript}
                                                    onStart={() => { }}
                                                />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="text-mode"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="relative flex-1"
                                        >
                                            <input
                                                type="text"
                                                value={textInput}
                                                onChange={(e) => setTextInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Message CivicBridge AI..."
                                                className="w-full h-12 bg-[#111827] border border-[rgba(255,255,255,0.08)] text-[#F9FAFB] rounded-xl px-4 pr-12 text-sm focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] outline-none"
                                            />
                                            <button
                                                onClick={() => handleSendMessage()}
                                                disabled={!textInput.trim()}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[var(--accent-cyan)] text-black flex items-center justify-center disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
                                            >
                                                <Send className="w-4 h-4 ml-0.5" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Extraction Preview */}
                <div className="space-y-6">
                    <div className="glass p-8 rounded-3xl border-[var(--border)] h-[650px] flex flex-col pt-6">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
                                Extraction Payload
                            </h3>
                            <div className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase border border-white/10 px-2 py-1 rounded bg-black/20">
                                Real-time DB Entry
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                            {/* Shimmer state if processing */}
                            {isExtracting ? (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                                </motion.div>
                            ) : extractedData ? (
                                <motion.div
                                    key="data"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                                    }}
                                    className="space-y-6"
                                >
                                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex gap-2">
                                                Category
                                                <span className="bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] px-2 py-0.5 rounded text-[9px] flex items-center gap-1">
                                                    {extractedData.confidence}% confident
                                                </span>
                                            </p>
                                            <div className="flex items-center gap-2 text-white font-medium text-lg">
                                                <CategoryIcon categoryId={extractedData.category.toLowerCase()} />
                                                <span className="capitalize">{extractedData.category}</span>
                                            </div>
                                        </div>
                                        <PriorityBadge priority={extractedData.priority} />
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="space-y-1 bg-black/20 p-4 rounded-lg border border-white/5">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Target Location</p>
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <MapPin className="w-4 h-4 text-[var(--accent-cyan)]" />
                                            <span>{extractedData.location}</span>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="space-y-1 bg-black/20 p-4 rounded-lg border border-white/5">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Routing Department</p>
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <Tag className="w-4 h-4 text-[var(--accent-gold)]" />
                                            <span>{extractedData.suggestedDept}</span>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-4">Narrative Description</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-white/5 p-4 rounded-xl italic border border-white/5 shadow-inner">
                                            "{extractedData.description}"
                                        </p>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center p-12 opacity-30 h-full mt-12">
                                    <FileText className="w-16 h-16 mb-6" />
                                    <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest font-bold">No Payload Generated</p>
                                    <p className="text-xs mt-2 text-gray-500">Chat with the AI to extract <br />a structured reporting payload.</p>
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!extractedData || isExtracting}
                            className={cn(
                                "mt-6 w-full py-4 shrink-0 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                extractedData && !isExtracting
                                    ? "bg-[var(--accent-cyan)] text-black shadow-[0_0_20px_var(--accent-cyan)]/40 hover:scale-[1.02]"
                                    : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed border border-white/10"
                            )}
                        >
                            <Send className="w-4 h-4" />
                            Submit Report to Department
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Submit;
