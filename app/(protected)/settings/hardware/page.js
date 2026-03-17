'use client';

import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HardwareSetupPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user && !user.isAdmin && !user.isSuperAdmin) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) return null;
    if (!user.isAdmin && !user.isSuperAdmin) return null;
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hardware & Printer Setup</h1>
                    <p className="text-[var(--text-secondary)]">Koneksi ke printer thermal, laci kasir, dan scanner</p>
                </div>
                <div className="card text-center py-20">
                    <div className="inline-block p-4 rounded-full bg-[var(--primary)]/10 mb-4">
                        <svg className="w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Printer & Drawer</h3>
                    <p className="text-[var(--text-secondary)]">Modul ini sedang dalam pengembangan.</p>
                </div>
            </div>
        </MainLayout>
    );
}
