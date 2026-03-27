'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
    XMarkIcon, UserIcon, PhoneIcon, MapPinIcon, IdentificationIcon,
    MagnifyingGlassIcon, ShoppingBagIcon, PlusIcon, TrashIcon,
    ChevronLeftIcon, ChevronRightIcon, LockClosedIcon, LockOpenIcon,
    TableCellsIcon, ListBulletIcon, DocumentTextIcon, CheckIcon,
    PrinterIcon, BanknotesIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import FetchErrorState from './FetchErrorState';
import PaymentModal from './PaymentModal';
import Toast from './Toast';
import { RoundUp } from '../hooks/useHelpers';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { db } from '../../lib/db';
import { sqlite } from '../../lib/sqlite-client';

export default function TransactionForm({ onClose, onStepChange, initialData = null }) {
    const router = useRouter();
    const { selectedBranch, branches, user } = useAuth();
    const currentBranch = selectedBranch || branches[0];
    const isPaid = initialData?.transaksi?.Status_Bayar === 'Lunas';
    const isOnline = useNetworkStatus();

    // Admins can edit products even if initialData exists. Others cannot.
    const isReadOnlyProducts = (isPaid && (!!initialData && user?.accessProduct !== 1));

    // --- PAYMENT MODAL STATES ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [lastTransactionNo, setLastTransactionNo] = useState(null);

    // --- TOAST STATE ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    // --- STEP MANAGEMENT ---
    const [step, setStep] = useState(1); // 1: Customer, 2: Product Select, 3: Item Config
    useEffect(() => {
        if (onStepChange) onStepChange(step);
    }, [step, onStepChange]);

    const [editingIndex, setEditingIndex] = useState(null);

    // --- FORM STATES ---
    const [customerData, setCustomerData] = useState({
        nama_pemesan: initialData?.transaksi?.nama_pemesan || '',
        alamat_pemesan: initialData?.transaksi?.alamat_pemesan || '',
        telepon_pemesan: initialData?.transaksi?.telepon_pemesan || '',
        membership: initialData?.transaksi?.membership || 'UMUM',
    });
    const [errors, setErrors] = useState({});

    // --- CUSTOMER AUTO-SUGGEST ---
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const suggestionRef = useRef(null);

    // --- PRODUCT STATES ---
    const [products, setProducts] = useState([]);
    const [productPagination, setProductPagination] = useState({ current_page: 1, last_page: 1 });
    const [productSearch, setProductSearch] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // --- ITEM CONFIG STATE ---
    const [itemConfig, setItemConfig] = useState({
        p: '',
        l: '',
        qty: 1,
        harga: 0,
        keterangan: '',
        isPriceLocked: true
    });

    // --- CART STATE ---
    const [cart, setCart] = useState(() => {
        if (initialData?.items) {
            return initialData.items.map(item => {
                const p = Number(item.p ?? item.panjang) || 0;
                const l = Number(item.l ?? item.lebar) || 0;
                const qty = Number(item.Qty ?? item.qty) || 0;
                const isDimensi = item.isdimensi === 1;
                const cost = Number(item.cost ?? item.hpp ?? item.harga_beli ?? item.hpp_sales) || 0;
                return {
                    ...item,
                    p,
                    l,
                    qty,
                    cost, // Normalize to 'cost'
                    harga: Number(item.sales ?? item.harga_satuan ?? item.harga) || 0,
                    total_price: Number(item.subtotal_sales ?? item.subtotal) || 0,
                    display_qty: isDimensi ? `${p.toFixed(2)} x ${l.toFixed(2)} (${qty})` : `${qty}`,
                    Satuan: item.satuan ?? item.Satuan, // Normalize casing
                };
            });
        }
        return [];
    });

    // --- SHIPPING & DISCOUNT LOGIC ---
    const [ongkir, setOngkir] = useState(Number(initialData?.transaksi?.ongkir) || 0);
    const [diskonType, setDiskonType] = useState('nominal');
    const [diskonValue, setDiskonValue] = useState(Number(initialData?.transaksi?.potongan) || 0);

    // --- BIAYA LAIN STATE ---
    const [biayaLain, setBiayaLain] = useState(() => {
        const raw = initialData?.transaksi?.biaya_lain || initialData?.transaksi?.biaya_lain_data || [];
        if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch (e) { return []; }
        }
        return Array.isArray(raw) ? raw : [];
    });
    const [newBiaya, setNewBiaya] = useState({ keterangan: '', nominal: '' });
    const [isAddingBiaya, setIsAddingBiaya] = useState(false);

    const handleAddBiayaLain = () => {
        if (!newBiaya.keterangan || !newBiaya.nominal) return;
        setBiayaLain(prev => [...prev, { keterangan: newBiaya.keterangan, nominal: Number(newBiaya.nominal) }]);
        setNewBiaya({ keterangan: '', nominal: '' });
        setIsAddingBiaya(false);
    };

    const handleRemoveBiayaLain = (index) => {
        setBiayaLain(prev => prev.filter((_, i) => i !== index));
    };

    // --- TOTALS CALCULATION ---
    const cartSummary = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.total_price || 0), 0);
        const totalQty = cart.reduce((acc, item) => acc + Number(item.qty || 0), 0);
        const totalItems = cart.length;

        let diskonNominal = 0;
        if (diskonType === 'persen') {
            diskonNominal = (subtotal * diskonValue) / 100;
        } else {
            diskonNominal = Number(diskonValue) || 0;
        }

        const grandTotal = subtotal + Number(ongkir || 0) - diskonNominal + biayaLain.reduce((acc, b) => acc + (Number(b.nominal) || 0), 0);

        return { subtotal, totalQty, totalItems, grandTotal, diskonNominal };
    }, [cart, ongkir, diskonValue, diskonType, biayaLain]);

    // --- INITIALIZATION & DRAFT PERSISTENCE ---
    const draftKey = useMemo(() => {
        return `transaction_draft_${currentBranch?.id || 'default'}`;
    }, [currentBranch]);

    // Load Draft on Mount
    useEffect(() => {
        if (initialData) return;
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);

                if (parsed.customer) setCustomerData(prev => ({ ...prev, ...parsed.customer }));
                if (parsed.cart) setCart(parsed.cart);
                if (parsed.step) setStep(parsed.step);

                // TAMBAHKAN INI:
                if (parsed.selectedProduct) setSelectedProduct(parsed.selectedProduct);
                if (parsed.itemConfig) setItemConfig(parsed.itemConfig);

                if (parsed.ongkir !== undefined) setOngkir(parsed.ongkir);
                if (parsed.diskonType !== undefined) setDiskonType(parsed.diskonType);
                if (parsed.diskonValue !== undefined) setDiskonValue(parsed.diskonValue);
                if (parsed.biayaLain !== undefined) setBiayaLain(parsed.biayaLain);
            }
        } catch (e) {
            console.error("Failed to load draft:", e);
        }
    }, [draftKey, initialData]);

    // Save Draft on Change
    useEffect(() => {
        if (initialData) return;
        const timer = setTimeout(() => {
            try {
                const hasData = customerData.nama_pemesan || cart.length > 0 || selectedProduct;
                if (hasData) {
                    const draftState = JSON.stringify({
                        customer: customerData,
                        cart,
                        step,
                        // TAMBAHKAN INI:
                        selectedProduct,
                        itemConfig,
                        ongkir,
                        diskonType,
                        diskonValue,
                        biayaLain
                    });
                    localStorage.setItem(draftKey, draftState);
                }
            } catch (e) {
                console.error("Failed to save draft:", e);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [customerData, cart, step, selectedProduct, itemConfig, draftKey, initialData]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(draftKey);
        } catch (e) {
            console.error("Failed to clear draft:", e);
        }
    };

    // --- API CALLS ---
    const [productsError, setProductsError] = useState(null);

    const fetchProducts = useCallback(async () => {
        if (!currentBranch) return;
        setIsLoadingProducts(true);
        setProductsError(null);
        try {
            // ALWAYS check SQLite first or if offline
            if (!isOnline) {
                console.log('[TransactionForm] Fetching products from SQLite (Offline mode)...');
                const localProducts = await sqlite.searchItems(productSearch || '');
                setProducts(localProducts);
                setProductPagination(prev => ({
                    ...prev,
                    last_page: 1,
                    total: localProducts.length
                }));
                setIsLoadingProducts(false);
                return;
            }

            const action = productSearch ? 'search' : 'getAll';
            const queryParams = new URLSearchParams({
                shortName: currentBranch.storeData.short_name,
                uniqueId: currentBranch.uniqueId,
                page: productPagination.current_page,
                paginate: 15,
                ...(productSearch && { v: productSearch })
            });

            const res = await fetch(`/api/products/${action}?${queryParams.toString()}`);
            const results = await res.json();

            if (results.success) {
                setProducts(results.data.data);
                setProductPagination(prev => ({
                    ...prev,
                    last_page: results.data.last_page,
                    total: results.data.total
                }));
            } else {
                throw new Error(results.message || 'Gagal memuat produk');
            }
        } catch (error) {
            console.error('[TransactionForm] Failed to fetch products, falling back to SQLite:', error);
            // Fallback to SQLite on error
            const localProducts = await sqlite.searchItems(productSearch || '');
            setProducts(localProducts);
        } finally {
            setIsLoadingProducts(false);
        }
    }, [currentBranch, productPagination.current_page, productSearch, isOnline]);

    // Load products if needed (must be after fetchProducts definition)
    useEffect(() => {
        if (step === 2) fetchProducts();
    }, [step, productSearch, productPagination.current_page, fetchProducts]);
    // --- CUSTOMER SEARCH LOGIC ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerData.nama_pemesan.length >= 2 && showSuggestions) {
                setIsLoadingCustomers(true);
                try {
                    if (!isOnline) {
                        // Customers are no longer synced offline. We can only allow manual entry.
                        setSuggestions([]);
                    } else {
                        const params = new URLSearchParams({
                            shortName: currentBranch?.storeData.short_name,
                            uniqueId: currentBranch?.uniqueId,
                            paginate: 50,
                            qname: customerData.nama_pemesan
                        });
                        const res = await fetch(`/api/customers/getAll?${params}`);
                        const data = await res.json();
                        if (data.success) setSuggestions(data.data.data || []);
                    }
                } catch (err) { console.error(err); }
                finally { setIsLoadingCustomers(false); }
            } else { setSuggestions([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [customerData.nama_pemesan, showSuggestions, isOnline]);

    // --- HANDLERS ---
    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
        if (name === 'nama_pemesan') setShowSuggestions(true);
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const handleSelectCustomer = (customer) => {
        setCustomerData({
            nama_pemesan: customer.nama_pemesan,
            alamat_pemesan: customer.alamat_pemesan,
            telepon_pemesan: customer.telp_pemesan,
            membership: customer.membership || 'UMUM'
        });
        setErrors({});
        setShowSuggestions(false);
    };

    const nextToProducts = () => {
        const newErrors = {};
        if (!customerData.nama_pemesan.trim()) newErrors.nama_pemesan = true;
        if (!customerData.alamat_pemesan.trim()) newErrors.alamat_pemesan = true;
        if (!customerData.telepon_pemesan.trim()) newErrors.telepon_pemesan = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setStep(2);
    };

    // --- PRICING LOGIC ---
    const calculateBestPrice = (product, qty) => {
        if (!product || !product.prices || product.prices.length === 0) {
            return product?.harga_jual || 0;
        }

        // 1. Get all pricing tiers that match the quantity requirement
        const validQtyTiers = product.prices.filter(p => qty >= p.min_pembelian);

        if (validQtyTiers.length === 0) return product.harga_jual || 0;

        // 2. Filter for relevant memberships (User's Membership OR 'UMUM')
        // We only consider prices that are either for this user's specific membership 
        // OR the general 'UMUM' price which acts as a fallback.
        const applicablePrices = validQtyTiers.filter(p =>
            p.jenis_harga === customerData.membership || p.jenis_harga === 'UMUM'
        );

        if (applicablePrices.length === 0) return product.harga_jual || 0;

        // 3. Sort to find the absolute best match:
        // Priority 1: Highest minimum purchase quantity (Bulk tier check)
        // Priority 2: Exact membership match (e.g. STUDIO price > UMUM price if both exist for same qty)
        // Priority 3: Lowest price (Safety fallback)
        applicablePrices.sort((a, b) => {
            if (b.min_pembelian !== a.min_pembelian) {
                return b.min_pembelian - a.min_pembelian;
            }

            // If same quantity tier, prioritize exact membership match
            const aMatch = a.jenis_harga === customerData.membership;
            const bMatch = b.jenis_harga === customerData.membership;

            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;

            return a.harga - b.harga;
        });

        return applicablePrices[0].harga;
    };

    // Auto-update price when configs change
    useEffect(() => {
        if (selectedProduct && itemConfig.isPriceLocked) {
            const p = Number(itemConfig.p) || 1;
            const l = Number(itemConfig.l) || 1;
            const qty = Number(itemConfig.qty) || 1;

            // For dimensional products, we usually use the total sheets (qty) for pricing tiered, 
            // OR sometimes total area. Assuming 'qty' (sheets) is the trigger for now based on 'min_pembelian' context.
            // If the user meant 'total pcs' (p * l * qty), we would use that.
            // Based on "min_pembelian" (minimum purchase), it usually refers to the main Qty field.

            const bestPrice = calculateBestPrice(selectedProduct, qty);
            setItemConfig(prev => ({ ...prev, harga: bestPrice }));
        }
    }, [itemConfig.qty, itemConfig.p, itemConfig.l, customerData.membership, selectedProduct]);

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setEditingIndex(null);
        const initialQty = 1;
        const initialPrice = calculateBestPrice(product, initialQty);

        setItemConfig({
            p: product.isdimensi ? '1' : '',
            l: product.isdimensi ? '1' : '',
            qty: initialQty,
            harga: initialPrice,
            keterangan: '',
            isPriceLocked: true,
            cost: product.hpp
        });
        setStep(3);
    };

    const handleEditItem = (index) => {
        const item = cart[index];
        setEditingIndex(index);
        setSelectedProduct(item);
        setItemConfig({
            p: item.p,
            l: item.l,
            qty: item.qty,
            harga: item.harga,
            keterangan: item.keterangan || '',
            isPriceLocked: false, // Don't auto-calculate when editing existing item
            cost: item.cost || item.hpp
        });
        setStep(3);
    };

    const saveItem = () => {
        const isDimensi = selectedProduct.isdimensi === 1;
        let p = Number(itemConfig.p) || 1;
        let l = Number(itemConfig.l) || 1;
        const qty = Number(itemConfig.qty) || 1;
        const cost = itemConfig.cost || 0;

        const total_price = isDimensi
            ? RoundUp(p) * RoundUp(l) * qty * itemConfig.harga
            : qty * itemConfig.harga;

        const newItem = {
            ...selectedProduct,
            ...itemConfig,
            p: isDimensi ? p : itemConfig.p,
            l: isDimensi ? l : itemConfig.l,
            total_price,
            display_qty: isDimensi ? `${p.toFixed(2)} x ${l.toFixed(2)} (${qty})` : `${qty}`
        };

        if (editingIndex !== null) {
            setCart(prev => {
                const newCart = [...prev];
                newCart[editingIndex] = newItem;
                return newCart;
            });
            setEditingIndex(null);
            setStep(1); // Return to summary after editing
        } else {
            setCart(prev => [...prev, newItem]);
            setStep(initialData ? 1 : 2); // Return to summary if in edit mode, else product select
        }
        setSelectedProduct(null);
    };

    const removeItem = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    // --- ACTION HANDLERS ---
    const [isSubmitting, setIsSubmitting] = useState(false);

    const buildPayload = (totalBayar) => {
        const items = cart.map(item => ({
            Kode_Produk: item.Kode_Produk,
            Nama_Produk: item.Nama_Produk,
            p: Number(item.p) || 0,
            l: Number(item.l) || 0,
            Qty: Number(item.qty) || 0,
            satuan: item.Satuan || null,
            cost: Number(item.cost) || 0,
            sales: Number(item.harga) || 0,
            subtotal_sales: item.total_price,
            keterangan: item.keterangan || null,
            isdimensi: item.isdimensi ? 1 : 0,
            distock: item.distock ? 1 : 0,
            isopen: item.isopen ? 1 : 0,
            ongkir: Number(item.ongkir) || 0,
            diskon: Number(item.diskon) || 0,
        }));

        return {
            total_qty: cartSummary.totalQty,
            total_item: cartSummary.totalItems,
            total_sales: cartSummary.subtotal,
            net_total_sales: cartSummary.grandTotal,
            biaya_lain: biayaLain,
            ongkir: Number(ongkir) || 0,
            diskon: cartSummary.diskonNominal,
            total_bayar: totalBayar,
            nama_pemesan: customerData.nama_pemesan,
            alamat_pemesan: customerData.alamat_pemesan || '',
            telepon_pemesan: customerData.telepon_pemesan || '',
            no_pemesan: customerData.membership || 'UMUM',
            membership: customerData.membership || 'UMUM',
            name: [user?.nama_depan_karyawan || '', user?.nama_belakang_karyawan || ''].join(' '),
            items,
        };
    };

    const generateOfflineNo = async () => {
        const shortName = currentBranch?.storeData?.short_name || 'POS';
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        // Try to get count of today's offline transactions to make a pseudo-sequence
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const count = await db.pending_transactions
            .filter(t => t.created_at >= todayStart.getTime())
            .count();

        const seq = (count + 1).toString().padStart(4, '0');
        return `${shortName}O${dateStr}${seq}`;
    };

    const handlePayment = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const currentPayment = Number(initialData?.transaksi?.total_bayar) || 0;
            const payload = buildPayload(currentPayment);

            if (!isOnline) {
                // SAVE OFFLINE to SQLite
                const dummyNo = await generateOfflineNo();
                payload.No_Transaksi = dummyNo;

                await sqlite.saveTransaction({
                    No_Transaksi: dummyNo,
                    payload
                });

                showToast('Koneksi terputus. Transaksi disimpan secara offline!', 'warning');
                setLastTransactionNo(dummyNo);
                setShowPaymentModal(true);
                clearDraft();
                return;
            }

            const action = initialData ? `edit/${initialData.transaksi.No_Transaksi}` : 'add';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(`/api/transactions/${action}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            console.log('[TransactionForm] Payment API Result:', result);

            if (!res.ok || result.success === false || result.ok === false) {
                throw new Error(result.message || 'Gagal memproses transaksi.');
            }

            const transactionNo = result.data?.No_Transaksi || result.No_Transaksi || initialData?.transaksi?.No_Transaksi;
            console.log('[TransactionForm] Using Transaction No:', transactionNo);

            if (!transactionNo) throw new Error("Nomor transaksi tidak ditemukan.");

            setLastTransactionNo(transactionNo);
            setShowPaymentModal(true);
            clearDraft();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Gagal memproses transaksi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const currentPayment = Number(initialData?.transaksi?.total_bayar) || 0;
            const payload = buildPayload(currentPayment);

            if (!isOnline) {
                const dummyNo = await generateOfflineNo();
                payload.No_Transaksi = dummyNo;

                await sqlite.saveTransaction({
                    No_Transaksi: dummyNo,
                    payload
                });

                showToast('Transaksi disimpan lokal (offline).', 'warning');
                setLastTransactionNo(dummyNo);

                clearDraft();
                setCart([]);
                setStep(1);
                if (onClose) onClose();
                return;
            }

            const action = initialData ? `edit/${initialData.transaksi.No_Transaksi}` : 'add';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(`/api/transactions/${action}?shortName=${currentBranch.storeData.short_name}&uniqueId=${currentBranch.uniqueId}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok || result.ok === false) {
                throw new Error(result.message || 'Gagal menyimpan transaksi.');
            }

            if (!initialData) {
                const transactionNo = result.data?.No_Transaksi || result.No_Transaksi;
                if (transactionNo) {
                    setLastTransactionNo(transactionNo);
                    showToast(`Transaksi berhasil disimpan!`, 'success');
                    setTimeout(() => {
                        router.push(`/transaction/edit/${transactionNo}`);
                    }, 1500);
                }

                clearDraft();
                setCart([]);
                setStep(1);
            } else {
                showToast(`Transaksi diperbarui!`, 'success');
            }
            if (onClose) onClose();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Gagal menyimpan transaksi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        const activeNo = initialData?.transaksi?.No_Transaksi || lastTransactionNo;
        if (activeNo) {
            window.open(`/transaction/print/${activeNo}`, '_blank');
        } else {
            showToast('Simpan transaksi terlebih dahulu sebelum mencetak.', 'error');
        }
    };

    // --- RENDER HELPERS ---
    const inputClass = (name) => `
        input !pl-10 h-11 transition-all duration-200 text-sm
        ${errors[name] ? '!border-red-500 !bg-red-50 !ring-red-100' : 'hover:border-gray-400'}
        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
    `;

    return (
        <div className="flex flex-col h-full bg-white lg:bg-transparent">
            {/* Step Indicator */}
            <div className="flex items-center justify-center p-6 bg-white lg:rounded-t-[2rem]">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= i ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {step > i ? <CheckIcon className="w-6 h-6" /> : i}
                        </div>
                        {i < 2 && <div className={`w-20 h-1 mx-2 rounded-full transition-all duration-300 ${step > i ? 'bg-primary' : 'bg-gray-100'}`} />}
                    </div>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* --- MAIN FORM AREA --- */}
                <div className="lg:col-span-8 space-y-6">

                    {/* STEP 1: CUSTOMER */}
                    {step === 1 && (
                        <div className="bg-white p-8 lg:rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6 animate-fade-in">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserIcon className="w-6 h-6 text-primary" />
                                Data Pelanggan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Pemesan *</label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text" name="nama_pemesan" autoComplete="off"
                                            placeholder="Ketik nama pelanggan..."
                                            value={customerData.nama_pemesan}
                                            onChange={handleCustomerChange}
                                            onFocus={() => customerData.nama_pemesan.length >= 2 && setShowSuggestions(true)}
                                            className={inputClass('nama_pemesan')}
                                        />
                                    </div>
                                    {showSuggestions && (suggestions.length > 0 || isLoadingCustomers) && (
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto">
                                            {isLoadingCustomers ? <div className="p-4 text-center text-sm text-gray-500">Mencari...</div> : (
                                                <>
                                                    {suggestions.map((cust, idx) => (
                                                        <button key={idx} type="button" onClick={() => handleSelectCustomer(cust)} className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                                            <p className="font-bold text-gray-800 text-sm">{cust.nama_pemesan}</p>
                                                            <p className="text-xs text-gray-500">{cust.telepon_pemesan} • {cust.alamat_pemesan}</p>
                                                        </button>
                                                    ))}
                                                    <button type="button" onClick={() => setShowSuggestions(false)} className="w-full text-center p-3 text-xs font-bold text-primary bg-gray-50 hover:bg-red-50">
                                                        + Tambah Pelanggan Baru
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">No HP / WA *</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" name="telepon_pemesan" placeholder="08xxx..." value={customerData.telepon_pemesan} onChange={handleCustomerChange} className={inputClass('telepon_pemesan')} />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Alamat Lengkap *</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" name="alamat_pemesan" placeholder="Jl. Contoh No. 123..." value={customerData.alamat_pemesan} onChange={handleCustomerChange} className={inputClass('alamat_pemesan')} />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Jenis Membership *</label>
                                    <div className="relative">
                                        <IdentificationIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select name="membership" value={customerData.membership} onChange={handleCustomerChange} className={`${inputClass('membership')} appearance-none pr-10`}>
                                            <option value="UMUM">UMUM</option>
                                            <option value="STUDIO">STUDIO</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                {!isReadOnlyProducts && (
                                    <button onClick={nextToProducts} className="btn btn-primary px-10 group h-12 rounded-xl">
                                        Pilih Produk
                                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PRODUCT SELECTION */}
                    {step === 2 && (
                        <div className="bg-white lg:rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-auto">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 uppercase tracking-tight">
                                    <ShoppingBagIcon className="w-5 h-5 text-primary" />
                                    Daftar Produk
                                </h3>
                                <div className="relative flex-1 max-w-sm">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari produk..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="input !pl-10 h-10 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="table w-full">
                                    <thead className="bg-gray-50/50 sticky top-0">
                                        <tr>
                                            <th className="text-left text-[10px] uppercase text-gray-500 py-4 px-6">Produk</th>
                                            <th className="text-left text-[10px] uppercase text-gray-500 py-4 px-6">Kategori</th>
                                            <th className="text-center text-[10px] uppercase text-gray-500 py-4 px-6">Satuan</th>
                                            <th className="py-4 px-6"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoadingProducts ? (
                                            <tr><td colSpan="4" className="py-20 text-center text-gray-400 italic">Memuat produk...</td></tr>
                                        ) : productsError ? (
                                            <tr>
                                                <td colSpan="4" className="py-10">
                                                    <FetchErrorState message={productsError} onRetry={fetchProducts} className="bg-transparent border-none shadow-none" />
                                                </td>
                                            </tr>
                                        ) : products.map(p => (
                                            <tr key={p.id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-gray-800 text-sm">{p.Nama_Produk}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{p.Kode_Produk}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium whitespace-nowrap">{p.Kategori}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-gray-700">{p.Satuan}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <button onClick={() => handleSelectProduct(p)} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <PlusIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <button onClick={() => setStep(1)} className="btn btn-secondary !px-4 h-10 flex items-center gap-2">
                                    <ChevronLeftIcon className="w-4 h-4" /> Kembali
                                </button>
                                <div className="flex items-center gap-2">
                                    <button disabled={productPagination.current_page === 1} onClick={() => setProductPagination(p => ({ ...p, current_page: p.current_page - 1 }))} className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-100"><ChevronLeftIcon className="w-4 h-4" /></button>
                                    <span className="text-xs font-bold text-gray-600">Hal {productPagination.current_page} / {productPagination.last_page}</span>
                                    <button disabled={productPagination.current_page === productPagination.last_page} onClick={() => setProductPagination(p => ({ ...p, current_page: p.current_page + 1 }))} className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-100"><ChevronRightIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: ITEM CONFIGURATION */}
                    {step === 3 && selectedProduct && (
                        <div className="bg-white p-8 lg:rounded-[2rem] border border-gray-100 shadow-2xl animate-fade-in space-y-8">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                        <TableCellsIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedProduct.Nama_Produk}</h3>
                                        <div className="flex flex-col">
                                            <p className="text-sm text-gray-400 font-medium">{selectedProduct.Kategori} • {selectedProduct.Satuan}</p>
                                            {itemConfig.keterangan && (
                                                <p className="text-xs text-primary font-bold italic mt-0.5 opacity-70">
                                                    "{itemConfig.keterangan}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setStep(editingIndex !== null || initialData ? 1 : 2)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <XMarkIcon className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {selectedProduct.isdimensi === 1 ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Panjang (P)</label>
                                            <div className="relative">
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">{selectedProduct.Satuan}</span>
                                                <input type="number" disabled={isReadOnlyProducts} value={itemConfig.p} onChange={(e) => setItemConfig(p => ({ ...p, p: e.target.value }))} onWheel={(e) => e.target.blur()} className="input pl-4 pr-12 font-bold text-lg disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed no-spinner" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Lebar (L)</label>
                                            <div className="relative">
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">{selectedProduct.Satuan}</span>
                                                <input type="number" disabled={isReadOnlyProducts} value={itemConfig.l} onChange={(e) => setItemConfig(p => ({ ...p, l: e.target.value }))} onWheel={(e) => e.target.blur()} className="input pl-4 pr-12 font-bold text-lg disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed no-spinner" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Qty (Eks)</label>
                                            <input type="number" disabled={isReadOnlyProducts} value={itemConfig.qty} onChange={(e) => setItemConfig(p => ({ ...p, qty: e.target.value }))} onWheel={(e) => e.target.blur()} className="input pl-4 font-bold text-lg disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed no-spinner" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2 col-span-1 md:col-span-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Jumlah (Qty)</label>
                                        <div className="relative">
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 tracking-widest">{selectedProduct.Satuan}</span>
                                            <input type="number" disabled={isReadOnlyProducts} value={itemConfig.qty} onChange={(e) => setItemConfig(p => ({ ...p, qty: e.target.value }))} onWheel={(e) => e.target.blur()} className="input pl-4 pr-16 font-bold text-lg disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed no-spinner" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Harga Satuan</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</div>
                                        <input
                                            type="number"
                                            value={itemConfig.harga}
                                            disabled={itemConfig.isPriceLocked || isReadOnlyProducts}
                                            onChange={(e) => setItemConfig(p => ({ ...p, harga: e.target.value }))}
                                            className="input !pl-12 !pr-12 font-black text-lg disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed no-spinner"
                                        />
                                        {!isReadOnlyProducts && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (user?.isCashier !== 1) {
                                                        showToast("Hanya Kasir yang dapat mengubah harga", "error");
                                                        return;
                                                    }
                                                    setItemConfig(p => ({ ...p, isPriceLocked: !p.isPriceLocked }));
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                {itemConfig.isPriceLocked ? <LockClosedIcon className="w-4 h-4 text-gray-400" /> : <LockOpenIcon className="w-4 h-4 text-primary" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Keterangan Pesanan</label>
                                    <div className="relative">
                                        <DocumentTextIcon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                        <textarea
                                            placeholder="Tambahkan detail atau instruksi khusus..."
                                            value={itemConfig.keterangan}
                                            onChange={(e) => setItemConfig(p => ({ ...p, keterangan: e.target.value }))}
                                            className="input !pl-12 !py-3 min-h-[100px] resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estimasi Harga Item</p>
                                    <h4 className="text-3xl font-black text-primary">
                                        {formatCurrency(
                                            selectedProduct.isdimensi === 1
                                                ? RoundUp(Number(itemConfig.p) || 0) * RoundUp(Number(itemConfig.l) || 0) * (Number(itemConfig.qty) || 0) * (Number(itemConfig.harga) || 0)
                                                : (Number(itemConfig.qty) || 0) * (Number(itemConfig.harga) || 0)
                                        )}
                                    </h4>
                                </div>
                                <button onClick={saveItem} className="btn btn-primary h-14 !px-12 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all">
                                    <CheckIcon className="w-6 h-6" />
                                    Simpan Item
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT SIDE: SUMMARY & CART --- */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">

                    {/* CART ITEMS */}
                    <div className="bg-white p-6 lg:rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                                <ListBulletIcon className="w-5 h-5 text-primary" />
                                Rincian Pesanan
                            </h3>
                            <span className="bg-red-50 text-primary text-[10px] font-black px-2.5 py-1 rounded-full">{cart.length} ITEM</span>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="py-12 text-center space-y-3">
                                    <XMarkIcon className="w-10 h-10 text-gray-200 mx-auto" />
                                    <p className="text-xs font-medium text-gray-400 max-w-[150px] mx-auto uppercase tracking-wider">Belum ada produk yang dipilih</p>
                                </div>
                            ) : cart.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleEditItem(idx)}
                                    className="group p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]"
                                >
                                    {!isReadOnlyProducts && (
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeItem(idx);
                                                }}
                                                className="p-1.5 bg-white shadow-sm rounded-lg text-red-500 hover:bg-red-50 border border-gray-100"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h5 className="font-bold text-gray-800 text-sm leading-tight">{item.Nama_Produk}</h5>
                                        {item.keterangan && (
                                            <p className="text-[10px] text-gray-400 italic bg-gray-100/50 px-2 py-1 rounded-md inline-block">
                                                {item.keterangan}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between pt-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.display_qty} {item.Satuan}</p>
                                            <p className="font-black text-gray-700 text-sm">{formatCurrency(item.total_price)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FINAL SUMMARY */}
                        <div className="pt-6 border-t-2 border-dashed border-gray-100 space-y-4">
                            <div className="flex justify-between text-xs font-medium text-gray-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="text-gray-900 font-bold">{formatCurrency(cartSummary.subtotal)}</span>
                            </div>

                            {/* Ongkir */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Ongkir</label>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</div>
                                    <input
                                        type="number"
                                        value={ongkir || ''}
                                        onChange={(e) => setOngkir(e.target.value)}
                                        placeholder="0"
                                        className="input !pl-10 !pr-3 !py-1.5 min-h-[36px] h-auto text-right text-sm font-black text-gray-900 bg-gray-50 border border-gray-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl transition-all w-full no-spinner"
                                    />
                                </div>
                            </div>

                            {/* Diskon */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Diskon</label>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        {diskonType === 'nominal' && (
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</div>
                                        )}
                                        <input
                                            type="number"
                                            value={diskonValue || ''}
                                            onChange={(e) => setDiskonValue(e.target.value)}
                                            placeholder="0"
                                            className={`input ${diskonType === 'nominal' ? '!pl-10' : '!pl-3'} ${diskonType === 'persen' ? '!pr-10' : '!pr-3'} !py-1.5 min-h-[36px] h-auto text-right text-sm font-black text-gray-900 bg-gray-50 border border-gray-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl transition-all w-full no-spinner`}
                                        />
                                        {diskonType === 'persen' && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        title={`Ubah ke ${diskonType === 'nominal' ? 'Persen' : 'Nominal'}`}
                                        onClick={() => {
                                            if (diskonType === 'nominal') {
                                                setDiskonType('persen');
                                                setDiskonValue(0);
                                            } else {
                                                setDiskonType('nominal');
                                                setDiskonValue(0);
                                            }
                                        }}
                                        className="min-h-[36px] px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-black text-xs border border-transparent hover:border-gray-300 transition-all flex items-center justify-center shrink-0"
                                    >
                                        {diskonType === 'nominal' ? 'Rp' : '%'}
                                    </button>
                                </div>
                            </div>

                            {/* Biaya Lain */}
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                                    <span>Biaya Lain</span>
                                    {biayaLain.length > 0 && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{biayaLain.length}</span>}
                                </div>

                                {/* List Biaya Lain */}
                                {biayaLain.length > 0 && (
                                    <div className="space-y-2">
                                        {biayaLain.map((b, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 group transition-all hover:border-primary/20 hover:bg-white shadow-sm shadow-transparent hover:shadow-gray-100">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight truncate leading-tight">{b.keterangan}</p>
                                                    <p className="text-[10px] font-bold text-primary mt-0.5">{formatCurrency(b.nominal)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBiayaLain(idx)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}                                 {/* Input Biaya Lain Toggle */}
                                {!isAddingBiaya ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingBiaya(true)}
                                        className="w-full h-9 bg-gray-50 hover:bg-white text-gray-400 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 hover:border-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" />
                                        Tambah Biaya Lain
                                    </button>
                                ) : (
                                    <div className="bg-white/50 p-3 rounded-2xl border border-dashed border-primary/20 space-y-2 animate-fade-in">
                                        <div className="relative">
                                            <DocumentTextIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                            <input
                                                type="text" autoFocus
                                                placeholder="Keterangan (e.g. Ongkos Pasang)"
                                                value={newBiaya.keterangan}
                                                onChange={(e) => setNewBiaya(prev => ({ ...prev, keterangan: e.target.value }))}
                                                className="input !py-1.5 !pl-8 !pr-3 h-8 text-[10px] font-bold text-gray-800 bg-gray-100/50 border-none focus:bg-white focus:ring-1 focus:ring-primary/20 rounded-lg w-full placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300">Rp</div>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={newBiaya.nominal}
                                                    onChange={(e) => setNewBiaya(prev => ({ ...prev, nominal: e.target.value }))}
                                                    className="input !pl-7 !pr-3 !py-1.5 h-8 text-right text-[10px] font-black text-gray-900 bg-gray-100/50 border-none focus:bg-white focus:ring-1 focus:ring-primary/20 rounded-lg w-full no-spinner placeholder:text-gray-300"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddBiayaLain}
                                                disabled={!newBiaya.keterangan || !newBiaya.nominal}
                                                className="shrink-0 px-3 h-8 bg-primary hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 flex items-center justify-center active:scale-95 shadow-lg shadow-primary/10"
                                            >
                                                Simpan
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingBiaya(false)}
                                                className="shrink-0 px-3 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center active:scale-95"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between text-xs font-medium text-gray-400 uppercase tracking-widest">
                                <span>Total Item / Qty</span>
                                <span className="text-gray-900 font-bold">{cartSummary.totalItems} / {cartSummary.totalQty}</span>
                            </div>
                            <div className="pt-4 flex justify-between items-end">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Total Tagihan</span>
                                <h4 className="text-3xl font-black text-primary !leading-none tracking-tighter">{formatCurrency(cartSummary.grandTotal)}</h4>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="pt-6 grid grid-cols-1 gap-3">
                            {isPaid ? (
                                <div className="h-14 w-full bg-emerald-50 text-emerald-600 font-black flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-100">
                                    <CheckIcon className="w-6 h-6" />
                                    TRANSAKSI LUNAS
                                </div>
                            ) : (
                                <button
                                    onClick={handlePayment}
                                    disabled={cart.length === 0 || isSubmitting}
                                    className="btn btn-primary h-14 !text-base font-black tracking-tight rounded-2xl shadow-xl shadow-primary/10 disabled:opacity-30 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? 'Memproses...' : <><BanknotesIcon className="w-6 h-6" /> Bayar Sekarang</>}
                                </button>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={cart.length === 0 || isSubmitting}
                                    className="btn btn-secondary h-12 !text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? '...' : <><ArchiveBoxIcon className="w-4 h-4" /> Simpan</>}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={(!initialData && !lastTransactionNo) || isSubmitting}
                                    className="btn btn-secondary h-12 !text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 disabled:opacity-30"
                                >
                                    <PrinterIcon className="w-4 h-4" /> Cetak
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CUSTOMER INFO SUMMARY (Only if step > 1) */}
                    {step > 1 && (
                        <div className="bg-gray-900 p-6 lg:rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><UserIcon className="w-4 h-4 text-white" /></div>
                                    <h4 className="font-bold text-sm tracking-tight uppercase">Data Pelanggan</h4>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-black tracking-tight leading-tight">{customerData.nama_pemesan}</p>
                                    <div className="flex items-center gap-2 text-white/40"><PhoneIcon className="w-3 h-3" /><span className="text-[10px] font-bold tracking-wider">{customerData.telepon_pemesan}</span></div>
                                    <div className="flex items-center gap-2 text-white/40"><MapPinIcon className="w-3 h-3" /><span className="text-[10px] font-bold tracking-wider uppercase truncate">{customerData.alamat_pemesan}</span></div>
                                </div>
                                <div className="pt-2">
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-primary rounded-md tracking-widest">{customerData.membership}</span>
                                </div>
                                <button onClick={() => setStep(1)} className="absolute top-0 right-0 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Ubah</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Payment Modal Integration */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    // If it was a new transaction and we have a No_Transaksi, 
                    // we stay on the edit page for that transaction.
                    if (!initialData && lastTransactionNo) {
                        router.push(`/transaction/edit/${lastTransactionNo}`);
                        // Only clear/reset if we are moving to the edit page (to let it reload fresh)
                        setCart([]);
                        setCustomerData({ nama_pemesan: '', alamat_pemesan: '', telepon_pemesan: '', membership: 'UMUM' });
                        setStep(1);
                    }

                    if (onClose) onClose();
                }}
                transactionNo={lastTransactionNo}
                totalSales={cartSummary.grandTotal}
                branch={currentBranch}
                onSuccess={(msg) => {
                    if (msg) showToast(msg, 'success');
                }}
            />
            {/* Toast Notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
}
