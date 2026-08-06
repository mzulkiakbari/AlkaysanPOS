import { NextResponse } from 'next/server';
import { getLastSyncTimestamp, upsertTableData } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const requestHost = request?.headers?.get('host') || '';
    const isLocalNode = requestHost.includes('localhost') || requestHost.includes('127.0.0.1');

    if (!isLocalNode) {
        return NextResponse.json({ success: false, message: 'Delta sync hanya bisa dijalankan di node lokal.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const shortName = body.shortName;
        const uniqueId = body.uniqueId;

        if (!shortName || !uniqueId) {
            return NextResponse.json({ success: false, message: 'shortName and uniqueId are required for sync.' }, { status: 400 });
        }

        // Gather last sync timestamps for all targeted tables
        const tablesToSync = [
            'transaksis', 'bayar_transaksis', 'dashboard_summaries', 
            'item_transaksis', 'kas', 'logs', 'master_akuns', 
            'master_items', 'master_kas', 'produk_hargas'
        ];
        
        const timestamps = {};
        for (const table of tablesToSync) {
            const ts = await getLastSyncTimestamp(table);
            if (ts) timestamps[table] = ts;
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URI || 'https://v1.kasir.alkaysan.com';
        const syncUrl = `${baseUrl}/${shortName}/${uniqueId}/api/v2/sync/download`;

        console.log(`[DeltaSync] Pulling from ${syncUrl} with timestamps:`, timestamps);

        const res = await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timestamps })
        });

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const json = await res.json();
        
        if (!json.success || !json.data) {
            throw new Error(json.message || 'Invalid response format from server');
        }

        const tablesData = json.data;
        let totalUpserted = 0;
        let tablesUpserted = [];

        // Upsert each table
        for (const [tableName, rows] of Object.entries(tablesData)) {
            if (Array.isArray(rows) && rows.length > 0) {
                console.log(`[DeltaSync] Upserting ${rows.length} rows into ${tableName}...`);
                const affected = await upsertTableData(tableName, rows);
                totalUpserted += rows.length; // affectedRows can be 2 for updates, so we count original array length
                tablesUpserted.push(tableName);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Delta Sync berhasil.',
            stats: {
                total_rows: totalUpserted,
                tables_updated: tablesUpserted,
                last_sync_used: lastSync
            }
        });

    } catch (error) {
        console.error('[DeltaSync] Error:', error);
        return NextResponse.json({ success: false, message: 'Gagal melakukan Delta Sync.', error: error.message }, { status: 500 });
    }
}
