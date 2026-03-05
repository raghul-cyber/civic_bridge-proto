import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/router';
import { Loader2, Shield, LogOut, User, ChevronDown } from 'lucide-react';
import awsExports from '../src/aws-exports';

Amplify.configure(awsExports);

/**
 * Role hierarchy for access control.
 * Higher index = more permissions.
 */
const ROLE_HIERARCHY = { citizen: 0, officer: 1, admin: 2 };

/**
 * withAuth — Protected route Higher-Order Component.
 *
 * Features:
 *   - Redirects to /auth/signin if unauthenticated
 *   - Injects `user` prop: { userId, email, name, role, ward, avatarUrl }
 *   - Role-based gating: withAuth(Component, { requiredRole: 'officer' })
 *   - Renders nav header with user info + sign-out
 *
 * @param {React.Component} WrappedComponent
 * @param {object}          options
 * @param {string}          options.requiredRole - Minimum role: 'citizen' | 'officer' | 'admin'
 */
export default function withAuth(WrappedComponent, { requiredRole = 'citizen' } = {}) {
    return function ProtectedRoute(props) {
        const router = useRouter();
        const [user, setUser] = useState(null);
        const [authState, setAuthState] = useState('loading'); // loading | authenticated | unauthorized | unauthenticated
        const [menuOpen, setMenuOpen] = useState(false);

        useEffect(() => {
            checkAuth();
        }, []);

        const checkAuth = async () => {
            try {
                const currentUser = await getCurrentUser();
                const attributes = await fetchUserAttributes();

                const userData = {
                    userId: currentUser.userId,
                    username: currentUser.username,
                    email: attributes.email || '',
                    name: attributes.name || attributes.email?.split('@')[0] || 'User',
                    role: attributes['custom:role'] || 'citizen',
                    ward: attributes['custom:ward'] || '',
                    avatarUrl: attributes.picture || null,
                };

                // Role check
                const userLevel = ROLE_HIERARCHY[userData.role] ?? 0;
                const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

                if (userLevel < requiredLevel) {
                    setAuthState('unauthorized');
                    return;
                }

                setUser(userData);
                setAuthState('authenticated');
            } catch (err) {
                setAuthState('unauthenticated');
                router.replace(`/auth/signin?redirect=${encodeURIComponent(router.asPath)}`);
            }
        };

        const handleSignOut = async () => {
            try {
                await signOut();
                router.push('/auth/signin');
            } catch (err) {
                console.error('Sign-out error:', err);
            }
        };

        // ── Loading state ──
        if (authState === 'loading') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Authenticating...</p>
                    </div>
                </div>
            );
        }

        // ── Unauthorized (insufficient role) ──
        if (authState === 'unauthorized') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            This page requires <span className="text-red-400 font-semibold">{requiredRole}</span> access.
                            Your current role is <span className="text-blue-400">{user?.role || 'citizen'}</span>.
                        </p>
                        <button onClick={() => router.push('/')}
                            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all">
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        // ── Authenticated — render wrapped component + nav ──
        return (
            <div>
                {/* User Nav Bar */}
                <nav className="bg-slate-900/80 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-sm">🏛️</span>
                        </div>
                        <span className="text-white font-semibold text-sm hidden sm:block">CivicBridge</span>
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                        >
                            {/* Avatar */}
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <span className="text-sm text-white font-medium hidden sm:block">{user.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium uppercase tracking-wide">
                                {user.role}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {/* Dropdown */}
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                                <div className="px-4 py-2 border-b border-white/5">
                                    <p className="text-sm text-white font-medium">{user.name}</p>
                                    <p className="text-xs text-slate-400">{user.email}</p>
                                    {user.ward && <p className="text-xs text-slate-500 mt-0.5">{user.ward}</p>}
                                </div>
                                <button onClick={handleSignOut}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Wrapped Component */}
                <WrappedComponent {...props} user={user} />
            </div>
        );
    };
}
