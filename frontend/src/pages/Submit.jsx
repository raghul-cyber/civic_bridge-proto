import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, RotateCcw, FileText, MapPin, Tag, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import VoiceButton from '../components/VoiceButton';
import PriorityBadge from '../components/PriorityBadge';
import CategoryIcon from '../components/CategoryIcon';
import SectionHeader from '../components/SectionHeader';

const Submit = () => {
    const [transcript, setTranscript] = useState({ final: '', interim: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [language, setLanguage] = useState('en-US');

    const handleTranscript = (data) => {
        setTranscript(data);

        // Simulate real-time extraction when final transcript grows
        if (data.final.length > 20 && !extractedData && !isProcessing) {
            simulateExtraction(data.final);
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
                suggestedDept: 'Department of Transportation (CDOT)'
            });
            setIsProcessing(false);
        }, 2000);
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        // confetti or success animation handled by state change
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
                        Officers in Ward 42 have been notified.
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
                eyebrow="Voice Interface"
                title="Speak Your Mind"
                description="Just start talking. Our AI will handle the categories, locations, and urgency."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                {/* Left Panel: Input */}
                <div className="space-y-8">
                    <div className="glass p-8 rounded-3xl relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-radial-gradient from-[var(--accent-cyan)]/5 to-transparent pointer-events-none" />

                        <div className="flex gap-2 mb-12 bg-white/5 p-1 rounded-full border border-white/10 relative z-10">
                            {['EN', 'HI', 'TA', 'TE', 'BN'].map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLanguage(l === 'EN' ? 'en-US' : 'hi-IN')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
                                        (language.startsWith(l.toLowerCase()) || (l === 'EN' && language === 'en-US'))
                                            ? "bg-[var(--accent-cyan)] text-black shadow-[0_0_12px_var(--accent-cyan)]"
                                            : "text-[var(--text-muted)] hover:text-white"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <VoiceButton
                            language={language}
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
                            {isProcessing && !extractedData ? (
                                <div className="space-y-6 animate-pulse">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-12 bg-white/5 rounded-xl w-full" />
                                    ))}
                                </div>
                            ) : extractedData ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Category</p>
                                            <div className="flex items-center gap-2 text-white font-medium">
                                                <CategoryIcon categoryId={extractedData.category} />
                                                <span className="capitalize">{extractedData.category}</span>
                                            </div>
                                        </div>
                                        <PriorityBadge priority={extractedData.priority} />
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Location</p>
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <MapPin className="w-4 h-4 text-[var(--accent-cyan)]" />
                                            <span>{extractedData.location}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Department</p>
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <Tag className="w-4 h-4 text-[var(--accent-gold)]" />
                                            <span>{extractedData.suggestedDept}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Description</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-white/5 p-4 rounded-xl italic">
                                            "{extractedData.description}"
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
                                    <FileText className="w-16 h-16 mb-6" />
                                    <p className="text-sm">Start speaking to see AI-extracted <br />fields in real-time.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!extractedData || isProcessing}
                            className={cn(
                                "mt-8 w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                extractedData && !isProcessing
                                    ? "bg-[var(--accent-cyan)] text-black shadow-[0_0_20px_var(--accent-cyan)]/40"
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
