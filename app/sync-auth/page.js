'use client';

import { useEffect } from 'react';

export default function SyncAuthSender() {
    useEffect(() => {
        if (typeof window === 'undefined' || window.parent === window) return;

        // Hanya kirim jika ada data user yang tersimpan
        const posUser = localStorage.getItem('pos_user');
        const user = localStorage.getItem('user');
        if (!posUser && !user) return;

        // Ambil semua localStorage dan cookies dari domain saat ini
        const data = {
            localStorage: { ...localStorage },
            cookies: document.cookie
        };

        // Kirim pesan ke window parent (iframe induk)
        window.parent.postMessage({ 
            type: 'ALKAYSAN_AUTH_SYNC', 
            data 
        }, '*'); // Menggunakan '*' agar bisa diterima oleh localhost
    }, []);

    // Halaman ini tidak perlu menampilkan UI apapun karena berjalan di background
    return null;
}
