import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import { LogIn, Mail, Lock, Loader2, AlertCircle, Chrome } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import awsExports from '../../src/aws-exports';

Amplify.configure(awsExports);

/**
 * SignIn Page — email/password + Google OAuth.
 * Uses Amplify Auth v6 (modular imports).
 */
export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { isSignedIn, nextStep } = await signIn({
                username: email,
                password,
            });

            if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
            } else if (isSignedIn) {
                router.push('/');
            }
        } catch (err) {
            setError(err.message || 'Sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithRedirect({ provider: 'Google' });
        } catch (err) {
            setError('Google sign-in failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <span className="text-2xl">🏛️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-slate-400 mt-2">Sign in to CivicBridge</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Error */}
                    {error && (
                        <div className="mb-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                                   bg-white text-slate-800 font-medium text-sm
                                   hover:bg-slate-100 transition-all shadow-sm"
                    >
                        <Chrome className="w-5 h-5" />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs text-slate-500 bg-transparent">or sign in with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                               text-white placeholder-slate-500 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                               text-white placeholder-slate-500 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                                       bg-blue-600 text-white font-semibold text-sm
                                       hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer links */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
