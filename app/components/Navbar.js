'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BuildingStorefrontIcon,
    ChevronDownIcon,
    PlusIcon,
    BellIcon,
    UserCircleIcon,
    ArrowRightEndOnRectangleIcon,
    Cog6ToothIcon,
    ArrowPathIcon,
    Bars3Icon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick }) {
    const { user, selectedBranch, branches, switchBranch, logout, fetchBranches } = useAuth();
    const router = useRouter();
    const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (branches.length === 0) {
            fetchBranches();
        }
    }, [branches.length, fetchBranches]);

    const handleRefreshBranches = async () => {
        setIsRefreshing(true);
        await fetchBranches();
        setIsRefreshing(false);
    };

    if (!user) return null;

    const currentBranch = selectedBranch || branches[0];
    if (!currentBranch) return null;
    const displayUser = {
        ...user,
        name: user.nama_depan_karyawan
    };


    const filteredBranches = branches.filter(b => {
        const isActive = b.isActive === 1;

        // Only show branches that are present in user.authorizedBranches
        const isAuthorized = user?.authorizedBranches?.some(ab =>
            ab.uniqueId === b.uniqueId ||
            ab.id === b.uniqueId ||
            ab.id === b.id ||
            ab.uniqueId === b.id
        );
        return isActive && isAuthorized;
    });

    return (
        <header className="h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* Left Section - Hamburger & Branch Switcher */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-lg hover:bg-[var(--bg-main)] lg:hidden transition-colors"
                >
                    <Bars3Icon className="w-6 h-6 text-[var(--text-secondary)]" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-[var(--bg-main)] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{currentBranch.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{currentBranch.address}</p>
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Branch Dropdown */}
                    {branchDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden animate-fade-in">
                            <div className="p-3 border-b border-[var(--border)] flex justify-between items-center">
                                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Switch Branch</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRefreshBranches();
                                    }}
                                    className={`p-1 hover:bg-[var(--bg-main)] rounded-lg transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                                    title="Refresh Branches"
                                >
                                    <ArrowPathIcon className="w-3 h-3 text-[var(--text-muted)]" />
                                </button>
                            </div>
                            <div className="p-2">
                                {filteredBranches.map((branch) => (
                                    <button
                                        key={branch.id}
                                        onClick={() => {
                                            switchBranch(branch);
                                            setBranchDropdownOpen(false);
                                            router.push('/');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-left
                    ${branch.id === currentBranch.id ? 'bg-[var(--primary)]/5' : ''}`}
                                    >
                                        <BuildingStorefrontIcon className={`w-5 h-5 ${branch.id === currentBranch.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                                        <div>
                                            <p className={`text-sm font-medium ${branch.id === currentBranch.id ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                                                {branch.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{branch.address}</p>
                                        </div>
                                        {branch.id === currentBranch.id && (
                                            <div className="ml-auto w-2 h-2 rounded-full bg-[var(--primary)]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Add Transaction Button */}
                <Link href="/transaction/add" className="btn btn-primary px-3 md:px-5">
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Transaksi</span>
                </Link>

                {/* Add Cash Button */}
                <Link href="/cash/add" className="btn btn-secondary px-3 md:px-5">
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Kas</span>
                </Link>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-[var(--bg-main)] transition-colors">
                    <BellIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--danger)]" />
                </button>

                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-main)] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{displayUser.name}</span>
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{displayUser.name}</p>
                        </div>

                        <ChevronDownIcon className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User Dropdown */}
                    {userDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden animate-fade-in">
                            <div className="p-4 border-b border-[var(--border)]">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{displayUser.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">{displayUser.role}</p>
                            </div>

                            <div className="p-2">
                                <Link href="https://accounts.alkaysan.co.id" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-left">
                                    <UserCircleIcon className="w-5 h-5 text-[var(--text-muted)]" />
                                    <span className="text-sm text-[var(--text-primary)]">Profile</span>
                                </Link>
                            </div>
                            <div className="p-2 border-t border-[var(--border)]">
                                <Link
                                    href="/logout"
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left"
                                >
                                    <ArrowRightEndOnRectangleIcon className="w-5 h-5 text-[var(--danger)]" />
                                    <span className="text-sm text-[var(--danger)]">Keluar</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close dropdowns */}
            {(branchDropdownOpen || userDropdownOpen) && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => { setBranchDropdownOpen(false); setUserDropdownOpen(false); }}
                />
            )}
        </header>
    );
}
