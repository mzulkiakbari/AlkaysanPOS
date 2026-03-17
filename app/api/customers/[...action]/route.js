import { NextResponse } from 'next/server';

export async function GET(request, props) {
    const params = await props.params;
    return handleRequest(request, params, 'GET');
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
    const action = params.action;
    let actionPath = Array.isArray(action) ? action.join('/') : (action || 'getAll');

    const accessToken = req.cookies.get('access_token')?.value;
    const { searchParams } = new URL(req.url);
    const shortName = searchParams.get('shortName');
    const uniqueId = searchParams.get('uniqueId');

    if (!accessToken) {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!shortName || !uniqueId) {
        return NextResponse.json({ ok: false, message: "Missing store info" }, { status: 400 });
    }

    // Capture body for PUT/DELETE requests
    let body = null;
    if (method === 'PUT' || method === 'DELETE') {
        try {
            body = await req.json();
        } catch (e) {
            // Body might be empty or not JSON
        }
    }

    const fetchBackend = async (token) => {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${shortName.toLowerCase()}/${uniqueId}/api/v2/customers/${actionPath}`);

        // Forward all other search params for GET
        if (method === 'GET') {
            searchParams.forEach((value, key) => {
                if (key !== 'shortName' && key !== 'uniqueId') {
                    url.searchParams.append(key, value);
                }
            });
        }

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        };

        if (body) {
            // Convert JSON to x-www-form-urlencoded
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            const formData = new URLSearchParams();
            Object.keys(body).forEach(key => {
                formData.append(key, body[key]);
            });
            options.body = formData.toString();
        }

        return fetch(url.toString(), options);
    };

    try {
        let response = await fetchBackend(accessToken);

        if (!response.ok && response.status === 401) {
            const refreshToken = req.cookies.get('refresh_token')?.value;
            if (refreshToken) {
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
            }
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error(`Customer Proxy ${actionPath} Error:`, error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
