'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { ArrowPathIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';

export default function TransactionPrintPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const searchParams = useSearchParams();
    const { id } = params;
    const { selectedBranch, branches } = useAuth();
    
    // Extract from URL if not logged in
    const urlShortName = searchParams.get('shortName');
    const urlUniqueId = searchParams.get('uniqueId');

    const currentBranch = selectedBranch || (branches && branches.length > 0 ? branches[0] : null);
    
    // Determine store info (prefer AuthContext, fallback to URL)
    const storeShortName = currentBranch?.storeData?.short_name || urlShortName;
    const storeUniqueId = currentBranch?.uniqueId || urlUniqueId;

    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchTransactionDetail = async () => {
        if (!id || !storeShortName || !storeUniqueId) {
            if (!id) setError('ID Transaksi tidak ditemukan');
            else if (!storeShortName || !storeUniqueId) setError('Informasi toko tidak lengkap di URL');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/transactions/get/${id}?shortName=${storeShortName}&uniqueId=${storeUniqueId}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.message || 'Gagal memuat detail transaksi');
            }
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
            // Give a small delay to ensure all elements are rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(receiptElement, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2, // Higher quality
            });

            const link = document.createElement('a');
            link.download = `Struk-${data.transaksi.No_Transaksi}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
            alert('Gagal mendownload struk. Silakan coba lagi.');
        } finally {
            setIsDownloading(false);
        }
    };
    // ... existing effects and helpers ...
    useEffect(() => {
        fetchTransactionDetail();
    }, [id, storeShortName, storeUniqueId]);

    useEffect(() => {
        if (data) {
            // Wait for images (logo/qr) to load before printing
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [data]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val || 0);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <ArrowPathIcon className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Menyiapkan Struk...</p>
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
                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    const { transaksi, items, Tanggal_Transaksi } = data;
    const storeName = currentBranch?.storeName || data.perusahaan?.storeName;
    const storeData = currentBranch?.storeData || data.perusahaan?.storeData;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`;

    return (
        <div className="print-container">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 58mm auto; /* Standard thermal printer width */
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                body {
                    background: #f3f4f6;
                    font-family: 'Courier New', Courier, monospace;
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                }
                @media print {
                    body {
                        background: white;
                        display: block;
                        padding: 0;
                    }
                }
                .receipt {
                    width: 58mm;
                    background: white;
                    padding: 4mm;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    color: black;
                }
                @media print {
                    .receipt {
                        box-shadow: none;
                        width: 100%;
                    }
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-bold { font-weight: bold; }
                .text-uppercase { text-transform: uppercase; }
                .text-small { font-size: 7pt; }
                .text-normal { font-size: 8pt; }
                .text-large { font-size: 9pt; }
                
                hr {
                    border: none;
                    border-top: 1px dashed black;
                    margin: 2mm 0;
                }
                .logo-container {
                    width: 100%;
                    margin-bottom: 2mm;
                }
                .logo-container svg {
                    width: 100%;
                    height: auto;
                    max-height: 40px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5mm;
                }
                .info-label { width: 35%; flex-shrink: 0; }
                .info-value { width: 65%; text-align: right; }
                
                .item-container {
                    margin-bottom: 2mm;
                }
                .item-row {
                    display: flex;
                    justify-content: space-between;
                }
                .qr-container {
                    margin-top: 5mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1mm;
                }
                .qr-image {
                    width: 25mm;
                    height: 25mm;
                }
            `}</style>

            <div className="receipt">
                <div className="head-container">
                    <div className="logo-container" dangerouslySetInnerHTML={{ __html: storeData?.logo_svg }} />
                    <div className="text-center text-uppercase text-large text-bold">{storeName}</div>
                    <div className="text-center text-small">{storeData?.address}</div>
                    <div className="text-center text-small">WA : <span className="text-bold">{storeData?.phone_number}</span></div>
                    <div className="text-center text-small">{storeData?.email}</div>
                </div>

                <hr />

                <div className="metadata">
                    <div className="text-normal info-row">
                        <span className="info-label">Invoice</span>
                        <span className="info-value text-bold">: {transaksi.No_Transaksi}</span>
                    </div>
                    <div className="text-normal info-row">
                        <span className="info-label">Tgl Order</span>
                        <span className="info-value">: {Tanggal_Transaksi || formatDateTime(transaksi.Tanggal_Transaksi)}</span>
                    </div>
                    <div className="text-normal info-row">
                        <span className="info-label">Pelanggan</span>
                        <span className="info-value text-bold">: {transaksi.nama_pemesan}</span>
                    </div>
                    <div className="text-normal info-row">
                        <span className="info-label">HP/WA</span>
                        <span className="info-value">: {transaksi.telepon_pemesan || '-'}</span>
                    </div>
                    <div className="text-normal info-row">
                        <span className="info-label">Nama CS</span>
                        <span className="info-value">: {transaksi.nama_cs || '-'}</span>
                    </div>
                </div>

                <hr />

                <div className="items">
                    {items && items.map((item, idx) => (
                        <div key={idx} className="item-container text-normal">
                            <div className="text-bold">
                                {idx + 1}. {item.Nama_Produk}
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
                            {item.keterangan && (
                                <div className="text-small italic">Ket: {item.keterangan}</div>
                            )}
                        </div>
                    ))}
                </div>

                <hr />

                <div className="totals text-normal">
                    <div className="info-row">
                        <span>Total Item/Qty</span>
                        <span>{parseFloat(transaksi.total_item)} / {parseFloat(transaksi.total_qty)}</span>
                    </div>
                    <hr />
                    <div className="info-row">
                        <span>SUBTOTAL</span>
                        <span>{formatCurrency(transaksi.total_sales)}</span>
                    </div>
                    {parseFloat(transaksi.ongkir) > 0 && (
                        <div className="info-row">
                            <span>ONGKIR</span>
                            <span>{formatCurrency(transaksi.ongkir)}</span>
                        </div>
                    )}
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
                    {parseFloat(transaksi.total_kembali) > 0 && (
                        <div className="info-row">
                            <span>KEMBALIAN</span>
                            <span>{formatCurrency(transaksi.total_kembali)}</span>
                        </div>
                    )}
                    <div className="info-row text-bold uppercase">
                        <span>STATUS BAYAR</span>
                        <span>{transaksi.Status_Bayar}</span>
                    </div>
                </div>

                <hr />

                <div className="footer text-small">
                    <div className="info-row">
                        <span>Kasir</span>
                        <span>: {transaksi.nama_kasir}</span>
                    </div>
                    <div className="info-row">
                        <span>Tgl Bayar</span>
                        <span>: {transaksi.waktu_bayar || '-'}</span>
                    </div>
                </div>

                <hr />

                <div className="footer-info text-center text-small">
                    <div dangerouslySetInnerHTML={{ __html: storeData?.note }} />
                </div>

                <div className="qr-container">
                    <img src={qrCodeUrl} alt="QR Code" className="qr-image" />
                    <span className="text-small text-bold text-uppercase">Scan untuk e-Invoice</span>
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
                    className="p-4 bg-primary text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                    title="Cetak Struk"
                >
                    <PrinterIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
