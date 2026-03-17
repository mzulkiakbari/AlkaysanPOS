'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function CustomerModal({ isOpen, onClose, customer, onSave }) {
    const [formData, setFormData] = useState({
        nama_pemesan: '',
        telp_pemesan: '',
        alamat_pemesan: '',
        membership: 'UMUM'
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                nama_pemesan: customer.nama_pemesan || '',
                telp_pemesan: customer.telp_pemesan || '',
                alamat_pemesan: customer.alamat_pemesan || '',
                membership: customer.membership || 'UMUM'
            });
        }
    }, [customer, isOpen]);

    const [membershipOptions, setMembershipOptions] = useState(['UMUM']);

    useEffect(() => {
        if (isOpen) {
            fetchMetadata();
        }
    }, [isOpen]);

    const fetchMetadata = async () => {
        try {
            let branchInfo = null;
            try {
                const branchRaw = localStorage.getItem('pos_branch');
                if (branchRaw) branchInfo = JSON.parse(branchRaw);
            } catch (e) { }

            const shortName = branchInfo?.storeData?.short_name || '';
            const uniqueId = branchInfo?.uniqueId || '';

            if (!shortName || !uniqueId) return;

            const params = new URLSearchParams({ shortName, uniqueId }).toString();
            const res = await fetch(`/api/members?${params}`).then(res => res.json());

            if (res.success) {
                const labels = res.data?.map(m => m.membership) || [];
                const uniqueLabels = [...new Set(['UMUM', ...labels])];
                setMembershipOptions(uniqueLabels);
            }
        } catch (error) {
            console.error('Error fetching membership labels:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title="Edit Data Pelanggan"
            mode="modal"
            width="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nama Pelanggan</label>
                        <input
                            type="text"
                            name="nama_pemesan"
                            value={formData.nama_pemesan}
                            onChange={handleChange}
                            className="input h-12"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nomor WhatsApp</label>
                        <input
                            type="text"
                            name="telp_pemesan"
                            value={formData.telp_pemesan}
                            onChange={handleChange}
                            placeholder="08xxxxxxxxxx"
                            className="input h-12"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Jenis Member</label>
                        <select
                            name="membership"
                            value={formData.membership}
                            onChange={handleChange}
                            className="input h-12 font-bold"
                        >
                            {membershipOptions.map((label) => (
                                <option key={label} value={label}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Alamat</label>
                        <textarea
                            name="alamat_pemesan"
                            value={formData.alamat_pemesan}
                            onChange={handleChange}
                            placeholder="Alamat lengkap..."
                            className="input min-h-[100px] py-3 resize-none"
                        ></textarea>
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
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </Modal>
    );
}
