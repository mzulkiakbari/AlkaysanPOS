import Dexie from 'dexie';

export const db = new Dexie('AlkaysanCashier');

db.version(2).stores({
  audit_logs: '++id, user_id, action, module',
  bayar_transaksis: '++id, no_bayar, no_transaksi',
  item_transaksis: '++No_ItemTransaksi, No_Transaksi, Kode_Produk',
  kas: '++Id_kas, Tanggal, kode_kas',
  master_akuns: '++id, kode, nama',
  master_items: '++id, Kode_Produk, Nama_Produk, Kategori',
  master_kas: '++id, kode, nama',
  produk_hargas: '++id, Kode_Produk, jenis_harga',
  transaksis: '++id, No_Transaksi, Tanggal_Transaksi',
  pending_transactions: '++id, payload, created_at, status'
});
