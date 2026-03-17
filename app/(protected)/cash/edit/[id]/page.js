'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '../../../../components/MainLayout';
import CashForm from '../../../../components/CashForm';
import { ChevronLeftIcon, BanknotesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../../context/AuthContext';

export default function CashEditPage() {
    const router = useRouter();
    const { id } = useParams();
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(true);
    const [cashData, setCashData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentBranch && id) {
            fetchCashDetail();
        }
    }, [currentBranch, id]);

    const fetchCashDetail = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId
            });

            const res = await fetch(`/api/cash/get/${id}?${params}`);
            const result = await res.json();

            if (result.success) {
                
                setCashData(result.data);
            } else {
                setError(result.message || 'Gagal memuat detail kas');
            }
        } catch (err) {
            console.error(err);
            setError('Terjadi kesalahan saat memuat data');
        } finally {
            setIsLoading(false);
        }
    };

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
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Edit Transaksi Kas</h1>
                        <p className="text-sm text-gray-400 font-medium">Ubah pencatatan kas ID: {id}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-10 -mt-10" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                                <BanknotesIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tighter">Formulir Edit Kas</h2>
                        </div>

                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <ArrowPathIcon className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm font-bold text-gray-400 animate-pulse">Memuat Transaksi...</p>
                            </div>
                        ) : error ? (
                            <div className="py-10 text-center">
                                <p className="text-red-500 font-bold mb-4">{error}</p>
                                <button onClick={fetchCashDetail} className="btn btn-secondary">Coba Lagi</button>
                            </div>
                        ) : (
                            <CashForm
                                initialData={{ ...cashData, id }}
                                onClose={() => router.push('/cash')}
                                onSuccess={() => {
                                    setTimeout(() => router.push('/cash'), 2000);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
