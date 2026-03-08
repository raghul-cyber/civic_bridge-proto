import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Keyboard, FileText, MapPin, Tag, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import VoiceButton from '../components/VoiceButton';
import PriorityBadge from '../components/PriorityBadge';
import CategoryIcon from '../components/CategoryIcon';
import SectionHeader from '../components/SectionHeader';
import SkeletonCard from '../components/SkeletonCard';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import useToast from '../hooks/useToast';
import api from '../lib/api';

const PLACEHOLDERS = [
    'There is a pothole near the school on Main Street...',
    'The streetlight on Oak Avenue has been broken for 2 weeks...',
    'Garbage not collected from Ward 12 for 5 days...'
];

const Submit = () => {
    const { language, setLanguage } = useLanguage();
    const { showToast } = useToast();

    const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'type'
    const [textInput, setTextInput] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const [transcript, setTranscript] = useState({ final: '', interim: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [extractedData, setExtractedData] = useState(null);

    // Placeholder animation
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleTranscript = (data) => {
        setTranscript(data);
        if (data.final.length > 20 && !extractedData && !isProcessing) {
            simulateExtraction(data.final);
        }
    };

    const handleExtractText = async () => {
        setIsProcessing(true);
        setExtractedData(null);

        try {
            // Simulated POST to /api/voice/extract per prompt
            // const response = await api.post('/voice/extract', { text: textInput, language: language.code });

            setTimeout(() => {
                setExtractedData({
                    category: 'pothole',
                    priority: 'high',
                    location: 'Extracted from text',
                    ward: 'Ward 42',
                    description: textInput,
                    suggestedDept: 'Public Works',
                    confidence: 94
                });
                setIsProcessing(false);
            }, 2000);

        } catch (error) {
            showToast({ title: 'Error', message: 'Extraction failed. Please try again.', type: 'error' });
            setIsProcessing(false);
        }
    };

    const simulateExtraction = (text) => {
        setIsProcessing(true);
        setTimeout(() => {
            setExtractedData({
                category: 'pothole',
                priority: 'high',
                location: 'W Washington Blvd & N Clark St',
                ward: 'Ward 42 (Downtown)',
                description: text,
                suggestedDept: 'Department of Transportation (CDOT)',
                confidence: 94
            });
            setIsProcessing(false);
        }, 2000);
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);
    };

    const handleDirectSubmit = () => {
        setExtractedData({
            category: 'Other',
            priority: 'medium',
            location: 'Not specified',
            ward: 'Not specified',
            description: textInput,
            suggestedDept: 'General Support',
            confidence: 100
        });
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
                        Your issue has been logged as <span className="text-white font-mono">#CB-2024-9421</span>.
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
                title="Speak or Type Your Mind"
                description="Our AI will handle the categories, locations, and urgency."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                {/* Left Panel: Input */}
                <div className="space-y-8">
                    <div className="glass p-8 rounded-3xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-start">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-radial-gradient from-[var(--accent-cyan)]/5 to-transparent pointer-events-none" />

                        {/* Toggle */}
                        <div className="flex bg-black/40 border border-white/10 rounded-full w-fit mx-auto mb-10 relative mt-4">
                            <motion.div
                                layout
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--accent-cyan)] rounded-full z-0"
                                animate={{ left: inputMode === 'voice' ? 4 : 'calc(50% + 0px)' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                            <button
                                onClick={() => setInputMode('voice')}
                                className={cn(
                                    "relative z-10 flex items-center gap-2 px-6 py-2 border border-transparent rounded-full font-bold text-sm transition-colors",
                                    inputMode === 'voice' ? "text-black" : "text-[var(--accent-cyan)] hover:bg-white/5"
                                )}
                            >
                                <Mic className="w-4 h-4" />
                                Voice
                            </button>
                            <button
                                onClick={() => setInputMode('type')}
                                className={cn(
                                    "relative z-10 flex items-center gap-2 px-6 py-2 border border-transparent rounded-full font-bold text-sm transition-colors",
                                    inputMode === 'type' ? "text-black" : "text-[var(--accent-cyan)] hover:bg-white/5"
                                )}
                            >
                                <Keyboard className="w-4 h-4" />
                                Type
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {inputMode === 'voice' ? (
                                <motion.div key="voice" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full flex-col flex items-center">
                                    <div className="flex gap-2 mb-12 bg-white/5 p-1 rounded-full border border-white/10 relative z-10 flex-wrap justify-center">
                                        {LANGUAGES.map((lang) => {
                                            const isActive = lang.code === language.code;
                                            return (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => setLanguage(lang)}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1",
                                                        isActive
                                                            ? "bg-[var(--accent-cyan)] text-black shadow-[0_0_12px_var(--accent-cyan)]"
                                                            : "text-[var(--text-muted)] hover:text-white border border-transparent hover:border-white/10"
                                                    )}
                                                >
                                                    {lang.label} <span className="opacity-60 text-[9px]">{lang.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <VoiceButton
                                        language={language.code}
                                        onTranscript={handleTranscript}
                                        onStart={() => {
                                            setTranscript({ final: '', interim: '' });
                                            setExtractedData(null);
                                        }}
                                    />

                                    {/* Live Transcript Box */}
                                    <div className="w-full mt-12 bg-black/40 rounded-2xl border border-[var(--border)] p-6 font-mono text-sm min-h-[120px] relative">
                                        <div className="absolute top-3 left-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                                            Live Transcript
                                        </div>

                                        <div className="mt-4 leading-relaxed line-clamp-4">
                                            <span className="text-white">{transcript.final}</span>
                                            <span className="text-[var(--text-muted)] italic">{transcript.interim}</span>
                                            <motion.span
                                                animate={{ opacity: [1, 0] }}
                                                transition={{ duration: 0.8, repeat: Infinity }}
                                                className="inline-block w-2 h-4 bg-[var(--accent-cyan)] ml-1 align-middle"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center gap-4 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3 text-[var(--accent-gold)]" />
                                        AI Extraction Powered by Claude Haiku
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col items-center">
                                    <div className="relative w-full z-10">
                                        <textarea
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value.substring(0, 500))}
                                            placeholder={PLACEHOLDERS[placeholderIndex]}
                                            className="bg-[#111827] border border-[rgba(255,255,255,0.08)] text-[#F9FAFB] font-['JetBrains_Mono'] text-sm focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] rounded-xl p-4 w-full min-h-[160px] resize-none overflow-hidden transition-all outline-none placeholder:text-slate-600"
                                        />
                                        <div className={cn(
                                            "absolute bottom-4 right-4 text-xs font-medium bg-black/50 px-2 py-1 rounded",
                                            textInput.length < 400 ? "text-slate-400" : textInput.length < 480 ? "text-[var(--accent-gold)]" : "text-[var(--accent-red)]"
                                        )}>
                                            {textInput.length} / 500 characters
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-6 mb-4 bg-white/5 p-1 rounded-full border border-white/10 relative z-10 flex-wrap justify-center">
                                        {LANGUAGES.map((lang) => {
                                            const isActive = lang.code === language.code;
                                            return (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => setLanguage(lang)}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1",
                                                        isActive
                                                            ? "bg-[var(--accent-cyan)] text-black shadow-[0_0_12px_var(--accent-cyan)]"
                                                            : "text-[var(--text-muted)] hover:text-white border border-transparent hover:border-white/10"
                                                    )}
                                                >
                                                    {lang.label} <span className="opacity-60 text-[9px]">{lang.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <AnimatePresence>
                                        {textInput.length > 10 && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full mt-2 flex flex-col items-center z-10">
                                                <button
                                                    onClick={handleExtractText}
                                                    disabled={isProcessing}
                                                    className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-[var(--accent-cyan)] text-black shadow-[0_0_20px_var(--accent-cyan)]/40 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                                >
                                                    {isProcessing ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Extracting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-5 h-5" />
                                                            Extract with AI
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleDirectSubmit}
                                                    disabled={isProcessing}
                                                    className="mt-6 text-xs tracking-widest uppercase font-bold text-slate-500 hover:text-white transition-colors"
                                                >
                                                    Skip AI extraction and submit as-is
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Extraction Preview */}
                <div className="space-y-6">
                    <div className="glass p-8 rounded-3xl border-[var(--border)] h-full flex flex-col">
                        <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
                            Live Extraction Preview
                        </h3>

                        <div className="flex-1 space-y-8">
                            {/* Shimmer state if processing */}
                            {isProcessing ? (
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
                                    className="space-y-8"
                                >
                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex gap-2">
                                                Category
                                                <span className="bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] px-2 py-0.5 rounded text-[9px] flex items-center gap-1">
                                                    {extractedData.confidence}% confident
                                                </span>
                                            </p>
                                            <div className="flex items-center gap-2 text-white font-medium">
                                                <CategoryIcon categoryId={extractedData.category.toLowerCase()} />
                                                <span className="capitalize">{extractedData.category}</span>
                                            </div>
                                        </div>
                                        <PriorityBadge priority={extractedData.priority} />
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Location</p>
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <MapPin className="w-4 h-4 text-[var(--accent-cyan)]" />
                                            <span>{extractedData.location}</span>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Department</p>
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <Tag className="w-4 h-4 text-[var(--accent-gold)]" />
                                            <span>{extractedData.suggestedDept}</span>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Description</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-white/5 p-4 rounded-xl italic border border-white/5">
                                            "{extractedData.description}"
                                        </p>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
                                    <FileText className="w-16 h-16 mb-6" />
                                    <p className="text-sm">Speak or type an issue to see<br />AI-extracted fields in real-time.</p>
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!extractedData || isProcessing}
                            className={cn(
                                "mt-8 w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                extractedData && !isProcessing
                                    ? "bg-[var(--accent-cyan)] text-black shadow-[0_0_20px_var(--accent-cyan)]/40 hover:scale-[1.02]"
                                    : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                            Submit Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Submit;
