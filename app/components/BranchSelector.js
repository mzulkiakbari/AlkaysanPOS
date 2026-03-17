'use client';

import { useEffect, useState } from 'react';
import {
    BuildingStorefrontIcon,
    MapPinIcon,
    ChartBarIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import FetchErrorState from './FetchErrorState';
import { useAuth } from '../context/AuthContext';

export default function BranchSelector() {
    const { branches, selectBranch, user, logout, fetchBranches } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState(null);

    const loadBranches = async () => {
        if (branches.length === 0) {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchBranches();
                if (!res || res.length === 0) throw new Error('Gagal memuat daftar cabang.');
            } catch (err) {
                setError('Gagal menghubungkan ke server.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadBranches();
    }, [branches.length, fetchBranches]);

    if (error && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <FetchErrorState
                    title="Gagal Memuat Cabang"
                    message={error}
                    onRetry={loadBranches}
                    className="bg-white rounded-2xl shadow-xl max-w-md w-full"
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-medium">Memuat data cabang...</p>
                </div>
            </div>
        );
    }

    // Check if user has a position assigned
    if (user && !user.position) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-600 to-red-800">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center transform animate-fade-in">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Posisi Akun Belum Diisi</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Anda belum mengisi posisi di akun, mohon isikan dulu. <br />
                        <span className="font-semibold">Silahkan hubungi Admin.</span>
                    </p>
                    <button
                        onClick={logout}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                        Keluar & Coba Akun Lain
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 pt-8">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <ChartBarIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Alkaysan POS</h1>
                            <p className="text-white/60 text-xs">Point of Sale</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-3">Pilih Cabang</h2>
                    <p className="text-white/70 text-lg">Silakan pilih cabang untuk mulai bekerja hari ini</p>
                </div>

                {/* Branch Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {branches.filter(b => {
                        const isActive = b.isActive === 1;

                        // Only show branches that are present in user.authorizedBranches
                        const isAuthorized = user?.authorizedBranches?.some(ab =>
                            ab.uniqueId === b.uniqueId ||
                            ab.id === b.uniqueId ||
                            ab.id === b.id ||
                            ab.uniqueId === b.id
                        );
                        return isActive && isAuthorized;
                    }).map((branch, index) => (
                        <button
                            key={branch.id}
                            onClick={() => branch.isActive && selectBranch(branch)}
                            disabled={!branch.isActive}
                            className={`group text-left bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transition-all duration-300 animate-fade-in
                                ${branch.isActive
                                    ? 'hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl'
                                    : 'opacity-50 cursor-not-allowed grayscale'}`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                                    {branch.logo_svg ? (
                                        <div
                                            className="w-full h-full p-2 flex items-center justify-center"
                                            dangerouslySetInnerHTML={{
                                                __html: branch.logo_svg.replace('fill="#000000"', 'fill="currentColor"').replace('fill="#000"', 'fill="currentColor"')
                                            }}
                                            style={{ color: 'white' }}
                                        />
                                    ) : branch.logo ? (
                                        <div
                                            className="w-full h-full p-2 flex items-center justify-center"
                                            dangerouslySetInnerHTML={{ __html: branch.logo }}
                                        />
                                    ) : (
                                        <BuildingStorefrontIcon className="w-7 h-7 text-white" />
                                    )}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    {branch.isActive ? (
                                        <ArrowRightIcon className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                    ) : (
                                        <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-white">{branch.name}</h3>
                                {!branch.isActive && (
                                    <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 font-bold uppercase">Inactive</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-white/60 mb-4">
                                <MapPinIcon className="w-4 h-4 shrink-0" />
                                <span className="text-sm line-clamp-1">{branch.address || branch.city}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-white/50 text-xs mb-1">Status</p>
                                    <p className="text-white font-semibold">{branch.isActive ? 'Online' : 'Offline'}</p>
                                </div>
                                <div>
                                    <p className="text-white/50 text-xs mb-1">Role</p>
                                    <p className="text-white font-semibold">{user?.position?.positionName || 'Guest'}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                    <p className="text-white/50 text-sm">
                        Masuk sebagai <span className="text-white font-medium">{[user?.nama_depan_karyawan, user?.nama_belakang_karyawan].join(' ')}</span> •
                        <button
                            onClick={logout}
                            className="text-white/70 hover:text-white ml-1 underline"
                        >
                            Keluar
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
