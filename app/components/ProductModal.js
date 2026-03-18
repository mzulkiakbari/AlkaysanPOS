'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
    PlusIcon,
    TrashIcon,
    TagIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import CategorySelectionModal from './CategorySelectionModal';
import { useAuth } from '../context/AuthContext';
import { GenerateProductCode } from '../hooks/useHelpers';

export default function ProductModal({ isOpen, onClose, product, onSave, categories = [] }) {
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        Nama_Produk: '',
        Kode_Produk: '',
        Kategori: '',
        Satuan: '',
        dijual: 1,
        isdimensi: 0,
        isopen: 0,
        click: 0,
        harga_beli: 0,
        modifiedBy: [user?.nama_depan_karyawan, user?.nama_belakang_karyawan].join(' '),
        prices: [{ jenis_harga: 'UMUM', harga: 0, min_order: 1 }]
    });

    const [units, setUnits] = useState([]);
    const [priceLabels, setPriceLabels] = useState([]);
    const [isAutoCode, setIsAutoCode] = useState(true);
    const [showCategorySelector, setShowCategorySelector] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMetadata();
        }
    }, [isOpen]);

    const fetchMetadata = async () => {
        if (!isOpen) return;
        try {
            // Get current branch from localStorage if not available from context (safeguard)
            let branchInfo = null;
            try {
                const branchRaw = localStorage.getItem('pos_branch');
                if (branchRaw) branchInfo = JSON.parse(branchRaw);
            } catch (e) { }

            const shortName = branchInfo?.storeData?.short_name || '';
            const uniqueId = branchInfo?.uniqueId || '';

            if (!shortName || !uniqueId) return;

            const params = new URLSearchParams({ shortName, uniqueId }).toString();

            const [unitsRes, membersRes] = await Promise.all([
                fetch(`/api/units?${params}`).then(res => res.json()),
                fetch(`/api/members?${params}`).then(res => res.json())
            ]);

            if (unitsRes.success) setUnits(unitsRes.data || []);
            if (membersRes.success) {
                const labels = membersRes.data?.map(m => m.membership) || [];
                // Ensure 'UMUM' is unique and first if not present
                const uniqueLabels = [...new Set(['UMUM', ...labels])];
                setPriceLabels(uniqueLabels);
            } else {
                setPriceLabels(['UMUM']);
            }
        } catch (error) {
            console.error('Error fetching metadata:', error);
            setPriceLabels(['UMUM']);
        }
    };

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                dijual: parseInt(product.dijual),
                isdimensi: parseInt(product.isdimensi || 0),
                isopen: parseInt(product.isopen || 0),
                click: parseInt(product.click || 0),
                harga_beli: Number(product.harga_beli || product.hpp || 0),
                modifiedBy: [user?.nama_depan_karyawan, user?.nama_belakang_karyawan].join(' '),
                prices: product.prices?.map(p => ({ ...p, min_order: p.min_order || 1 })) || [{ jenis_harga: 'UMUM', harga: 0, min_order: 1 }]
            });
            setIsAutoCode(false);
        } else {
            setFormData({
                Nama_Produk: '',
                Kode_Produk: '',
                Kategori: '',
                Satuan: '',
                dijual: 1,
                isdimensi: 0,
                isopen: 0,
                click: 0,
                harga_beli: 0,
                modifiedBy: [user?.nama_depan_karyawan, user?.nama_belakang_karyawan].join(' '),
                prices: [{ jenis_harga: 'UMUM', harga: 0, min_order: 1 }]
            });
            setIsAutoCode(true);
        }
    }, [product, isOpen]);

    const handleNameChange = (e) => {
        const name = e.target.value;
        const updates = { Nama_Produk: name };
        if (isAutoCode && !product) {
            updates.Kode_Produk = GenerateProductCode(name);
        }
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handlePriceChange = (index, field, value) => {
        const newPrices = [...formData.prices];
        newPrices[index][field] = value;
        setFormData(prev => ({ ...prev, prices: newPrices }));
    };

    const addPriceLevel = (e) => {
        e.stopPropagation();
        setFormData(prev => ({
            ...prev,
            prices: [...prev.prices, { jenis_harga: '', harga: 0, min_order: 1 }]
        }));
    };

    const removePriceLevel = (e, index) => {
        e.stopPropagation();
        const newPrices = formData.prices.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, prices: newPrices }));
    };

    const isDuplicatePrice = (price, index) => {
        return formData.prices.some((p, i) =>
            i !== index &&
            p.jenis_harga === price.jenis_harga &&
            parseFloat(p.harga) === parseFloat(price.harga) &&
            parseInt(p.min_order) === parseInt(price.min_order) &&
            p.jenis_harga !== ''
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Final check for duplicates before save
        const hasDuplicates = formData.prices.some((p, i) => isDuplicatePrice(p, i));
        if (hasDuplicates) {
            alert('Terdapat duplikasi level harga (Label, Minimal Order, dan Harga sama). Mohon perbaiki sebelum menyimpan.');
            return;
        }

        onSave(formData);
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title={product ? 'Edit Produk' : 'Tambah Produk Baru'}
            mode="modal"
            width="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nama Produk</label>
                            <input
                                type="text"
                                name="Nama_Produk"
                                value={formData.Nama_Produk}
                                onChange={handleNameChange}
                                placeholder="Contoh: Banner Spanduk"
                                className="input"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kode Produk</label>
                                    {!product && (
                                        <button
                                            type="button"
                                            onClick={() => setIsAutoCode(!isAutoCode)}
                                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isAutoCode ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            {isAutoCode ? 'Otomatis' : 'Manual'}
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="Kode_Produk"
                                    value={formData.Kode_Produk}
                                    onChange={handleChange}
                                    readOnly={isAutoCode && !product}
                                    placeholder="SKU-001"
                                    className={`input ${isAutoCode && !product ? 'bg-gray-50' : ''}`}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Satuan</label>
                                <select
                                    name="Satuan"
                                    value={formData.Satuan}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="">Pilih</option>
                                    {units.map((u, i) => (
                                        <option key={i} value={u.Satuan}>{u.Satuan}</option>
                                    ))}
                                    {!units.length && <option value="pcs">pcs</option>}
                                    {!units.length && <option value="meter">meter</option>}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Kategori</label>
                            <button
                                type="button"
                                onClick={() => setShowCategorySelector(true)}
                                className="flex items-center justify-between w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-[var(--primary)] transition-all group/cat"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover/cat:bg-[var(--primary)] group-hover/cat:text-white transition-colors">
                                        <TagIcon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-bold ${formData.Kategori ? 'text-gray-900' : 'text-gray-400 font-medium'}`}>
                                        {formData.Kategori || 'Pilih Kategori'}
                                    </span>
                                </div>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover/cat:text-[var(--primary)] transition-colors" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 pt-2">
                            {/* Harga Beli (HPP) */}
                            <div className="space-y-1.5 col-span-2 mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Harga Beli (HPP)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</div>
                                    <input
                                        type="number"
                                        name="harga_beli"
                                        value={formData.harga_beli || ''}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="input !pl-10 no-spinner font-bold"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="dijual"
                                    checked={formData.dijual === 1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dijual: e.target.checked ? 1 : 0 }))}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Aktif / Dijual</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="isdimensi"
                                    checked={formData.isdimensi === 1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isdimensi: e.target.checked ? 1 : 0 }))}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Produk Dimensi</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="isopen"
                                    checked={formData.isopen === 1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isopen: e.target.checked ? 1 : 0 }))}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Bisa Nego?</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="click"
                                    checked={formData.click === 1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, click: e.target.checked ? 1 : 0 }))}
                                    className="w-5 h-5 rounded-lg border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                                />
                                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Produk A3?</span>
                            </label>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Image */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Level Harga</label>
                            <button
                                type="button"
                                onClick={addPriceLevel}
                                className="text-[10px] font-bold text-[var(--primary)] uppercase flex items-center gap-1 hover:text-[var(--primary-dark)]"
                            >
                                <PlusIcon className="w-3 h-3" />
                                Tambah Level
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {formData.prices.map((price, idx) => {
                                const isDup = isDuplicatePrice(price, idx);
                                return (
                                    <div key={idx} className={`flex items-end gap-2 p-3 rounded-2xl border transition-all relative group/price ${isDup ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex-[1.2] space-y-1.5 min-w-0">
                                            <label className="text-[9px] font-black text-gray-400 uppercase leading-none">Label</label>
                                            <select
                                                value={price.jenis_harga}
                                                onChange={(e) => handlePriceChange(idx, 'jenis_harga', e.target.value)}
                                                className={`input !h-9 !text-[11px] !py-0 !px-2 ${isDup ? '!border-red-300' : ''}`}
                                                required
                                            >
                                                <option value="">Pilih Label</option>
                                                {priceLabels.map(label => (
                                                    <option key={label} value={label}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-[0.8] space-y-1.5 min-w-0">
                                            <label className="text-[9px] font-black text-gray-400 uppercase leading-none">Min. Order</label>
                                            <input
                                                type="number"
                                                value={price.min_order}
                                                min="1"
                                                onChange={(e) => handlePriceChange(idx, 'min_order', e.target.value)}
                                                placeholder="1"
                                                className={`input !h-9 !text-[11px] font-bold no-spinner !px-2 ${isDup ? '!border-red-300' : ''}`}
                                                required
                                            />
                                        </div>
                                        <div className="flex-[1.2] space-y-1.5 min-w-0">
                                            <label className="text-[9px] font-black text-gray-400 uppercase leading-none">Harga (IDR)</label>
                                            <input
                                                type="number"
                                                value={price.harga}
                                                onChange={(e) => handlePriceChange(idx, 'harga', e.target.value)}
                                                placeholder="0"
                                                className={`input !h-9 !text-[11px] font-bold no-spinner !px-2 ${isDup ? '!border-red-300' : ''}`}
                                                required
                                            />
                                        </div>
                                        <div className="flex-none pb-0.5">
                                            {idx > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => removePriceLevel(e, idx)}
                                                    className="p-2 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        {isDup && (
                                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                                                DUPLIKAT
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 px-8 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="h-12 px-8 rounded-2xl bg-[var(--primary)] text-white font-bold shadow-xl shadow-[var(--primary)]/20 hover:bg-[var(--primary-dark)] transition-all active:scale-95"
                    >
                        Simpan Produk
                    </button>
                </div>
            </form>

            {/* Category Selection Modal */}
            <CategorySelectionModal
                isOpen={showCategorySelector}
                onClose={() => setShowCategorySelector(false)}
                onSelect={(val) => setFormData(prev => ({ ...prev, Kategori: val }))}
                currentCategory={formData.Kategori}
                apiCategories={categories}
            />
        </Modal>
    );
}
