'use client';

import { useState } from 'react';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
    Cog6ToothIcon, UsersIcon, BuildingStorefrontIcon, BellIcon,
    PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const users = [
    { id: 1, name: 'John Admin', email: 'john@pos.com', role: 'High Admin', status: 'active' },
    { id: 2, name: 'Jane Manager', email: 'jane@pos.com', role: 'Admin', status: 'active' },
    { id: 3, name: 'Bob Cashier', email: 'bob@pos.com', role: 'Cashier', status: 'active' },
    { id: 4, name: 'Alice CS', email: 'alice@pos.com', role: 'CS', status: 'inactive' },
];

const branches = [
    { id: 1, name: 'Jakarta Pusat', address: 'Jl. Sudirman No. 1', status: 'active' },
    { id: 2, name: 'Jakarta Selatan', address: 'Jl. Gatot Subroto No. 10', status: 'active' },
    { id: 3, name: 'Bandung', address: 'Jl. Asia Afrika No. 5', status: 'active' },
];

const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'branches', name: 'Branches', icon: BuildingStorefrontIcon },
];

export default function ConfigurationPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        if (!authLoading && user && !user.isAdmin && !user.isSuperAdmin) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) return null;
    if (!user.isAdmin && !user.isSuperAdmin) return null;

    const roleColors = {
        'High Admin': 'badge-danger',
        'Admin': 'badge-warning',
        'Cashier': 'badge-info',
        'CS': 'badge-success',
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pengaturan Sistem</h1>
                    <p className="text-[var(--text-secondary)]">Manajemen hak akses dan operasional</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[var(--border)]">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)]'
                                    }`}>
                                <Icon className="w-5 h-5" />{tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Store Settings</h3>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium mb-2">Store Name</label><input className="input" defaultValue="Alkaysan POS Store" /></div>
                                <div><label className="block text-sm font-medium mb-2">Currency</label><select className="input"><option>IDR - Indonesian Rupiah</option><option>USD - US Dollar</option></select></div>
                                <div><label className="block text-sm font-medium mb-2">Tax Rate (%)</label><input type="number" className="input" defaultValue="11" /></div>
                            </div>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><BellIcon className="w-5 h-5" />Notifications</h3>
                            <div className="space-y-4">
                                {['Email notifications', 'Low stock alerts', 'Daily sales report'].map((item, i) => (
                                    <label key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)]">
                                        <span>{item}</span>
                                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-[var(--primary)]" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="card">
                        <div className="flex justify-between mb-6">
                            <div><h3 className="font-semibold">User Management</h3><p className="text-sm text-[var(--text-secondary)]">Manage user roles</p></div>
                            <button onClick={() => setShowUserModal(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5" />Add User</button>
                        </div>
                        <table className="table">
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="font-medium">{u.name}</td>
                                        <td>{u.email}</td>
                                        <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                                        <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{u.status}</span></td>
                                        <td><button className="p-2"><PencilIcon className="w-4 h-4" /></button><button className="p-2"><TrashIcon className="w-4 h-4 text-[var(--danger)]" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Branches Tab */}
                {activeTab === 'branches' && (
                    <div className="card">
                        <div className="flex justify-between mb-6">
                            <div><h3 className="font-semibold">Branch Management</h3><p className="text-sm text-[var(--text-secondary)]">Manage store branches</p></div>
                            <button className="btn btn-primary"><PlusIcon className="w-5 h-5" />Add Branch</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {branches.map(b => (
                                <div key={b.id} className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center"><BuildingStorefrontIcon className="w-5 h-5 text-[var(--primary)]" /></div>
                                        <div><p className="font-medium">{b.name}</p><p className="text-xs text-[var(--text-muted)]">{b.address}</p></div>
                                    </div>
                                    <span className="badge badge-success">{b.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md animate-fade-in">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center"><ShieldCheckIcon className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold">Add User</h2></div>
                            <button onClick={() => setShowUserModal(false)}><XMarkIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium mb-2">Name</label><input className="input" /></div>
                            <div><label className="block text-sm font-medium mb-2">Email</label><input type="email" className="input" /></div>
                            <div><label className="block text-sm font-medium mb-2">Role</label><select className="input"><option>High Admin</option><option>Admin</option><option>Cashier</option><option>CS</option></select></div>
                            <div><label className="block text-sm font-medium mb-2">Password</label><input type="password" className="input" /></div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3"><button onClick={() => setShowUserModal(false)} className="btn btn-secondary">Cancel</button><button className="btn btn-primary">Add User</button></div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
