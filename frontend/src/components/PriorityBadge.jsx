import React from 'react';
import { cn } from '../lib/utils';

const PriorityBadge = ({ priority, className }) => {
    const getPriorityStyle = (p) => {
        switch (p?.toLowerCase()) {
            case 'critical':
                return {
                    bg: 'bg-red-500/10',
                    text: 'text-[#EF4444]',
                    border: 'border-[#EF4444]/30',
                    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                };
            case 'high':
                return {
                    bg: 'bg-amber-500/10',
                    text: 'text-[#F59E0B]',
                    border: 'border-[#F59E0B]/30',
                    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                };
            case 'medium':
                return {
                    bg: 'bg-cyan-500/10',
                    text: 'text-[#00D4FF]',
                    border: 'border-[#00D4FF]/30',
                    glow: ''
                };
            case 'low':
                return {
                    bg: 'bg-gray-500/10',
                    text: 'text-[#9CA3AF]',
                    border: 'border-[#9CA3AF]/30',
                    glow: ''
                };
            default:
                return {
                    bg: 'bg-gray-500/10',
                    text: 'text-[#9CA3AF]',
                    border: 'border-[#9CA3AF]/30',
                    glow: ''
                };
        }
    };

    const style = getPriorityStyle(priority);

    return (
        <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            style.bg,
            style.text,
            style.border,
            style.glow,
            className
        )}>
            <span className="flex items-center gap-1">
                <span className={cn("w-1 h-1 rounded-full", style.text.replace('text', 'bg'))} />
                {priority}
            </span>
        </div>
    );
};

export default PriorityBadge;
