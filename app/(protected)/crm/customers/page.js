'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import { SkeletonTable } from '../../../components/Skeleton';
import {
    MagnifyingGlassIcon,
    PencilIcon,
    UserGroupIcon,
    ArrowPathIcon,
    XMarkIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { FetchData } from '../../../hooks/useFetchData';
import Toast from '../../../components/Toast';
import CustomerModal from '../../../components/CustomerModal';
import Modal from '../../../components/Modal';
import { AlertModal } from '../../../components/Modal/Alert';

export default function CustomersPage() {
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || branches[0];

    const [isLoading, setIsLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });

    // Modal states
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (currentBranch) {
            fetchCustomers();
        }
    }, [currentBranch, search, pagination.page, showDuplicates]);

    const fetchCustomers = async () => {
        if (!currentBranch) return;
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: pagination.page,
                paginate: 25,
                ...(search && { qname: search }),
                ...(showDuplicates && { isDuplicate: 1 })
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/customers/getAll?${params.toString()}`
            });

            if (result && result.success) {
                const dataObj = result.data;
                const custData = dataObj?.data || [];
                setCustomers(custData);
                setPagination({
                    page: dataObj?.current_page || 1,
                    lastPage: dataObj?.last_page || 1,
                    total: dataObj?.total || custData.length
                });
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setIsLoading(false);
        }
    };

    const handleUpdateCustomer = async (data) => {
        setIsProcessing(true);
        try {
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId
            });

            // Map telp_pemesan to telepon_pemesan for backend
            const payload = {
                nama_pemesan: data.nama_pemesan,
                telepon_pemesan: data.telp_pemesan,
                alamat_pemesan: data.alamat_pemesan,
                membership: data.membership,
                old_nama_pemesan: selectedCustomer.nama_pemesan,
                old_telepon_pemesan: selectedCustomer.telp_pemesan,
                old_alamat_pemesan: selectedCustomer.alamat_pemesan || '',
                old_membership: selectedCustomer.membership || 'UMUM'
            };

            const result = await FetchData({
                method: 'PUT',
                uri: `/api/customers/edit?${params.toString()}`,
                data: payload
            });

            if (result && result.success) {
                setToast({ show: true, message: 'Data pelanggan berhasil diperbarui', type: 'success' });
                setShowEditModal(false);
                fetchCustomers();
            } else {
                setToast({ show: true, message: result?.message || 'Gagal memperbarui data pelanggan', type: 'error' });
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            setToast({ show: true, message: 'Gagal memperbarui data pelanggan', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteCustomer = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteModal(true);
    };

    const confirmDeleteCustomer = async () => {
        if (!customerToDelete) return;
        const customer = customerToDelete;
        setShowDeleteModal(false);
        setCustomerToDelete(null);

        setIsProcessing(true);
        try {
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId
            });

            const payload = {
                nama_pemesan: customer.nama_pemesan,
                telepon_pemesan: customer.telp_pemesan,
                alamat_pemesan: customer.alamat_pemesan,
                membership: customer.membership
            };

            const result = await FetchData({
                method: 'DELETE',
                uri: `/api/customers/delete?${params.toString()}`,
                data: payload
            });

            if (result && result.success) {
                setToast({ show: true, message: 'Pelanggan berhasil dihapus', type: 'success' });
                fetchCustomers();
            } else {
                setToast({ show: true, message: result?.message || 'Gagal menghapus pelanggan', type: 'error' });
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            setToast({ show: true, message: 'Gagal menghapus pelanggan', type: 'error' });
        } finally {
            setIsProcessing(false);
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
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Database Pelanggan</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Kelola data dan riwayat belanja pelanggan</p>
                    </div>
                </div>

                {/* Filters & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3">
                        <div className="card !p-3 flex-1">
                            <div className="relative group">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau nomor HP pelanggan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input !pl-12 !h-12 !bg-[var(--bg-main)] hover:bg-white focus:bg-white transition-all border-none shadow-sm w-full"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDuplicates(!showDuplicates)}
                            className={`h-[72px] px-8 rounded-[1.5rem] font-bold text-sm transition-all whitespace-nowrap shadow-sm border-2 ${showDuplicates
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-white text-gray-500 border-transparent hover:border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {showDuplicates ? 'Tutup Filter Duplikat' : 'Filter Duplikat'}
                        </button>
                    </div>
                    <div className="card !p-3 flex items-center justify-center !bg-[var(--primary)] !text-white border-none shadow-lg shadow-[var(--primary)]/20 rounded-[1.5rem]">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Total Pelanggan</p>
                            <p className="text-xl font-black">{pagination.total}</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card p-0 border-none shadow-xl shadow-black/5 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={10} cols={5} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        <th className="px-6 py-4">Nama Pelanggan</th>
                                        <th className="px-6 py-4">Kontak</th>
                                        <th className="px-6 py-4">Jenis Member</th>
                                        <th className="px-6 py-4">Alamat</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white text-sm">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center text-[var(--text-muted)] font-medium">
                                                Tidak ada data pelanggan ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((customer, idx) => (
                                            <tr key={customer.id || idx} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                                        {customer.nama_pemesan}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-500">{customer.telp_pemesan}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${customer.membership === 'Gold' ? 'bg-amber-100 text-amber-700' :
                                                        customer.membership === 'Platinum' ? 'bg-indigo-100 text-indigo-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {customer.membership || 'UMUM'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]" title={customer.alamat_pemesan}>
                                                        {customer.alamat_pemesan || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedCustomer(customer); setShowEditModal(true); }}
                                                            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                            title="Edit Pelanggan"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCustomer(customer)}
                                                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                            title="Hapus Pelanggan"
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

                    {/* Pagination */}
                    {!isLoading && pagination.lastPage > 1 && (
                        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-main)]/30">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                                Page {pagination.page} of {pagination.lastPage}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="btn btn-secondary !px-4 h-9 text-xs disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.lastPage, prev.page + 1) }))}
                                    disabled={pagination.page >= pagination.lastPage}
                                    className="btn btn-secondary !px-4 h-9 text-xs disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <CustomerModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                customer={selectedCustomer}
                onSave={handleUpdateCustomer}
            />

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} mode="popup">
                <AlertModal
                    text={{
                        header: "Hapus Pelanggan",
                        note: `Yakin untuk hapus pelanggan "${customerToDelete?.nama_pemesan}"?`,
                        confirmButton: "Hapus",
                        cancelButton: "Batal"
                    }}
                    type="danger"
                    onConfirm={confirmDeleteCustomer}
                    onClose={() => setShowDeleteModal(false)}
                />
            </Modal>
        </MainLayout>
    );
}
