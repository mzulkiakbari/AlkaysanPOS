import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=invalid_code", req.url));
    }

    const host = req.headers.get("host");
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    const redirectUri = isLocalhost
        ? `http://${host}/auth/callback`
        : process.env.NEXT_PUBLIC_REDIRECT_URI;

    // exchange code → token (SERVER ONLY)
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
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                code,
            }),
        }
    );

    if (!tokenRes.ok) {
        return NextResponse.redirect(new URL("/?error=token_failed", req.url));
    }

    const token = await tokenRes.json();

    const res = NextResponse.redirect(
        new URL("/", req.url)
    );

    res.cookies.set("access_token", token.access_token, {
        httpOnly: true,
        secure: isLocalhost ? false : true,
        sameSite: "lax",
        path: "/",
    });

    if (token.refresh_token) {
        res.cookies.set("refresh_token", token.refresh_token, {
            httpOnly: true,
            secure: isLocalhost ? false : true,
            sameSite: "lax",
            path: "/",
        });
    }

    return res;
}
