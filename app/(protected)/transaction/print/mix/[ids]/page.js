'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ArrowPathIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';

export default function MixedTransactionPrintPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { ids } = params;
    const { selectedBranch, branches } = useAuth();
    const currentBranch = selectedBranch || (branches && branches.length > 0 ? branches[0] : null);

    const storeShortName = currentBranch?.storeData?.short_name;
    const storeUniqueId = currentBranch?.uniqueId;

    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [mergedData, setMergedData] = useState(null);
    const [error, setError] = useState(null);

    const fetchAllTransactions = async () => {
        if (!ids || !storeShortName || !storeUniqueId) {
            if (!ids) setError('ID Transaksi tidak ditemukan');
            else if (!storeShortName || !storeUniqueId) setError('Informasi toko tidak ditemukan (Silakan pilih cabang)');
            setIsLoading(false);
            return;
        }
        const idList = decodeURIComponent(ids).split('|');
        setIsLoading(true);
        try {
            const results = await Promise.all(idList.map(async (id) => {
                const res = await fetch(`/api/transactions/get/${id}?shortName=${storeShortName}&uniqueId=${storeUniqueId}`);
                const result = await res.json();
                if (result.success) return result.data;
                throw new Error(`Gagal memuat transaksi ${id}`);
            }));

            const first = results[0];
            const consolidated = {
                transaksi: {
                    ...first.transaksi,
                    No_Transaksi: results.map(r => r.transaksi.No_Transaksi).join(' + '),
                    total_item: results.reduce((sum, r) => sum + parseFloat(r.transaksi.total_item || 0), 0),
                    total_qty: results.reduce((sum, r) => sum + parseFloat(r.transaksi.total_qty || 0), 0),
                    total_sales: results.reduce((sum, r) => sum + parseFloat(r.transaksi.total_sales || 0), 0),
                    net_total_sales: results.reduce((sum, r) => sum + parseFloat(r.transaksi.net_total_sales || 0), 0),
                    total_bayar: results.reduce((sum, r) => sum + parseFloat(r.transaksi.total_bayar || 0), 0),
                    sisa_bayar: results.reduce((sum, r) => sum + parseFloat(r.transaksi.sisa_bayar || 0), 0),
                    total_kembali: results.reduce((sum, r) => sum + parseFloat(r.transaksi.total_kembali || 0), 0),
                    ongkir: results.reduce((sum, r) => sum + parseFloat(r.transaksi.ongkir || 0), 0),
                    potongan: results.reduce((sum, r) => sum + parseFloat(r.transaksi.potongan || 0), 0),
                },
                items: results.flatMap(r => r.items.map(item => ({
                    ...item,
                    No_Transaksi: r.transaksi.No_Transaksi
                }))),
                perusahaan: first.perusahaan,
                Tanggal_Transaksi: first.Tanggal_Transaksi
            };

            setMergedData(consolidated);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadReceipt = async () => {
        const receiptElement = document.querySelector('.receipt');
        if (!receiptElement) return;

        setIsDownloading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const dataUrl = await toPng(receiptElement, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = `Struk-Gabungan.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
            alert('Gagal mendownload struk. Silakan coba lagi.');
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        if (storeShortName && storeUniqueId) {
            fetchAllTransactions();
        }
    }, [ids, storeShortName, storeUniqueId]);

    useEffect(() => {
        if (mergedData) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [mergedData]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val || 0);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-[var(--bg-sidebar)]">
                <ArrowPathIcon className="w-10 h-10 text-[var(--primary)] animate-spin mb-4" />
                <p className="font-medium">Menyiapkan Struk Gabungan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Struk</h1>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-bold"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    const { transaksi, items, Tanggal_Transaksi } = mergedData;
    const storeName = currentBranch?.storeName || mergedData.perusahaan?.storeName;
    const storeData = currentBranch?.storeData || mergedData.perusahaan?.storeData;


    return (
        <div className="print-container">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: 58mm auto; }
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
                body {
                    background: #f3f4f6;
                    font-family: 'Courier New', Courier, monospace;
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                }
                @media print {
                    body { background: white; display: block; padding: 0; }
                }
                .receipt {
                    width: 58mm;
                    background: white;
                    padding: 4mm;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    color: black;
                }
                @media print {
                    .receipt { box-shadow: none; width: 100%; }
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-bold { font-weight: bold; }
                .text-uppercase { text-transform: uppercase; }
                .text-small { font-size: 7pt; }
                .text-normal { font-size: 8pt; }
                .text-large { font-size: 9pt; }
                hr { border: none; border-top: 1px dashed black; margin: 2mm 0; }
                .logo-container { width: 100%; margin-bottom: 2mm; text-align: center; }
                .logo-container svg { width: 100%; height: auto; max-height: 40px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 0.5mm; gap: 2mm; }
                .info-label { width: 35%; flex-shrink: 0; }
                .info-value { width: 65%; text-align: right; word-break: break-all; }
                .item-container { margin-bottom: 2mm; }
                .item-row { display: flex; justify-content: space-between; }
                .qr-container { margin-top: 5mm; display: flex; flex-direction: column; align-items: center; gap: 1mm; }
                .qr-image { width: 25mm; height: 25mm; }
            `}</style>

            <div className="receipt">
                <div className="head-container">
                    <div className="logo-container" dangerouslySetInnerHTML={{ __html: storeData?.logo_svg }} />
                    <div className="text-center text-uppercase text-large text-bold">{storeName}</div>
                    <div className="text-center text-small">{storeData?.address}</div>
                    <div className="text-center text-small">WA : <span className="text-bold">{storeData?.phone_number}</span></div>
                </div>

                <hr />

                <div className="metadata">
                    <div className="text-normal info-row">
                        <span className="info-label">Invoice</span>
                        <span className="info-value text-bold">: {transaksi.No_Transaksi}</span>
                    </div>
                    <div className="text-normal info-row">
                        <span className="info-label">Tgl Cetak</span>
                        <span className="info-value text-bold">: {new Date().toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-normal info-row">
                        <span className="info-label">Pelanggan</span>
                        <span className="info-value text-bold">: {transaksi.nama_pemesan}</span>
                    </div>
                </div>

                <hr />

                <div className="items">
                    {items && items.map((item, idx) => (
                        <div key={idx} className="item-container text-normal">
                            <div className="text-bold">
                                {idx + 1}. {item.No_Transaksi && `[${item.No_Transaksi}] `}{item.Nama_Produk}
                            </div>
                            {(parseFloat(item.p) > 0 || parseFloat(item.l) > 0) && (
                                <div className="text-small">
                                    Ukuran: {parseFloat(item.p)}x{parseFloat(item.l)} {item.satuan}
                                </div>
                            )}
                            <div className="item-row">
                                <span>{item.Qty} x {formatCurrency(item.sales)}</span>
                                <span className="text-bold">{formatCurrency(item.subtotal_sales)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <hr />

                <div className="totals text-normal">
                    <div className="info-row">
                        <span>Total Qty</span>
                        <span>{parseFloat(transaksi.total_qty)}</span>
                    </div>
                    <hr />
                    <div className="info-row">
                        <span>SUBTOTAL</span>
                        <span>{formatCurrency(transaksi.total_sales)}</span>
                    </div>
                    {parseFloat(transaksi.potongan) > 0 && (
                        <div className="info-row">
                            <span>DISKON</span>
                            <span>({formatCurrency(transaksi.potongan)})</span>
                        </div>
                    )}
                    <div className="info-row text-bold text-large">
                        <span>GRANDTOTAL</span>
                        <span>{formatCurrency(transaksi.net_total_sales)}</span>
                    </div>
                    <div className="info-row">
                        <span>TOTAL BAYAR</span>
                        <span>{formatCurrency(transaksi.total_bayar)}</span>
                    </div>
                    <div className="info-row">
                        <span>SISA</span>
                        <span>{formatCurrency(transaksi.sisa_bayar)}</span>
                    </div>
                </div>

                <hr />

                <div className="footer text-small text-center">
                    <div>Terima Kasih Atas Kunjungan Anda</div>
                    <div className="text-bold">STRUK GABUNGAN</div>
                </div>
            </div>

            <div className="no-print fixed bottom-10 right-10 flex flex-col gap-4">
                <button
                    onClick={downloadReceipt}
                    disabled={isDownloading}
                    className="p-4 bg-emerald-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:scale-100"
                    title="Download Gambar"
                >
                    {isDownloading ? (
                        <ArrowPathIcon className="w-6 h-6 animate-spin" />
                    ) : (
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    )}
                </button>
                <button
                    onClick={() => window.print()}
                    className="p-4 bg-[var(--primary)] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                    title="Cetak Struk"
                >
                    <PrinterIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
