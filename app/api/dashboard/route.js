import { NextResponse } from 'next/server';

export async function GET(req) {
    const accessToken = req.cookies.get('access_token')?.value;
    const { searchParams } = new URL(req.url);
    const shortName = searchParams.get('shortName');
    const uniqueId = searchParams.get('uniqueId');

    if (!accessToken) {
        return NextResponse.json({
            ok: false,
            message: "You must have access token as bearer token in authorization."
        }, { status: 401 });
    }

    if (!shortName || !uniqueId) {
        return NextResponse.json({
            ok: false,
            message: "Missing shortName or uniqueId."
        }, { status: 400 });
    }

    const fetchDashboard = async (token) => {
        return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${shortName.toLowerCase()}/${uniqueId}/api/v2/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    };

    try {
        let response = await fetchDashboard(accessToken);

        if (!response.ok && response.status === 401) {
            // Try refresh token server-side
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
                        // Retry with new token
                        const retryRes = await fetchDashboard(token.access_token);

                        if (retryRes.ok) {
                            const result = await retryRes.json();
                            const res = NextResponse.json(result);
                            // Update cookies
                            res.cookies.set("access_token", token.access_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
                            if (token.refresh_token) {
                                res.cookies.set("refresh_token", token.refresh_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
                            }
                            return res;
                        }
                    }
                } catch (refreshErr) {
                    console.error('Dashboard proxy refresh failed:', refreshErr);
                }
            }
        }

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({}));
            return NextResponse.json({
                ok: false,
                message: errorResult.message || "Failed to fetch dashboard data."
            }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Dashboard Proxy Fetch Error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
