'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FetchData } from '../hooks/useFetchData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [credential, setCredential] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const logoutLocal = useCallback(() => {
        setUser(null);
        setSelectedBranch(null);
        setBranches([]);
        localStorage.removeItem('pos_user');
        router.push('/');
    }, [router]);

    const loginWithSSO = useCallback((profile) => {
        if (!profile) return;

        const userData = {
            ...profile,
            id: profile.uniqueId,
            name: profile.name || profile.fullname,
            email: profile.email,
            role: profile.isAdmin ? 'Admin' : 'Cashier',
            isAdmin: profile.isAdmin === 1 || profile.isAdmin === true,
            isSuperAdmin: profile.isSuperAdmin === 1 || profile.isSuperAdmin === true,
            avatar: profile.avatar,
            pin_access: profile.pin_access,
            authorizedBranches: profile.branches || [],
        };

        setUser(userData);
        localStorage.setItem('pos_user', JSON.stringify(userData));
        return { success: true };
    }, []);

    const fetchBranches = useCallback(async () => {
        try {
            const result = await FetchData({
                method: 'GET',
                uri: '/api/stores/branches'
            });

            if (result && result.ok && result.results?.data) {
                const mappedBranches = result.results.data
                    .filter(store => store.isActive === 1)
                    .map(store => ({
                        ...store,
                        id: store.uniqueId,
                        name: store.storeName,
                        address: store.storeData?.address || '',
                        city: store.storeData?.city || '',
                        logo: store.storeData?.logo || '',
                        logo_svg: store.storeData?.logo_svg || '',
                    }));
                setBranches(mappedBranches);
                localStorage.setItem('pos_branches', JSON.stringify(mappedBranches));
                return mappedBranches;
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
        return [];
    }, []);

    const fetchProfile = useCallback(async () => {
        // Jika offline, gunakan data dari localStorage saja
        if (!navigator.onLine) {
            console.warn('[AuthContext] Offline mode: skipping profile fetch, using cached data.');
            const storedUser = localStorage.getItem('pos_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                return parsed;
            }
            return null;
        }

        try {
            const res = await fetch('/api/user/profile', { cache: 'no-store' });
            if (res.status === 401) {
                const fullPath = window.location.pathname + window.location.search;
                logoutLocal();
                // Save redirect path after logoutLocal clears localStorage
                localStorage.setItem('auth_redirect', fullPath);
                return null;
            }

            if (res.ok) {
                const profile = await res.json();
                const { faceId, ...profileData } = profile;

                const userData = {
                    ...profileData,
                    isSuperAdmin: profileData.isSuperAdmin === 1 || profileData.isSuperAdmin === true,
                    authorizedBranches: profileData.branches || [],
                };
                setUser(userData);
                localStorage.setItem('pos_user', JSON.stringify(userData));
                return userData;
            }
        } catch (error) {
            // Jika fetch error (misal timeout saat offline terdeteksi terlambat),
            // fallback ke localStorage agar app tetap bisa berjalan
            console.error('Failed to fetch session profile:', error);
            const storedUser = localStorage.getItem('pos_user');
            if (storedUser) {
                console.warn('[AuthContext] Using cached user data due to fetch error.');
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                return parsed;
            }
        }
        return null;
    }, [logoutLocal]);


    const logout = useCallback(() => {
        const callbackUrl = `${window.location.origin}/callback/logout`;
        const logoutUrl = `https://account.alkaysan.co.id/oauth/logout?callback=${encodeURIComponent(callbackUrl)}`;
        window.location.href = logoutUrl;
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('pos_user');
            const storedBranch = localStorage.getItem('pos_branch');
            const storedBranches = localStorage.getItem('pos_branches');

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            // Always fetch fresh profile to sync with SSO
            // This runs in background and updates state + localStorage if successful
            await fetchProfile();

            if (storedBranch) {
                setSelectedBranch(JSON.parse(storedBranch));
            }

            if (storedBranches) {
                const parsedBranches = JSON.parse(storedBranches);
                const filteredBranches = parsedBranches.filter(b => b.isActive === 1);
                setBranches(filteredBranches);
            }
            setIsLoading(false);
        };

        initializeAuth();

        const handleUnauthorized = () => {
            console.warn('Unauthorized access detected, logging out...');
            const fullPath = window.location.pathname + window.location.search;
            logoutLocal();
            // Save redirect path after logoutLocal clears localStorage
            localStorage.setItem('auth_redirect', fullPath);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [fetchProfile, logoutLocal]);

    const selectBranch = useCallback((branch) => {
        setSelectedBranch(branch);
        localStorage.setItem('pos_branch', JSON.stringify(branch));
        router.push('/');
    }, [router]);

    const switchBranch = useCallback((branch) => {
        setSelectedBranch(branch);
        localStorage.setItem('pos_branch', JSON.stringify(branch));
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            credential,
            selectedBranch,
            branches,
            isLoading,
            isAuthenticated: !!user,
            hasBranch: !!selectedBranch,
            loginWithSSO,
            logout,
            logoutLocal,
            selectBranch,
            switchBranch,
            fetchProfile,
            fetchBranches,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

