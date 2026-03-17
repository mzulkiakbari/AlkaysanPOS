'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import CashForm from '../../../components/CashForm';
import { ChevronLeftIcon, BanknotesIcon } from '@heroicons/react/24/outline';

export default function CashAddPage() {
    const router = useRouter();

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
                {/* Header/Breadcrumb */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/cash')}
                        className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Transaksi Kas Baru</h1>
                        <p className="text-sm text-gray-400 font-medium">Tambah pencatatan kas masuk atau keluar</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 relative overflow-hidden">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-10 -mt-10" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                                <BanknotesIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tighter">Formulir Kas</h2>
                        </div>

                        <CashForm
                            onClose={() => router.push('/cash')}
                            onSuccess={() => {
                                // Redirection is handled in the form via setTimeout or manual here
                                setTimeout(() => router.push('/cash'), 2000);
                            }}
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
