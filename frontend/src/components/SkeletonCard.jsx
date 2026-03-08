import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const SkeletonCard = ({ className }) => {
    return (
        <div className={cn("glass rounded-xl p-5 overflow-hidden relative", className)}>
            <div className="flex gap-4">
                {/* Animated shimmer sweep */}
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                />

                <div className="w-1.5 h-32 bg-white/5 rounded-full shrink-0" />

                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="w-20 h-3 bg-white/5 rounded-full" />
                        <div className="flex gap-2">
                            <div className="w-12 h-4 bg-white/5 rounded-full" />
                            <div className="w-16 h-4 bg-white/5 rounded-full" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="w-3/4 h-5 bg-white/10 rounded-lg" />
                        <div className="w-full h-10 bg-white/5 rounded-lg" />
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] flex justify-between">
                        <div className="w-24 h-4 bg-white/5 rounded-full" />
                        <div className="w-16 h-4 bg-white/5 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
