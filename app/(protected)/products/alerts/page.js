'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import { SkeletonTable } from '../../../components/Skeleton';
import {
    ExclamationTriangleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    BellAlertIcon,
    ShoppingBagIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { FetchData } from '../../../hooks/useFetchData';
import Link from 'next/link';

export default function LowStockPage() {
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(true);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (currentBranch) {
            fetchLowStock();
        }
    }, [currentBranch, search]);

    const fetchLowStock = async () => {
        if (!currentBranch) return;
        try {
            setIsLoading(true);
            // Fetching all products and filtering locally for now, 
            // as specific low stock endpoint might not be ready.
            const result = await FetchData({
                method: 'GET',
                uri: `/api/product/getAll?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}&paginate=100`
            });

            if (result && result.success) {
                const allProducts = result.results?.data || result.results || [];
                // Filtering products with stock < 10 (or any threshold)
                // In real app, this should be a backend filter
                const filtered = allProducts.filter(p => (p.Stok || 0) < 10);
                setLowStockProducts(filtered);
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching low stock:', error);
            setIsLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                            <BellAlertIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Alert Stok Rendah</h1>
                            <p className="text-[var(--text-secondary)] text-sm">Segera restock produk berikut untuk kelancaran transaksi</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchLowStock}
                        className="btn btn-secondary h-12 px-6 rounded-2xl flex items-center gap-2"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Data</span>
                    </button>
                </div>

                {/* Info Card */}
                <div className="card bg-gradient-to-r from-red-500 to-rose-600 border-none p-6 text-white overflow-hidden relative group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-black uppercase tracking-widest opacity-80">Ringkasan Kritis</h3>
                            <p className="text-3xl font-black">{lowStockProducts.length > 0 ? `${lowStockProducts.length} Produk Perlu Perhatian` : 'Stok Aman'}</p>
                            <p className="text-sm font-medium opacity-90 max-w-md">
                                Menampilkan semua produk dengan jumlah stok di bawah ambang batas minimum.
                            </p>
                        </div>
                        <div className="flex h-14 bg-white/20 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20">
                            <div className="px-6 flex flex-col justify-center items-center border-r border-white/20">
                                <span className="text-[10px] uppercase font-bold text-white/70">Kritis (0)</span>
                                <span className="text-xl font-black">{lowStockProducts.filter(p => (p.Stok || 0) === 0).length}</span>
                            </div>
                            <div className="px-6 flex flex-col justify-center items-center">
                                <span className="text-[10px] uppercase font-bold text-white/70">Peringatan (&lt;10)</span>
                                <span className="text-xl font-black">{lowStockProducts.filter(p => (p.Stok || 0) > 0).length}</span>
                            </div>
                        </div>
                    </div>
                    <ExclamationTriangleIcon className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none" />
                </div>

                {/* Filters */}
                <div className="card !p-3">
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari produk kritis..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input !pl-12 !h-12 !bg-[var(--bg-main)] hover:bg-white focus:bg-white transition-all border-none shadow-sm"
                        />
                    </div>
                </div>

                {/* Low Stock List */}
                <div className="card p-0 border-none shadow-xl shadow-black/5 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={10} cols={5} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        <th className="px-6 py-4">Produk</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4 text-center">Stok Sisa</th>
                                        <th className="px-6 py-4 text-center">Satuan</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white text-sm">
                                    {lowStockProducts.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-red-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{item.Nama_Produk}</div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{item.Kode_Produk}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-500">{item.Kategori || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl font-black ${item.Stok <= 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    <span className="text-xl leading-none">{item.Stok || 0}</span>
                                                    <span className="text-[8px] uppercase tracking-tighter mt-1">{item.Stok <= 0 ? 'Habis' : 'Low'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-400">{item.Satuan || '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href="/products/stock"
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                                                    >
                                                        <ShoppingBagIcon className="w-4 h-4" />
                                                        Restock
                                                    </Link>
                                                    <Link
                                                        href={`/products?search=${item.Nama_Produk}`}
                                                        className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-[var(--primary)] transition-all"
                                                    >
                                                        <ArrowRightIcon className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {lowStockProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-pulse">
                                                        <ShoppingBagIcon className="w-10 h-10" />
                                                    </div>
                                                    <p className="text-lg font-bold text-gray-700">Tidak ada stok kritis!</p>
                                                    <p className="text-sm text-gray-400">Semua produk Anda memiliki stok yang cukup.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
