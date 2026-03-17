'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LogoutCallback() {
    const { logoutLocal } = useAuth();
    const processedRef = useRef(false);
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        const finalizeLogout = async () => {
            try {
                // 1. Clear HTTP-only cookies via API
                await fetch('/api/auth/logout', { method: 'POST' });

                // 2. Clear local storage and state
                logoutLocal();
                setIsProcessing(false);
            } catch (error) {
                console.error('Final logout failed:', error);
                // Fallback: clear what we can and go home
                logoutLocal();
                setIsProcessing(false);
            }
        };

        finalizeLogout();
    }, [logoutLocal]);

    return (
        <div className="min-h-screen bg-[var(--bg-sidebar)] flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                <h2 className="text-xl font-bold text-white">Menyelesaikan Logout...</h2>
                <p className="text-white/60">Mohon tunggu sebentar, Anda akan segera dialihkan.</p>
            </div>
        </div>
    );
}
