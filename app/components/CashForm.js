'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
    XMarkIcon,
    CalendarIcon,
    BanknotesIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    CheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import Toast from './Toast';
import { FormatCurrency } from '../hooks/useHelpers';

export default function CashForm({ onClose, initialData = null, onSuccess }) {
    const router = useRouter();
    const { selectedBranch, branches, user } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [methods, setMethods] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        kasMasuk: initialData?.kasMasuk ?? initialData?.masuk ?? 0,
        kasKeluar: initialData?.kasKeluar ?? initialData?.keluar ?? 0,
        Tanggal: initialData
            ? (initialData.Tanggal || initialData.tanggal || '').split(' ')[0]
            : new Date().toLocaleDateString('en-CA'),
        jnsBayar: initialData?.jnsBayar ?? initialData?.kode_kas ?? '',
        tujuanKas: initialData?.tujuanKas ?? initialData?.forKas ?? '',
        keterangan: initialData?.keterangan || ''
    });

    const [type, setType] = useState((initialData?.kasMasuk ?? initialData?.masuk) > 0 ? 'in' : 'out');

    useEffect(() => {
        if (currentBranch) {
            fetchOptions();
        }
    }, [currentBranch]);

    const fetchOptions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId
            });

            const [accRes, methRes] = await Promise.all([
                fetch(`/api/cash/master/accounts?${params}`),
                fetch(`/api/cash/master/methods?${params}`)
            ]);

            const [accData, methData] = await Promise.all([
                accRes.json(),
                methRes.json()
            ]);

            // Field structure: { id, kode, nama }

            if (accData.success) setAccounts(accData.data || []);
            if (methData.success) setMethods(methData.data || []);

            // Set defaults if not editing
            if (!initialData) {
                const firstAcc = accData.data?.[0];
                if (firstAcc) setFormData(prev => ({ ...prev, tujuanKas: firstAcc.kode }));

                // Find TUNAI or default to first method
                const tunaiMeth = methData.data?.find(m => m.kode === 'TUNAI');
                const firstMeth = methData.data?.[0];
                if (tunaiMeth) {
                    setFormData(prev => ({ ...prev, jnsBayar: tunaiMeth.kode }));
                } else if (firstMeth) {
                    setFormData(prev => ({ ...prev, jnsBayar: firstMeth.kode }));
                }
            }
        } catch (error) {
            console.error('Error fetching cash options:', error);
            showToast('Gagal memuat opsi kas', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const action = initialData ? `edit/${initialData.id}` : 'add';
            const method = initialData ? 'PUT' : 'POST';

            // Format number fields and add time to Tanggal
            const currentTime = new Date().toTimeString().split(' ')[0]; // HH:mm:ss
            const payload = {
                ...formData,
                Tanggal: `${formData.Tanggal} ${currentTime}`,
                masuk: type === 'in' ? Number(formData.kasMasuk) : 0,
                keluar: type === 'out' ? Number(formData.kasKeluar) : 0,
                name: [user?.nama_depan_karyawan || '', user?.nama_belakang_karyawan || ''].join(' ')
            };

            const res = await fetch(`/api/cash/${action}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (result.success) {
                showToast(`Transaksi kas berhasil ${initialData ? 'diperbarui' : 'disimpan'}!`, 'success');
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    if (onClose) onClose();
                }, 1500);
            } else {
                showToast(result.message || 'Gagal menyimpan transaksi kas', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Terjadi kesalahan sistem', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "input !pl-10 h-12 transition-all duration-200 text-sm hover:border-gray-400 focus:ring-2 focus:ring-primary/20";

    return (
        <div className="space-y-6">
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => setType('in')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${type === 'in'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                            : 'text-gray-500 hover:bg-white/50'
                            }`}
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Kas Masuk
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('out')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${type === 'out'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                            : 'text-gray-500 hover:bg-white/50'
                            }`}
                    >
                        <ArrowUpTrayIcon className="w-5 h-5" />
                        Kas Keluar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount Input */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                            Jumlah Nominal ({type === 'in' ? 'Masuk' : 'Keluar'})
                        </label>
                        <div className="relative">
                            <BanknotesIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${type === 'in' ? 'text-emerald-500' : 'text-red-500'}`} />
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={new Intl.NumberFormat('id-ID').format(type === 'in' ? Number(formData.kasMasuk) : Number(formData.kasKeluar))}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({
                                        ...formData,
                                        [type === 'in' ? 'kasMasuk' : 'kasKeluar']: val || '0'
                                    });
                                }}
                                placeholder="0"
                                className={`${inputClass} !pl-12 text-lg font-black ${type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}
                            />
                        </div>
                    </div>

                    {/* Date Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tanggal</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                required
                                value={formData.Tanggal}
                                onChange={(e) => setFormData({ ...formData, Tanggal: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Metode / Jenis Bayar</label>
                        <div className="relative">
                            <BanknotesIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                required
                                value={formData.jnsBayar}
                                onChange={(e) => setFormData({ ...formData, jnsBayar: e.target.value })}
                                className={`${inputClass} appearance-none pr-10`}
                            >
                                <option value="" disabled>Pilih Metode</option>
                                {methods.map(m => (
                                    <option key={m.id} value={m.kode}>
                                        {m.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Cash Account */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tujuan Kas / Akun</label>
                        <div className="relative">
                            <ArrowPathIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                required
                                value={formData.tujuanKas}
                                onChange={(e) => setFormData({ ...formData, tujuanKas: e.target.value })}
                                className={`${inputClass} appearance-none pr-10`}
                            >
                                <option value="" disabled>Pilih Akun Kas</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.kode}>
                                        {a.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Keterangan</label>
                        <div className="relative">
                            <DocumentTextIcon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                            <textarea
                                value={formData.keterangan}
                                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                placeholder="Tambahkan catatan transaksi di sini..."
                                className={`${inputClass} !py-3 min-h-[100px] resize-none`}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSaving || isLoading}
                        className={`w-full h-14 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${type === 'in'
                            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'
                            : 'bg-red-500 hover:bg-red-600 shadow-red-100'
                            }`}
                    >
                        {isSaving ? (
                            <ArrowPathIcon className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <CheckIcon className="w-6 h-6" />
                                {initialData ? 'Update Transaksi Kas' : 'Simpan Transaksi Kas'}
                            </>
                        )}
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full mt-3 h-12 text-gray-500 font-bold hover:text-gray-800 transition-colors"
                        >
                            Batal
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
