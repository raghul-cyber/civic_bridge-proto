// src/components/Navbar.jsx 
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Globe, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage, INDIAN_LANGUAGES } from '../context/LanguageContext';

const Navbar = () => {
    const { language, setLanguage } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Report Issue', path: '/submit' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Live Data', path: '/live' },
        { name: 'Officer Portal', path: '/officer' },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300 border-b border-transparent bg-transparent",
                isScrolled && "glass border-[var(--border)] shadow-[var(--shadow-glow)]"
            )}
        >
            <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="text-2xl font-display flex items-baseline">
                        <span className="text-[var(--accent-cyan)] font-bold">CIVIC</span>
                        <span className="text-white">BRIDGE</span>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-2 h-2 rounded-full bg-[var(--accent-green)] shadow-[0_0_8px_var(--accent-green)]"
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="relative text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors py-2"
                        >
                            {link.name}
                            {location.pathname === link.path && (
                                <motion.div
                                    layoutId="nav-underline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] shadow-[0_0_8px_var(--accent-cyan)]"
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent-cyan)] hover:text-white transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            <span>{language.label}</span>
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isLangOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {isLangOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full mt-2 right-0 w-32 glass rounded-lg overflow-hidden py-1"
                                >
                                    {INDIAN_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang);
                                                setIsLangOpen(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2 text-xs transition-colors",
                                                lang.code === language.code ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] font-bold" : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--accent-cyan)] text-[var(--accent-cyan)] text-sm font-medium hover:bg-[var(--accent-cyan)] hover:text-black transition-all duration-300">
                        <LogIn className="w-4 h-4" />
                        <span>Login</span>
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-[var(--border)] overflow-hidden"
                    >
                        <div className="px-4 py-6 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "text-lg font-medium py-2 transition-colors",
                                        location.pathname === link.path ? "text-[var(--accent-cyan)]" : "text-[var(--text-secondary)]"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                <button className="flex items-center gap-2 text-[var(--text-secondary)]">
                                    <Globe className="w-5 h-5" />
                                    <span>{language.name}</span>
                                </button>
                                <button className="px-6 py-2 rounded-full border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-medium">
                                    Login
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
