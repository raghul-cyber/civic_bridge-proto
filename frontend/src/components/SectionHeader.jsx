import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { fadeUp } from '../lib/animations';

const SectionHeader = ({ eyebrow, title, description, className, align = 'left' }) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className={cn(
                "mb-12",
                align === 'center' ? "text-center mx-auto max-w-2xl" : "text-left",
                className
            )}
        >
            {eyebrow && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-cyan)] mb-3 block">
                    {eyebrow}
                </span>
            )}
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 relative inline-block">
                {title}
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "circOut" }}
                    className={cn(
                        "absolute -bottom-2 h-1 bg-[var(--accent-cyan)] shadow-[0_0_12px_var(--accent-cyan)]",
                        align === 'center' ? "left-0" : "left-0"
                    )}
                />
            </h2>
            {description && (
                <p className="mt-6 text-[var(--text-secondary)] text-lg leading-relaxed">
                    {description}
                </p>
            )}
        </motion.div>
    );
};

export default SectionHeader;
