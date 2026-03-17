'use client';

export default function TransactionLayout({ children, modal }) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}
