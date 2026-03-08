import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, Zap, Shield, ChevronDown, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeUp, stagger } from '../lib/animations';
import SectionHeader from '../components/SectionHeader';
import StatsCounter from '../components/StatsCounter';
const MapView = lazy(() => import('../components/MapView'));
import { mockIssues } from '../data/mockData';

const Home = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Floating particles effect
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const particles = [];
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedY: -(Math.random() * 0.5 + 0.2),
                opacity: Math.random() * 0.5 + 0.1
            });
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                p.y += p.speedY;
                if (p.y < -10) p.y = canvas.height + 10;
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full overflow-x-hidden">
            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden w-full">
                <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

                <motion.div
                    style={{ y: y1, opacity }}
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center"
                >
                    <motion.span
                        variants={fadeUp}
                        className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-cyan)] mb-6 block w-full"
                    >
                        CIVIC TECHNOLOGY FOR EVERYONE
                    </motion.span>

                    <motion.h1
                        variants={fadeUp}
                        className="text-center text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 tracking-tight w-full"
                    >
                        Your City. Your Voice.<br />
                        <span className="relative inline-block mt-2">
                            Your Rights.
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1, delay: 1, ease: "circOut" }}
                                className="absolute -bottom-2 left-0 h-2 bg-[var(--accent-cyan)] shadow-[0_0_20px_var(--accent-cyan)]"
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="text-center max-w-2xl mx-auto text-lg md:text-xl text-[var(--text-secondary)] mb-12 leading-relaxed w-full"
                    >
                        Report civic issues in your language. Track them in real time.
                        Hold your city accountable with AI-powered transparency.
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full">
                        <Link
                            to="/submit"
                            className="group relative px-8 py-4 bg-[var(--accent-cyan)] text-black font-bold rounded-xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-105"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                <Mic className="w-5 h-5 group-hover:animate-pulse" />
                                <span>Start Speaking</span>
                            </div>
                        </Link>

                        <Link
                            to="/dashboard"
                            className="px-8 py-4 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] font-bold rounded-xl hover:bg-[var(--accent-cyan)]/5 transition-all text-center"
                        >
                            View Live Dashboard
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Bug C Fix: SCROLL TO EXPLORE text correctly centered */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span className="text-xs tracking-widest text-gray-500 uppercase">SCROLL TO EXPLORE</span>
                    <ChevronDown className="w-5 h-5 animate-bounce mt-2 text-gray-500" />
                </div>
            </section>

            {/* Bugs B Fix: Stats section correctly aligned */}
            <section className="py-16 flex flex-col items-center justify-center border-y border-[var(--border)] glass relative z-10 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-3xl mx-auto text-center px-4">
                    <StatsCounter value={12847} label="ISSUES RESOLVED" suffix="+" />
                    <StatsCounter value={5} label="LANGUAGES SUPPORTED" />
                    <StatsCounter value={48} label="CITY WARDS COVERED" />
                </div>
            </section>

            {/* Bug C Fix: Feature cards centered */}
            <section className="py-32 w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
                <SectionHeader
                    eyebrow="How it works"
                    title="Speak. Submit. Track."
                    description="We've removed the barriers to civic engagement. No forms, no waiting, just action."
                    align="center"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16">
                    {[
                        {
                            icon: <Mic className="w-8 h-8" />,
                            title: "Speak in your language",
                            desc: "Hindi, Tamil, Telugu, Bengali, English. Our AI understands you perfectly. No forms, no barriers."
                        },
                        {
                            icon: <Zap className="w-8 h-8" />,
                            title: "Geotagged Automatically",
                            desc: "Your location is pinned to the ward instantly. Officers see exactly where the issue is, no guesswork."
                        },
                        {
                            icon: <Shield className="w-8 h-8" />,
                            title: "Real-time updates",
                            desc: "Get SMS and email updates as your issue moves through the system. Transparency by design."
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            custom={i}
                            className="glass p-8 rounded-2xl hover:border-[var(--accent-cyan)]/30 transition-all group flex flex-col items-center justify-center text-center w-full"
                        >
                            <div className="w-16 h-16 rounded-xl bg-[var(--accent-cyan)]/10 flex items-center justify-center text-[var(--accent-cyan)] mb-6 group-hover:scale-110 transition-transform mx-auto">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-4 text-center w-full">{feature.title}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed text-center w-full">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Bug C Fix: Missing Social Proof / Large Stats */}
            <section className="py-24 border-y border-[var(--border)] bg-black/40 w-full flex flex-col items-center justify-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center w-full">
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-4xl md:text-5xl font-display font-bold text-white mb-2">47,293</span>
                            <span className="text-[10px] sm:text-xs text-[var(--accent-cyan)] tracking-widest uppercase font-bold">Reports Filed</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-4xl md:text-5xl font-display font-bold text-white mb-2">32m</span>
                            <span className="text-[10px] sm:text-xs text-[var(--accent-cyan)] tracking-widest uppercase font-bold">Avg Response Time</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-4xl md:text-5xl font-display font-bold text-white mb-2">98%</span>
                            <span className="text-[10px] sm:text-xs text-[var(--accent-cyan)] tracking-widest uppercase font-bold">Resolution Rate</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-4xl md:text-5xl font-display font-bold text-white mb-2">12</span>
                            <span className="text-[10px] sm:text-xs text-[var(--accent-cyan)] tracking-widest uppercase font-bold">City Departments</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* City Map Teaser */}
            <section className="py-32 w-full flex flex-col items-center justify-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
                        <div className="flex flex-col items-start text-left">
                            <SectionHeader
                                eyebrow="Live Situational Awareness"
                                title="Your City at a Glance"
                                description="Explore real-time data from every ward. See where progress is being made and where attention is needed."
                            />

                            <div className="space-y-6 mt-8 w-full">
                                <div className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors items-center">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-white font-bold">Critical Rapid Response</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">AI-triaged priority for life-safety issues.</p>
                                    </div>
                                </div>
                            </div>

                            <Link to="/live" className="inline-flex items-center gap-2 mt-10 text-[var(--accent-cyan)] font-bold group">
                                <span>View Full Map Data</span>
                                <Globe className="w-4 h-4 transition-transform group-hover:rotate-12" />
                            </Link>
                        </div>

                        <div className="h-[500px] w-full relative">
                            <div className="absolute top-4 left-4 z-10">
                                <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border-[var(--accent-cyan)]/20 shadow-lg">
                                    <div className="w-2 h-2 rounded-full bg-[var(--accent-red)] animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live 47 Active Issues</span>
                                </div>
                            </div>
                            <Suspense fallback={<div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />}>
                                <MapView
                                    markers={mockIssues.map(issue => ({
                                        position: issue.location,
                                        color: issue.priority === 'critical' ? 'var(--accent-red)' : 'var(--accent-gold)',
                                        popup: { title: issue.title, description: issue.ward }
                                    }))}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-[var(--border)] text-center w-full bg-black flex flex-col items-center justify-center">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center w-full">
                    <div className="text-2xl font-display font-bold mb-4 flex items-center justify-center">
                        <span className="text-[var(--accent-cyan)]">CIVIC</span>
                        <span className="text-white">BRIDGE</span>
                    </div>
                    <p className="text-[var(--text-muted)] text-sm text-center">
                        © {new Date().getFullYear()} CivicBridge. All rights reserved. Built for the people.
                    </p>
                </div>
            </footer>
        </div>
    );
};

// Simple AlertCircle local icon
const AlertCircle = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

export default Home;
