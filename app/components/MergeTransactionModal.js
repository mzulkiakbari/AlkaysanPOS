'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import { FetchData } from '../hooks/useFetchData';

export default function MergeTransactionModal({ isOpen, onClose, currentBranch, initialTx }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialTx) {
            setSelectedTransactions([initialTx]);
            setSearch(initialTx.nama_pemesan || '');
        } else if (!isOpen) {
            setSelectedTransactions([]);
            setSearch('');
        }
    }, [isOpen, initialTx]);

    useEffect(() => {
        if (isOpen && currentBranch) {
            fetchTransactions();
        }
    }, [isOpen, search, currentBranch]);

    const fetchTransactions = async () => {
        if (!search) return; // Strictly only search when name is available
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: 1,
                paginate: 15,
                v: search
            });

            const result = await FetchData({
                method: 'GET',
                uri: `/api/transactions/search?${params.toString()}`
            });

            if (result && result.success) {
                const dataObj = result.results?.data || result.data || result.results;
                const txData = dataObj?.data || (Array.isArray(dataObj) ? dataObj : []);
                setResults(txData);
            }
        } catch (error) {
            console.error('Error fetching transactions for merge:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addTransaction = (tx) => {
        if (!selectedTransactions.find(t => t.No_Transaksi === tx.No_Transaksi)) {
            setSelectedTransactions([...selectedTransactions, tx]);
        }
    };

    const removeTransaction = (noTx) => {
        // Don't allow removing the initial transaction if you want to keep it as core
        // User didn't specify, but usually you want to allow changing everything.
        // However, if we remove the initial one, it becomes a "fresh" merge.
        setSelectedTransactions(selectedTransactions.filter(t => t.No_Transaksi !== noTx));
    };

    const handlePrint = () => {
        if (selectedTransactions.length === 0) return;
        const ids = selectedTransactions.map(t => t.No_Transaksi).join('|');
        window.open(`/transaction/print/mix/${ids}`, '_blank');
        onClose();
    };

    // Filter results to exclude initial, already selected, and mismatching customer details
    const filteredResults = results.filter(tx => {
        const isNotInitial = tx.No_Transaksi !== initialTx?.No_Transaksi;
        const isNotSelected = !selectedTransactions.find(s => s.No_Transaksi === tx.No_Transaksi);

        // Customer Identity Matches
        const sameName = (tx.nama_pemesan || '') === (initialTx?.nama_pemesan || '');
        const samePhone = (tx.telepon_pemesan || '') === (initialTx?.telepon_pemesan || '');
        const sameAddress = (tx.alamat_pemesan || '') === (initialTx?.alamat_pemesan || '');
        const sameMemberType = (tx.membership || tx.tipe_member_pemesan || '') === (initialTx?.membership || initialTx?.tipe_member_pemesan || '');

        return isNotInitial && isNotSelected && sameName && samePhone && sameAddress && sameMemberType;
    });

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title={`Gabungkan Struk (${initialTx?.No_Transaksi || ''} - ${initialTx?.nama_pemesan || ''})`}
            mode="modal"
        >
            <div className="space-y-6">
                {/* Information Header */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mb-1">Pencarian Otomatis</p>
                            <h4 className="text-sm font-black text-gray-900 leading-tight">Mencari transaksi lain untuk "{initialTx?.nama_pemesan}"</h4>
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-main)]">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white border-b border-[var(--border)] z-10">
                                <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    <th className="px-4 py-3">Invoice</th>
                                    <th className="px-4 py-3">Pemesan</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Memuat data...</td>
                                    </tr>
                                ) : filteredResults.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                                            {search ? 'Tidak ada transaksi lain ditemukan untuk pelanggan ini' : 'Memulai pencarian...'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResults.map((tx) => (
                                        <tr key={tx.No_Transaksi} className="hover:bg-white transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-bold text-[var(--text-primary)]">{tx.No_Transaksi}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">{tx.Tanggal_Transaksi}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{tx.nama_pemesan || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addTransaction(tx);
                                                    }}
                                                    disabled={selectedTransactions.find(t => t.No_Transaksi === tx.No_Transaksi)}
                                                    className="p-2 rounded-lg bg-[var(--primary)] text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Selected List */}
                {selectedTransactions.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Transaksi Terpilih ({selectedTransactions.length})</h3>
                            <button
                                onClick={() => setSelectedTransactions([])}
                                className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                            >
                                Bersihkan
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedTransactions.map((tx) => (
                                <div key={tx.No_Transaksi} className="flex items-center gap-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3 py-1.5 rounded-full animate-fade-in group">
                                    <span className="text-xs font-bold text-[var(--primary)]">{tx.No_Transaksi}</span>
                                    <button
                                        onClick={() => removeTransaction(tx.No_Transaksi)}
                                        className="text-[var(--primary)] hover:text-red-500 transition-colors"
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Action */}
                <div className="pt-6">
                    <button
                        onClick={handlePrint}
                        disabled={selectedTransactions.length === 0}
                        className="w-full h-14 bg-[var(--primary)] text-white font-black rounded-2xl shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        <PrinterIcon className="w-6 h-6" />
                        <span>Cetak Gabungan</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
