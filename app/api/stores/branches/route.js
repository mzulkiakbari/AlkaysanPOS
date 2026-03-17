import { NextResponse } from 'next/server';

export async function GET(req) {
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
        return NextResponse.json({
            ok: false,
            message: "You must have access token as bearer token in authorization."
        }, { status: 401 });
    }

    const fetchBranches = async (token) => {
        return fetch('https://api.alkaysan.co.id/v2/store/store/get/all?orderBy=storeName&sortBy=asc', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    };

    try {
        let response = await fetchBranches(accessToken);

        if (!response.ok && response.status === 401) {
            // Try refresh token server-side
            const refreshToken = req.cookies.get('refresh_token')?.value;
            if (refreshToken) {
                try {
                    const tokenRes = await fetch("https://account.alkaysan.co.id/oauth/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: "12",
                            client_secret: "3oa5ND3KZQwaswL29c0ecxVsmc0yz2qGv7RvaXMc",
                            grant_type: "refresh_token",
                            refresh_token: refreshToken,
                        }),
                    });

                    if (tokenRes.ok) {
                        const token = await tokenRes.json();
                        // Retry with new token
                        const retryRes = await fetchBranches(token.access_token);

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
                    console.error('Branches proxy refresh failed:', refreshErr);
                }
            }
        }

        if (!response.ok) {
            return NextResponse.json({
                ok: false,
                message: "You must have access token as bearer token in authorization."
            }, { status: 401 });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Branches Fetch Error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
