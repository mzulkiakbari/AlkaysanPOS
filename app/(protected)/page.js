'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import DashboardContent from '../components/DashboardContent';
import LoginContent from '../components/LoginContent';
import BranchSelector from '../components/BranchSelector';
import MainLayout from '../components/MainLayout';

export default function Home() {
    const { user, isLoading: isAuthLoading, hasBranch } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Handle post-unauthorized redirect
        if (!isAuthLoading && user) {
            const redirectPath = localStorage.getItem('auth_redirect');
            if (redirectPath && redirectPath !== '/') {
                localStorage.removeItem('auth_redirect');
                router.replace(redirectPath);
            }
        }
    }, [isAuthLoading, user, router]);

    // Show processing state if context is loading
    if (isAuthLoading) {
        return <LoginContent withBranding isLoadingOverride={true} />;
    }

    if (!user) {
        return <LoginContent withBranding />;
    }

    if (!hasBranch) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[var(--bg-sidebar)] via-[var(--primary-dark)] to-[var(--primary)]">
                <BranchSelector />
            </div>
        );
    }

    return (
        <MainLayout>
            <DashboardContent />
        </MainLayout>
    );
}


