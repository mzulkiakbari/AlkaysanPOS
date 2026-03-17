'use client';

import MainLayout from '../../../components/MainLayout';

export default function BestSellingItemsPage() {
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Produk Terlaris</h1>
                    <p className="text-[var(--text-secondary)]">Analisis produk mana yang paling laku</p>
                </div>
                <div className="card text-center py-20">
                    <div className="inline-block p-4 rounded-full bg-[var(--primary)]/10 mb-4">
                        <svg className="w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.98 7.98 0 01-2.343 5.657z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l.879 2.121z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Analisis Produk</h3>
                    <p className="text-[var(--text-secondary)]">Modul ini sedang dalam pengembangan.</p>
                </div>
            </div>
        </MainLayout>
    );
}
