import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { signUp } from 'aws-amplify/auth';
import { UserPlus, Mail, Lock, User, MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import awsExports from '../../src/aws-exports';

Amplify.configure(awsExports);

const WARDS = Array.from({ length: 50 }, (_, i) => `Ward ${i + 1}`);

/**
 * SignUp Page — name, email, ward/district, password.
 * Stores role as 'citizen' by default in Cognito custom:role.
 */
export default function SignUpPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', ward: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await signUp({
                username: form.email,
                password: form.password,
                options: {
                    userAttributes: {
                        email: form.email,
                        name: form.name,
                        'custom:role': 'citizen',
                        'custom:ward': form.ward,
                    },
                },
            });
            router.push(`/auth/verify?email=${encodeURIComponent(form.email)}`);
        } catch (err) {
            setError(err.message || 'Sign-up failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                        <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="text-slate-400 mt-2">Join CivicBridge — your civic voice</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="text" value={form.name} onChange={update('name')} required
                                    placeholder="Raghul Kumar"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="email" value={form.email} onChange={update('email')} required
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>

                        {/* Ward */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ward / District</label>
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select value={form.ward} onChange={update('ward')}
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                                    <option value="" className="bg-slate-800">Select ward</option>
                                    {WARDS.map(w => <option key={w} value={w} className="bg-slate-800">{w}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="password" value={form.password} onChange={update('password')} required
                                    placeholder="Min 8 characters"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>

                        {/* Confirm */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            {form.password && form.confirmPassword && form.password === form.confirmPassword && (
                                <div className="flex items-center gap-1 mt-1.5 text-emerald-400 text-xs">
                                    <CheckCircle className="w-3 h-3" /> Passwords match
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
