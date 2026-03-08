import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ThumbsUp, Share2, Clock } from 'lucide-react';
import { cn, formatRelativeTime, getPriorityColor } from '../lib/utils';
import CategoryIcon from './CategoryIcon';
import PriorityBadge from './PriorityBadge';

const IssueCard = ({ issue, className }) => {
    const {
        id,
        title,
        description,
        category,
        priority,
        status,
        location,
        ward,
        timestamp,
        upvotes = 0
    } = issue;

    const priorityColor = getPriorityColor(priority);

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            role="article"
            aria-label={title}
            className={cn(
                "glass glass-hover rounded-xl overflow-hidden flex flex-col group",
                className
            )}
        >
            <div className="flex h-full">
                {/* Priority Strip */}
                <div
                    className="w-1.5 h-full shrink-0"
                    style={{ backgroundColor: priorityColor }}
                />

                <div className="flex-1 p-5 flex flex-col gap-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <CategoryIcon categoryId={category} className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{category?.replace('_', ' ')}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] font-medium">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(timestamp)}
                            </div>
                            <PriorityBadge priority={priority} />
                        </div>
                    </div>

                    {/* Content Row */}
                    <div className="space-y-2">
                        <h3 className="text-base font-display text-white group-hover:text-[var(--accent-cyan)] transition-colors line-clamp-1">
                            {title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Footer Row */}
                    <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                                <MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                <span className="font-medium">{ward}</span>
                            </div>

                            <div className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                                status === 'RESOLVED' ? "bg-green-500/10 text-[var(--accent-green)]" :
                                    status === 'IN_PROGRESS' ? "bg-amber-500/10 text-[var(--accent-gold)]" :
                                        "bg-red-500/10 text-[var(--accent-red)]"
                            )}>
                                {status?.replace('_', ' ')}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-white transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-xs font-mono">{upvotes}</span>
                            </button>
                            <button className="text-[var(--text-muted)] hover:text-white transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default IssueCard;
