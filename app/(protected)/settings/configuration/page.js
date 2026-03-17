'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import {
    CircleStackIcon,
    ArrowPathIcon,
    ClipboardIcon,
    ExclamationTriangleIcon,
    DocumentDuplicateIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import Toast from '../../../components/Toast';

export default function ConfigurationPage() {
    const [configData, setConfigData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [storeForm, setStoreForm] = useState({
        store_name: '',
        address: '',
        phone_number: '',
        footer_receipt: ''
    });

    const htmlToText = (html) => {
        if (!html) return '';
        return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, "");
    };

    const textToHtml = (text) => {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
    };

    const loadConfig = () => {
        setIsLoading(true);
        const keys = ['pos_user', 'pos_branch', 'pos_branches', 'active_branch'];
        const data = keys.map(key => ({
            key,
            value: localStorage.getItem(key) || 'null'
        }));
        setConfigData(data);

        // Load store form
        const branch = localStorage.getItem('pos_branch');
        if (branch) {
            try {
                const parsed = JSON.parse(branch);
                setStoreForm({
                    store_name: parsed?.storeName || '',
                    address: parsed.storeData?.address || '',
                    phone_number: parsed.storeData?.phone_number || '',
                    footer_receipt: htmlToText(parsed.storeData?.note || '')
                });
            } catch (e) { }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleSaveStore = (e) => {
        e.preventDefault();
        try {
            const branch = localStorage.getItem('pos_branch');
            if (branch) {
                const parsed = JSON.parse(branch);
                const updatedStoreData = {
                    ...parsed.storeData,
                    address: storeForm.address,
                    phone_number: storeForm.phone_number,
                    note: textToHtml(storeForm.footer_receipt)
                };
                parsed.storeData = updatedStoreData;
                localStorage.setItem('pos_branch', JSON.stringify(parsed));
                loadConfig();
                setToast({ show: true, message: 'Informasi toko berhasil diperbarui', type: 'success' });
            }
        } catch (error) {
            console.error('Error saving store data:', error);
            setToast({ show: true, message: 'Gagal memperbarui informasi toko', type: 'error' });
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-10">
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                            <CircleStackIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Konfigurasi Sistem</h1>
                            <p className="text-[var(--text-secondary)] text-sm">Kelola data lokal aplikasi</p>
                        </div>
                    </div>
                    <button
                        onClick={loadConfig}
                        className="btn btn-secondary h-12 px-6 rounded-2xl flex items-center gap-2"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Data</span>
                    </button>
                </div>

                {/* Store Data Form */}
                <div className="card p-6 border-none shadow-xl shadow-black/5 bg-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold border border-blue-100">
                            ID
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)]">Informasi Toko</h3>
                            <p className="text-[var(--text-secondary)] text-xs">Edit data yang muncul di struk dan profil toko</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveStore} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nama Toko</label>
                                <input
                                    type="text"
                                    value={storeForm.store_name}
                                    onChange={(e) => setStoreForm(prev => ({ ...prev, store_name: e.target.value }))}
                                    className="input !bg-gray-100 !text-gray-400 cursor-not-allowed border-gray-200"
                                    disabled
                                    placeholder="Masukkan nama toko"
                                />
                                <span className="text-[10px] text-gray-400 block pl-1">Hanya Admin yang dapat mengubah nama toko</span>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nomor Telepon</label>
                                <input
                                    type="text"
                                    value={storeForm.phone_number}
                                    onChange={(e) => setStoreForm(prev => ({ ...prev, phone_number: e.target.value }))}
                                    className="input"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Alamat</label>
                                <textarea
                                    value={storeForm.address}
                                    onChange={(e) => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="input min-h-[100px] py-3 resize-none"
                                    placeholder="Alamat lengkap toko"
                                ></textarea>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Footer Struk</label>
                                <textarea
                                    value={storeForm.footer_receipt}
                                    onChange={(e) => setStoreForm(prev => ({ ...prev, footer_receipt: e.target.value }))}
                                    className="input min-h-[160px] py-3 font-mono text-sm leading-relaxed"
                                    placeholder="Pesan di bagian bawah struk..."
                                ></textarea>
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="btn btn-primary w-full h-12 rounded-2xl shadow-lg shadow-[var(--primary)]/20 font-bold">
                                    Simpan Konfigurasi Toko
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
