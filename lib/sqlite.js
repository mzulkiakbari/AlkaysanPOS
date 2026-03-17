const path = require('path');
const { app, ipcMain } = require('electron');

let db;

function initDatabase() {
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'pos_local.db');
    db = new Database(dbPath, { verbose: console.log });
    
    // Create tables mirroring MySQL
    // Note: Use TEXT for IDs if they are UUIDs/Strings, or INTEGER if auto-increment
    db.exec(`
        CREATE TABLE IF NOT EXISTS master_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uniqueId TEXT UNIQUE,
            Kode_Produk TEXT UNIQUE,
            Nama_Produk TEXT,
            Kategori TEXT,
            Satuan TEXT,
            harga_jual REAL,
            hpp REAL,
            isdimensi INTEGER DEFAULT 0,
            distock INTEGER DEFAULT 0,
            isopen INTEGER DEFAULT 0,
            prices TEXT, -- JSON string of pricing tiers
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transaksis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            No_Transaksi TEXT UNIQUE,
            Tanggal_Transaksi TEXT,
            nama_pemesan TEXT,
            alamat_pemesan TEXT,
            telepon_pemesan TEXT,
            membership TEXT,
            total_qty REAL,
            total_item INTEGER,
            total_sales REAL,
            total_bayar REAL,
            sisa_bayar REAL,
            Status_Bayar TEXT,
            Status_Transaksi TEXT,
            nama_kasir TEXT,
            payload TEXT, -- Full JSON payload for syncing
            sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS item_transaksis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            No_Transaksi TEXT,
            Kode_Produk TEXT,
            Nama_Produk TEXT,
            Qty REAL,
            p REAL,
            l REAL,
            sales REAL,
            subtotal_sales REAL,
            cost REAL,
            keterangan TEXT,
            FOREIGN KEY (No_Transaksi) REFERENCES transaksis(No_Transaksi)
        );

        CREATE TABLE IF NOT EXISTS branches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uniqueId TEXT UNIQUE,
            storeName TEXT,
            shortName TEXT,
            storeData TEXT, -- JSON string
            isActive INTEGER DEFAULT 1
        );
    `);

    console.log('SQLite Database Initialized at:', dbPath);
}

function setupIpcHandlers() {
    // Items
    ipcMain.handle('db:items:upsert', (event, items) => {
        const insert = db.prepare(`
            INSERT INTO master_items (uniqueId, Kode_Produk, Nama_Produk, Kategori, Satuan, harga_jual, hpp, isdimensi, distock, isopen, prices)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(Kode_Produk) DO UPDATE SET
                uniqueId=excluded.uniqueId,
                Nama_Produk=excluded.Nama_Produk,
                Kategori=excluded.Kategori,
                Satuan=excluded.Satuan,
                harga_jual=excluded.harga_jual,
                hpp=excluded.hpp,
                isdimensi=excluded.isdimensi,
                distock=excluded.distock,
                isopen=excluded.isopen,
                prices=excluded.prices,
                updated_at=CURRENT_TIMESTAMP
        `);

        const transaction = db.transaction((items) => {
            for (const item of items) {
                insert.run(
                    item.uniqueId, 
                    item.Kode_Produk, 
                    item.Nama_Produk, 
                    item.Kategori, 
                    item.Satuan, 
                    item.harga_jual || item.sales || 0,
                    item.hpp || item.cost || 0,
                    item.isdimensi ? 1 : 0,
                    item.distock ? 1 : 0,
                    item.isopen ? 1 : 0,
                    JSON.stringify(item.prices || [])
                );
            }
        });

        transaction(items);
        return { success: true };
    });

    ipcMain.handle('db:items:search', (event, query) => {
        const stmt = db.prepare(`
            SELECT * FROM master_items 
            WHERE Nama_Produk LIKE ? OR Kode_Produk LIKE ?
        `);
        const results = stmt.all(`%${query}%`, `%${query}%`);
        return results.map(r => ({ ...r, prices: JSON.parse(r.prices || '[]') }));
    });

    // Transactions
    ipcMain.handle('db:transactions:save', (event, data) => {
        const { No_Transaksi, payload } = data;
        const stmt = db.prepare(`
            INSERT INTO transaksis (
                No_Transaksi, Tanggal_Transaksi, nama_pemesan, alamat_pemesan, 
                telepon_pemesan, membership, total_qty, total_item, total_sales, 
                total_bayar, sisa_bayar, Status_Bayar, Status_Transaksi, 
                nama_kasir, payload, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const res = stmt.run(
            No_Transaksi,
            payload.Tanggal_Transaksi || new Date().toISOString().split('T')[0],
            payload.nama_pemesan,
            payload.alamat_pemesan,
            payload.telepon_pemesan,
            payload.membership,
            payload.total_qty,
            payload.total_item,
            payload.total_sales,
            payload.total_bayar,
            payload.total_sales - payload.total_bayar,
            payload.total_bayar >= payload.total_sales ? 'Lunas' : 'Belum Lunas',
            'Belum diproses',
            payload.name,
            JSON.stringify(payload),
            'pending'
        );

        // Save items
        const itemStmt = db.prepare(`
            INSERT INTO item_transaksis (No_Transaksi, Kode_Produk, Nama_Produk, Qty, p, l, sales, subtotal_sales, cost, keterangan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const itemTransaction = db.transaction((items) => {
            for (const item of items) {
                itemStmt.run(
                    No_Transaksi,
                    item.Kode_Produk,
                    item.Nama_Produk,
                    item.Qty,
                    item.p,
                    item.l,
                    item.sales,
                    item.subtotal_sales,
                    item.cost,
                    item.keterangan
                );
            }
        });

        itemTransaction(payload.items);

        return { success: true, id: res.lastInsertRowid };
    });

    ipcMain.handle('db:transactions:getPending', (event) => {
        const stmt = db.prepare(`SELECT * FROM transaksis WHERE sync_status = 'pending'`);
        const rows = stmt.all();
        return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
    });

    ipcMain.handle('db:transactions:markSynced', (event, No_Transaksi) => {
        const stmt = db.prepare(`UPDATE transaksis SET sync_status = 'synced' WHERE No_Transaksi = ?`);
        stmt.run(No_Transaksi);
        return { success: true };
    });
}

module.exports = {
    initDatabase,
    setupIpcHandlers
};
