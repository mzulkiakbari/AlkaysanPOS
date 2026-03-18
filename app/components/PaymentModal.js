'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
    BanknotesIcon,
    XMarkIcon,
    CheckIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

export default function PaymentModal({
    isOpen,
    onClose,
    transactionNo,
    totalSales,
    branch,
    onSuccess
}) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [amount, setAmount] = useState(0); // Numeric value for calculation/API
    const [displayAmount, setDisplayAmount] = useState('0'); // Formatted string for UI
    const [method, setMethod] = useState('');
    const [methods, setMethods] = useState([]);
    const [error, setError] = useState(null);

    // --- TOAST STATE ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    const fetchPaymentInfo = async () => {
        if (!transactionNo || !branch) return;
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                shortName: branch.storeData.short_name,
                uniqueId: branch.uniqueId
            });

            const [payRes, methRes] = await Promise.all([
                fetch(`/api/transactions/payment/${transactionNo}?${params}`),
                fetch(`/api/cash/master/methods?${params}`)
            ]);

            const [payResult, methResult] = await Promise.all([
                payRes.json(),
                methRes.json()
            ]);

            if (payResult.success) {
                setPaymentData(payResult.data);
                setAmount(payResult.data.transaksi.sisa_bayar);
                setDisplayAmount(new Intl.NumberFormat('id-ID').format(payResult.data.transaksi.sisa_bayar));
            } else {
                throw new Error(payResult.message || 'Gagal memuat data pembayaran');
            }

            if (methResult.success) {
                setMethods(methResult.data || []);
                if (methResult.data?.length > 0 && !method) {
                    const tunaiMeth = methResult.data.find(m => m.kode === 'TUNAI');
                    const firstMeth = methResult.data[0];
                    setMethod(tunaiMeth ? tunaiMeth.kode : firstMeth.kode);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && transactionNo) {
            fetchPaymentInfo();
        }
    }, [isOpen, transactionNo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (amount <= 0) return;

        setIsSubmitting(true);
        try {
            const sisa = paymentData.transaksi.sisa_bayar - amount;
            const res = await fetch(`/api/transactions/payment/${transactionNo}?shortName=${branch.storeData.short_name}&uniqueId=${branch.uniqueId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jumlah: amount, // Amount currently being paid
                    total_bayar: amount, // Explicitly required as per user request
                    sisa: sisa, // Remaining balance after this payment
                    jnsBayar: method,
                    name: [user?.nama_depan_karyawan || '', user?.nama_belakang_karyawan || ''].join(' ')
                })
            });
            const result = await res.json();
            if (result.success) {
                // Success! Close modal and notify parent immediately
                if (onSuccess) onSuccess('Pembayaran berhasil dicatat!');
                if (onClose) onClose();
            } else {
                throw new Error(result.message || 'Gagal mencatat pembayaran');
            }
        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val);

    const handleAmountChange = (e) => {
        // Remove all non-numeric characters for processing
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        const numericValue = Number(rawValue);

        setAmount(numericValue);
        // Format with thousand separator for display
        setDisplayAmount(new Intl.NumberFormat('id-ID').format(numericValue));
    };

    if (!isOpen) return null;

    return (
        <Modal show={isOpen} onClose={onClose} title="Pembayaran Transaksi" mode="modal">
            <div className="space-y-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-gray-500 font-medium">Memuat data pembayaran...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button onClick={fetchPaymentInfo} className="btn btn-secondary text-xs uppercase tracking-widest font-bold">Coba Lagi</button>
                    </div>
                ) : (
                    <>
                        {/* Transaction Summary Header */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                                <p className="text-xl font-black text-gray-800">{formatCurrency(paymentData.transaksi.net_total_sales)}</p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ongkir</p>
                                <p className="text-xl font-black text-gray-800">{formatCurrency(paymentData.transaksi.ongkir)}</p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Diskon</p>
                                <p className="text-xl font-black text-gray-800">{formatCurrency(paymentData.transaksi.potongan)}</p>
                            </div>

                            {/* Biaya Lain Summary Item */}
                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute -right-2 -top-2 w-12 h-12 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Biaya Lain</p>
                                {(() => {
                                    const raw = paymentData.transaksi.biaya_lain || paymentData.transaksi.biaya_lain_data || [];
                                    console.log(raw)
                                    const items = typeof raw === 'string' ? (JSON.parse(raw) || []) : (Array.isArray(raw) ? raw : []);
                                    const total = items.reduce((acc, b) => acc + (Number(b.nominal) || 0), 0);
                                    return (
                                        <>
                                            <p className="text-xl font-black text-gray-800">{formatCurrency(total)}</p>
                                            {items.length > 0 && <p className="text-[9px] text-primary font-bold mt-1 uppercase tracking-tight">{items.length} Detail Biaya</p>}
                                        </>
                                    )
                                })()}
                            </div>

                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm">
                                <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest mb-1">Sudah Dibayar</p>
                                <p className="text-xl font-black text-primary">{formatCurrency(paymentData.transaksi.total_bayar)}</p>
                            </div>
                            <div className={`p-5 rounded-2xl border shadow-sm ${paymentData.transaksi.sisa_bayar > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${paymentData.transaksi.sisa_bayar > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                    Sisa Bayar
                                </p>
                                <p className={`text-xl font-black ${paymentData.transaksi.sisa_bayar > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {formatCurrency(paymentData.transaksi.sisa_bayar)}
                                </p>
                            </div>
                        </div>

                        {/* Detail Biaya Lain List */}
                        {(() => {
                            const raw = paymentData.transaksi.biaya_lain || paymentData.transaksi.biaya_lain_data || [];
                            const items = typeof raw === 'string' ? (JSON.parse(raw) || []) : (Array.isArray(raw) ? raw : []);
                            if (items.length === 0) return null;
                            return (
                                <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <CurrencyDollarIcon className="w-4 h-4" />
                                        Rincian Biaya Lainnya
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {items.map((b, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary/20 hover:bg-white transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{b.keterangan}</span>
                                                    <span className="text-[10px] font-bold text-primary mt-0.5">{formatCurrency(b.nominal)}</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Middle Section: History & Form */}
                        <div className="grid grid-cols-1 gap-8">
                            {/* Payment History */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    Riwayat Pembayaran
                                </h4>
                                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    {paymentData.payments.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 italic text-sm">Belum ada riwayat pembayaran</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left">Tanggal</th>
                                                        <th className="px-6 py-4 text-right">Jumlah</th>
                                                        <th className="px-6 py-4 text-left">Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {paymentData.payments.map((p, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-600 font-medium">{p.tgl_input}</td>
                                                            <td className="px-6 py-4 text-right font-black text-gray-800">{p.jumlah_format}</td>
                                                            <td className="px-6 py-4 text-gray-500 text-xs">{p.keterangan}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Form */}
                            {paymentData.transaksi.sisa_bayar > 0 && (
                                <div className="p-8 bg-gray-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all duration-500" />

                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                                <BanknotesIcon className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg tracking-tight">Input Pembayaran Baru</h4>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Catat pembayaran masuk hari ini</p>
                                            </div>
                                        </div>

                                        <form id="payment-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Jumlah Bayar (Rp)</label>
                                                <div className="relative group/input">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-white/20 group-focus-within/input:text-primary transition-colors text-xl">Rp</div>
                                                    <input
                                                        type="text"
                                                        value={displayAmount}
                                                        onChange={handleAmountChange}
                                                        onWheel={(e) => e.target.blur()} // Disable scroll increase/decrease
                                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 font-black text-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-white/20"
                                                        placeholder="0"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                                                <div className="relative">
                                                    <select
                                                        value={method}
                                                        onChange={(e) => setMethod(e.target.value)}
                                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-black text-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all cursor-pointer"
                                                    >
                                                        {methods.map(m => (
                                                            <option key={m.id} value={m.kode} className="bg-gray-800">
                                                                {m.nama}
                                                            </option>
                                                        ))}
                                                        {methods.length === 0 && (
                                                            <option value="" className="bg-gray-800">Memuat...</option>
                                                        )}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {paymentData.transaksi.sisa_bayar === 0 && (
                                <div className="p-10 bg-green-50 rounded-[2rem] border-2 border-dashed border-green-200 flex flex-col items-center justify-center space-y-6">
                                    <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-200 rotate-3">
                                        <CheckIcon className="w-12 h-12" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-2xl font-black text-green-800 tracking-tight">Transaksi Lunas</h4>
                                        <p className="text-sm text-green-600/60 font-medium">Semua tagihan telah diselesaikan dengan baik.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Sticky Footer */}
            {!isLoading && !error && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-8 h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all active:scale-[0.98]"
                    >
                        Tutup
                    </button>
                    {paymentData?.transaksi.sisa_bayar > 0 && (
                        <button
                            form="payment-form"
                            type="submit"
                            disabled={isSubmitting || amount <= 0}
                            className="px-8 h-14 bg-primary hover:bg-red-600 disabled:opacity-50 disabled:bg-gray-700 text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                        >
                            {isSubmitting ? (
                                <ArrowPathIcon className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <CheckIcon className="w-6 h-6" />
                                    Konfirmasi Pembayaran
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
            {/* Toast Notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </Modal>
    );
}
