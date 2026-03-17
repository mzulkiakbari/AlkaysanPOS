'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import {
    ListBulletIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    ClockIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    SwatchIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { FetchData } from '../../../hooks/useFetchData';

export default function AuditLogsPage() {
    const { selectedBranch } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    const fetchLogs = async (page = 1) => {
        if (!selectedBranch) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                shortName: selectedBranch.storeData.short_name,
                uniqueId: selectedBranch.uniqueId,
                page: page
            });

            if (filterAction !== 'all') {
                params.append('action', filterAction);
            }

            const result = await FetchData({
                method: 'GET',
                uri: `/api/audit-logs?${params.toString()}`
            });

            if (result && result.success) {
                setLogs(result.data.data || []);
                setMeta(result.data);
                setCurrentPage(result.data.current_page);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [selectedBranch, filterAction]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (meta?.last_page || 1)) {
            fetchLogs(newPage);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short'
        }).format(date);
    };

    const getActionBadgeColor = (action) => {
        switch (action.toLowerCase()) {
            case 'create': return 'bg-emerald-50 text-emerald-600';
            case 'update': return 'bg-sky-50 text-sky-600';
            case 'delete': return 'bg-rose-50 text-rose-600';
            case 'login': return 'bg-violet-50 text-violet-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
                {/* Header Container */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Logs</h1>
                        <p className="text-gray-500 font-medium mt-1">Riwayat aktivitas sistem pada {selectedBranch?.storeName}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari aktivitas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white border border-gray-200 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none md:w-80 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => fetchLogs(currentPage)}
                            className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-500 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'create', 'update', 'delete', 'login'].map((act) => (
                        <button
                            key={act}
                            onClick={() => setFilterAction(act)}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterAction === act
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-white text-gray-400 border border-gray-100'
                                }`}
                        >
                            {act}
                        </button>
                    ))}
                </div>

                {/* Logs Feed Container */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
                    <div className="p-8 space-y-2">
                        {isLoading ? (
                            <div className="py-40 text-center space-y-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Menyelaraskan Aktivitas...</p>
                            </div>
                        ) : logs.length > 0 ? (
                            logs.map((log) => (
                                <div key={log.id} className="group relative p-6 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                    <div className="flex items-start gap-6">
                                        {/* Avatar / Icon */}
                                        <div className="shrink-0 relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm transition-transform group-hover:scale-110">
                                                {log.sso_user?.photo ? (
                                                    <img src={log.sso_user.photo} alt={log.sso_user.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircleIcon className="w-8 h-8 text-gray-300" />
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg border-2 border-white ${getActionBadgeColor(log.action)}`}>
                                                <SwatchIcon className="w-3 h-3" />
                                            </div>
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-x-2 text-base md:text-lg leading-relaxed">
                                                <span className="font-black text-gray-900">
                                                    {log.sso_user?.full_name || 'Sistem'}
                                                </span>
                                                <span className="text-gray-600 font-medium">
                                                    {log.description}
                                                </span>
                                                <span className="text-gray-400 font-bold text-sm whitespace-nowrap flex items-center gap-1.5 ml-auto md:ml-0">
                                                    pada {formatDateTime(log.created_at)}
                                                </span>
                                            </div>

                                            {/* Sub-details (IP, UA, Module) - Very Subtle */}
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 border-t border-gray-100/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    <SwatchIcon className="w-3.5 h-3.5" />
                                                    Modul: <span className="text-primary">{log.module}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    <GlobeAltIcon className="w-3.5 h-3.5" />
                                                    IP: <span className="text-gray-600">{log.ip_address}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider max-w-[200px] truncate" title={log.user_agent}>
                                                    <ComputerDesktopIcon className="w-3.5 h-3.5" />
                                                    UA: <span className="text-gray-600 lowercase">{log.user_agent}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-40 text-center">
                                <ListBulletIcon className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                <p className="text-gray-300 font-black uppercase tracking-widest text-xs">Belum ada aktivitas yang tercatat</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination - Simplified Modern */}
                    {meta && meta.last_page > 1 && (
                        <div className="px-8 py-8 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between">
                            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                Menampilkan {meta.from}-{meta.to} dari {meta.total} Entri
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm active:scale-90"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm text-sm font-black text-gray-700">
                                    <span className="text-primary">{currentPage}</span>
                                    <span className="text-gray-300">/</span>
                                    <span>{meta.last_page}</span>
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === meta.last_page}
                                    className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm active:scale-90"
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
