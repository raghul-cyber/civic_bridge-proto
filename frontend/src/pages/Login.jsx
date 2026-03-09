import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { handleGoogleSuccess } = useAuth();

    return (
        <div className="flex h-screen w-full bg-[#0a0f1d] overflow-hidden font-sans">

            {/* ────────────────────────────────────────────────────────────
          LEFT PANEL (Desktop Only) - Dark India Theme
          ──────────────────────────────────────────────────────────── */}
            <div className="hidden lg:flex w-[60%] relative flex-col justify-center bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0a0f1d] to-black overflow-hidden p-16">

                {/* Decorative Grid / Glow */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen"></div>

                <div className="z-10 text-white max-w-2xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                        className="text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: '"Clash Display", sans-serif' }}>
                        Apka Sheher. <span className="text-cyan-400">Aapke Adhikar.</span> Aapki Awaaz.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-xl text-gray-400 mb-12">
                        CivicBridge gives every Indian citizen real civic intelligence directly from official sources.
                    </motion.p>
                </div>

                {/* Floating Stat Cards using framer-motion */}
                <div className="z-10 grid grid-cols-2 gap-6 max-w-lg relative">

                    {/* Decorative India outline SVG placeholder behind cards */}
                    <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] text-cyan-400 pointer-events-none" viewBox="0 0 100 100">
                        <path fill="currentColor" d="M50 0 L100 50 L50 100 L0 50 Z" />
                    </svg>

                    <StatCard delay={0.4} value="88+" label="Indian Datasets" />
                    <StatCard delay={0.5} value="8" label="Languages Supported" />
                    <StatCard delay={0.6} value="28" label="States + 8 UTs" />
                    <StatCard delay={0.7} value="1.4B" label="Citizens Served" />
                </div>

                {/* Decorative Language Pills */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    className="absolute bottom-12 left-16 flex gap-3 text-xs font-medium text-gray-500">
                    {['EN', 'HI', 'TA', 'TE', 'KN', 'BN', 'MR', 'GU'].map(lang => (
                        <span key={lang} className="px-3 py-1 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                            {lang}
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* ────────────────────────────────────────────────────────────
          RIGHT PANEL (Login Section)
          ──────────────────────────────────────────────────────────── */}
            <div className="w-full lg:w-[40%] flex items-center justify-center relative p-8 bg-black/50 lg:bg-transparent backdrop-blur-2xl">

                {/* Glassmorphism Auth Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-10 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"
                >
                    {/* Logo / Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-3xl text-white mb-2" style={{ fontFamily: '"Clash Display", sans-serif' }}>Welcome back</h2>
                        <p className="text-sm text-gray-400">Sign in to access India civic intelligence</p>
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent my-6"></div>

                    {/* Google Login Button Container */}
                    <div className="flex justify-center w-full transition-transform hover:scale-[1.02] duration-200">
                        {/* We customize the wrapper to make GoogleLogin stretch a bit if needed, 
                but @react-oauth/google handles its own iframe rendering securely */}
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.error('Google Login Failed')}
                            useOneTap
                            theme="filled_black"
                            size="large"
                            shape="rectangular"
                            width="320"
                            containerProps={{ style: { display: 'flex', justifyContent: 'center', width: '100%' } }}
                        />
                    </div>

                    {/* Footer Notes */}
                    <div className="mt-8 text-center space-y-4">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                            We only use your Google account for identity.
                        </p>
                        <p className="text-[10px] text-gray-600">
                            By continuing you agree to our <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a> & <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>.
                        </p>
                    </div>
                </motion.div>
            </div>

        </div>
    );
}

// Helper Component for Stat Cards
function StatCard({ value, label, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6 }}
            className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all duration-300 group"
        >
            <div className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">{value}</div>
            <div className="text-sm text-gray-500 font-medium">{label}</div>
        </motion.div>
    );
}
