'use client';

import MainLayout from '../../../components/MainLayout';

export default function StaffPerformancePage() {
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Performa Staf</h1>
                    <p className="text-[var(--text-secondary)]">Pantau penjualan per kasir atau jam kerja</p>
                </div>
                <div className="card text-center py-20">
                    <div className="inline-block p-4 rounded-full bg-[var(--primary)]/10 mb-4">
                        <svg className="w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Performa Karyawan</h3>
                    <p className="text-[var(--text-secondary)]">Modul ini sedang dalam pengembangan.</p>
                </div>
            </div>
        </MainLayout>
    );
}
