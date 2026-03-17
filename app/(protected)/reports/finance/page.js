'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import {
    CalendarIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { GetLocalDate } from '../../../hooks/useHelpers';
import { FetchData } from '../../../hooks/useFetchData';

export default function FinanceReportPage() {
    const { selectedBranch } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [periode, setPeriode] = useState('');

    // Standardized date states
    const [dateRangePreset, setDateRangePreset] = useState('today');
    const [startDate, setStartDate] = useState(GetLocalDate());
    const [endDate, setEndDate] = useState(GetLocalDate());
    const [showDateModal, setShowDateModal] = useState(false);

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

    const fetchReport = async () => {
        if (!selectedBranch) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                shortName: selectedBranch.storeData.short_name,
                uniqueId: selectedBranch.uniqueId,
                startDate: startDate,
                endDate: endDate,
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/reports/financial?${params.toString()}`
            });

            if (result) {
                setReportData(result || null);
                setPeriode(result?.periode || '-');
            }
        } catch (error) {
            console.error('Error fetching finance report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [selectedBranch, startDate, endDate]);

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        const val = parseFloat(amount || 0);
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <MainLayout>
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; padding: 0.5cm; margin: 0; color: black; font-size: 8pt; }
                    .main-content { padding: 0 !important; margin: 0 !important; }
                    
                    /* Classic Table Styles */
                    table { border-collapse: collapse !important; width: 100% !important; margin-top: 10px; }
                    th, td { border: 1px solid #000 !important; padding: 3px 6px !important; text-align: left !important; color: black !important; }
                    th { bg-color: #f2f2f2 !important; font-weight: bold !important; text-transform: uppercase !important; }

                    @page { 
                        size: landscape; 
                        margin: 0.5cm;
                    }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .finance-row th { background-color: #f9fafb !important; }
                }
            `}</style>

            <div className="space-y-8 animate-fade-in relative px-4 md:px-0">
                {/* Filter & Print Row */}
                <div className="no-print flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm w-full md:w-auto">
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Rentang Tanggal</label>
                            <div className="relative">
                                <select
                                    value={dateRangePreset}
                                    onChange={(e) => handlePresetChange(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none pr-10"
                                >
                                    <option value="all">Semua Tanggal</option>
                                    <option value="today">Hari Ini</option>
                                    <option value="yesterday">Kemarin</option>
                                    <option value="thisMonth">Bulan Ini</option>
                                    <option value="lastMonth">Bulan Lalu</option>
                                    <option value="custom">Sesuaikan Tanggal...</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {(startDate || endDate) && dateRangePreset !== 'all' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Periode Aktif</label>
                                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                    <span className="text-xs font-black text-primary uppercase">{startDate || '...'}</span>
                                    <span className="text-[10px] font-bold text-gray-400">s/d</span>
                                    <span className="text-xs font-black text-primary uppercase">{endDate || '...'}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={fetchReport}
                            className="mt-5 px-6 py-2.5 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-95 group shrink-0"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                        UNDUH PDF
                    </button>
                </div>

                {/* Custom Date Range Modal */}
                {showDateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in shadow-2xl">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden border border-gray-100">
                            <div className="flex items-center justify-between p-8 border-b border-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
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
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sampai Dengan</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                                    className="flex-1 h-14 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all active:scale-95 uppercase text-xs tracking-widest"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowDateModal(false)}
                                    className="flex-1 h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 uppercase text-xs tracking-widest"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Section Optimized for Printing */}
                <div className="flex flex-row items-start justify-between bg-white md:p-8 rounded-[2.5rem] border border-gray-100 md:shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-0 print:mb-6 print:bg-transparent print:rounded-none">
                    <div className="flex flex-row items-center gap-6">
                        <div className="w-16 h-16 md:w-32 md:h-32 bg-gray-50 rounded-2xl md:rounded-3xl flex items-center justify-center p-2 md:p-4 border border-gray-100 shrink-0 z-10">
                            {selectedBranch?.storeData?.logo ? (
                                <img src={selectedBranch.storeData.logo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary font-black text-xl md:text-5xl">
                                    {selectedBranch?.storeName?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1 z-10">
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">LAPORAN KEUANGAN</h1>
                            <h2 className="text-md md:text-xl font-bold text-primary uppercase">{selectedBranch?.storeName}</h2>
                            <p className="text-[10px] md:text-xs text-gray-500 font-medium max-w-md leading-relaxed">{selectedBranch?.storeData?.address}</p>
                        </div>
                    </div>

                    <div className="text-right space-y-1 z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Periode</p>
                        <div className="flex items-center justify-end gap-2 text-gray-700 font-bold text-xs md:text-sm bg-gray-50 px-4 py-2 rounded-xl print:bg-transparent print:p-0">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span>{periode}</span>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center justify-center border border-gray-100 shadow-sm print:border-none print:shadow-none">
                        <ArrowPathIcon className="w-12 h-12 animate-spin text-primary/20" />
                        <p className="mt-4 text-sm font-black text-gray-400 uppercase tracking-widest">Mengkalkulasi Data Keuangan...</p>
                    </div>
                ) : reportData ? (
                    <div className="space-y-6 print:space-y-4">
                        {/* Summary Data Section */}
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
                            <table className="w-full text-left print:text-[8pt]">
                                <tbody className="divide-y divide-gray-100">
                                    <tr className="bg-gray-50/50 finance-row">
                                        <th className="px-8 py-5 text-gray-500 font-bold uppercase text-[10px] tracking-widest">Omset Bulan Ini</th>
                                        <td className="px-8 py-5 text-right font-black text-gray-900 text-lg tabular-nums">{reportData.omset_bulan_ini}</td>
                                    </tr>
                                    <tr className="bg-gray-50/50 finance-row">
                                        <th className="px-8 py-5 text-gray-500 font-bold uppercase text-[10px] tracking-widest">Omset Bulan Lalu</th>
                                        <td className="px-8 py-5 text-right font-black text-gray-400 text-lg tabular-nums">{reportData.omset_bulan_lalu || '-'}</td>
                                    </tr>
                                    <tr className="bg-emerald-50/50 finance-row">
                                        <th className="px-8 py-5 text-emerald-700 font-black uppercase text-[10px] tracking-widest">Omset Hari Ini</th>
                                        <td className="px-8 py-5 text-right font-black text-emerald-600 text-lg tabular-nums">{reportData.pemasukan?.omset_hari_ini}</td>
                                    </tr>
                                    <tr className="bg-emerald-50/50 finance-row">
                                        <th className="px-8 py-5 text-emerald-700 font-black uppercase text-[10px] tracking-widest">Pelunasan</th>
                                        <td className="px-8 py-5 text-right font-black text-emerald-600 text-lg tabular-nums">{reportData.pemasukan?.pelunasan_piutang}</td>
                                    </tr>
                                    <tr className="bg-red-50/50 finance-row">
                                        <th className="px-8 py-5 text-red-700 font-black uppercase text-[10px] tracking-widest">Biaya</th>
                                        <td className="px-8 py-5 text-right font-black text-red-600 text-lg tabular-nums">{reportData.pengeluaran?.biaya}</td>
                                    </tr>
                                    <tr className="bg-red-50/50 finance-row">
                                        <th className="px-8 py-5 text-red-700 font-black uppercase text-[10px] tracking-widest">Pinjaman</th>
                                        <td className="px-8 py-5 text-right font-black text-red-400 text-lg tabular-nums">{reportData.pengeluaran?.pinjaman || '-'}</td>
                                    </tr>
                                    <tr className="bg-red-50/50 finance-row">
                                        <th className="px-8 py-5 text-red-700 font-black uppercase text-[10px] tracking-widest">Piutang Konsumen Bulan Ini</th>
                                        <td className="px-8 py-5 text-right font-black text-red-600 text-lg tabular-nums">{reportData.piutang_bulan_ini}</td>
                                    </tr>
                                    <tr className="bg-blue-50/50 finance-row">
                                        <th className="px-8 py-5 text-blue-700 font-black uppercase text-[10px] tracking-widest">Profit Harian</th>
                                        <td className="px-8 py-5 text-right font-black text-blue-600 text-2xl tracking-tighter tabular-nums">{reportData.profit_harian}</td>
                                    </tr>
                                    <tr className="bg-blue-50/50 finance-row">
                                        <th className="px-8 py-5 text-blue-700 font-black uppercase text-[10px] tracking-widest">Profit Bulanan</th>
                                        <td className="px-8 py-5 text-right font-black text-blue-600 text-2xl tracking-tighter tabular-nums">{reportData.profit_bulanan}</td>
                                    </tr>
                                    <tr className="bg-blue-50/50 finance-row">
                                        <th className="px-8 py-5 text-blue-700 font-black uppercase text-[10px] tracking-widest">EDC</th>
                                        <td className="px-8 py-5 text-right font-black text-blue-600 text-lg tabular-nums">{reportData.edc?.total}</td>
                                    </tr>
                                    <tr className="bg-blue-50/50 finance-row">
                                        <th className="px-8 py-5 text-blue-700 font-black uppercase text-[10px] tracking-widest">EDC Berjalan</th>
                                        <td className="px-8 py-5 text-right font-black text-blue-400 text-lg tabular-nums">{reportData.edc_berjalan || '-'}</td>
                                    </tr>
                                    <tr className="bg-amber-50/50 finance-row">
                                        <th className="px-8 py-5 text-amber-700 font-black uppercase text-[10px] tracking-widest">Setor Bank</th>
                                        <td className="px-8 py-5 text-right font-black text-amber-600 text-lg tabular-nums">{reportData.setor_bank}</td>
                                    </tr>
                                    <tr className="bg-amber-50/50 finance-row">
                                        <th className="px-8 py-5 text-amber-700 font-black uppercase text-[10px] tracking-widest">Setor Bank Berjalan</th>
                                        <td className="px-8 py-5 text-right font-black text-amber-400 text-lg tabular-nums">{reportData.setor_bank_berjalan || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Breakdown Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                            {/* Left Column: Pengeluaran Sections */}
                            <div className="space-y-6 print:space-y-4">
                                {/* Rincian Pengeluaran (Self) */}
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-fit print:border-none print:shadow-none print:rounded-none">
                                    <div className="px-8 py-6 bg-red-500/5 border-b border-gray-100 font-black text-red-600 uppercase tracking-widest text-xs print:bg-gray-100 print:text-black print:border-black print:py-2 print:px-4">
                                        Rincian Pengeluaran
                                    </div>
                                    <div className="divide-y divide-gray-50 print:divide-y print:divide-black">
                                        <table className="w-full border-collapse">
                                            <tbody>
                                                {reportData.pengeluaran?.item_self && Array.isArray(reportData.pengeluaran.item_self) && reportData.pengeluaran.item_self.length > 0 ? (
                                                    reportData.pengeluaran.item_self.map((item, idx) => (
                                                        <tr key={`self-${idx}`} className="group hover:bg-gray-50/50 transition-colors print:hover:bg-transparent">
                                                            <td className="px-8 py-4 text-sm font-bold text-gray-500 uppercase tracking-tight leading-tight print:px-2 print:py-1 print:text-black print:font-normal print:text-[7pt]">{item.keterangan}</td>
                                                            <td className="px-8 py-4 text-right text-sm font-black text-red-600 print:px-2 print:py-1 print:text-black print:font-normal print:text-[7pt]">{item.subtotal}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr className="print:border-none">
                                                        <td colSpan="2" className="px-8 py-8 text-center text-gray-400 italic text-sm font-bold print:py-2 print:text-black print:font-normal">-</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Rincian Pengeluaran Cabang Lain */}
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-fit print:border-none print:shadow-none print:rounded-none">
                                    <div className="px-8 py-6 bg-blue-500/5 border-b border-gray-100 font-black text-blue-600 uppercase tracking-widest text-xs print:bg-gray-100 print:text-black print:border-black print:py-2 print:px-4">
                                        Rincian Pengeluaran Cabang Lain
                                    </div>
                                    <div className="divide-y divide-gray-50 print:divide-y print:divide-black">
                                        <table className="w-full border-collapse">
                                            <tbody>
                                                {reportData.pengeluaran?.item_cabang && Array.isArray(reportData.pengeluaran.item_cabang) && reportData.pengeluaran.item_cabang.length > 0 ? (
                                                    reportData.pengeluaran.item_cabang.map((item, idx) => (
                                                        <tr key={`cabang-${idx}`} className="group hover:bg-gray-50/50 transition-colors print:hover:bg-transparent">
                                                            <td className="px-8 py-4 text-sm font-bold text-gray-500 uppercase tracking-tight leading-tight print:px-2 print:py-1 print:text-black print:font-normal print:text-[7pt]">{item.keterangan}</td>
                                                            <td className="px-8 py-4 text-right text-sm font-black text-red-600 print:px-2 print:py-1 print:text-black print:font-normal print:text-[7pt]">{item.subtotal}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr className="print:border-none">
                                                        <td colSpan="2" className="px-8 py-8 text-center text-gray-400 italic text-sm font-bold print:py-2 print:text-black print:font-normal">-</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: EDC Breakdown */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-fit print:border-none print:shadow-none print:rounded-none">
                                <div className="px-8 py-6 bg-blue-500/5 border-b border-gray-100 font-black text-blue-600 uppercase tracking-widest text-xs print:bg-gray-100 print:text-black print:border-black print:py-2 print:px-4">
                                    Rincian EDC
                                </div>
                                <div className="divide-y divide-gray-50 print:divide-y print:divide-black">
                                    <table className="w-full border-collapse">
                                        <tbody>
                                            {reportData.edc?.item && Array.isArray(reportData.edc.item) && reportData.edc.item.length > 0 ? (
                                                reportData.edc.item.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors print:hover:bg-transparent">
                                                        <td className="px-8 py-4 text-sm font-bold text-gray-500 uppercase tracking-tight leading-tight print:px-2 print:py-1 print:text-black print:font-normal print:text-[7pt]">{item.keterangan}</td>
                                                        <td className="px-8 py-4 text-right text-sm font-black text-blue-600 print:px-2 print:py-1 print:text-black print:font-normal print:text-[7pt]">{item.subtotal}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr className="print:border-none">
                                                    <td colSpan="2" className="px-8 py-8 text-center text-gray-400 italic text-sm font-bold print:py-2 print:text-black print:font-normal">-</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm uppercase tracking-[0.2em]">
                        <p className="text-gray-400 italic font-black text-sm">Data Tidak Tersedia</p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
