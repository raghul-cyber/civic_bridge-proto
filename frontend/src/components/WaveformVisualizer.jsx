import React from 'react';
import { motion } from 'framer-motion';

const WaveformVisualizer = ({ isListening }) => {
    const barCount = 5;

    return (
        <div className="flex items-center justify-center gap-1.5 h-8">
            {[...Array(barCount)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={isListening ? {
                        height: [4, 32, 4],
                    } : {
                        height: 4
                    }}
                    transition={isListening ? {
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    } : {
                        duration: 0.3
                    }}
                    className="w-1.5 bg-[var(--accent-cyan)] rounded-full shadow-[0_0_8px_var(--accent-cyan)]"
                />
            ))}
        </div>
    );
};

export default WaveformVisualizer;
