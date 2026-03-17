'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function CategoryModal({ isOpen, onClose, category, onSave }) {
    const [formData, setFormData] = useState({
        Kategori: ''
    });

    useEffect(() => {
        if (category) {
            setFormData({
                Kategori: category.Kategori || ''
            });
        } else {
            setFormData({
                Kategori: ''
            });
        }
    }, [category, isOpen]);

    const handleChange = (e) => {
        setFormData({ Kategori: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title={category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            mode="modal"
            width="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nama Kategori</label>
                    <input
                        type="text"
                        value={formData.Kategori}
                        onChange={handleChange}
                        placeholder="Contoh: Banner, Printing, dll"
                        className="input h-12"
                        required
                        autoFocus
                    />
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
                        Simpan Kategori
                    </button>
                </div>
            </form>
        </Modal>
    );
}
