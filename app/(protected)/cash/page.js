'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import Modal from '../../components/Modal';
import { SkeletonTable } from '../../components/Skeleton';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    CalendarIcon,
    BanknotesIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { FetchData } from '../../hooks/useFetchData';
import { GetLocalDate } from '../../hooks/useHelpers';
import Toast from '../../components/Toast';

export default function CashPage() {
    const { selectedBranch, branches, user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState(GetLocalDate());
    const [endDate, setEndDate] = useState(GetLocalDate());
    const [datePreset, setDatePreset] = useState('today');
    const [showDateModal, setShowDateModal] = useState(false);

    // Summary data
    const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });

    // Action states
    const [selectedTx, setSelectedTx] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const currentBranch = selectedBranch || branches[0];

    useEffect(() => {
        if (currentBranch) {
            fetchTransactions();
        }
    }, [currentBranch, search, startDate, endDate, pagination.current_page]);

    const fetchTransactions = async () => {
        if (!currentBranch) return;

        try {
            setIsLoading(true);
            const action = search ? 'search' : 'getAll';
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: pagination.current_page,
                paginate: 25,
                ...(search && { v: search }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/cash/${action}?${params.toString()}`
            });

            if (result && result.success) {
                const dataObj = result.results?.data || result.data || result.results;
                const txData = dataObj?.data || (Array.isArray(dataObj) ? dataObj : []);
                setTransactions(txData);

                // Use the overall report from API if available
                if (result.cash_report) {
                    setSummary({
                        totalIn: result.cash_report.total_masuk,
                        totalOut: result.cash_report.total_keluar,
                        balance: result.cash_report.saldo
                    });
                } else {
                    // Fallback to per-page calculation if report not available
                    const tIn = txData.reduce((sum, t) => sum + Number(t.masuk || 0), 0);
                    const tOut = txData.reduce((sum, t) => sum + Number(t.keluar || 0), 0);
                    setSummary({
                        totalIn: tIn,
                        totalOut: tOut,
                        balance: tIn - tOut
                    });
                }

                if (dataObj?.current_page) {
                    setPagination({
                        current_page: dataObj.current_page,
                        last_page: dataObj.last_page
                    });
                }
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching cash transactions:', error);
            setIsLoading(false);
        }
    };

    const handlePresetChange = (preset) => {
        setDatePreset(preset);
        setPagination(prev => ({ ...prev, current_page: 1 }));
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'custom') {
            setShowDateModal(true);
        } else {
            if (preset === 'today') {
                setStartDate(GetLocalDate());
                setEndDate(GetLocalDate());
            } else if (preset === 'yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setStartDate(GetLocalDate(yesterday));
                setEndDate(GetLocalDate(yesterday));
            }
            // Add more presets if needed
        }
    };

    const deleteTransaction = async (tx) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/cash/delete/${tx.id_kas}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (result.success) {
                setShowDeleteModal(false);
                setSelectedTx(null);
                setToast({ show: true, message: 'Transaksi berhasil dihapus', type: 'success' });
                fetchTransactions();
            } else {
                setToast({ show: true, message: result.message || 'Gagal menghapus transaksi', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Terjadi kesalahan sistem', type: 'error' });
        } finally {
            setIsDeleting(false);
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Cash Management</h1>
                        <p className="text-[var(--text-secondary)]">Kelola Kas Masuk & Keluar</p>
                    </div>
                    <Link
                        href="/cash/add"
                        className="btn btn-primary w-full sm:w-auto"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Kas Baru</span>
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <ArrowDownTrayIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase">Total Kas Masuk</p>
                                <p className="text-2xl font-black text-emerald-700">{formatCurrency(summary.totalIn)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                <ArrowUpTrayIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-red-600 uppercase">Total Kas Keluar</p>
                                <p className="text-2xl font-black text-red-700">{formatCurrency(summary.totalOut)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <BanknotesIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-600 uppercase">Saldo Kas</p>
                                <p className="text-2xl font-black text-indigo-700">{formatCurrency(summary.balance)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-8">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Cari Transaksi</label>
                            <div className="relative group">
                                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari keterangan atau nama kasir..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPagination(prev => ({ ...prev, current_page: 1 }));
                                    }}
                                    className="input !pl-10 h-11 text-sm"
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-4">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Rentang Tanggal</label>
                            <div className="relative">
                                <select
                                    value={datePreset}
                                    onChange={(e) => handlePresetChange(e.target.value)}
                                    className="input h-11 text-sm appearance-none pr-10"
                                >
                                    <option value="all">Semua Tanggal</option>
                                    <option value="today">Hari Ini</option>
                                    <option value="yesterday">Kemarin</option>
                                    <option value="custom">Pilih Tanggal...</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="card p-0 overflow-hidden border border-gray-100">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={10} cols={6} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="text-center w-28">Action</th>
                                        <th className="text-center">Tanggal</th>
                                        <th className="text-left">No Transaksi</th>
                                        <th className="text-center">Kode Kas</th>
                                        <th className="text-left">Nama Pemesan</th>
                                        <th className="text-left">Keterangan</th>
                                        <th className="text-center">Status Bayar</th>
                                        <th className="text-right">Masuk</th>
                                        <th className="text-right">Keluar</th>
                                        <th className="text-left">Kasir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((tx, idx) => (
                                        <tr key={tx.id_kas} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/cash/edit/${tx.id_kas}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => { setSelectedTx(tx); setShowDeleteModal(true); }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="text-center text-xs font-semibold text-gray-600 whitespace-nowrap">{tx.tanggal}</td>
                                            <td className="text-left text-xs font-mono font-bold text-primary">{tx.transaksi?.No_Transaksi || tx.no_transaksi || '-'}</td>
                                            <td className="text-center">
                                                <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-bold uppercase">{tx.kode_kas}</span>
                                            </td>
                                            <td className="text-left text-sm font-medium text-gray-700">{tx.nama_pemesan || '-'}</td>
                                            <td className="text-left py-4">
                                                <div className="text-xs text-gray-800 whitespace-normal break-words min-w-[150px] max-w-[300px]">{tx.keterangan || '-'}</div>
                                            </td>
                                            <td className="text-center">
                                                {(tx.transaksi?.Status_Bayar || tx.status_bayar) ? (
                                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${(tx.transaksi?.Status_Bayar || tx.status_bayar) === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {tx.transaksi?.Status_Bayar || tx.status_bayar}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="text-right font-black text-emerald-600 whitespace-nowrap">
                                                {tx.masuk > 0 ? formatCurrency(tx.masuk) : '-'}
                                            </td>
                                            <td className="text-right font-black text-red-600 whitespace-nowrap">
                                                {tx.keluar > 0 ? formatCurrency(tx.keluar) : '-'}
                                            </td>
                                            <td className="text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{tx.input_by}</td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                        <CalendarIcon className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-500">
                                                            Tidak ada data transaksi kas {datePreset === 'today' ? 'untuk hari ini' : 'pada periode ini'}.
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">Coba ubah rentang tanggal atau gunakan kata kunci pencarian lain.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && transactions.length > 0 && (
                        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Halaman {pagination.current_page} dari {pagination.last_page}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                                    disabled={pagination.current_page === 1}
                                    className="btn btn-secondary !px-4 h-10 disabled:opacity-50"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="btn btn-secondary !px-4 h-10 disabled:opacity-50"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Modal */}
            {showDateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md animate-fade-in shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900">Pilih Tanggal</h2>
                            <button onClick={() => setShowDateModal(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Awal</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Akhir</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => { setStartDate(''); setEndDate(''); setDatePreset('all'); setPagination(prev => ({ ...prev, current_page: 1 })); setShowDateModal(false); }} className="btn btn-secondary flex-1">Reset</button>
                            <button onClick={() => { setPagination(prev => ({ ...prev, current_page: 1 })); setShowDateModal(false); }} className="btn btn-primary flex-1">Terapkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onClose={() => !isDeleting && setShowDeleteModal(false)} title="Hapus Kas" mode="modal">
                <div className="text-center p-2">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <TrashIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Transaksi Kas?</h3>
                    <p className="text-gray-500 text-sm mb-8">Tindakan ini akan menghapus data kas secara permanen.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="btn btn-secondary h-14 rounded-2xl">Batal</button>
                        <button onClick={() => deleteTransaction(selectedTx)} disabled={isDeleting} className="btn bg-red-500 hover:bg-red-600 text-white h-14 rounded-2xl flex items-center justify-center gap-2">
                            {isDeleting ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
}
