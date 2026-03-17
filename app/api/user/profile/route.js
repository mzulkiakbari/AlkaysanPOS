import { NextResponse } from 'next/server';

export async function GET(req) {
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const response = await fetch('https://account.alkaysan.co.id/api/v1/user/get/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Try refresh token server-side if possible
                const refreshToken = req.cookies.get('refresh_token')?.value;
                if (refreshToken) {
                    try {
                        const tokenRes = await fetch("https://account.alkaysan.co.id/oauth/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: new URLSearchParams({
                                client_id: process.env.NEXT_PUBLIC_CLIENT_ID || "14",
                                client_secret: process.env.CLIENT_SECRET || "7Jopgub3ewoD82KdZiNZPyAHv1iyWmSigIhip16L",
                                redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:4200/auth/callback",
                                grant_type: "refresh_token",
                                refresh_token: refreshToken,
                            }),
                        });

                        if (tokenRes.ok) {
                            const token = await tokenRes.json();
                            // Retry profile fetch with new token
                            const retryRes = await fetch('https://account.alkaysan.co.id/api/v1/user/get/me', {
                                headers: {
                                    'Authorization': `Bearer ${token.access_token}`,
                                    'Accept': 'application/json'
                                }
                            });

                            if (retryRes.ok) {
                                const profile = await retryRes.json();
                                const res = NextResponse.json(profile);
                                // Update cookies with new tokens
                                res.cookies.set("access_token", token.access_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
                                if (token.refresh_token) {
                                    res.cookies.set("refresh_token", token.refresh_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
                                }
                                return res;
                            }
                        }
                    } catch (refreshErr) {
                        console.error('Server-side refresh failed:', refreshErr);
                    }
                }
            }
            const errorRes = NextResponse.json({
                ok: false,
                message: "You must have access token as bearer token in authorization."
            }, { status: 401 });

            errorRes.cookies.set("access_token", "", { path: "/", expires: new Date(0) });
            errorRes.cookies.set("refresh_token", "", { path: "/", expires: new Date(0) });

            return errorRes;
        }

        const profile = await response.json();

        // Check if the user has at least one valid role for POS
        const hasAccess =
            profile.isSuperAdmin ||
            profile.isAdmin ||
            profile.isCashier ||
            profile.isCS;

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied', profile: profile }, { status: 403 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
