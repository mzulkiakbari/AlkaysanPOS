import { NextResponse } from 'next/server';
import { searchLocalProducts } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const requestHost = request?.headers?.get('host') || '';
    const isLocalNode = requestHost.includes('localhost') || requestHost.includes('127.0.0.1');
    
    if (!isLocalNode) {
        return NextResponse.json({ success: true, data: { data: [], current_page: 1, last_page: 1 } });
    }

    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('v') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('paginate') || '15', 10);

        const results = await searchLocalProducts(keyword, page, limit);

        return NextResponse.json({
            success: true,
            data: results,
            isLocal: true
        });
    } catch (error) {
        console.error('Failed to fetch local products:', error);
        return NextResponse.json({ success: false, message: 'Gagal mengambil produk dari database lokal', error: error.message }, { status: 500 });
    }
}
