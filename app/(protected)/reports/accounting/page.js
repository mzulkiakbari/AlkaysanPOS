'use client';

import MainLayout from '../../../components/MainLayout';

export default function AccountingPage() {
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pajak & Akuntansi</h1>
                    <p className="text-[var(--text-secondary)]">Rekapitulasi pajak (PPN) dan laba kotor</p>
                </div>
                <div className="card text-center py-20">
                    <div className="inline-block p-4 rounded-full bg-[var(--primary)]/10 mb-4">
                        <svg className="w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Financial Report</h3>
                    <p className="text-[var(--text-secondary)]">Modul ini sedang dalam pengembangan.</p>
                </div>
            </div>
        </MainLayout>
    );
}
