'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { MagnifyingGlassIcon, PlusIcon, TagIcon, CheckIcon } from '@heroicons/react/24/outline';
import CategoryModal from './CategoryModal';

export default function CategorySelectionModal({ isOpen, onClose, onSelect, currentCategory, apiCategories = [] }) {
    const [search, setSearch] = useState('');
    const [allCategories, setAllCategories] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadCategories = () => {
        // Sync API categories with localStorage temp categories
        let tempCats = [];
        try {
            const raw = localStorage.getItem('pos_temp_categories');
            if (raw) tempCats = JSON.parse(raw);
        } catch (e) { }

        // Combine and unique
        const combined = [...apiCategories];
        tempCats.forEach(tc => {
            const exists = combined.find(c => (c.Kategori || c) === tc.Kategori);
            if (!exists) combined.push(tc);
        });

        setAllCategories(combined);
    };

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            setSearch('');
        }
    }, [isOpen, apiCategories]);

    const handleAddCategory = (data) => {
        try {
            const raw = localStorage.getItem('pos_temp_categories');
            let tempCats = raw ? JSON.parse(raw) : [];

            // Check if already exists in temp or API
            const exists = allCategories.find(c => (c.Kategori || c) === data.Kategori);
            if (!exists) {
                const newCat = { id: `temp-${Date.now()}`, Kategori: data.Kategori, is_temp: true };
                tempCats.push(newCat);
                localStorage.setItem('pos_temp_categories', JSON.stringify(tempCats));
                loadCategories();
            }
            setShowAddModal(false);
        } catch (e) {
            console.error('Error adding temp category:', e);
        }
    };

    const filtered = allCategories.filter(cat => {
        const name = (cat.Kategori || cat || '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    return (
        <>
            <Modal
                show={isOpen}
                onClose={onClose}
                title="Pilih Kategori Produk"
                mode="modal"
                width="max-w-xl"
            >
                <div className="space-y-4">
                    {/* Search & Add */}
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input !pl-12 h-12"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary h-12 px-4 rounded-xl shrink-0"
                            title="Tambah Kategori Baru"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="table">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-3 text-left">Nama Kategori</th>
                                    <th className="px-6 py-3 text-right w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-12 text-center text-gray-400">
                                            {search ? 'Kategori tidak ditemukan.' : 'Belum ada kategori.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((cat, idx) => {
                                        const catName = cat.Kategori || cat;
                                        const isSelected = currentCategory === catName;
                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.is_temp ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                            <TagIcon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-700">{catName}</div>
                                                            {cat.is_temp && <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Baru (Belum Simpan)</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isSelected ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-600 font-bold text-xs">
                                                            <CheckIcon className="w-3.5 h-3.5" />
                                                            Terpilih
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => { onSelect(catName); onClose(); }}
                                                            className="btn btn-secondary !h-9 !px-4 !rounded-xl text-xs"
                                                        >
                                                            Pilih
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* Sub-Modal Add Category */}
            <CategoryModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddCategory}
            />
        </>
    );
}
