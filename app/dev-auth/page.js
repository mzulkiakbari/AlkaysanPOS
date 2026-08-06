'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function DevAuthHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Memproses data akun...');

    useEffect(() => {
        const dataParam = searchParams.get('data');
        if (!dataParam) {
            setStatus('Error: Tidak ada data otentikasi yang ditemukan di URL.');
            return;
        }

        try {
            const data = JSON.parse(decodeURIComponent(dataParam));

            // 1. Simpan LocalStorage
            if (data.localStorage) {
                Object.keys(data.localStorage).forEach(key => {
                    localStorage.setItem(key, data.localStorage[key]);
                });
            }

            // 2. Simpan Cookies
            if (data.cookies) {
                data.cookies.split(';').forEach(cookie => {
                    document.cookie = cookie.trim();
                });
            }

            setStatus('Selesai! Otentikasi berhasil disalin. Mengalihkan ke dashboard...');
            
            // Redirect ke halaman utama setelah berhasil
            setTimeout(() => {
                window.location.href = '/'; 
            }, 1500);

        } catch (error) {
            console.error(error);
            setStatus('Error: Format data tidak valid.');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm text-center">
                {status.includes('Selesai') ? (
                    <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-4" />
                ) : status.includes('Error') ? (
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">X</div>
                ) : (
                    <ArrowPathIcon className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                )}
                <h1 className="text-xl font-bold text-gray-800 mb-2">Sinkronisasi Lokal</h1>
                <p className="text-sm text-gray-500">{status}</p>
            </div>
        </div>
    );
}

export default function DevAuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <DevAuthHandler />
        </Suspense>
    );
}
