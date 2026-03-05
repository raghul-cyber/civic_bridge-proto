import React, { useState, useRef, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { ShieldCheck, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/router';
import awsExports from '../../src/aws-exports';

Amplify.configure(awsExports);

const CODE_LENGTH = 6;

/**
 * OTP Verification Page — 6-digit code input with auto-focus.
 */
export default function VerifyPage() {
    const router = useRouter();
    const email = router.query.email || '';
    const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const inputRefs = useRef([]);

    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-advance
        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (newCode.every(d => d !== '')) {
            handleVerify(newCode.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
        if (pasted.length === CODE_LENGTH) {
            setCode(pasted.split(''));
            handleVerify(pasted);
        }
    };

    const handleVerify = async (otp) => {
        setError('');
        setLoading(true);
        try {
            await confirmSignUp({ username: email, confirmationCode: otp });
            router.push('/auth/signin?verified=true');
        } catch (err) {
            setError(err.message || 'Verification failed.');
            setCode(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        try {
            await resendSignUpCode({ username: email });
            setResent(true);
            setTimeout(() => setResent(false), 5000);
        } catch (err) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Verify Email</h1>
                    <p className="text-slate-400 mt-2">
                        We sent a 6-digit code to<br />
                        <span className="text-blue-400 font-medium">{email || 'your email'}</span>
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => (inputRefs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className={`
                                    w-12 h-14 text-center text-xl font-bold
                                    bg-white/5 border rounded-xl text-white
                                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                                    transition-all
                                    ${digit ? 'border-violet-400' : 'border-white/10'}
                                `}
                            />
                        ))}
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center gap-2 text-violet-300 mb-4">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Verifying...</span>
                        </div>
                    )}

                    {/* Resend */}
                    <div className="text-center">
                        <button
                            onClick={handleResend}
                            disabled={resending || resent}
                            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                            {resent ? 'Code resent ✓' : resending ? 'Sending...' : 'Resend code'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
