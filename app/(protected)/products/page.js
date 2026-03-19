'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout';
import { SkeletonTable } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { FetchData } from '../../hooks/useFetchData';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import ProductModal from '../../components/ProductModal';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';

export default function ProductsPage() {
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, lastPage: 1 });
    const [categories, setCategories] = useState([]);

    // Modal states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fetchCategories = async () => {
        if (!currentBranch) return;
        try {
            const result = await FetchData({
                method: 'GET',
                uri: `/api/categories/getAll?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}&paginate=100&page=1`
            });
            if (result && result.success) {
                const dataObj = result.results?.data || result.data || result.results;
                const txData = dataObj?.data || (Array.isArray(dataObj) ? dataObj : []);

                // Merge temp categories from localStorage
                let finalData = [...txData];
                try {
                    const raw = localStorage.getItem('pos_temp_categories');
                    if (raw) {
                        const tempCats = JSON.parse(raw);
                        tempCats.forEach(tc => {
                            const exists = finalData.find(c => (c.Kategori || c) === tc.Kategori);
                            if (!exists) finalData.push(tc);
                        });
                    }
                } catch (e) { }

                setCategories(finalData);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [currentBranch]);

    const handleSaveProduct = async (data) => {
        setIsProcessing(true);
        try {
            const method = selectedProduct ? 'PUT' : 'POST';
            const uri = selectedProduct
                ? `/api/products/edit/${selectedProduct.Kode_Produk}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`
                : `/api/products/add?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`;

            const res = await fetch(uri, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();

            if (!res.ok || result.success === false) {
                throw new Error(result.message || 'Gagal menyimpan produk');
            }

            setToast({ show: true, message: `Produk berhasil ${selectedProduct ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });

            // Cleanup temp categories if the saved category was from localStorage
            try {
                const raw = localStorage.getItem('pos_temp_categories');
                if (raw) {
                    const tempCats = JSON.parse(raw);
                    const remaining = tempCats.filter(cat => cat.Kategori !== data.Kategori);
                    if (remaining.length !== tempCats.length) {
                        localStorage.setItem('pos_temp_categories', JSON.stringify(remaining));
                        fetchCategories(); // Refresh local list
                    }
                }
            } catch (e) { }

            setShowFormModal(false);
            fetchProducts(pagination.page);
        } catch (error) {
            console.error('Error saving product:', error);
            setToast({ show: true, message: error.message || 'Gagal menyimpan produk', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteProduct = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/products/delete/${selectedProduct.Kode_Produk}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                method: 'DELETE',
            });
            const result = await res.json();

            if (!res.ok || result.success === false) {
                throw new Error(result.message || 'Gagal menghapus produk');
            }

            setToast({ show: true, message: 'Produk berhasil dihapus', type: 'success' });
            setShowDeleteModal(false);
            fetchProducts(pagination.page);
        } catch (error) {
            console.error('Error deleting product:', error);
            setToast({ show: true, message: 'Gagal menghapus produk', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };
    const fetchProducts = async (page = 1) => {
        if (!currentBranch) return;

        try {
            setIsLoading(true);
            const action = search ? 'search' : 'getAll';
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: page,
                paginate: 15,
                ...(search && { v: search })
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/products/${action}?${params.toString()}`
            });

            if (result && result.success) {
                // Adjust this based on actual backend response structure
                const dataObj = result.results?.data || result.data || result.results;
                const txData = dataObj?.data || (Array.isArray(dataObj) ? dataObj : []);
                setProducts(txData);
                setPagination({
                    page: dataObj?.current_page || page,
                    total: dataObj?.total || txData.length,
                    lastPage: dataObj?.last_page || 1
                });
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentBranch) {
                fetchProducts(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, currentBranch]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Manajemen Produk</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Kelola produk, stok, dan harga di <span className="text-[var(--primary)] font-bold">{currentBranch?.storeName}</span></p>
                    </div>
                    <button
                        onClick={() => { setSelectedProduct(null); setShowFormModal(true); }}
                        className="btn btn-primary h-12 px-6 rounded-2xl shadow-lg shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Tambah Produk</span>
                    </button>
                </div>

                {/* Search & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 card !p-3">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari nama produk atau kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input !pl-12 !h-12 !bg-[var(--bg-main)] hover:bg-white focus:bg-white transition-all border-none shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="card !p-3 flex items-center justify-center !bg-[var(--primary)] !text-white border-none shadow-lg shadow-[var(--primary)]/20 rounded-[1.5rem]">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Total Produk</p>
                            <p className="text-xl font-black">{pagination.total}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card border-none shadow-xl shadow-black/5 overflow-hidden">
                    {isLoading ? (
                        <SkeletonTable rows={10} cols={6} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        <th className="px-6 py-4">Produk</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Harga</th>
                                        <th className="px-6 py-4 text-center">Satuan</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white text-sm">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-[var(--text-muted)]">
                                                Tidak ada produk ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product, idx) => {
                                            return (
                                                <tr key={product.id || idx} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{product.Nama_Produk}</div>
                                                        <div className="text-[10px] text-[var(--text-muted)] uppercase font-medium">{product.Kode_Produk}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">{product.Kategori || 'Uncategorized'}</td>
                                                    <td className="px-6 py-4">
                                                        {product.prices && product.prices.length > 0 ? (
                                                            <div className="space-y-1.5">
                                                                {product.prices.map((p, pi) => (
                                                                    <div key={pi} className="flex items-center gap-2 text-xs">
                                                                        <span className="font-black text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-tight shrink-0">{p.jenis_harga}</span>
                                                                        {(p.min_pembelian > 1 || p.min_order > 1) && (
                                                                            <span className="text-[10px] text-[var(--text-muted)] shrink-0">min {p.min_pembelian || p.min_order}x</span>
                                                                        )}
                                                                        <span className="font-bold text-[var(--text-primary)]">{formatCurrency(p.harga)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[var(--text-muted)] text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`font-bold text-[var(--text-primary)]`}>
                                                            {product.Satuan || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-[10px] font-bold">
                                                        <span className={`px-3 py-1 rounded-full uppercase tracking-tighter ${parseInt(product.dijual) === 1
                                                            ? 'bg-emerald-100 text-emerald-600'
                                                            : 'bg-red-100 text-red-600'
                                                            }`}>
                                                            {parseInt(product.dijual) === 1 ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 transition-opacity">
                                                            <button
                                                                title="Edit Produk"
                                                                onClick={() => { setSelectedProduct(product); setShowFormModal(true); }}
                                                                className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                title="Hapus Produk"
                                                                onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}
                                                                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && pagination.lastPage > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => fetchProducts(pagination.page - 1)}
                            className="btn btn-secondary !px-4 !h-10 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-sm font-bold text-[var(--text-muted)]">
                            Page {pagination.page} of {pagination.lastPage}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.lastPage}
                            onClick={() => fetchProducts(pagination.page + 1)}
                            className="btn btn-secondary !px-4 !h-10 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <ProductModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                product={selectedProduct}
                onSave={handleSaveProduct}
                categories={categories}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onClose={() => !isProcessing && setShowDeleteModal(false)}
                title="Konfirmasi Hapus"
                mode="modal"
            >
                <div className="p-2 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <TrashIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Produk?</h3>
                    <p className="text-gray-500 text-sm font-medium mb-8">
                        Apakah Anda yakin ingin menghapus <span className="text-red-600 font-bold">{selectedProduct?.Nama_Produk}</span>? Tindakan ini tidak dapat dibatalkan.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isProcessing}
                            className="h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDeleteProduct}
                            disabled={isProcessing}
                            className="h-14 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <ArrowPathIcon className="w-6 h-6 animate-spin" />
                            ) : (
                                'Ya, Hapus'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Toast Notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </MainLayout>
    );
}
