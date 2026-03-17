'use client';

import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function FetchErrorState({
    title = "Gagal memuat data",
    message = "Terjadi kesalahan saat mengambil data. Silakan coba lagi.",
    onRetry,
    className = ""
}) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 ${className}`}>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 text-sm max-w-md mb-6">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Coba Lagi
                </button>
            )}
        </div>
    );
}
