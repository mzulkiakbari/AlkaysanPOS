'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChartBarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const SLEEP_TIMEOUT = 5 * 60 * 1000; // 5 menit default

export default function SessionWrapper({ children }) {
    const { isAuthenticated, user } = useAuth();
    const [isSleeping, setIsSleeping] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const timeoutRef = useRef(null);

    const inputRef = useRef(null);

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!isSleeping && isAuthenticated) {
            timeoutRef.current = setTimeout(() => {
                setIsSleeping(true);
            }, SLEEP_TIMEOUT);
        }
    };

    useEffect(() => {
        if (isSleeping && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSleeping]);

    useEffect(() => {
        if (pin.length === 6) {
            // Simulasi event untuk handleUnlock
            handleUnlock({ preventDefault: () => { } });
        }
    }, [pin]);

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        const handleEvent = () => {
            if (!isSleeping) {
                resetTimer();
            }
        };

        if (isAuthenticated) {
            events.forEach(event => document.addEventListener(event, handleEvent));
            resetTimer();
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => document.removeEventListener(event, handleEvent));
        };
    }, [isAuthenticated, isSleeping]);

    const handleUnlock = (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Decode pin_access from user data (encoded with btoa)
        let correctPin = '123456'; // Default fallback if pin_access is missing
        if (user && user.pin_access) {
            try {
                correctPin = atob(user.pin_access);
            } catch (err) {
                console.error('Failed to decode PIN:', err);
            }
        }

        if (pin === correctPin) {
            setIsSleeping(false);
            setPin('');
            setError('');
            resetTimer();
        } else {
            setError('PIN salah. Coba lagi.');
            setPin('');
            // Refocus after clear
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    };

    if (isSleeping) {
        return (
            <div
                className="fixed inset-0 z-[9999] bg-gradient-to-br from-[var(--bg-sidebar)] via-[var(--primary-dark)] to-[var(--primary)] flex items-center justify-center p-6 animate-fade-in cursor-default"
                onClick={() => inputRef.current?.focus()}
            >
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="w-full max-w-sm text-center relative z-10" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-2xl">
                            <LockClosedIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Sesi Terkunci</h2>
                        <p className="text-white/60">Masukkan PIN untuk melanjutkan</p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-6">
                        <div className="flex justify-center gap-3" onClick={() => inputRef.current?.focus()}>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full border-2 border-white/50 transition-all duration-300 ${pin.length > i ? 'bg-white scale-110' : ''
                                        }`}
                                />
                            ))}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={pin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 6) setPin(val);
                            }}
                            className="absolute opacity-0 pointer-events-none"
                            autoComplete="off"
                            autoFocus
                        />

                        {/* PIN Pad Grid */}
                        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (num === 'C') setPin('');
                                        else if (num === '←') setPin(prev => prev.slice(0, -1));
                                        else if (pin.length < 6) setPin(prev => prev + num);
                                        inputRef.current?.focus();
                                    }}
                                    className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xl font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center shadow-lg"
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        {error && <p className="text-red-300 text-sm animate-shake">{error}</p>}

                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl bg-white text-[var(--primary-dark)] font-bold text-lg shadow-2xl hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            <LockClosedIcon className="w-5 h-5" />
                            Masuk Ke Sistem
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return children;
}
