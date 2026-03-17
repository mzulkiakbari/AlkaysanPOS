'use client';

import { useRouter } from 'next/navigation';
import TransactionForm from '../../../../components/TransactionForm';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function TransactionAddModal() {
    const router = useRouter();

    const handleClose = () => {
        router.back();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-stretch justify-end">
            {/* Backdrop - click to close */}
            <div className="flex-1 cursor-pointer" onClick={handleClose} />

            {/* Side Panel */}
            <div className="w-full max-w-5xl bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Transaksi Baru</h2>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Lengkapi data pemesan & pilih produk</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                    >
                        <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50/50">
                    <TransactionForm onClose={handleClose} />
                </div>
            </div>
        </div>
    );
}
