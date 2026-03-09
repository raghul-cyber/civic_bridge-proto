import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('cb_token'))
    const navigate = useNavigate()

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await fetch('http://localhost:8000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            })

            if (!res.ok) {
                throw new Error('Authentication failed on the server')
            }

            const data = await res.json()
            localStorage.setItem('cb_token', data.token)
            setToken(data.token)
            setUser(data.user)
            navigate('/chat')  // redirect to main chat
        } catch (error) {
            console.error('Google Sign-In Error:', error)
            // Provide user fallback or silent fail depending on UX
        }
    }

    const logout = () => {
        localStorage.removeItem('cb_token')
        setUser(null)
        setToken(null)
        navigate('/login')
    }

    return { user, token, handleGoogleSuccess, logout }
}
