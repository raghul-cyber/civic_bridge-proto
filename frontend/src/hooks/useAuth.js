import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
    const getInitialUser = () => {
        try {
            const saved = localStorage.getItem('cb_user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    };

    const [user, setUser] = useState(getInitialUser);
    const [token, setToken] = useState(localStorage.getItem('cb_token'));
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            if (!res.ok) {
                throw new Error('Authentication failed on the server');
            }

            const data = await res.json();
            localStorage.setItem('cb_token', data.token);
            localStorage.setItem('cb_user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);

            // Dispatch success event for toast notification
            window.dispatchEvent(new CustomEvent('login-success', { detail: data.user.name }));
            navigate('/chat');  // redirect to main chat
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            window.dispatchEvent(new CustomEvent('login-error', { detail: 'Google Sign-In Failed' }));
        }
    }

    const logout = () => {
        localStorage.removeItem('cb_token');
        localStorage.removeItem('cb_user');
        setUser(null);
        setToken(null);
        navigate('/login');
    }

    return { user, token, handleGoogleSuccess, logout };
}
