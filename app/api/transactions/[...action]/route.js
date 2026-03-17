import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req, props) {
    const params = await props.params;
    return handleRequest(req, params, 'GET');
}

export async function POST(req, props) {
    const params = await props.params;
    return handleRequest(req, params, 'POST');
}

export async function PUT(req, props) {
    const params = await props.params;
    return handleRequest(req, params, 'PUT');
}

export async function DELETE(req, props) {
    const params = await props.params;
    return handleRequest(req, params, 'DELETE');
}

async function handleRequest(req, params, method) {
    const action = params?.action; // Array of path segments
    let actionPath = Array.isArray(action) ? action.join('/') : (action || 'getAll');

    const accessToken = req.cookies.get('access_token')?.value;
    const shortName = req.nextUrl.searchParams.get('shortName');
    const uniqueId = req.nextUrl.searchParams.get('uniqueId');

    const isPublicAction = method === 'GET' && typeof actionPath === 'string' && actionPath.startsWith('get/');

    if (!accessToken && !isPublicAction) {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!shortName || !uniqueId) {
        return NextResponse.json({ ok: false, message: "Missing store info" }, { status: 400 });
    }

    // Capture body for POST/PUT requests
    let body = null;
    if (method === 'POST' || method === 'PUT') {
        try {
            body = await req.json();
        } catch (e) {
            // Body might be empty or not JSON
        }
    }

    const fetchBackend = async (token) => {
        const baseUrl = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
        let targetUrl = `${baseUrl}/${shortName.toLowerCase()}/${uniqueId}/api/v2/transactions/${actionPath}`;

        // Forward all other search params
        const query = new URLSearchParams();
        req.nextUrl.searchParams.forEach((value, key) => {
            if (key !== 'shortName' && key !== 'uniqueId') {
                query.append(key, value);
            }
        });

        const queryString = query.toString();
        if (queryString) {
            targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString;
        }

        const options = {
            method,
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return fetch(targetUrl, options);
    };

    try {
        let response = await fetchBackend(accessToken);

        if (!response.ok && response.status === 401) {
            const refreshToken = req.cookies.get('refresh_token')?.value;
            if (refreshToken) {
                try {
                    const tokenRes = await fetch(process.env.OAUTH_TOKEN_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
                            client_secret: process.env.CLIENT_SECRET,
                            grant_type: "refresh_token",
                            refresh_token: refreshToken,
                        }),
                    });

                    if (tokenRes.ok) {
                        const token = await tokenRes.json();
                        const retryRes = await fetchBackend(token.access_token);

                        if (retryRes.ok) {
                            const result = await retryRes.json();
                            const res = NextResponse.json(result);
                            res.cookies.set("access_token", token.access_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
                            if (token.refresh_token) {
                                res.cookies.set("refresh_token", token.refresh_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
                            }
                            return res;
                        }
                    }
                } catch (refreshErr) {
                    console.error('Transaction proxy refresh failed:', refreshErr);
                }
            }
        }

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({}));
            return NextResponse.json({
                ok: false,
                message: errorResult.message || `Failed to ${actionPath} transaction data.`
            }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error(`Transaction Proxy ${actionPath} Error:`, error);
        return NextResponse.json({ ok: false, message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
