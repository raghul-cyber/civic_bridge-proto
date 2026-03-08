import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-red)] blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-12 rounded-3xl text-center max-w-lg border-[var(--accent-red)]/20 relative z-10"
            >
                <div className="w-20 h-20 bg-[var(--accent-red)]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--accent-red)]/30">
                    <AlertTriangle className="w-10 h-10 text-[var(--accent-red)]" />
                </div>

                <h1 className="text-6xl font-display font-bold text-white mb-2">404</h1>
                <h2 className="text-xl font-display font-bold text-[var(--text-secondary)] mb-6 uppercase tracking-[0.2em]">Signal Lost</h2>

                <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
                    The civic infrastructure page you are looking for has been moved,
                    decommissioned, or never existed in this ward.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--accent-cyan)] text-black font-bold rounded-xl hover:shadow-[0_0_20px_var(--accent-cyan)]/40 transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Return Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-8 py-3 glass hover:bg-white/5 text-white font-bold rounded-xl transition-all border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
