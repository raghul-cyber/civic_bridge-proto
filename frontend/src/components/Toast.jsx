import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

const Toast = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="pointer-events-auto"
                    >
                        <div className={cn(
                            "glass px-4 py-3 rounded-lg border flex items-start gap-3 shadow-lg",
                            toast.type === 'success' && "border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5",
                            toast.type === 'error' && "border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5",
                            toast.type === 'info' && "border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5"
                        )}>
                            <div className="mt-0.5 shrink-0">
                                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-[var(--accent-green)]" />}
                                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[var(--accent-red)]" />}
                                {toast.type === 'info' && <Info className="w-5 h-5 text-[var(--accent-cyan)]" />}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-0.5">{toast.title}</h4>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{toast.message}</p>
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-[var(--text-muted)] hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Auto-dismiss progress bar */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 4, ease: "linear" }}
                            className={cn(
                                "absolute bottom-0 left-0 h-0.5 bg-white/20 origin-left",
                                toast.type === 'success' && "bg-[var(--accent-green)]",
                                toast.type === 'error' && "bg-[var(--accent-red)]",
                                toast.type === 'info' && "bg-[var(--accent-cyan)]"
                            )}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
