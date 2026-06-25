import mysql from 'mysql2/promise';

let pool;

export async function getLocalDb() {
    if (!pool) {
        pool = mysql.createPool({
            host: 'localhost',
            user: process.env.LOCAL_DB_USER || 'root',
            password: process.env.LOCAL_DB_PASS || '',
            database: process.env.LOCAL_DB_NAME || 'kasir',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

/**
 * Save a transaction to the local database with sync_status.
 */
export async function saveLocalTransaction(payload, isSync = false) {
    const db = await getLocalDb();
    const { No_Transaksi, Tanggal_Transaksi, nama_pemesan, alamat_pemesan, telepon_pemesan, membership, total_qty, total_item, total_sales, total_bayar, Status_Bayar, name, items } = payload;
    
    const sisa_bayar = total_sales - total_bayar;
    const syncStatus = isSync ? 'SYNCED' : 'PENDING';
    const jsonPayload = JSON.stringify(payload);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if exists first (upsert)
        const [rows] = await connection.execute('SELECT No_Transaksi FROM transaksis WHERE No_Transaksi = ?', [No_Transaksi]);
        
        if (rows.length === 0) {
            await connection.execute(`
                INSERT INTO transaksis (
                    No_Transaksi, Tanggal_Transaksi, nama_pemesan, alamat_pemesan, 
                    telepon_pemesan, membership, total_qty, total_item, total_sales, 
                    total_bayar, sisa_bayar, Status_Bayar, Status_Transaksi, 
                    nama_kasir, payload, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                No_Transaksi,
                Tanggal_Transaksi || new Date().toISOString().split('T')[0],
                nama_pemesan || null,
                alamat_pemesan || null,
                telepon_pemesan || null,
                membership || null,
                total_qty || 0,
                total_item || 0,
                total_sales || 0,
                total_bayar || 0,
                sisa_bayar,
                Status_Bayar || 'Belum Lunas',
                'Belum diproses',
                name || 'Kasir',
                jsonPayload,
                syncStatus
            ]);

            // Save items
            if (items && items.length > 0) {
                for (const item of items) {
                    await connection.execute(`
                        INSERT INTO item_transaksis (No_Transaksi, Kode_Produk, Nama_Produk, Qty, p, l, sales, subtotal_sales, cost, keterangan)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        No_Transaksi,
                        item.Kode_Produk || '',
                        item.Nama_Produk || '',
                        item.Qty || 0,
                        item.p || 0,
                        item.l || 0,
                        item.sales || 0,
                        item.subtotal_sales || 0,
                        item.cost || 0,
                        item.keterangan || null
                    ]);
                }
            }
        } else {
            // Update sync_status and payload if it already exists
            await connection.execute(`
                UPDATE transaksis SET sync_status = ?, payload = ?, updated_at = NOW() WHERE No_Transaksi = ?
            `, [syncStatus, jsonPayload, No_Transaksi]);
        }

        await connection.commit();
        return { success: true, No_Transaksi };
    } catch (error) {
        await connection.rollback();
        console.error('Failed to save local transaction:', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get all pending transactions that need to be synced
 */
export async function getPendingTransactions() {
    const db = await getLocalDb();
    const [rows] = await db.execute('SELECT * FROM transaksis WHERE sync_status = ? AND deleted_at IS NULL', ['PENDING']);
    return rows;
}

/**
 * Update transaction sync status
 */
export async function updateTransactionSyncStatus(noTransaksi, status, errorMsg = null) {
    const db = await getLocalDb();
    await db.execute(`
        UPDATE transaksis 
        SET sync_status = ?, sync_error = ?, last_synced_at = NOW()
        WHERE No_Transaksi = ?
    `, [status, errorMsg, noTransaksi]);
}

/**
 * Search products from local master_items table
 */
export async function searchLocalProducts(keyword, page = 1, limit = 15) {
    const db = await getLocalDb();
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM master_items';
    let countQuery = 'SELECT COUNT(*) as total FROM master_items';
    let params = [];
    
    if (keyword) {
        query += ' WHERE Nama_Produk LIKE ? OR Kode_Produk LIKE ?';
        countQuery += ' WHERE Nama_Produk LIKE ? OR Kode_Produk LIKE ?';
        params = [`%${keyword}%`, `%${keyword}%`];
    }
    
    query += ' LIMIT ? OFFSET ?';
    
    // Add pagination params
    const queryParams = [...params, limit.toString(), offset.toString()]; // Convert to string to avoid MySQL prepared statement issues with numbers sometimes
    
    // Using CAST for LIMIT/OFFSET is safer in mysql2 execute, but since we cast to strings, it might complain. Let's pass as numbers but avoid SQL injection by parsing.
    const finalLimit = parseInt(limit, 10);
    const finalOffset = parseInt(offset, 10);
    
    // Format query directly for limit/offset since execute() can be strict about them
    const safeQuery = query.replace('LIMIT ? OFFSET ?', `LIMIT ${finalLimit} OFFSET ${finalOffset}`);

    const [rows] = await db.execute(safeQuery, params);
    const [countRows] = await db.execute(countQuery, params);
    
    return {
        data: rows,
        current_page: page,
        last_page: Math.ceil(countRows[0].total / limit),
        total: countRows[0].total
    };
}

/**
 * Get the latest timestamp from a table for Delta Sync
 */
export async function getLastSyncTimestamp(tableName) {
    const db = await getLocalDb();
    const possibleDateCols = ['Tgl_Modified', 'TglModified', 'updated_at', 'tgl_input', 'waktu_bayar', 'Tanggal_Transaksi', 'Tanggal', 'created_at'];
    
    try {
        const [cols] = await db.execute(`SHOW COLUMNS FROM ${tableName}`);
        const colNames = cols.map(c => c.Field);
        
        let dateCol = null;
        for (const col of possibleDateCols) {
            const found = colNames.find(c => c.toLowerCase() === col.toLowerCase());
            if (found) {
                dateCol = found;
                break;
            }
        }
        
        if (!dateCol) return null;
        
        const [rows] = await db.execute(`SELECT MAX(${dateCol}) as lastSync FROM ${tableName}`);
        if (rows && rows.length > 0 && rows[0].lastSync) {
            const dt = new Date(rows[0].lastSync);
            // Format YYYY-MM-DD HH:MM:SS
            return dt.getFullYear() + '-' + 
                String(dt.getMonth() + 1).padStart(2, '0') + '-' + 
                String(dt.getDate()).padStart(2, '0') + ' ' + 
                String(dt.getHours()).padStart(2, '0') + ':' + 
                String(dt.getMinutes()).padStart(2, '0') + ':' + 
                String(dt.getSeconds()).padStart(2, '0');
        }
        return null;
    } catch (e) {
        console.error(`Error getting last sync for ${tableName}:`, e);
        return null;
    }
}

/**
 * Generic Upsert function for syncing tables from API
 */
export async function upsertTableData(tableName, rows) {
    if (!rows || rows.length === 0) return 0;
    
    const db = await getLocalDb();
    
    // Filter out rows that are entirely null or empty
    const validRows = rows.filter(r => r && typeof r === 'object');
    if (validRows.length === 0) return 0;

    const columns = Object.keys(validRows[0]);
    if (columns.length === 0) return 0;
    
    const chunkSize = 100;
    let affectedRows = 0;
    
    for (let i = 0; i < validRows.length; i += chunkSize) {
        const chunk = validRows.slice(i, i + chunkSize);
        
        const colList = columns.map(c => `${c}`).join(', ');
        const placeholders = '(' + columns.map(() => '?').join(', ') + ')';
        const chunkPlaceholders = chunk.map(() => placeholders).join(', ');
        
        const updateClauses = columns.map(col => `${col} = VALUES(${col})`).join(', ');
        
        const sql = `INSERT INTO ${tableName} (${colList}) VALUES ${chunkPlaceholders} ON DUPLICATE KEY UPDATE ${updateClauses}`;
        
        const values = [];
        for (const row of chunk) {
            for (const col of columns) {
                let val = row[col];
                // MySQL JSON columns or serialized objects
                if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val);
                }
                values.push(val !== undefined ? val : null);
            }
        }
        
        try {
            const [result] = await db.execute(sql, values);
            affectedRows += result.affectedRows;
        } catch (error) {
            console.error(`Upsert failed for chunk in ${tableName}:`, error);
            // Optionally continue or throw
        }
    }
    
    return affectedRows;
}
