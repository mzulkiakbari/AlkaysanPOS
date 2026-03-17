'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../context/AuthContext';
import { FetchData } from '../../../hooks/useFetchData';
import { SkeletonTable } from '../../../components/Skeleton';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    TagIcon,
    ArrowPathIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import CategoryModal from '../../../components/CategoryModal';
import Modal from '../../../components/Modal';

export default function CategoriesPage() {
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, lastPage: 1 });

    // Modal states
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const handleSaveCategory = async (data) => {
        setIsProcessing(true);
        try {
            const action = selectedCategory ? 'update' : 'create';
            const uri = selectedCategory
                ? `/api/categories/update/${selectedCategory.id}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`
                : `/api/categories/create?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`;

            console.log(`${action} category:`, data);

            // Mock success
            setToast({ show: true, message: `Kategori berhasil ${selectedCategory ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });
            setShowFormModal(false);
            fetchCategories(pagination.page);
        } catch (error) {
            console.error('Error saving category:', error);
            setToast({ show: true, message: 'Gagal menyimpan kategori', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteCategory = async () => {
        setIsProcessing(true);
        try {
            console.log('Deleting category:', selectedCategory.id);
            // Mock success
            setToast({ show: true, message: 'Kategori berhasil dihapus', type: 'success' });
            setShowDeleteModal(false);
            fetchCategories(pagination.page);
        } catch (error) {
            console.error('Error deleting category:', error);
            setToast({ show: true, message: 'Gagal menghapus kategori', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const fetchCategories = async (page = 1) => {
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
                uri: `/api/categories/${action}?${params.toString()}`
            });

            console.log('Categories API Response:', result);

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
                setPagination({
                    page: dataObj?.current_page || page,
                    total: dataObj?.total || finalData.length,
                    lastPage: dataObj?.last_page || 1
                });
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentBranch) {
                fetchCategories(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, currentBranch]);

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Kategori Produk</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Kelola kelompok produk Anda di <span className="text-[var(--primary)] font-bold">{currentBranch?.storeName}</span></p>
                    </div>
                    <button
                        onClick={() => { setSelectedCategory(null); setShowFormModal(true); }}
                        className="btn btn-primary h-12 px-6 rounded-2xl shadow-lg shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Tambah Kategori</span>
                    </button>
                </div>

                {/* Filters & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 card !p-3">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari nama kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input !pl-12 !h-12 !bg-[var(--bg-main)] hover:bg-white focus:bg-white transition-all border-none shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="card !p-3 flex items-center justify-center bg-[var(--primary)] text-white border-none shadow-lg shadow-[var(--primary)]/20">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Total Kategori</p>
                            <p className="text-xl font-black">{pagination.total}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card border-none shadow-xl shadow-black/5 overflow-hidden">
                    {isLoading ? (
                        <SkeletonTable rows={10} cols={3} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        <th className="px-6 py-4 w-20 text-center">No</th>
                                        <th className="px-6 py-4">Nama Kategori</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white text-sm">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-[var(--text-muted)]">
                                                Belum ada kategori ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category, idx) => (
                                            <tr key={category.id || idx} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                                                <td className="px-6 py-4 text-center text-[var(--text-muted)] font-bold">
                                                    {(pagination.page - 1) * 15 + idx + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                                        {category.Kategori || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                                        <button
                                                            title="Edit Kategori"
                                                            onClick={() => { setSelectedCategory(category); setShowFormModal(true); }}
                                                            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            title="Hapus Kategori"
                                                            onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}
                                                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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
                            onClick={() => fetchCategories(pagination.page - 1)}
                            className="btn btn-secondary !px-4 !h-10 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="text-sm font-bold text-[var(--text-muted)]">
                            Page {pagination.page} of {pagination.lastPage}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.lastPage}
                            onClick={() => fetchCategories(pagination.page + 1)}
                            className="btn btn-secondary !px-4 !h-10 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <CategoryModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                category={selectedCategory}
                onSave={handleSaveCategory}
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
                    <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Kategori?</h3>
                    <p className="text-gray-500 text-sm font-medium mb-8">
                        Apakah Anda yakin ingin menghapus kategori <span className="text-red-600 font-bold">{selectedCategory?.Kategori}</span>? Produk dalam kategori ini akan menjadi "Uncategorized".
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
                            onClick={handleDeleteCategory}
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
            {toast.show && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md ${toast.type === 'success'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                        }`}>
                        <span className="font-bold tracking-tight">{toast.message}</span>
                        <button onClick={() => setToast({ ...toast, show: false })}><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
