import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, BarChart3, Map as MapIcon, ChevronDown, Shield, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { fadeUp, stagger, fadeIn } from '../lib/animations';
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
        <div ref={containerRef} className="relative">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

                <motion.div
                    style={{ y: y1, opacity }}
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="relative z-10 text-center px-4 max-w-5xl mx-auto"
                >
                    <motion.span
                        variants={fadeUp}
                        className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-cyan)] mb-6 block"
                    >
                        Civic Technology for Everyone
                    </motion.span>

                    <motion.h1
                        variants={fadeUp}
                        className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 tracking-tight"
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
                        className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        Report civic issues in your language. Track them in real time.
                        Hold your city accountable with AI-powered transparency.
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            to="/submit"
                            className="group relative px-8 py-4 bg-[var(--accent-cyan)] text-black font-bold rounded-xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-105"
                        >
                            <div className="relative z-10 flex items-center gap-2">
                                <Mic className="w-5 h-5 group-hover:animate-pulse" />
                                <span>Start Speaking</span>
                            </div>
                        </Link>

                        <Link
                            to="/dashboard"
                            className="px-8 py-4 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] font-bold rounded-xl hover:bg-[var(--accent-cyan)]/5 transition-all"
                        >
                            View Live Dashboard
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-muted)] flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-widest font-bold">Scroll to explore</span>
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </section>

            {/* Stats Quick Look */}
            <section className="py-20 border-y border-[var(--border)] glass relative z-10">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <StatsCounter value={12847} label="Issues Resolved" suffix="+" />
                    <StatsCounter value={5} label="Languages Supported" />
                    <StatsCounter value={48} label="City Wards Covered" />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 max-w-7xl mx-auto px-4">
                <SectionHeader
                    eyebrow="How it works"
                    title="Speak. Submit. Track."
                    description="We've removed the barriers to civic engagement. No forms, no waiting, just action."
                    align="center"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
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
                            className="glass p-8 rounded-2xl hover:border-[var(--accent-cyan)]/30 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-xl bg-[var(--accent-cyan)]/10 flex items-center justify-center text-[var(--accent-cyan)] mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* City Map Teaser */}
            <section className="py-32 border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <SectionHeader
                                eyebrow="Live Situational Awareness"
                                title="Your City at a Glance"
                                description="Explore real-time data from every ward. See where progress is being made and where attention is needed."
                            />

                            <div className="space-y-6 mt-8">
                                <div className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Critical Rapid Response</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">AI-triaged priority for life-safety issues.</p>
                                    </div>
                                </div>
                                {/* More items... */}
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
        </div>
    );
};

// Simple AlertCircle local icon since it's not imported
const AlertCircle = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

export default Home;
