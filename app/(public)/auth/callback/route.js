import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        const host = req.headers.get("host") || "";
        const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URI || (isLocalhost ? `http://${host}` : `https://${host}`);

        if (!code) {
            console.error('[auth/callback] No code parameter provided in query string');
            return NextResponse.redirect(new URL("/?error=invalid_code", appBaseUrl));
        }

        const tokenUrl = process.env.OAUTH_TOKEN_URL || "https://account.alkaysan.com/oauth/token";
        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || "";
        const clientSecret = process.env.CLIENT_SECRET || "";
        const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || `${appBaseUrl}/auth/callback`;

        if (!clientId || !clientSecret) {
            console.error('[auth/callback] Missing NEXT_PUBLIC_CLIENT_ID or CLIENT_SECRET environment variable!');
            return NextResponse.redirect(new URL("/?error=config_missing&details=Missing+client+credentials", appBaseUrl));
        }

        // exchange code → token (SERVER ONLY)
        const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                code,
            }),
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error('[auth/callback] Token exchange failed with status', tokenRes.status, ':', errorText);
            return NextResponse.redirect(
                new URL(`/?error=token_failed&status=${tokenRes.status}&reason=${encodeURIComponent(errorText.slice(0, 150))}`, appBaseUrl)
            );
        }

        const token = await tokenRes.json();

        if (!token.access_token) {
            console.error('[auth/callback] Token response missing access_token:', token);
            return NextResponse.redirect(new URL("/?error=token_missing_access_token", appBaseUrl));
        }

        const res = NextResponse.redirect(new URL("/", appBaseUrl));

        const maxAge = token.expires_in || 30 * 24 * 60 * 60; // Default 30 days

        res.cookies.set("access_token", token.access_token, {
            httpOnly: true,
            secure: !isLocalhost,
            sameSite: "lax",
            path: "/",
            maxAge,
        });

        if (token.refresh_token) {
            res.cookies.set("refresh_token", token.refresh_token, {
                httpOnly: true,
                secure: !isLocalhost,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 24 * 60 * 60, // 60 days
            });
        }

        console.log('[auth/callback] Successfully exchanged token and set cookies for user.');
        return res;
    } catch (err) {
        console.error('[auth/callback] Uncaught error during callback:', err);
        const fallbackUrl = process.env.NEXT_PUBLIC_APP_URI || "https://kasir.alkaysan.com";
        return NextResponse.redirect(new URL(`/?error=server_error&msg=${encodeURIComponent(err.message)}`, fallbackUrl));
    }
}