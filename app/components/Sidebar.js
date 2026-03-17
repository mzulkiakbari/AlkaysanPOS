'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  CubeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  GiftIcon,
  TicketIcon,
  FireIcon,
  UserGroupIcon,
  CalculatorIcon,
  UserPlusIcon,
  PrinterIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

const menuSections = [
  {
    id: 'utama',
    title: 'Utama',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Transaksi', href: '/transaction', icon: ShoppingCartIcon },
      { name: 'Kas', href: '/cash', icon: BanknotesIcon },
    ]
  },
  {
    id: 'produk',
    title: 'Produk & Inventori',
    items: [
      { name: 'Daftar Produk', href: '/products', icon: CubeIcon },
      { name: 'Kategori', href: '/products/categories', icon: TagIcon },
      // { name: 'Stok Masuk/Keluar', href: '/products/stock', icon: ArrowsRightLeftIcon },
      // { name: 'Notif Stok', href: '/products/alerts', icon: ExclamationTriangleIcon },
    ]
  },
  {
    id: 'crm',
    title: 'Pelanggan & CRM',
    items: [
      { name: 'Pelanggan', href: '/crm/customers', icon: UsersIcon },
      { name: 'Hutang Piutang', href: '/crm/debt-loan', icon: CurrencyDollarIcon }
    ]
  },
  {
    id: 'laporan',
    title: 'Laporan & Analitik',
    items: [
      { name: 'Laporan Penjualan', href: '/reports/sales', icon: ChartBarIcon },
      { name: 'Arus Kas', href: '/reports/cash-flow', icon: BanknotesIcon },
      { name: 'Keuangan', href: '/reports/finance', icon: CalculatorIcon },
      // { name: 'Laba Rugi', href: '/reports/profit-loss', icon: CurrencyDollarIcon },
      { name: 'Audit Logs', href: '/reports/audit-logs', icon: ListBulletIcon, roles: ['isSuperAdmin'] },
    ]
  },
  {
    id: 'pengaturan',
    title: 'Pengaturan',
    items: [
      { name: 'Konfigurasi', href: '/settings/configuration', icon: Cog6ToothIcon },
    ]
  }
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState({});

  const canAccessSettings = user?.isAdmin || user?.isSuperAdmin;

  // Auto-expand sections that have active items
  useEffect(() => {
    const initialOpenState = {};
    menuSections.forEach(section => {
      const hasActiveItem = section.items.some(item =>
        pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href + '/'))
      );
      if (hasActiveItem) {
        initialOpenState[section.id] = true;
      }
    });
    setOpenSections(prev => ({ ...prev, ...initialOpenState }));
  }, [pathname]);

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-[var(--bg-sidebar)] text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <h1 className="text-lg font-bold text-gray-800">Alkaysan POS</h1>
              <p className="text-xs text-[var(--text-muted)]">Point of Sale</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuSections.map((section) => {
            if (section.id === 'pengaturan' && !canAccessSettings) return null;

            const isOpen = openSections[section.id];

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header / Dropdown Toggle */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] hover:text-[var(--primary)] uppercase tracking-[0.2em] transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Content */}
                <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {section.items.map((item) => {
                    // Item-level role check
                    if (item.roles && !item.roles.some(role => user?.[role])) return null;

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                        ${isActive
                            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-lg shadow-[var(--primary)]/30'
                            : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-sidebar-hover)] hover:text-white'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white'}`} />
                        <span className="text-sm font-medium">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 rounded-xl bg-[var(--bg-sidebar-hover)]">
            <p className="text-xs text-white">Version</p>
            <p className="text-sm font-medium text-white">2.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
