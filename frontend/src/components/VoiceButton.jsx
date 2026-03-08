import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import WaveformVisualizer from './WaveformVisualizer';

const VoiceButton = ({ onStart, onStop, onTranscript, language = 'en-US', disabled = false }) => {
    const [status, setStatus] = useState('idle'); // idle | listening | processing | success | error
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = language;

            recog.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                onTranscript?.({ final: finalTranscript, interim: interimTranscript });
            };

            recog.onend = () => {
                if (status === 'listening') {
                    setStatus('idle');
                    onStop?.();
                }
            };

            recog.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setStatus('error');
                setTimeout(() => setStatus('idle'), 3000);
            };

            setRecognition(recog);
        }
    }, [language, onTranscript, onStop, status]);

    const handleClick = () => {
        if (disabled) return;

        if (status === 'idle' || status === 'error') {
            if (recognition) {
                try {
                    recognition.start();
                    setStatus('listening');
                    onStart?.();
                } catch (e) {
                    console.error('Start error:', e);
                    setStatus('idle');
                }
            } else {
                alert('Speech recognition is not supported in this browser.');
            }
        } else if (status === 'listening') {
            recognition?.stop();
            setStatus('processing');
            // Mock processing delay
            setTimeout(() => {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
            }, 1500);
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
                    status === 'success' && "bg-[var(--accent-green)] shadow-[0_0_30px_var(--accent-green)]/40 border-4 border-white/20",
                    status === 'error' && "bg-[var(--accent-red)] shadow-[0_0_30px_var(--accent-red)]/40 border-4 border-white/20",
                    disabled && "opacity-50 cursor-not-allowed grayscale"
                )}
                aria-label={status === 'listening' ? 'Stop recording' : status === 'processing' ? 'Processing...' : 'Start recording'}
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
                    {status === 'success' && (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }}>
                            <Check className="w-12 h-12 text-white" />
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }}>
                            <AlertCircle className="w-12 h-12 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Center Glow Overlay */}
                <div className="absolute inset-0 rounded-full bg-radial-gradient from-[var(--accent-cyan)]/20 to-transparent pointer-events-none" />
            </button>

            {/* Status Label */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={status}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={cn(
                        "text-sm font-medium tracking-widest uppercase",
                        status === 'idle' && "text-[var(--text-secondary)]",
                        status === 'listening' && "text-[var(--accent-cyan)] animate-pulse",
                        status === 'processing' && "text-[var(--accent-gold)]",
                        status === 'success' && "text-[var(--accent-green)]",
                        status === 'error' && "text-[var(--accent-red)]"
                    )}
                >
                    {status === 'idle' && 'Tap to speak'}
                    {status === 'listening' && 'Listening...'}
                    {status === 'processing' && 'Extracting data...'}
                    {status === 'success' && 'Analysis Complete'}
                    {status === 'error' && 'Retry later'}
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

export default VoiceButton;
