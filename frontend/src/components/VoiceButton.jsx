import React, { useState } from 'react';
import useVoice from '../hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import WaveformVisualizer from './WaveformVisualizer';

const VoiceButton = ({ onStart, onStop, onTranscript, language = 'en-US', disabled = false }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTranscript = (text) => {
        setIsProcessing(true);
        if (onTranscript) {
            // Mock interim/final structure if the rest of the app expects it
            onTranscript({ final: text, interim: '' });
        }
        // Simulated processing success reset
        setTimeout(() => setIsProcessing(false), 2000);
    };

    const { isListening, error, isSupported, startListening, stopListening } = useVoice({
        language,
        onTranscript: handleTranscript
    });

    // Derive status to match old component mapping
    let status = 'idle';
    if (isListening) status = 'listening';
    else if (isProcessing) status = 'processing';
    else if (error) status = 'error';

    if (!isSupported) {
        return (
            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-medium">
                    Voice not supported in this browser. Use text input below.
                </p>
            </div>
        );
    }

    const handleClick = () => {
        if (disabled || isProcessing) return;

        if (isListening) {
            stopListening();
            if (onStop) onStop();
        } else {
            startListening();
            if (onStart) onStart();
        }
    };

    return (
        <div className="relative flex flex-col items-center gap-8">
            {/* Waveform Visualizer */}
            <div className={cn("transition-opacity duration-300", status === 'listening' ? "opacity-100" : "opacity-0")}>
                <WaveformVisualizer isListening={status === 'listening'} />
            </div>

            {/* Main Button */}
            <button
                onClick={handleClick}
                disabled={disabled || status === 'processing'}
                className={cn(
                    "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
                    status === 'idle' && "bg-[var(--bg-elevated)] border-2 border-[var(--accent-cyan)] shadow-[0_0_20px_var(--accent-cyan)]/20 hover:scale-105",
                    status === 'listening' && "bg-[var(--accent-cyan)] shadow-[0_0_40px_var(--accent-cyan)]/50 border-4 border-white/20",
                    status === 'processing' && "bg-[var(--bg-elevated)] border-2 border-[var(--accent-gold)] shadow-[0_0_20px_var(--accent-gold)]/20",
                    status === 'error' && "bg-[var(--accent-red)] shadow-[0_0_30px_var(--accent-red)]/40 border-4 border-white/20",
                    disabled && "opacity-50 cursor-not-allowed grayscale"
                )}
            >
                {/* Animated Rings for Listening */}
                <AnimatePresence>
                    {status === 'listening' && (
                        <>
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 1, opacity: 1 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                                    className="absolute inset-0 rounded-full border border-[var(--accent-cyan)]"
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Processing Spinner Overlay */}
                {status === 'processing' && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[var(--accent-cyan)]"
                    />
                )}

                {/* Icons */}
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Mic className="w-10 h-10 text-[var(--accent-cyan)]" />
                        </motion.div>
                    )}
                    {status === 'listening' && (
                        <motion.div key="stop" initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }}>
                            <div className="w-8 h-8 bg-white rounded-sm" />
                        </motion.div>
                    )}
                    {status === 'processing' && (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="w-10 h-10 text-[var(--accent-gold)] animate-spin" />
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }}>
                            <AlertCircle className="w-12 h-12 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute inset-0 rounded-full bg-radial-gradient from-[var(--accent-cyan)]/20 to-transparent pointer-events-none" />
            </button>

            {/* Status Label */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-center"
                >
                    <p className={cn(
                        "text-sm font-medium tracking-widest uppercase",
                        status === 'idle' && "text-[var(--text-secondary)]",
                        status === 'listening' && "text-[var(--accent-cyan)] animate-pulse",
                        status === 'processing' && "text-[var(--accent-gold)]",
                        status === 'error' && "text-[var(--accent-red)]"
                    )}>
                        {status === 'idle' && 'TAP TO SPEAK'}
                        {status === 'listening' && 'LISTENING...'}
                        {status === 'processing' && 'PROCESSING...'}
                        {status === 'error' && 'Retry later'}
                    </p>
                    {error && (
                        <p className="text-red-400 text-xs mt-2 max-w-[200px]">{error.message}</p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default VoiceButton;
