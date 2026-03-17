'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { isAuthenticated } from '../hooks/useHelpers';
import { AlkaysanLogin } from '@noonor/alkaysan-one';

export default function LoginContent({ withBranding = false, isLoadingOverride = false }) {
    const router = useRouter();
    const { loginWithSSO } = useAuth();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(isLoadingOverride);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        setIsLoading(isLoadingOverride);
    }, [isLoadingOverride]);

    useEffect(() => {
        // Detect if running inside Electron
        const isRunningInElectron = typeof window !== 'undefined' &&
            window.process &&
            window.process.type === 'renderer';
        setIsElectron(isRunningInElectron);

        if (isRunningInElectron) {
            const { ipcRenderer } = window.require('electron');

            const handleDeepLink = async (event, url) => {
                console.log('Received deep link in renderer:', url);
                setIsLoading(true);

                try {
                    const urlObj = new URL(url);
                    let code = urlObj.searchParams.get('code');

                    if (code) {
                        const codeVerifier = localStorage.getItem('sso_code_verifier');

                        // Use the new callback route that handles PKCE and multiple secrets
                        const res = await fetch('/api/auth/callback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                code,
                                redirect_uri: 'alkaysan-pos://callback',
                                code_verifier: codeVerifier
                            })
                        });
                        const data = await res.json();
                        if (data.success) {
                            loginWithSSO(data.profile);
                            router.push('/');
                        } else {
                            setError(data.message || 'Gagal autentikasi via SSO.');
                        }
                    }
                } catch (err) {
                    console.error('Deep link processing error:', err);
                    setError('Terjadi kesalahan saat memproses login.');
                } finally {
                    setIsLoading(false);
                    localStorage.removeItem('sso_code_verifier');
                }
            };

            ipcRenderer.on('deep-link-callback', handleDeepLink);
            return () => ipcRenderer.removeListener('deep-link-callback', handleDeepLink);
        }
    }, [loginWithSSO, router]);

    const generatePKCE = async () => {
        // RFC-7636: code_verifier must be 43–128 chars, using [A-Z a-z 0-9 - . _ ~]
        const array = new Uint8Array(32); // 32 bytes → 43 chars after Base64URL
        window.crypto.getRandomValues(array);

        // Base64URL-encode to get a valid verifier string
        const verifier = btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        localStorage.setItem('sso_code_verifier', verifier);

        // SHA-256 hash the verifier, then Base64URL-encode to get the challenge
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const challenge = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return challenge;
    };

    const handleExternalLogin = async () => {
        // Differentiate variables based on platform
        const isApp = process.env.NEXT_PUBLIC_PLATFORM === 'electron' || isElectron;

        const clientId = isApp
            ? (process.env.NEXT_PUBLIC_APP_CLIENT_ID || '15')
            : (process.env.NEXT_PUBLIC_CLIENT_ID || '14');

        const redirectUri = isApp
            ? (process.env.NEXT_PUBLIC_APP_REDIRECT_URI || 'alkaysan-pos://callback')
            : (process.env.NEXT_PUBLIC_REDIRECT_URI || 'https://demo.kasir.alkaysan.co.id/auth/callback');

        const codeChallenge = await generatePKCE();

        const authorizeUrl = `https://account.alkaysan.co.id/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=*&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        if (isElectron) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('open-sso-external', authorizeUrl);
            setIsLoading(true);
        } else {
            // Web fallback
            window.location.href = authorizeUrl;
        }
    };



    const handleLoginError = (error) => {
        console.error('Login Error:', error);
        setError('Gagal login. Silakan coba lagi.');
        setIsLoading(false);
    };

    const handleLoginSuccess = async (response) => {
        // With mode="redirect", this might not be called on the same page,
        // but we'll keep it for completeness if needed.
        setIsLoading(true);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            {withBranding && (
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--bg-sidebar)] via-[var(--primary-dark)] to-[var(--primary)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-center p-16 text-white">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ChartBarIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Alkaysan Cashier</h1>
                                <p className="text-white/70">Point of Sale System</p>
                            </div>
                        </div>

                        <h2 className="text-5xl font-bold mb-6 leading-tight">
                            Kelola bisnis Anda <br />
                            <span className="text-white/80">lebih cerdas dengan AI</span>
                        </h2>

                        <p className="text-lg text-white/70 max-w-md">
                            Sistem kasir modern dengan kecerdasan buatan.
                            Lacak penjualan, kelola inventaris, dan kembangkan bisnis Anda.
                        </p>

                        <div className="mt-12 grid grid-cols-2 gap-4">
                            {[
                                { title: 'Multi-Cabang', desc: 'Kelola banyak toko' },
                                { title: 'AI Powered', desc: 'Rekomendasi pintar' },
                                { title: 'Real-time', desc: 'Pantau penjualan langsung' },
                                { title: 'Laporan', desc: 'Analisis detail' },
                            ].map((feature, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-white/60">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Right Side if with branding, center if without branding - Login Form */}
            <div className={`w-full ${withBranding ? 'lg:w-1/2 ' : ''}flex items-center justify-center p-8 bg-[var(--bg-main)]`}>
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    {withBranding && (
                        <div className="lg:hidden flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                                <ChartBarIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[var(--text-primary)]">Alkaysan Cashier</h1>
                                <p className="text-xs text-[var(--text-muted)]">Point of Sale</p>
                            </div>
                        </div>
                    )}

                    <div className={`${withBranding ? 'card' : ''}`}>
                        {withBranding && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Selamat Datang</h2>
                                <p className="text-[var(--text-secondary)] mt-1">Masuk dengan akun Alkaysan Anda</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-[var(--text-secondary)]">Memproses masuk...</p>
                            </div>
                        ) : isElectron ? (
                            <button
                                onClick={handleExternalLogin}
                                className="btn btn-primary w-full h-14 rounded-full font-bold flex items-center justify-center gap-2"
                            >
                                <img src="https://account.alkaysan.co.id/favicon.ico" alt="Alkaysan" className="w-6 h-6 rounded-full" />
                                Masuk dengan Alkaysan
                            </button>
                        ) : (
                            <AlkaysanLogin
                                theme="filled_light"
                                shape="pill"
                                size="large"
                                type="button"
                                mode="redirect"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
