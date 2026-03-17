'use client';

import BranchSelector from '../../components/BranchSelector';

export default function SelectBranchPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--bg-sidebar)] via-[var(--primary-dark)] to-[var(--primary)]">
            <BranchSelector />
        </div>
    );
}
