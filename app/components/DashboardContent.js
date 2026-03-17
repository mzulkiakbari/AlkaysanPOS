'use client';

import { useState, useEffect } from 'react';
import {
    CurrencyDollarIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    DocumentTextIcon,
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { SkeletonCard, SkeletonTable, Skeleton } from './Skeleton';
import FetchErrorState from './FetchErrorState';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { FetchData } from '../hooks/useFetchData';
import { useAuth } from '../context/AuthContext';
import { FormatCurrency } from '../hooks/useHelpers';
import Link from 'next/link';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function DashboardContent() {
    const { selectedBranch, branches } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const currentBranch = selectedBranch || branches[0];

    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!currentBranch) return;

        try {
            setIsLoading(true);
            setError(null);
            const result = await FetchData({
                method: 'GET',
                uri: `/api/dashboard?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`
            });

            if (result && result.success) {
                setData(result.data);
            } else {
                throw new Error(result?.message || 'Gagal memuat data dashboard.');
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.message || 'Terjadi kesalahan jaringan.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentBranch]);

    if (error && !isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center animate-fade-in">
                <FetchErrorState
                    title="Gagal Memuat Dashboard"
                    message={error}
                    onRetry={fetchData}
                />
            </div>
        );
    }

    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return '0%';
        const change = ((current - previous) / previous) * 100;
        return (change > 0 ? '+' : '') + change.toFixed(1) + '%';
    };

    const yesterdayExpenses = data?.trends?.length >= 2 ? parseFloat(data.trends[data.trends.length - 2].pengeluaran) : 0;

    const stats = data ? [
        {
            name: 'Penjualan Hari Ini',
            value: data.penjualan_harian_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.penjualan_harian), parseFloat(data.penjualan_kemarin)),
            isPositive: parseFloat(data.penjualan_harian) >= parseFloat(data.penjualan_kemarin),
            compareText: 'vs kemarin',
            icon: ShoppingCartIcon,
            color: 'from-blue-600 to-indigo-600'
        },
        {
            name: 'Penjualan Bulan Ini',
            value: data.penjualan_bulanan_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.penjualan_bulanan), parseFloat(data.penjualan_bulan_lalu)),
            isPositive: parseFloat(data.penjualan_bulanan) >= parseFloat(data.penjualan_bulan_lalu),
            compareText: 'vs bln lalu',
            icon: ShoppingCartIcon,
            color: 'from-blue-600 to-indigo-600'
        },
        {
            name: 'Penjualan Bulan Lalu',
            value: data.penjualan_bulan_lalu_rp || 'Rp 0',
            change: '',
            isPositive: true,
            icon: ShoppingCartIcon,
            color: 'from-gray-600 to-gray-700'
        },
        {
            name: 'Penghasilan Hari Ini',
            value: data.penghasilan_harian_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.penghasilan_harian), parseFloat(data.penghasilan_kemarin)),
            isPositive: parseFloat(data.penghasilan_harian) >= parseFloat(data.penghasilan_kemarin),
            compareText: 'vs kemarin',
            icon: CurrencyDollarIcon,
            color: 'from-emerald-500 to-teal-500',
            breakdown: {
                order: data.penghasilan_harian_byOrder,
                debt: data.penghasilan_harian_byDebt
            }
        },
        {
            name: 'Penghasilan Bulan Ini',
            value: data.penghasilan_bulanan_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.penghasilan_bulanan), parseFloat(data.penghasilan_bulan_lalu)),
            isPositive: parseFloat(data.penghasilan_bulanan) >= parseFloat(data.penghasilan_bulan_lalu),
            compareText: 'vs bln lalu',
            icon: CurrencyDollarIcon,
            color: 'from-emerald-500 to-teal-500',
            breakdown: {
                order: data.penghasilan_bulanan_byOrder,
                debt: data.penghasilan_bulanan_byDebt
            }
        },
        {
            name: 'Penghasilan Bulan Lalu',
            value: data.penghasilan_bulan_lalu_rp || 'Rp 0',
            change: '',
            isPositive: true,
            icon: CurrencyDollarIcon,
            color: 'from-gray-600 to-gray-700',
            breakdown: {
                order: data.penghasilan_bulan_lalu_byOrder,
                debt: data.penghasilan_bulan_lalu_byDebt
            }
        },
        {
            name: 'Transaksi Hari Ini',
            value: (data.transaksi_hari_ini || 0).toString(),
            change: calculateChange(data.transaksi_hari_ini, data.transaksi_kemarin),
            isPositive: data.transaksi_hari_ini >= data.transaksi_kemarin,
            compareText: 'vs kemarin',
            icon: ShoppingCartIcon,
            color: 'from-blue-500 to-indigo-500'
        },
        {
            name: 'Pelanggan Hari Ini',
            value: (data.pelanggan_hari_ini || 0).toString(),
            change: calculateChange(data.pelanggan_hari_ini, data.pelanggan_kemarin),
            compareText: 'vs kemarin',
            isPositive: data.pelanggan_hari_ini >= data.pelanggan_kemarin,
            icon: UserGroupIcon,
            color: 'from-purple-500 to-pink-500'
        },
        {
            name: 'Rata-rata Order Hari Ini',
            value: data.rata_rata_order_rp,
            change: '',
            isPositive: true,
            icon: ArrowTrendingUpIcon,
            color: 'from-orange-500 to-red-500'
        },
        {
            name: 'Klik A3',
            value: data.a3 || '0',
            change: calculateChange(parseInt(data.a3 || 0), parseInt(data.a3_bulan_lalu || 0)),
            isPositive: parseInt(data.a3 || 0) >= parseInt(data.a3_bulan_lalu || 0),
            compareText: 'vs bln lalu',
            icon: DocumentTextIcon,
            color: 'from-cyan-500 to-blue-500'
        },
        {
            name: 'Pengeluaran Hari Ini',
            value: data.biaya_harian_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.biaya_harian), yesterdayExpenses),
            isPositive: parseFloat(data.biaya_harian) <= yesterdayExpenses,
            compareText: 'vs kemarin',
            icon: BanknotesIcon,
            color: 'from-red-500 to-orange-500'
        },
        {
            name: 'Pengeluaran Bulan Ini',
            value: data.biaya_bulanan_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.biaya_bulanan), parseFloat(data.biaya_bulan_lalu || 0)),
            isPositive: parseFloat(data.biaya_bulanan) <= parseFloat(data.biaya_bulan_lalu || 0),
            compareText: 'vs bln lalu',
            icon: BanknotesIcon,
            color: 'from-red-500 to-orange-500'
        },
        {
            name: 'Piutang Konsumen (Bln Ini)',
            value: data.piutang_konsumen_bulan_ini_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.piutang_konsumen_bulan_ini), parseFloat(data.piutang_konsumen_bulan_lalu || 0)),
            isPositive: parseFloat(data.piutang_konsumen_bulan_ini) >= parseFloat(data.piutang_konsumen_bulan_lalu || 0),
            compareText: 'vs bln lalu',
            icon: UserGroupIcon,
            color: 'from-amber-500 to-yellow-500'
        },
        {
            name: 'EDC Hari Ini',
            value: data.edc_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.edc), parseFloat(data.edc_kemarin || 0)),
            isPositive: parseFloat(data.edc) >= parseFloat(data.edc_kemarin || 0),
            compareText: 'vs kemarin',
            icon: CreditCardIcon,
            color: 'from-indigo-400 to-blue-400'
        },
        {
            name: 'EDC Berjalan',
            value: data.edc_berjalan_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.edc_berjalan), parseFloat(data.edc_bulan_lalu || 0)),
            isPositive: parseFloat(data.edc_berjalan) >= parseFloat(data.edc_bulan_lalu || 0),
            compareText: 'vs bln lalu',
            icon: CreditCardIcon,
            color: 'from-indigo-400 to-blue-400'
        },
        {
            name: 'Setor Bank Hari Ini',
            value: data.setor_bank_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.setor_bank), parseFloat(data.setor_bank_kemarin || 0)),
            isPositive: parseFloat(data.setor_bank) >= parseFloat(data.setor_bank_kemarin || 0),
            compareText: 'vs kemarin',
            icon: BuildingLibraryIcon,
            color: 'from-emerald-400 to-teal-400'
        },
        {
            name: 'Setor Bank Berjalan',
            value: data.setor_bank_berjalan_rp || 'Rp 0',
            change: calculateChange(parseFloat(data.setor_bank_berjalan), parseFloat(data.setor_bank_bulan_lalu || 0)),
            isPositive: parseFloat(data.setor_bank_berjalan) >= parseFloat(data.setor_bank_bulan_lalu || 0),
            compareText: 'vs bln lalu',
            icon: BuildingLibraryIcon,
            color: 'from-emerald-400 to-teal-400'
        },
    ] : [];

    const salesChartData = {
        labels: data?.trends.map(t => t.tanggal.split('/')[0]) || [],
        datasets: [
            {
                label: 'Penjualan',
                data: data?.trends.map(t => parseFloat(t.penjualan)) || [],
                fill: true,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 2,
            },
            {
                label: 'Penghasilan',
                data: data?.trends.map(t => parseFloat(t.penghasilan)) || [],
                fill: true,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 2,
            },
            {
                label: 'Pengeluaran',
                data: data?.trends.map(t => parseFloat(t.pengeluaran)) || [],
                fill: true,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.05)',
                tension: 0.4,
                pointBackgroundColor: '#f97316',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 2,
            }
        ],
    };

    const topProductsData = {
        labels: data?.kategorinow.slice(0, 5).map(k => k.Kategori) || [],
        datasets: [{
            label: 'Total Kategori',
            data: data?.kategorinow.slice(0, 5).map(k => parseFloat(k.total_kategori)) || [],
            backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(129, 140, 248, 0.8)', 'rgba(165, 180, 252, 0.8)', 'rgba(199, 210, 254, 0.8)', 'rgba(224, 231, 255, 0.8)'],
            borderRadius: 8,
        }],
    };

    const orderStatusData = {
        labels: ['Belum Diproses', 'Sedang Didesain', 'Proses Cetak', 'Selesai Dicetak', 'Sudah Diambil'],
        datasets: [{
            label: 'Total Pesanan',
            data: [
                data?.stats?.belum_diproses || 0,
                data?.stats?.sedang_didesain || 0,
                data?.stats?.proses_cetak || 0,
                data?.stats?.selesai_dicetak || 0,
                data?.stats?.sudah_diambil || 0
            ],
            backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(107, 114, 128, 0.8)'
            ],
            borderRadius: 6,
        }],
    };

    const busyHoursData = {
        labels: data?.trendsHour.map(t => t.tanggal.split('/')[0]) || [],
        datasets: [{
            label: 'Jam Tersibuk',
            data: data?.trendsHour.map(t => t.jam_tersibuk) || [],
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderRadius: 6,
        }],
    };

    const topActiveCustomersData = {
        labels: data?.topCustomers?.byOrder.map(c => c.nama_pemesan) || [],
        datasets: [{
            label: 'Total Order',
            data: data?.topCustomers?.byOrder.map(c => c.total_order) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 6,
        }],
    };

    const topLoyalCustomersData = {
        labels: data?.topCustomers?.bySpending.map(c => c.nama_pemesan) || [],
        datasets: [{
            label: 'Total Spending',
            data: data?.topCustomers?.bySpending.map(c => parseFloat(c.total_spending)) || [],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 6,
        }],
    };

    const topSoldProductsData = {
        labels: data?.topProducts?.map(p => p.Nama_Produk) || [],
        datasets: [{
            label: 'Total Qty',
            data: data?.topProducts?.map(p => parseFloat(p.total_qty)) || [],
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderRadius: 6,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: (v) => {
                        if (v >= 1000000) return 'Rp ' + (v / 1000000).toFixed(1) + 'M';
                        if (v >= 1000) return 'Rp ' + (v / 1000).toFixed(0) + 'K';
                        return 'Rp ' + v;
                    }
                }
            },
        },
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 11 }
                }
            }
        },
    };

    const busyHoursOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const item = data?.trendsHour[context.dataIndex];
                        return item?.keterangan || `Jam ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                min: 0,
                max: 23,
                ticks: { stepSize: 4, callback: (v) => v + ':00' }
            }
        },
    };

    const horizontalBarOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.dataset.label === 'Total Spending') {
                            const val = context.parsed.x;
                            return label + 'Rp ' + val.toLocaleString('id-ID');
                        }
                        return label + context.parsed.x;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: (v) => {
                        if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                        if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
                        return v;
                    }
                }
            },
            y: { grid: { display: false } }
        },
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                <p className="text-[var(--text-secondary)]">Selamat datang! Berikut ringkasan hari ini.</p>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-wrap gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="w-full sm:w-[280px]" />)
                ) : (
                    stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.name} className="card hover:shadow-lg transition-shadow w-full sm:w-[280px]" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm text-[var(--text-secondary)] truncate">{stat.name}</p>
                                        <p className="text-xl font-bold text-[var(--text-primary)] mt-1 truncate">{stat.value}</p>
                                        <div className={`flex items-center gap-1 mt-2 text-[10px] sm:text-xs ${stat.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                                            {stat.change && (
                                                <>
                                                    {stat.isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                                                    <span className="truncate">{stat.change} {stat.compareText}</span>
                                                </>
                                            )}
                                        </div>
                                        {stat.breakdown && (
                                            <div className="mt-2 pt-2 border-t border-gray-100/50 space-y-1">
                                                <div className="flex justify-between text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                                                    <span>Order</span>
                                                    <span className="text-[var(--text-primary)]">{FormatCurrency(stat.breakdown.order || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                                                    <span>Piutang</span>
                                                    <span className="text-[var(--text-primary)]">{FormatCurrency(stat.breakdown.debt || 0)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Horizontal Bar */}
                                        <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
                                                style={{ width: stat.change ? (stat.isPositive ? '75%' : '40%') : '100%' }}
                                            />
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Charts Row 1: Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tren Penjualan Bulan Ini</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Performa transaksi terakhir</p>
                        </div>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Line data={salesChartData} options={chartOptions} />}
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tren Jam Tersibuk Bulan Ini</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Kepadatan transaksi per jam</p>
                        </div>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Bar data={busyHoursData} options={busyHoursOptions} />}
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Categories & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Kategori Populer Bulan Ini</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Berdasarkan total unit</p>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Pie data={topProductsData} options={pieChartOptions} />}
                    </div>
                </div>

                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Status Pesanan Bulan Ini</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Distribusi status order</p>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Bar data={orderStatusData} options={horizontalBarOptions} />}
                    </div>
                </div>
            </div>

            {/* Charts Row 3: Products & Active Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Produk Terlaris Bulan Ini</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Berdasarkan total unit terjual</p>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Bar data={topSoldProductsData} options={horizontalBarOptions} />}
                    </div>
                </div>

                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pelanggan Teraktif Bulan Ini</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Berdasarkan jumlah order</p>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Bar data={topActiveCustomersData} options={horizontalBarOptions} />}
                    </div>
                </div>
            </div>

            {/* Charts Row 4: Loyal Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pelanggan Terloyal Bulan Ini</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Berdasarkan total pengeluaran</p>
                    </div>
                    <div className="h-72">
                        {isLoading ? <Skeleton className="w-full h-full" borderRadius="12px" /> : <Bar data={topLoyalCustomersData} options={horizontalBarOptions} />}
                    </div>
                </div>
            </div>

            {/* Recent Transactions - AT THE BOTTOM */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Transaksi Hari Ini</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Order dan pembayaran terbaru</p>
                    </div>
                    {!isLoading && <Link href={`/transaction`} className="btn btn-secondary text-sm">Lihat Semua</Link>}
                </div>
                {isLoading ? (
                    <SkeletonTable rows={5} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr><th>ID Transaksi</th><th>Pelanggan</th><th>Jumlah</th><th>Status</th><th>Waktu</th><th>Kasir</th></tr>
                            </thead>
                            <tbody>
                                {data?.transaksi_terakhir.map((tx) => (
                                    <tr key={tx.no_transaksi}>
                                        <td className="font-medium text-[var(--text-primary)]">{tx.no_transaksi}</td>
                                        <td>{tx.nama_pemesan}</td>
                                        <td className="font-medium">{tx.grandtotal_rp}</td>
                                        <td>
                                            <span className={`badge ${tx.status_bayar === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                                                {tx.status_bayar}
                                            </span>
                                        </td>
                                        <td className="text-[var(--text-muted)] text-xs">{tx.tgl_transaksi}</td>
                                        <td className="text-[var(--text-muted)] text-xs">{tx.kasir}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
