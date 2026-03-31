'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import Modal from '../../../components/Modal';
import PaymentModal from '../../../components/PaymentModal';
import { SkeletonTable } from '../../../components/Skeleton';
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    BanknotesIcon,
    EyeIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    CalendarIcon,
    UserGroupIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { FetchData } from '../../../hooks/useFetchData';
import Toast from '../../../components/Toast';

export default function DebtLoanPage() {
    const { selectedBranch, branches } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [receivables, setReceivables] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [search, setSearch] = useState('');

    // Standardized date states
    const [dateRangePreset, setDateRangePreset] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDateModal, setShowDateModal] = useState(false);

    const [summary, setSummary] = useState({
        totalPiutang: 0,
        piutangBulanIni: 0,
        piutangBulanLalu: 0,
        piutangTahunIni: 0,
        piutangTahunLalu: 0
    });

    // Action states
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [isFetchingInvoices, setIsFetchingInvoices] = useState(false);

    // Payment states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
    const [selectedTotalSales, setSelectedTotalSales] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const currentBranch = selectedBranch || branches[0];

    const getDatePresets = () => {
        const today = new Date();
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

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

    const handlePresetChange = (presetKey) => {
        setDateRangePreset(presetKey);
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

    useEffect(() => {
        if (currentBranch) {
            fetchReceivables();
        }
    }, [currentBranch, search, pagination.current_page, startDate, endDate]);

    const fetchReceivables = async () => {
        if (!currentBranch) return;

        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: pagination.current_page,
                paginate: 50,
                ...(search && { qname: search }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/reports/ar-ap/?${params.toString()}`
            });

            if (result && result.success) {
                const apiData = result.data;
                const stats = apiData.stats || {};

                setSummary({
                    totalPiutang: apiData.total_piutang_all_time || 0,
                    piutangBulanIni: stats.piutang_bulan_ini || 0,
                    piutangBulanLalu: stats.piutang_bulan_lalu || 0,
                    piutangTahunIni: stats.piutang_tahun_ini || 0,
                    piutangTahunLalu: stats.piutang_tahun_lalu || 0
                });

                const details = apiData.details || {};
                const listData = details.data || [];

                // Map API fields to UI field names
                const mappedData = listData.map(item => ({
                    id: item.id || Math.random(),
                    nama_konsumen: item.nama_pemesan || 'Unknown',
                    no_hp: item.telepon_pemesan || '-',
                    jenis_member: item.membership || 'UMUM',
                    total_orderan: item.total_orderan || 0,
                    terhutang: parseFloat(item.terhutang || 0),
                    belum_lunas: item.belum_lunas || []
                }));

                setReceivables(mappedData);
                setPagination({
                    current_page: details.current_page || 1,
                    last_page: details.last_page || 1,
                    total: details.total || 0
                });

                // Auto-refresh selected customer details if modal is open
                if (selectedCustomer) {
                    const updated = mappedData.find(c =>
                        c.nama_konsumen === selectedCustomer.nama_konsumen &&
                        c.no_hp === selectedCustomer.no_hp
                    );
                    if (updated) {
                        setSelectedCustomer(updated);
                        fetchCustomerInvoices(updated);
                    } else {
                        setIsFetchingInvoices(false);
                        setCustomerInvoices([]);
                    }
                }
            } else {
                setReceivables([]);
            }
        } catch (error) {
            console.error('Error fetching receivables:', error);
            setReceivables([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomerInvoices = (customer) => {
        setIsFetchingInvoices(true);
        try {
            // Take data from belum_lunas key in the API response
            const invoices = (customer.belum_lunas || []).map(inv => ({
                no_transaksi: inv.No_Transaksi,
                tanggal: inv.Tanggal_Transaksi,
                total: parseFloat(inv.net_total_sales || 0),
                terbayar: parseFloat(inv.total_bayar || 0),
                sisa: parseFloat(inv.sisa_bayar || 0)
            }));
            setCustomerInvoices(invoices);
        } catch (error) {
            console.error('Error processing customer invoices:', error);
        } finally {
            setIsFetchingInvoices(false);
        }
    };

    const handleSeeInvoices = (customer) => {
        setSelectedCustomer(customer);
        setShowInvoiceModal(true);
        fetchCustomerInvoices(customer);
    };

    const handleRedirectWA = (customer) => {
        const message = `Halo ${customer.nama_konsumen}, kami dari ${currentBranch.storeName} ingin menginfokan bahwa terdapat tagihan yang belum lunas sebesar ${formatCurrency(customer.terhutang)}. Mohon segera melakukan pembayaran. Terima kasih.`;
        const phone = customer.no_hp.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    const handlePayInvoice = (invoice) => {
        setSelectedInvoiceNo(invoice.no_transaksi);
        setSelectedTotalSales(invoice.total);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setIsFetchingInvoices(true);
        // Refresh summary and table (this automatically refreshes the open invoice modal with updated data)
        fetchReceivables();
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
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hutang Piutang</h1>
                        <p className="text-[var(--text-secondary)]">Monitoring piutang konsumen</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="card bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-4">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Total Piutang</p>
                        <p className="text-lg font-black text-red-700 mt-1">{formatCurrency(summary.totalPiutang)}</p>
                    </div>
                    <div className="card bg-white border border-gray-100 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bulan Ini</p>
                        <p className="text-lg font-black text-gray-700 mt-1">{formatCurrency(summary.piutangBulanIni)}</p>
                    </div>
                    <div className="card bg-white border border-gray-100 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bulan Lalu</p>
                        <p className="text-lg font-black text-gray-700 mt-1">{formatCurrency(summary.piutangBulanLalu)}</p>
                    </div>
                    <div className="card bg-white border border-gray-100 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tahun Ini</p>
                        <p className="text-lg font-black text-gray-700 mt-1">{formatCurrency(summary.piutangTahunIni)}</p>
                    </div>
                    <div className="card bg-white border border-gray-100 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tahun Lalu</p>
                        <p className="text-lg font-black text-gray-700 mt-1">{formatCurrency(summary.piutangTahunLalu)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Search */}
                    <div className="card !p-3 flex-1 w-full">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari nama konsumen atau no hp..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination(prev => ({ ...prev, current_page: 1 }));
                                }}
                                className="input !pl-12 !h-12 !bg-[var(--bg-main)] hover:bg-white focus:bg-white transition-all border-none shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Date Preset Range Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-3xl shadow-sm w-full md:w-auto overflow-hidden shrink-0 h-[72px]">
                        <div className="relative w-full sm:w-64 h-full flex items-center justify-center bg-gray-50 rounded-2xl px-2">
                            <select
                                value={dateRangePreset}
                                onChange={(e) => handlePresetChange(e.target.value)}
                                className="w-full bg-transparent border-none py-2.5 text-xs font-bold text-gray-700 focus:ring-0 outline-none appearance-none cursor-pointer pl-4"
                            >
                                <option value="all">Semua Tanggal</option>
                                <option value="today">Hari Ini</option>
                                <option value="yesterday">Kemarin</option>
                                <option value="thisMonth">Bulan Ini</option>
                                <option value="lastMonth">Bulan Lalu</option>
                                <option value="custom">Sesuaikan Tanggal...</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {(startDate || endDate) && dateRangePreset !== 'all' && (
                            <div className="flex items-center gap-2 bg-primary/5 px-4 h-full rounded-2xl border border-primary/10 mr-2 shrink-0">
                                <span className="text-xs font-black text-primary uppercase">{startDate || '...'}</span>
                                <span className="text-[10px] font-bold text-gray-400">s/d</span>
                                <span className="text-xs font-black text-primary uppercase">{endDate || '...'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="card p-0 overflow-hidden border border-gray-100 shadow-xl shadow-black/5">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={10} cols={6} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                    <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        <th className="px-6 py-4">Nama Konsumen</th>
                                        <th className="px-6 py-4">No Hp</th>
                                        <th className="px-6 py-4 text-center">Jenis Member</th>
                                        <th className="px-6 py-4 text-center">Total Orderan</th>
                                        <th className="px-6 py-4 text-right">Terhutang</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)] bg-white text-sm">
                                    {receivables.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{item.nama_konsumen}</td>
                                            <td className="px-6 py-4 text-[var(--text-secondary)]">{item.no_hp}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-tighter">
                                                    {item.jenis_member}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium">{item.total_orderan}</td>
                                            <td className="px-6 py-4 text-right font-black text-red-600">
                                                {formatCurrency(item.terhutang)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleSeeInvoices(item)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-xs font-bold"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                        Lihat
                                                    </button>
                                                    <button
                                                        onClick={() => handleRedirectWA(item)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold"
                                                    >
                                                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                        WA
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {receivables.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-20 text-center text-[var(--text-muted)]">
                                                Tidak ada data piutang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && receivables.length > 0 && (
                        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-main)]/30">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                                Page {pagination.current_page} of {pagination.last_page}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                                    disabled={pagination.current_page === 1}
                                    className="btn btn-secondary !px-4 h-9 text-xs disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="btn btn-secondary !px-4 h-9 text-xs disabled:opacity-50"
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-8 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-blue-700 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                                    <CalendarIcon className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Pilih Tanggal</h2>
                            </div>
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="p-3 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mulai Dari</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sampai Dengan</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-4">
                            <button
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setDateRangePreset('all');
                                    setShowDateModal(false);
                                }}
                                className="flex-1 px-4 py-4 bg-white border-2 border-gray-200 text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => {
                                    setPagination(prev => ({ ...prev, current_page: 1 }));
                                    fetchReceivables();
                                    setShowDateModal(false);
                                }}
                                className="flex-1 px-4 py-4 bg-[var(--primary)] text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--primary)]/20"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Table Modal */}
            <Modal
                show={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                title={`Piutang: ${selectedCustomer?.nama_konsumen}`}
                mode="modal"
                width="max-w-4xl"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-2">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Terhutang</p>
                            <p className="text-2xl font-black text-red-600 tracking-tighter">{formatCurrency(selectedCustomer?.terhutang)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Kontak</p>
                            <p className="text-sm font-bold text-gray-800">{selectedCustomer?.no_hp}</p>
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="table">
                            <thead className="bg-gray-50">
                                <tr className="text-[10px] font-bold text-gray-400 uppercase">
                                    <th className="px-4 py-3">No Invoice</th>
                                    <th className="px-4 py-3 text-center">Tanggal</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">Terbayar</th>
                                    <th className="px-4 py-3 text-right">Sisa</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {isFetchingInvoices ? (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center">
                                            <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto text-gray-300" />
                                        </td>
                                    </tr>
                                ) : customerInvoices.length > 0 ? (
                                    customerInvoices.map((inv, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-800">{inv.no_transaksi}</td>
                                            <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">{inv.tanggal}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                                            <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(inv.terbayar)}</td>
                                            <td className="px-4 py-3 text-right font-black text-red-600">{formatCurrency(inv.sisa)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => window.open(`/transaction/print/${inv.no_transaksi}`, '_blank')}
                                                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center gap-1"
                                                    >
                                                        <EyeIcon className="w-3 h-3" />
                                                        Lihat
                                                    </button>
                                                    <button
                                                        onClick={() => handlePayInvoice(inv)}
                                                        className="px-3 py-1 rounded-lg bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:scale-105 transition-all"
                                                    >
                                                        Bayar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center text-gray-400 italic">
                                            Tidak ada invoice tertunggak.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setShowInvoiceModal(false)}
                            className="h-11 px-6 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={() => handleRedirectWA(selectedCustomer)}
                            className="h-11 px-6 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                        >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            Hubungi via WA
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    transactionNo={selectedInvoiceNo}
                    totalSales={selectedTotalSales}
                    branch={selectedBranch}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </MainLayout>
    );
}
