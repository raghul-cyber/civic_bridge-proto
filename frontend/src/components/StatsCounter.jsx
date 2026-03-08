import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';

const StatsCounter = ({ value, label, prefix = '', suffix = '', duration = 2, className }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

    useEffect(() => {
        if (isInView) {
            count.set(value);
        }
    }, [isInView, value, count]);

    const springValue = useSpring(count, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000
    });

    const displayValue = useTransform(springValue, (latest) => {
        const num = Math.round(latest);
        return num.toLocaleString();
    });

    return (
        <div ref={ref} className={className}>
            <div className="text-4xl md:text-5xl font-display font-bold text-[var(--accent-cyan)] mb-2 flex items-baseline">
                {prefix && <span className="text-2xl mr-1 text-[var(--accent-cyan)]/60">{prefix}</span>}
                <motion.span>{displayValue}</motion.span>
                {suffix && <span className="text-2xl ml-1 text-[var(--accent-cyan)]/60">{suffix}</span>}
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)] tracking-wide uppercase">
                {label}
            </p>
        </div>
    );
};

export default StatsCounter;
