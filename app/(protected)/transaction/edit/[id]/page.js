'use client';

import { useState, useEffect, use } from 'react';
import MainLayout from '../../../../components/MainLayout';
import TransactionForm from '../../../../components/TransactionForm';
import { useAuth } from '../../../../context/AuthContext';
import { SkeletonTable } from '../../../../components/Skeleton';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EditTransactionPage({ params }) {
    const { id } = use(params);
    const { selectedBranch, branches } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [transaction, setTransaction] = useState(null);
    const [error, setError] = useState(null);

    const currentBranch = selectedBranch || branches[0];

    useEffect(() => {
        if (currentBranch && id) {
            fetchTransaction();
        }
    }, [currentBranch, id]);

    const fetchTransaction = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/transactions/get/${id}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`);
            const result = await res.json();

            if (result.success) {
                setTransaction(result.data);
            } else {
                throw new Error(result.message || 'Gagal mengambil data transaksi');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/transaction"
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Edit Transaksi</h1>
                        <p className="text-gray-500 font-medium">{id}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl">
                        <div className="space-y-4">
                            <div className="h-8 w-1/3 bg-gray-100 animate-pulse rounded-lg"></div>
                            <SkeletonTable rows={5} cols={4} />
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center">
                        <p className="text-red-600 font-bold mb-4">{error}</p>
                        <button onClick={fetchTransaction} className="btn btn-primary px-8">Coba Lagi</button>
                    </div>
                ) : (
                    <TransactionForm initialData={transaction} />
                )}
            </div>
        </MainLayout>
    );
}
