import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpDown, Map as MapIcon, List, Plus, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '../lib/utils';
import useIssues from '../hooks/useIssues';
import IssueCard from '../components/IssueCard';
import SkeletonCard from '../components/SkeletonCard';
import SectionHeader from '../components/SectionHeader';
const MapView = React.lazy(() => import('../components/MapView'));
import { CATEGORIES } from '../lib/constants';

const Dashboard = () => {
    const [viewMode, setViewMode] = useState('list'); // list | map
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const { issues, isLoading } = useIssues({
        query: searchQuery,
        category: activeCategory === 'all' ? null : activeCategory
    });

    const stats = [
        { label: 'Total Issues', value: '47,293', change: '+12%', icon: <List className="w-4 h-4" /> },
        { label: 'Open Now', value: '12,847', change: '-3%', icon: <Clock className="w-4 h-4" />, color: 'var(--accent-red)' },
        { label: 'Resolved', value: '32,446', change: '+18%', icon: <CheckCircle2 className="w-4 h-4" />, color: 'var(--accent-green)' },
        { label: 'Active Wards', value: '48', change: '0%', icon: <MapIcon className="w-4 h-4" /> },
    ];

    const chartData = [
        { name: 'Mon', value: 400 },
        { name: 'Tue', value: 300 },
        { name: 'Wed', value: 600 },
        { name: 'Thu', value: 800 },
        { name: 'Fri', value: 500 },
        { name: 'Sat', value: 900 },
        { name: 'Sun', value: 700 },
    ];

    const categoryData = useMemo(() => {
        return CATEGORIES.map(cat => ({
            name: cat.name,
            value: Math.floor(Math.random() * 50) + 10
        })).sort((a, b) => b.value - a.value);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <SectionHeader
                    eyebrow="Citizen Dashboard"
                    title="Community Insights"
                    description="47 active reports across 48 wards. Your city is listening."
                    className="mb-0"
                />

                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            viewMode === 'list' ? "bg-[var(--accent-cyan)] text-black" : "text-[var(--text-muted)] hover:text-white"
                        )}
                    >
                        <List className="w-4 h-4" />
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            viewMode === 'map' ? "bg-[var(--accent-cyan)] text-black" : "text-[var(--text-muted)] hover:text-white"
                        )}
                    >
                        <MapIcon className="w-4 h-4" />
                        Map View
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-6 rounded-2xl relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[var(--accent-cyan)]">
                                {stat.icon}
                            </div>
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded",
                                stat.change.startsWith('+') ? "bg-green-500/10 text-[var(--accent-green)]" : "bg-red-500/10 text-[var(--accent-red)]"
                            )}>
                                {stat.change}
                            </div>
                        </div>
                        <h4 className="text-2xl font-display font-bold text-white mb-1" style={{ color: stat.color }}>{stat.value}</h4>
                        <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{stat.label}</p>

                        {/* Sparkline approximation */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '40%' }}
                                className="h-full bg-[var(--accent-cyan)]/30"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filters & Search */}
                    <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by location, category, or issue ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--accent-cyan)]/50 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={activeCategory}
                                onChange={(e) => setActiveCategory(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white focus:outline-none focus:border-[var(--accent-cyan)]/50 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <button className="p-2.5 glass rounded-xl border-white/10 hover:border-[var(--accent-cyan)]/50 transition-colors">
                                <Filter className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* View Container */}
                    <div className="min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {viewMode === 'list' ? (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 gap-4"
                                >
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                                    ) : (
                                        issues.map(issue => (
                                            <IssueCard key={issue.id} issue={issue} />
                                        ))
                                    )}
                                    {issues.length === 0 && !isLoading && (
                                        <div className="flex flex-col items-center justify-center p-20 opacity-30 text-center">
                                            <Search className="w-16 h-16 mb-4" />
                                            <p>No issues found matching your filters.</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="map"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="h-[600px] w-full rounded-2xl overflow-hidden glass border-[var(--border)]"
                                >
                                    <Suspense fallback={<div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />}>
                                        <MapView
                                            markers={issues.map(issue => ({
                                                position: issue.location,
                                                color: issue.priority === 'critical' ? 'var(--accent-red)' : 'var(--accent-gold)',
                                                popup: { title: issue.title, description: issue.ward }
                                            }))}
                                        />
                                    </Suspense>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-8">
                    {/* Quick Stats Chart */}
                    <div className="glass p-6 rounded-3xl border-[var(--border)]">
                        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[var(--accent-cyan)]" />
                            Activity Trend
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--accent-cyan)' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="glass p-6 rounded-3xl border-[var(--border)]">
                        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[var(--accent-gold)]" />
                            Issue Breakdown
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'white', opacity: 0.05 }}
                                        contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// BarChart3 local icon
const BarChart3 = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
);

export default Dashboard;
