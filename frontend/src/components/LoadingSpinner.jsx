import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullPage = false }) => {
    const content = (
        <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
                {/* Pulsing Logo placeholder */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.7, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 flex items-center justify-center text-xl font-display font-bold tracking-tighter"
                >
                    <span className="text-[var(--accent-cyan)]">C</span>
                    <span className="text-white">B</span>
                </motion.div>

                {/* Rotating Arc */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-cyan)] border-r-[var(--accent-cyan)]"
                />

                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full shadow-[0_0_30px_var(--accent-cyan)]/20" />
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-cyan)] animate-pulse"
            >
                Synchronizing...
            </motion.p>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[100] bg-[var(--bg-base)] flex items-center justify-center">
                <div className="grain-overlay opacity-[0.05]" />
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
