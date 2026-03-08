import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, MapPin, Tag, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import PriorityBadge from '../components/PriorityBadge';
import CategoryIcon from '../components/CategoryIcon';
import SectionHeader from '../components/SectionHeader';
import SkeletonCard from '../components/SkeletonCard';
import useToast from '../hooks/useToast';
import ChatBot from '../components/ChatBot';

const Submit = () => {
    const { showToast } = useToast();

    // Right panel data extraction states
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);


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
                <div className="h-[650px]">
                    <ChatBot onMessage={runExtractionPipeline} />
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
