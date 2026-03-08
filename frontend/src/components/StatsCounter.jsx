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
        <div ref={ref} className={className || 'flex flex-col items-center justify-center text-center'}>
            <div className="flex items-center justify-center text-center">
                {prefix && <span className="text-2xl mr-1 text-[#00D4FF]">{prefix}</span>}
                <motion.span className="text-[#00D4FF] font-display font-bold text-5xl md:text-6xl">{displayValue}</motion.span>
                {suffix && <span className="text-[#00D4FF] font-display font-bold text-5xl md:text-6xl ml-1">{suffix}</span>}
            </div>
            <span className="text-[#9CA3AF] text-xs tracking-[0.15em] uppercase mt-2">
                {label}
            </span>
        </div>
    );
};

export default StatsCounter;
