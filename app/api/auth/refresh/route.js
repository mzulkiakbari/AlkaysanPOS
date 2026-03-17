import { NextResponse } from 'next/server';

export async function POST(req) {
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
        return NextResponse.json({ ok: false, message: 'No refresh token' }, { status: 401 });
    }

    try {
        const tokenRes = await fetch(
            process.env.OAUTH_TOKEN_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                }),
            }
        );

        if (!tokenRes.ok) {
            const errorData = await tokenRes.json();
            return NextResponse.json({ ok: false, message: 'Failed to refresh token', error: errorData }, { status: tokenRes.status });
        }

        const token = await tokenRes.json();

        const res = NextResponse.json({ ok: true });

        res.cookies.set("access_token", token.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
        });

        if (token.refresh_token) {
            res.cookies.set("refresh_token", token.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                path: "/",
            });
        }

        return res;
    } catch (error) {
        console.error('Refresh Token Error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
