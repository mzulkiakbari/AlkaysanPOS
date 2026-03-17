'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
    MagnifyingGlassIcon,
    ArrowDownCircleIcon,
    ArrowUpCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function StockFormModal({ isOpen, onClose, onSave, products = [] }) {
    const [formData, setFormData] = useState({
        product_id: '',
        type: 'in',
        qty: 1,
        keterangan: ''
    });
    const [searchProduct, setSearchProduct] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductList, setShowProductList] = useState(false);

    useEffect(() => {
        if (searchProduct) {
            const filtered = products.filter(p =>
                p.Nama_Produk?.toLowerCase().includes(searchProduct.toLowerCase()) ||
                p.Kode_Produk?.toLowerCase().includes(searchProduct.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [searchProduct, products]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const selectProduct = (p) => {
        setFormData(prev => ({ ...prev, product_id: p.id }));
        setSearchProduct(p.Nama_Produk);
        setShowProductList(false);
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title="Catat Stok Masuk/Keluar"
            mode="modal"
            width="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Pilih Produk</label>
                    <div className="relative group">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari nama atau kode produk..."
                            value={searchProduct}
                            onChange={(e) => { setSearchProduct(e.target.value); setShowProductList(true); }}
                            onFocus={() => setShowProductList(true)}
                            className="input !pl-10 h-12"
                            required
                        />
                    </div>
                    {showProductList && filteredProducts.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProduct(p)}
                                    className="w-full text-left p-3 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-none"
                                >
                                    <span className="text-sm font-bold text-gray-800">{p.Nama_Produk}</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase">{p.Kode_Produk} | Stok: {p.Stok || 0}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jenis</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: 'in' }))}
                                className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${formData.type === 'in'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                                    : 'border-gray-200 text-gray-400 hover:border-emerald-200'}`}
                            >
                                <ArrowDownCircleIcon className="w-5 h-5" />
                                In
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: 'out' }))}
                                className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${formData.type === 'out'
                                    ? 'bg-red-50 border-red-500 text-red-600'
                                    : 'border-gray-200 text-gray-400 hover:border-red-200'}`}
                            >
                                <ArrowUpCircleIcon className="w-5 h-5" />
                                Out
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jumlah (Qty)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.qty}
                            onChange={(e) => setFormData(prev => ({ ...prev, qty: parseInt(e.target.value) }))}
                            className="input h-12 font-bold"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Keterangan</label>
                    <textarea
                        value={formData.keterangan}
                        onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                        placeholder="Alasan penyesuaian stok..."
                        className="input min-h-[100px] py-3 resize-none"
                    ></textarea>
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
                        className={`h-12 px-8 rounded-2xl text-white font-bold shadow-xl transition-all active:scale-95 ${formData.type === 'in'
                            ? 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600'
                            : 'bg-red-500 shadow-red-200 hover:bg-red-600'}`}
                    >
                        Simpan Stok
                    </button>
                </div>
            </form>
        </Modal>
    );
}
