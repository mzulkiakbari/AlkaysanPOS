'use client';
import { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function SyncIndicator() {
    const [status, setStatus] = useState('SYNCED'); // SYNCED, SYNCING, FAILED, OFFLINE
    const [details, setDetails] = useState({ syncedCount: 0, failedCount: 0, totalPending: 0 });
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || (branches && branches[0]);
    const isLocalNode = typeof window !== 'undefined' ? window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') : true;
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            setStatus('OFFLINE');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const performSync = async () => {
        if (!isOnline || !currentBranch) return;

        setStatus('SYNCING');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shortName: currentBranch.storeData.short_name,
                    uniqueId: currentBranch.uniqueId
                })
            });

            if (!res.ok) throw new Error('Sync endpoint failed');

            const data = await res.json();
            
            // Step 2: Download Master Data (Delta Sync)
            const masterRes = await fetch('/api/sync/master-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shortName: currentBranch.storeData.short_name,
                    uniqueId: currentBranch.uniqueId
                })
            });

            setDetails(data);

            if (data.failedCount > 0) {
                setStatus('FAILED');
            } else if (data.totalPending > 0) {
                // If it synced everything successfully
                setStatus('SYNCED');
            } else {
                // Nothing to sync
                setStatus('SYNCED');
            }
        } catch (error) {
            console.error('Background Sync Error:', error);
            setStatus('FAILED');
        }
    };

    useEffect(() => {
        // Run immediately, then every 30 seconds
        performSync();
        const interval = setInterval(performSync, 30000);
        return () => clearInterval(interval);
    }, [isOnline, currentBranch]);

    let Icon = CheckCircleIcon;
    let colorClass = 'text-green-500';
    let tooltip = 'Tersinkronisasi';

    if (status === 'OFFLINE') {
        Icon = XCircleIcon;
        colorClass = 'text-red-500';
        tooltip = 'Koneksi Terputus';
    } else if (status === 'SYNCING') {
        Icon = ArrowPathIcon;
        colorClass = 'text-yellow-500 animate-spin';
        tooltip = 'Sedang Mensinkronisasi...';
    } else if (status === 'FAILED') {
        Icon = ExclamationTriangleIcon;
        colorClass = 'text-red-500';
        tooltip = `Ada ${details.failedCount} data gagal sinkron`;
    } else if (details.totalPending > 0) {
        Icon = ArrowPathIcon;
        colorClass = 'text-yellow-500';
        tooltip = `Antrean: ${details.totalPending} data`;
    }

    if (!isLocalNode) return null;

    return (
        <div className="relative group flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title={tooltip}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
    );
}
