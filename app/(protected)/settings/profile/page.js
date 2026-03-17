'use client';

import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StoreProfilePage() {
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
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profil Toko</h1>
                    <p className="text-[var(--text-secondary)]">Mengatur nama toko, alamat, dan logo pada struk</p>
                </div>
                <div className="card text-center py-20">
                    <div className="inline-block p-4 rounded-full bg-[var(--primary)]/10 mb-4">
                        <svg className="w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Identitas Toko</h3>
                    <p className="text-[var(--text-secondary)]">Modul ini sedang dalam pengembangan.</p>
                </div>
            </div>
        </MainLayout>
    );
}
