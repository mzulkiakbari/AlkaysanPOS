'use client';

import { useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Toast({ show, message, type = 'success', onClose }) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-in">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md ${type === 'success'
                    ? 'bg-emerald-500/90 text-white shadow-emerald-200/50'
                    : 'bg-red-500/90 text-white shadow-red-200/50'
                }`}>
                {type === 'success' ? (
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-white" />
                    </div>
                ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                        <XMarkIcon className="w-5 h-5 text-white" />
                    </div>
                )}
                <span className="font-bold tracking-tight">{message}</span>
            </div>

            <style jsx global>{`
                @keyframes bounce-in {
                    0% { transform: translate(-50%, 100%); opacity: 0; }
                    60% { transform: translate(-50%, -10%); opacity: 1; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
}
