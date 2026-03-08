import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Wind, Droplets, Thermometer, CreditCard, Users, Map as MapIcon, RefreshCw, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '../lib/utils';
const MapView = lazy(() => import('../components/MapView'));
import SectionHeader from '../components/SectionHeader';
import { mockDatasets, mockIssues } from '../data/mockData';

const LiveData = () => {
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [aqiData, setAqiData] = useState(mockDatasets.airQuality.trend);

    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdated(new Date());
            // Slight random jitter to data for "live" feel
            setAqiData(prev => [...prev.slice(1), prev[prev.length - 1] + (Math.random() * 4 - 2)]);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const budgetData = [
        { name: 'Infrastructure', value: 45, color: 'var(--accent-cyan)' },
        { name: 'Public Safety', value: 30, color: 'var(--accent-gold)' },
        { name: 'Sanitation', value: 15, color: 'var(--accent-green)' },
        { name: 'Admin', value: 10, color: 'var(--text-muted)' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-12">
                <SectionHeader
                    eyebrow="City Metrics"
                    title="Live Data Stream"
                    description="Real-time situational awareness across all departments."
                    className="mb-0"
                />
                <div className="flex items-center gap-3 glass px-4 py-2 rounded-full border-[var(--border)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse shadow-[0_0_8px_var(--accent-green)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live Connection Stable</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Hero Map */}
            <div className="h-[500px] w-full mb-12 rounded-3xl overflow-hidden glass border-[var(--border)] relative group">
                <Suspense fallback={<div className="h-full w-full bg-white/5 animate-pulse" />}>
                    <MapView
                        markers={mockIssues.map(issue => ({
                            position: issue.location,
                            color: issue.priority === 'critical' ? 'var(--accent-red)' : 'var(--accent-gold)',
                            popup: { title: issue.title, description: issue.status }
                        }))}
                    />
                </Suspense>
                <div className="absolute top-6 left-6 z-10 glass p-4 rounded-xl border-white/10 max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                        <MapIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
                        <h4 className="text-sm font-bold text-white">Active Deployments</h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Currently tracking 47 active service requests across Chicago metro area.</p>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Air Quality Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass p-8 rounded-3xl relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--accent-cyan)]">
                            <Wind className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Air Quality Index</p>
                            <h4 className="text-2xl font-display font-bold text-white">42 AQI</h4>
                        </div>
                    </div>

                    <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={aqiData.map((v, i) => ({ v, i }))}>
                                <Area type="monotone" dataKey="v" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.1} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-4 text-[10px] text-[var(--accent-green)] font-bold uppercase flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Healthy Conditions Persist
                    </p>
                </motion.div>

                {/* Budget Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="glass p-8 rounded-3xl relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--accent-gold)]">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Monthly Spending</p>
                            <h4 className="text-2xl font-display font-bold text-white">$14.2M</h4>
                        </div>
                    </div>

                    <div className="flex h-32 items-center">
                        <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={budgetData}
                                        innerRadius={30}
                                        outerRadius={45}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {budgetData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-2">
                            {budgetData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-[10px] text-[var(--text-secondary)] truncate">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-[var(--text-muted)] font-bold uppercase">Data sourced from USASpending.gov</p>
                </motion.div>

                {/* Weather Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="glass p-8 rounded-3xl relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--accent-red)]">
                            <Thermometer className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Local Weather</p>
                            <h4 className="text-2xl font-display font-bold text-white">68°F</h4>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-[var(--accent-cyan)]" />
                                <span className="text-xs text-white">Humidity</span>
                            </div>
                            <span className="text-xs font-mono">45%</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-[var(--accent-gold)]" />
                                <span className="text-xs text-white">Wind Speed</span>
                            </div>
                            <span className="text-xs font-mono">12 mph</span>
                        </div>
                    </div>
                    <p className="mt-8 text-[10px] text-[var(--text-muted)] font-bold uppercase">Station: Chicago Midway (MDW)</p>
                </motion.div>
            </div>
        </div>
    );
};

export default LiveData;
