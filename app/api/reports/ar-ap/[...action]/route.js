import { NextResponse } from 'next/server';

export async function GET(request, props) {
    const params = await props.params;
    const actionPath = params.action ? params.action.join('/') : '';
    const { searchParams } = new URL(request.url);
    const shortName = searchParams.get('shortName');
    const uniqueId = searchParams.get('uniqueId');

    if (!shortName || !uniqueId) {
        return NextResponse.json({ success: false, message: 'Missing shortName or uniqueId' }, { status: 400 });
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        let apiUrl = `${baseUrl}/${shortName.toLowerCase()}/${uniqueId}/api/v2/reports/ar-ap${actionPath}`;

        const backendParams = new URLSearchParams();
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'shortName' && key !== 'uniqueId') {
                backendParams.append(key, value);
            }
        }

        const paramStr = backendParams.toString();
        if (paramStr) {
            apiUrl += `?${paramStr}`;
        }

        const authHeader = request.headers.get('Authorization');

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json',
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('AR/AP Proxy Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
