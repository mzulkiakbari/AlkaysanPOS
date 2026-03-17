'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import Modal from '../../components/Modal';
import { SkeletonTable } from '../../components/Skeleton';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    ChevronDownIcon,
    CalendarIcon,
    BanknotesIcon,
    PrinterIcon,
    CheckIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { FetchData } from '../../hooks/useFetchData';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { sqlite } from '../../../lib/sqlite-client';
import { GetLocalDate } from '../../hooks/useHelpers';
import PaymentModal from '../../components/PaymentModal';
import MergeTransactionModal from '../../components/MergeTransactionModal';

export default function SalesPage() {
    const { selectedBranch, branches, user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [search, setSearch] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('all');
    const [transactionStatus, setTransactionStatus] = useState('all');
    const [dateRangePreset, setDateRangePreset] = useState('today');
    const [startDate, setStartDate] = useState(GetLocalDate());
    const [endDate, setEndDate] = useState(GetLocalDate());
    const [showDateModal, setShowDateModal] = useState(false);

    // Action states
    const [selectedTx, setSelectedTx] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMergeChoiceModal, setShowMergeChoiceModal] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const currentBranch = selectedBranch || branches[0];

    const getDatePresets = () => {
        const today = new Date();
        const formatDate = GetLocalDate;

        const presets = {
            today: {
                label: 'Hari Ini',
                start: formatDate(today),
                end: formatDate(today)
            },
            yesterday: {
                label: 'Kemarin',
                start: formatDate(new Date(new Date().setDate(today.getDate() - 1))),
                end: formatDate(new Date(new Date().setDate(today.getDate() - 1)))
            },
            thisMonth: {
                label: 'Bulan Ini',
                start: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
                end: formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
            },
            lastMonth: {
                label: 'Bulan Lalu',
                start: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                end: formatDate(new Date(today.getFullYear(), today.getMonth(), 0))
            }
        };
        return presets;
    };

    useEffect(() => {
        if (currentBranch) {
            fetchTransactions();
        }
    }, [currentBranch, search, paymentStatus, transactionStatus, startDate, endDate, pagination.current_page]);

    const isOnline = useNetworkStatus();

    const fetchTransactions = async () => {
        if (!currentBranch) return;

        try {
            setIsLoading(true);

            if (!isOnline) {
                console.log('[SalesPage] Offline: fetching pending transactions from SQLite...');
                const pending = await sqlite.getPendingTransactions();
                setTransactions(pending);
                setPagination({ current_page: 1, last_page: 1 });
                setIsLoading(false);
                return;
            }

            const action = search ? 'search' : 'getAll';
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: pagination.current_page,
                paginate: 25,
                ...(search && { v: search }),
                ...(paymentStatus !== 'all' && { status_bayar: paymentStatus }),
                ...(transactionStatus !== 'all' && { status_transaksi: transactionStatus }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/transactions/${action}?${params.toString()}`
            });

            if (result && result.success) {
                const dataObj = result.results?.data || result.data || result.results;
                const txData = dataObj?.data || (Array.isArray(dataObj) ? dataObj : []);
                setTransactions(txData);

                if (dataObj?.current_page) {
                    setPagination({
                        current_page: dataObj.current_page,
                        last_page: dataObj.last_page
                    });
                }
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setIsLoading(false);
        }
    };

    const handlePresetChange = (presetKey) => {
        setDateRangePreset(presetKey);
        setPagination(prev => ({ ...prev, current_page: 1 }));
        if (presetKey === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (presetKey === 'custom') {
            setShowDateModal(true);
        } else {
            const presets = getDatePresets();
            const selected = presets[presetKey];
            if (selected) {
                setStartDate(selected.start);
                setEndDate(selected.end);
            }
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const getRowStyle = (tx) => {
        const isLunas = tx.Status_Bayar === 'Lunas';
        const isDiambil = tx.Status_Transaksi === 'Sudah Diambil';
        const isSelesaiCetak = tx.Status_Transaksi === 'Selesai Dicetak' || tx.Status_Transaksi === 'Selesai';

        if (isLunas && isDiambil) return 'bg-gray-100 text-gray-400 opacity-80';
        if (isLunas && isSelesaiCetak) return 'bg-blue-900 text-white';
        if (isLunas) return 'bg-emerald-50';
        if (tx.Status_Bayar === 'Belum Lunas') return 'bg-red-50';
        return '';
    };

    const handleAction = (action, tx) => {
        setSelectedTx(tx);
        if (action === 'bayar') {
            setShowPayModal(true);
        } else if (action === 'cetak') {
            setShowMergeChoiceModal(true);
        } else if (action === 'hapus') {
            if (!user?.isAdmin && !user?.isSuperAdmin) {
                showToast('Hanya admin yang bisa hapus transaksi', 'error');
                return;
            }
            setShowDeleteModal(true);
        }
    };

    const deleteTransaction = async (tx) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/transactions/delete/${tx.No_Transaksi}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: [user?.nama_depan_karyawan || '', user?.nama_belakang_karyawan || ''].join(' ')
                })
            });
            const result = await res.json();
            if (result.success) {
                setShowDeleteModal(false);
                setSelectedTx(null);
                showToast('Transaksi berhasil dihapus');
                fetchTransactions();
            } else {
                showToast(result.message || 'Gagal menghapus transaksi', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan saat menghapus transaksi', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transaksi</h1>
                        <p className="text-[var(--text-secondary)]">Kelola Transaksi Penjualan</p>
                    </div>
                    <Link
                        href="/transaction/add"
                        className="btn btn-primary w-full sm:w-auto"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Transaksi Baru</span>
                    </Link>
                </div>

                {/* Filters */}
                <div className="card space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Search - Takes more space */}
                        <div className="lg:col-span-5 flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Pencarian</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari invoice atau nama pelanggan..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPagination(prev => ({ ...prev, current_page: 1 }));
                                    }}
                                    className="input !pl-10 text-xs"
                                />
                            </div>
                        </div>

                        {/* Status Filters */}
                        <div className="lg:col-span-4 flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Filter Status</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => {
                                            setPaymentStatus(e.target.value);
                                            setPagination(prev => ({ ...prev, current_page: 1 }));
                                        }}
                                        className="input text-xs appearance-none pr-8"
                                    >
                                        <option value="all">Pembayaran: Semua</option>
                                        <option value="Lunas">Lunas</option>
                                        <option value="Belum Lunas">Belum Lunas</option>
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={transactionStatus}
                                        onChange={(e) => {
                                            setTransactionStatus(e.target.value);
                                            setPagination(prev => ({ ...prev, current_page: 1 }));
                                        }}
                                        className="input text-xs appearance-none pr-8"
                                    >
                                        <option value="all">Transaksi: Semua</option>
                                        <option value="Belum diproses">Belum diproses</option>
                                        <option value="Proses cetak">Proses cetak</option>
                                        <option value="Selesai dicetak">Selesai dicetak</option>
                                        <option value="Sudah diambil">Sudah diambil</option>
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Date Preset Selector */}
                        <div className="lg:col-span-3 flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Rentang Tanggal</label>
                            <div className="relative">
                                <select
                                    value={dateRangePreset}
                                    onChange={(e) => handlePresetChange(e.target.value)}
                                    className="input text-xs appearance-none pr-8"
                                >
                                    <option value="all">Semua Tanggal</option>
                                    <option value="today">Hari Ini</option>
                                    <option value="yesterday">Kemarin</option>
                                    <option value="thisMonth">Bulan Ini</option>
                                    <option value="lastMonth">Bulan Lalu</option>
                                    <option value="custom">Sesuaikan Tanggal...</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Custom Date Range Display (if active) */}
                    {(startDate || endDate) && dateRangePreset !== 'all' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Periode Aktif:</span>
                            <div className="flex items-center gap-2 bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border)]">
                                <span className="text-sm font-semibold text-[var(--primary)]">{startDate || '...'}</span>
                                <span className="text-[var(--text-muted)]">sampai</span>
                                <span className="text-sm font-semibold text-[var(--primary)]">{endDate || '...'}</span>
                                <button
                                    onClick={() => handlePresetChange('all')}
                                    className="ml-2 hover:text-red-500 transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend & Summary */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium px-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-widest">Note:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-50 border border-emerald-100 rounded"></div>
                        <span className="text-emerald-700">Lunas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-50 border border-red-100 rounded"></div>
                        <span className="text-red-700">Belum Lunas / DP</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-900 border border-blue-800 rounded"></div>
                        <span className="text-blue-900 font-semibold">Selesai (Siap Ambil)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                        <span className="text-gray-500">Sudah Diambil (Arsip)</span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="card p-0 md:p-6 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={10} cols={8} /></div>
                    ) : (
                        <div className="space-y-4">
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="text-center">Invoice</th>
                                            <th className="text-center">Nama Pemesan</th>
                                            <th className="text-center">Tanggal</th>
                                            <th className="text-center">Total QTY</th>
                                            <th className="text-center">Total Item</th>
                                            <th className="text-center">Grandtotal</th>
                                            <th className="text-center">Total Bayar</th>
                                            <th className="text-center">Sisa Bayar</th>
                                            <th className="text-center">Status Bayar</th>
                                            <th className="text-center">Status Transaksi</th>
                                            <th className="text-center">CS/Kasir</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx.id || tx.No_Transaksi} className={`${getRowStyle(tx)} transition-colors`}>
                                                <td className="font-medium text-center">
                                                    <div className="text-[var(--text-primary)] mb-1.5 font-black">{tx.No_Transaksi}</div>
                                                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                                                        <Link
                                                            href={`/transaction/edit/${tx.No_Transaksi}`}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                                        >
                                                            <PencilIcon className="w-3 h-3" />
                                                            Edit
                                                        </Link>
                                                        <span className="text-gray-200">/</span>
                                                        <button
                                                            onClick={() => handleAction('hapus', tx)}
                                                            className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            <TrashIcon className="w-3 h-3" />
                                                            Hapus
                                                        </button>
                                                        <span className="text-gray-200">/</span>
                                                        {tx.Status_Bayar === 'Lunas' ? (
                                                            <div className="flex items-center gap-1 text-emerald-600">
                                                                <CheckIcon className="w-3 h-3" />
                                                                Lunas
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAction('bayar', tx)}
                                                                className="flex items-center gap-1 text-orange-600 hover:text-orange-800 transition-colors"
                                                            >
                                                                <BanknotesIcon className="w-3 h-3" />
                                                                Bayar
                                                            </button>
                                                        )}
                                                        <span className="text-gray-200">/</span>
                                                        <button
                                                            onClick={() => handleAction('cetak', tx)}
                                                            className="flex items-center gap-1 text-gray-600 hover:text-gray-950 transition-colors"
                                                        >
                                                            <PrinterIcon className="w-3 h-3" />
                                                            Cetak
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="text-center">{tx.nama_pemesan || '-'}</td>
                                                <td className="text-xs text-center">{tx.Tanggal_Transaksi}</td>
                                                <td className="text-center">{~~tx.total_qty}</td>
                                                <td className="text-center">{~~tx.total_item}</td>
                                                <td className="font-semibold text-center">{formatCurrency(tx.total_sales)}</td>
                                                <td className="font-medium text-center">{formatCurrency(tx.total_bayar)}</td>
                                                <td className="font-medium text-center">{formatCurrency(tx.sisa_bayar)}</td>
                                                <td className="text-center">
                                                    <span className={`badge ${tx.Status_Bayar === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                                                        {tx.Status_Bayar}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge ${tx.Status_Transaksi === 'Selesai' ? 'badge-success' : 'badge-info'}`}>
                                                        {tx.Status_Transaksi}
                                                    </span>
                                                </td>
                                                <td className="text-xs text-center">{tx.nama_kasir}</td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan="11" className="py-24 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center">
                                                            <CalendarIcon className="w-10 h-10 text-gray-300" />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-bold text-gray-500">
                                                                Tidak ada transaksi {dateRangePreset === 'today' ? 'untuk hari ini' : 'pada periode ini'}.
                                                            </p>
                                                            <p className="text-sm text-gray-400 mt-1">Gunakan filter atau pencarian untuk menemukan data lain.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="lg:hidden divide-y divide-[var(--border)]">
                                {transactions.map((tx) => (
                                    <div key={tx.id || tx.No_Transaksi} className={`p-4 ${getRowStyle(tx)}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-bold text-[var(--text-primary)]">{tx.No_Transaksi}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{tx.Tanggal_Transaksi}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`badge ${tx.Status_Bayar === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                                                    {tx.Status_Bayar}
                                                </span>
                                                <span className={`badge ${tx.Status_Transaksi === 'Selesai' ? 'badge-success' : 'badge-info'}`}>
                                                    {tx.Status_Transaksi}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                                            <div>
                                                <p className="text-[var(--text-muted)] text-xs uppercase font-semibold">Pemesan</p>
                                                <p className="font-medium">{tx.nama_pemesan || '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[var(--text-muted)] text-xs uppercase font-semibold">Kasir</p>
                                                <p className="font-medium">{tx.nama_kasir}</p>
                                            </div>
                                            <div>
                                                <p className="text-[var(--text-muted)] text-xs uppercase font-semibold">Items</p>
                                                <p>{tx.total_qty} Qty / {tx.total_item} Items</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[var(--text-muted)] text-xs uppercase font-semibold">Total</p>
                                                <p className="font-bold text-[var(--primary)]">{formatCurrency(tx.total_sales)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-black/5">
                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-tight">
                                                <Link href={`/transaction/edit/${tx.No_Transaksi}`} className="text-blue-600">Edit</Link>
                                                <button onClick={() => handleAction('hapus', tx)} className="text-red-500">Hapus</button>
                                                {tx.Status_Bayar === 'Lunas' ? (
                                                    <span className="text-emerald-600">Lunas</span>
                                                ) : (
                                                    <button onClick={() => handleAction('bayar', tx)} className="text-orange-600">Bayar</button>
                                                )}
                                                <button onClick={() => handleAction('cetak', tx)} className="text-gray-600">Cetak</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && (
                                    <div className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3 italic text-gray-400">
                                            <CalendarIcon className="w-10 h-10 mb-2 opacity-50" />
                                            <p className="font-bold">Tidak ada transaksi {dateRangePreset === 'today' ? 'untuk hari ini' : 'pada periode ini'}.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && transactions.length > 0 && (
                        <div className="p-6 border-t border-[var(--border)] flex items-center justify-between">
                            <p className="text-sm text-[var(--text-secondary)]">
                                Page <span className="font-semibold text-[var(--text-primary)]">{pagination.current_page}</span> of <span className="font-semibold text-[var(--text-primary)]">{pagination.last_page}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                                    disabled={pagination.current_page === 1}
                                    className="btn btn-secondary px-4 py-2 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="btn btn-secondary px-4 py-2 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Date Range Modal */}
            {showDateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md animate-fade-in shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                                    <CalendarIcon className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">Pilih Rentang Tanggal</h2>
                            </div>
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-[var(--text-muted)]" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Mulai Dari</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Sampai Dengan</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-main)] rounded-b-2xl flex gap-3">
                            <button
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setDateRangePreset('all');
                                    setPagination(prev => ({ ...prev, current_page: 1 }));
                                    setShowDateModal(false);
                                }}
                                className="btn btn-secondary flex-1"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => {
                                    setPagination(prev => ({ ...prev, current_page: 1 }));
                                    setShowDateModal(false);
                                }}
                                className="btn btn-primary flex-1"
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Payment Modal */}
            {selectedTx && (
                <PaymentModal
                    isOpen={showPayModal}
                    onClose={() => {
                        setShowPayModal(false);
                        setSelectedTx(null);
                    }}
                    transactionNo={selectedTx.No_Transaksi}
                    totalSales={selectedTx.total_sales}
                    branch={currentBranch}
                    onSuccess={(msg) => {
                        if (msg) showToast(msg, 'success');
                        fetchTransactions();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Konfirmasi Hapus"
                mode="modal"
            >
                <div className="p-2 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110">
                        <TrashIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Transaksi?</h3>
                    <p className="text-gray-500 text-sm font-medium mb-8">
                        Apakah Anda yakin ingin menghapus transaksi <span className="text-red-600 font-bold">{selectedTx?.No_Transaksi}</span>? Tindakan ini tidak dapat dibatalkan.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                            className="h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => deleteTransaction(selectedTx)}
                            disabled={isDeleting}
                            className="h-14 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <ArrowPathIcon className="w-6 h-6 animate-spin" />
                            ) : (
                                'Ya, Hapus'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Merge Choice Modal */}
            <Modal
                show={showMergeChoiceModal}
                onClose={() => setShowMergeChoiceModal(false)}
                title="Cetak Struk"
                mode="modal"
            >
                <div className="p-2 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-[var(--primary)] rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110">
                        <PrinterIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Gabungkan Struk?</h3>
                    <p className="text-gray-500 text-sm font-medium mb-8">
                        Apakah Anda ingin menggabungkan beberapa transaksi ke dalam satu struk?
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                setShowMergeChoiceModal(false);
                                window.open(`/transaction/print/${selectedTx?.No_Transaksi}`, '_blank');
                            }}
                            className="h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                        >
                            Tidak (Hanya Ini)
                        </button>
                        <button
                            onClick={() => {
                                setShowMergeChoiceModal(false);
                                setShowMergeModal(true);
                            }}
                            className="h-14 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-black rounded-2xl shadow-xl shadow-[var(--primary)]/20 transition-all active:scale-95 flex items-center justify-center"
                        >
                            Ya (Gabungkan)
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Merge Transaction Modal */}
            <MergeTransactionModal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                currentBranch={currentBranch}
                initialTx={selectedTx}
            />

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-in">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md ${toast.type === 'success'
                        ? 'bg-emerald-500/90 text-white shadow-emerald-200/50'
                        : 'bg-red-500/90 text-white shadow-red-200/50'
                        }`}>
                        {toast.type === 'success' ? (
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                <CheckIcon className="w-5 h-5 text-white" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                <XMarkIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <span className="font-bold tracking-tight">{toast.message}</span>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes bounce-in {
                    0% { transform: translate(-50%, 100%); opacity: 0; }
                    60% { transform: translate(-50%, -10%); opacity: 1; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </MainLayout>
    );
}
