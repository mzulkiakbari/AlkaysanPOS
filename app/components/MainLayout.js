'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {/* Sidebar with mobile toggle */}
            <div className="no-print">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0 lg:ml-64'}`}>
                {/* Top Navbar */}
                <div className="no-print">
                    <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                </div>

                {/* Page Content */}
                <main className="p-4 md:p-6 main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
