'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import {
    CalendarIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    XMarkIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { GetLocalDate } from '../../../hooks/useHelpers';
import { FetchData } from '../../../hooks/useFetchData';

export default function ProfitLossReportPage() {
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
                uri: `/api/reports/profit-loss?${params.toString()}`
            });

            if (result && result.success) {
                setReportData(result.data || null);
                setPeriode(result.data?.periode || '-');
            }
        } catch (error) {
            console.error('Error fetching profit loss report:', error);
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
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">LAPORAN LABA RUGI</h1>
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
                        <p className="mt-4 text-sm font-black text-gray-400 uppercase tracking-widest">Menganalisis Laba Rugi...</p>
                    </div>
                ) : reportData ? (
                    <div className="card text-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden relative print:border-none print:shadow-none print:pt-4 print:rounded-none">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/2 rounded-full -mr-32 -mt-32 blur-3xl no-print" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/2 rounded-full -ml-32 -mb-32 blur-3xl no-print" />

                        <div className="relative z-10 space-y-6 max-w-lg mx-auto">
                            <div className="inline-block p-6 rounded-3xl bg-primary/10 shadow-inner no-print">
                                <CurrencyDollarIcon className="w-12 h-12 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight print:text-sm">Modul Laba Rugi</h3>
                                <p className="text-gray-500 font-medium leading-relaxed print:text-xs">
                                    Modul analisis keuangan lengkap sedang ditingkatkan untuk memberikan wawasan yang lebih mendalam mengenai profitabilitas bisnis Anda.
                                </p>
                            </div>
                            <div className="pt-4 no-print">
                                <span className="px-6 py-2 rounded-full bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-200">
                                    Dalam Pengembangan
                                </span>
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
