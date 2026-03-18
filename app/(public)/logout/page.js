'use client';

import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LogoutPage() {
    const { logout } = useAuth();

    useEffect(() => {
        logout();
    }, [logout]);

    return (
        <div className="min-h-screen bg-[var(--bg-sidebar)] flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                <h2 className="text-xl font-bold text-white">Sedang Keluar...</h2>
                <p className="text-white/60">Anda akan segera dialihkan ke halaman login SSO.</p>
            </div>
        </div>
    );
}
