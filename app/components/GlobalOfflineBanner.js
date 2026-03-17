'use client';

import { useState, useEffect } from 'react';
import { WifiIcon } from '@heroicons/react/24/solid';
import { sqlite } from '../../lib/sqlite-client';

export default function GlobalOfflineBanner() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'success', 'error'
    const [syncCount, setSyncCount] = useState(0);

    useEffect(() => {
        // Initial check
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
            if (!navigator.onLine) setShowBanner(true);
        }

        const fetchPendingCount = async () => {
            try {
                const pending = await sqlite.getPendingTransactions();
                setSyncCount(pending.length);
            } catch (err) {
                console.error('Failed to fetch pending count', err);
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            fetchPendingCount();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
            setSyncStatus(null);
            fetchPendingCount();
        };

        const handleSyncStart = (e) => {
            setSyncStatus('syncing');
            setSyncCount(e.detail.count);
            setShowBanner(true);
        };

        const handleSyncEnd = (e) => {
            fetchPendingCount();
            if (e.detail.success) {
                setSyncStatus('success');
                setTimeout(() => {
                    setShowBanner(false);
                    setSyncStatus(null);
                }, 3000);
            } else {
                setSyncStatus('error');
                setTimeout(() => setSyncStatus(null), 5000);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 10000); // Check every 10s

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('sync:start', handleSyncStart);
        window.addEventListener('sync:end', handleSyncEnd);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sync:start', handleSyncStart);
            window.removeEventListener('sync:end', handleSyncEnd);
        };
    }, []);

    if (!showBanner) return null;

    const getBannerContent = () => {
        if (syncStatus === 'syncing') return {
            message: `Sedang menyinkronkan ${syncCount} transaksi...`,
            class: 'bg-blue-600',
            iconClass: 'animate-spin'
        };
        if (syncStatus === 'success') return {
            message: 'Sinkronisasi berhasil!',
            class: 'bg-emerald-500',
            iconClass: ''
        };
        if (syncStatus === 'error') return {
            message: 'Gagal menyinkronkan transaksi.',
            class: 'bg-red-500',
            iconClass: ''
        };
        
        return {
            message: isOnline 
                ? 'Koneksi internet terhubung kembali.' 
                : `Anda sedang offline. ${syncCount > 0 ? `(${syncCount} transaksi tertunda)` : 'Periksa koneksi internet Anda.'}`,
            class: isOnline ? 'bg-emerald-500' : 'bg-gray-900',
            iconClass: !isOnline ? 'animate-pulse text-red-400' : ''
        };
    };

    const content = getBannerContent();

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-in-out ${showBanner ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className={`px-4 py-3 flex items-center justify-center gap-2 shadow-lg ${content.class} text-white`}>
                <WifiIcon className={`w-5 h-5 ${content.iconClass}`} />
                <span className="font-bold text-sm">
                    {content.message}
                </span>
            </div>
        </div>
    );
}
