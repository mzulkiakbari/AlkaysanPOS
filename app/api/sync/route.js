import { NextResponse } from 'next/server';
import { getPendingTransactions, updateTransactionSyncStatus } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const requestHost = req.headers.get('host') || '';
    const isLocalNode = requestHost.includes('localhost') || requestHost.includes('127.0.0.1');
    if (!isLocalNode) {
        return NextResponse.json({ success: false, message: 'Sync background worker only runs on localhost.' });
    }

    try {
        const accessToken = req.cookies.get('access_token')?.value;
        if (!accessToken) {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { shortName, uniqueId } = body;

        if (!shortName || !uniqueId) {
            return NextResponse.json({ ok: false, message: "Missing store info" }, { status: 400 });
        }

        const pendingTx = await getPendingTransactions();

        if (pendingTx.length === 0) {
            return NextResponse.json({ ok: true, message: "No pending transactions", syncedCount: 0 });
        }

        let syncedCount = 0;
        let failedCount = 0;
        const baseUrl = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();

        // Process one by one (or Promise.all if preferred, but sequential is safer for DB integrity)
        for (const tx of pendingTx) {
            try {
                let payload;
                try {
                    payload = typeof tx.payload === 'string' ? JSON.parse(tx.payload) : tx.payload;
                } catch (e) {
                    await updateTransactionSyncStatus(tx.No_Transaksi, 'FAILED', 'Invalid JSON payload');
                    failedCount++;
                    continue;
                }

                // If No_Transaksi starts with OFF-, it means it was generated locally
                // The API should handle it as a new transaction (action: 'add')
                // But wait, the API probably expects standard payload
                const targetUrl = `${baseUrl}/${shortName.toLowerCase()}/${uniqueId}/api/v2/transactions/add`;

                // Quick timeout for sync so it doesn't hang the whole loop
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    await updateTransactionSyncStatus(tx.No_Transaksi, 'SYNCED', null);
                    syncedCount++;
                } else {
                    const errorResult = await res.json().catch(() => ({}));
                    await updateTransactionSyncStatus(tx.No_Transaksi, 'FAILED', errorResult.message || `HTTP ${res.status}`);
                    failedCount++;
                }
            } catch (err) {
                // Network error / Timeout
                await updateTransactionSyncStatus(tx.No_Transaksi, 'PENDING', err.message);
                failedCount++;
            }
        }

        return NextResponse.json({
            ok: true,
            message: "Sync complete",
            syncedCount,
            failedCount,
            totalPending: pendingTx.length
        });
    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
