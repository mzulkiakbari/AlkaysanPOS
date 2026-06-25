import { NextResponse } from 'next/server';
import { getPendingTransactions } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const requestHost = request?.headers?.get('host') || '';
    const isLocalNode = requestHost.includes('localhost') || requestHost.includes('127.0.0.1');
    if (!isLocalNode) {
        return NextResponse.json({ success: true, data: { data: [], current_page: 1, last_page: 1 } });
    }

    try {
        const pending = await getPendingTransactions();
        // Return in a format similar to remote API
        const mapped = pending.map(t => {
            const payload = typeof t.payload === 'string' ? JSON.parse(t.payload) : t.payload;
            return {
                ...payload,
                No_Transaksi: t.No_Transaksi,
                Status_Bayar: t.Status_Bayar,
                Status_Transaksi: t.sync_status === 'PENDING' ? 'Belum diproses (Offline)' : t.Status_Transaksi,
                total_bayar: t.total_bayar,
                sisa_bayar: t.sisa_bayar,
                total_sales: t.total_sales,
                net_total_sales: t.total_sales
            };
        });
        
        return NextResponse.json({
            success: true,
            data: {
                data: mapped,
                current_page: 1,
                last_page: 1
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
