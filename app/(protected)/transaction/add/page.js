'use client';

import { useState, useEffect } from 'react';

import MainLayout from '../../../components/MainLayout';
import TransactionForm from '../../../components/TransactionForm';
import { ShoppingCartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TransactionAddPage() {
    const [mounted, setMounted] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <MainLayout>
            <div className="mx-auto space-y-8 animate-fade-in pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/transaction" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Input Transaksi</h1>
                            <p className="text-gray-500 font-medium font-inter">Buat pesanan baru untuk pelanggan</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark items-center justify-center shadow-xl shadow-primary/20">
                        <ShoppingCartIcon className="w-7 h-7 text-white" />
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-10">
                    <div className="mb-10 flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold text-gray-800">
                            {(() => {
                                switch (currentStep) {
                                    case 1: return 'Detail Pelanggan';
                                    case 2: return 'Daftar Produk';
                                    case 3: return 'Konfigurasi Item';
                                    default: return 'Detail Pelanggan';
                                }
                            })()}
                        </h2>
                    </div>
                    <TransactionForm onStepChange={setCurrentStep} />
                </div>
            </div>
        </MainLayout>
    );
}
