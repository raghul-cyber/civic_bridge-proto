import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Inbox, BarChart3, Settings, LogOut, Search, MoreVertical, CheckCircle2, UserPlus, Zap, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import useIssues from '../hooks/useIssues';
import IssueCard from '../components/IssueCard';
import { CATEGORIES } from '../lib/constants';

const OfficerPortal = () => {
    const [activeTab, setActiveTab] = useState('overview'); // overview | queue | analytics
    const [searchQuery, setSearchQuery] = useState('');

    const filters = useMemo(() => ({
        status: 'OPEN',
        query: searchQuery
    }), [searchQuery]);

    const { issues, isLoading } = useIssues(filters);

    const stats = [
        { label: 'Assigned to Me', value: '12', icon: <Inbox className="w-4 h-4 text-[var(--accent-cyan)]" /> },
        { label: 'Avg Resolution', value: '2.4d', icon: <Zap className="w-4 h-4 text-[var(--accent-gold)]" /> },
        { label: 'Team Capacity', value: '82%', icon: <BarChart3 className="w-4 h-4 text-[var(--accent-green)]" /> },
    ];

    return (
        <div className="flex min-h-[calc(100vh-64px)] bg-[var(--bg-base)]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--border)] glass hidden lg:flex flex-col p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-cyan)]/10 flex items-center justify-center text-[var(--accent-cyan)] font-display font-bold">
                        JD
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-tight">John Doe</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Officer • Ward 42</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'overview', name: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
                        { id: 'queue', name: 'My Queue', icon: <Inbox className="w-4 h-4" />, badge: '5' },
                        { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
                        { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                activeTab === item.id
                                    ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-l-2 border-[var(--accent-cyan)] rounded-l-none"
                                    : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className="bg-[var(--accent-red)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors mt-auto">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-12">
                        <div className="flex items-center gap-2 text-[var(--accent-cyan)] font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                            <Shield className="w-4 h-4" />
                            Infrastructure Management Portal
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white">Officer Operations Dashboard</h1>
                    </header>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {stats.map((stat, i) => (
                            <div key={i} className="glass p-6 rounded-2xl border-white/5 flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-display font-bold text-white">{stat.value}</h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-display font-bold text-white">Priority Queue</h2>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="ID Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-[var(--accent-cyan)]/50 "
                                />
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border-white/10 text-xs font-bold text-white">
                                <Plus className="w-3.5 h-3.5" />
                                Assign Selected
                            </button>
                        </div>
                    </div>

                    {/* Issue Table/List */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
                            </div>
                        ) : (
                            issues.map(issue => (
                                <div key={issue.id} className="glass rounded-2xl border-white/5 overflow-hidden group hover:border-[var(--accent-cyan)]/30 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-mono font-bold text-[var(--accent-cyan)]">{issue.id}</span>
                                                <div className="px-2 py-0.5 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] text-[8px] font-bold rounded uppercase flex items-center gap-1">
                                                    <Zap className="w-2.5 h-2.5" /> AI Triage: Infrastructure Risk
                                                </div>
                                            </div>
                                            <h3 className="text-white font-bold mb-1 truncate">{issue.title}</h3>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{issue.description}</p>
                                        </div>

                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Reported By</p>
                                                <p className="text-xs text-white font-medium">{issue.reporter || 'Anonymous'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 glass rounded-lg border-white/10 hover:text-[var(--accent-green)] transition-colors">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 glass rounded-lg border-white/10 hover:text-[var(--accent-cyan)] transition-colors">
                                                    <UserPlus className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 glass rounded-lg border-white/10 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OfficerPortal;
