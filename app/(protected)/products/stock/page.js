'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import Modal from '../../../components/Modal';
import { SkeletonTable } from '../../../components/Skeleton';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowDownCircleIcon,
    ArrowUpCircleIcon,
    ArrowPathIcon,
    XMarkIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { FetchData } from '../../../hooks/useFetchData';
import Toast from '../../../components/Toast';
import StockFormModal from '../../../components/StockFormModal';

export default function StockPage() {
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, lastPage: 1 });

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (currentBranch) {
            fetchActivities();
            fetchProducts();
        }
    }, [currentBranch, search, pagination.page]);

    const fetchActivities = async () => {
        if (!currentBranch) return;
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: pagination.page,
                paginate: 25,
                ...(search && { v: search })
            });

            // Mock data for now
            const mockActivities = [
                { id: 1, tanggal: '2026-02-27 10:30', nama_produk: 'Spanduk Outdoor', kode_produk: 'PRD-001', type: 'in', qty: 50, keterangan: 'Restock dari supplier', user: 'Admin' },
                { id: 2, tanggal: '2026-02-27 11:15', nama_produk: 'Stiker Vinyl', kode_produk: 'PRD-002', type: 'out', qty: 5, keterangan: 'Produk rusak/reject', user: 'Kasir 1' },
            ];

            setActivities(mockActivities);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching stock activities:', error);
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        if (!currentBranch) return;
        try {
            const result = await FetchData({
                method: 'GET',
                uri: `/api/product/getAll?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}&paginate=100`
            });
            if (result && result.success) {
                setProducts(result.results?.data || result.data || result.results || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSaveStock = async (data) => {
        try {
            console.log('Saving stock adjustment:', data);
            // Mock success
            setToast({ show: true, message: 'Adjustment stok berhasil disimpan', type: 'success' });
            setShowFormModal(false);
            fetchActivities();
        } catch (error) {
            console.error('Error saving stock:', error);
            setToast({ show: true, message: 'Gagal menyimpan adjustment stok', type: 'error' });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
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
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Stok Masuk/Keluar</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Monitoring mutasi stok di <span className="text-[var(--primary)] font-bold">{currentBranch?.storeName}</span></p>
                    </div>
                    <button
                        onClick={() => setShowFormModal(true)}
                        className="btn btn-primary h-12 px-6 rounded-2xl shadow-lg shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Catat Mutasi</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="card !p-3">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari nama produk atau keterangan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input !pl-12 !h-12 !bg-[var(--bg-main)] hover:bg-white focus:bg-white transition-all border-none shadow-sm"
                        />
                    </div>
                </div>

                {/* Activity List */}
                <div className="card p-0 border-none shadow-xl shadow-black/5 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={10} cols={6} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        <th className="px-6 py-4">Waktu</th>
                                        <th className="px-6 py-4">Produk</th>
                                        <th className="px-6 py-4 text-center">Jenis</th>
                                        <th className="px-6 py-4 text-center">Jumlah</th>
                                        <th className="px-6 py-4">Keterangan</th>
                                        <th className="px-6 py-4 text-right">Oleh</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white text-xs">
                                    {activities.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                                            <td className="px-6 py-4 text-[var(--text-muted)] font-medium whitespace-nowrap">{item.tanggal}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-[var(--text-primary)]">{item.nama_produk}</div>
                                                <div className="text-[10px] text-[var(--text-muted)] uppercase font-medium">{item.kode_produk}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.type === 'in' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-bold uppercase tracking-tighter">
                                                        <ArrowDownCircleIcon className="w-4 h-4" />
                                                        Masuk
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold uppercase tracking-tighter">
                                                        <ArrowUpCircleIcon className="w-4 h-4" />
                                                        Keluar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-black ${item.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {item.type === 'in' ? '+' : '-'}{item.qty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text-secondary)] italic">"{item.keterangan || '-'}"</td>
                                            <td className="px-6 py-4 text-right font-bold text-[var(--text-muted)] uppercase">{item.user}</td>
                                        </tr>
                                    ))}
                                    {activities.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-20 text-center text-[var(--text-muted)] font-medium">
                                                Tidak ada riwayat mutasi stok ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            <StockFormModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSave={handleSaveStock}
                products={products}
            />
        </MainLayout>
    );
}
