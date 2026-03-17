import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { code, redirect_uri, code_verifier } = await req.json();

        if (!code) {
            return NextResponse.json({ success: false, message: 'Authorization code is missing.' }, { status: 400 });
        }

        // Determine which secret to use based on redirect_uri
        const isApp = redirect_uri === 'alkaysan-pos://callback' || 
                      redirect_uri === process.env.NEXT_PUBLIC_APP_REDIRECT_URI;
        const clientId = isApp 
            ? (process.env.NEXT_PUBLIC_APP_CLIENT_ID || "15")
            : (process.env.NEXT_PUBLIC_CLIENT_ID || "14");
        const clientSecret = isApp 
            ? (process.env.APP_CLIENT_SECRET || "OACP34J2HWTF9EHGFCcf4SVT1qa47HPNhsFqc1hA")
            : (process.env.CLIENT_SECRET || "7Jopgub3ewoD82KdZiNZPyAHv1iyWmSigIhip16L");

        // 1. Exchange code for token
        const payload = {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirect_uri || process.env.NEXT_PUBLIC_REDIRECT_URI,
            grant_type: "authorization_code",
            code,
        };

        // Add code_verifier for PKCE if provided
        if (code_verifier) {
            payload.code_verifier = code_verifier;
        }

        const tokenRes = await fetch(process.env.OAUTH_TOKEN_URL || "https://account.alkaysan.co.id/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(payload),
        });

        if (!tokenRes.ok) {
            const errorData = await tokenRes.json();
            console.error('SSO Token Exchange Error:', errorData);
            return NextResponse.json({ success: false, message: 'Failed to exchange token.' }, { status: tokenRes.status });
        }

        const tokens = await tokenRes.json();

        // 2. Fetch user profile
        const profileRes = await fetch('https://account.alkaysan.co.id/api/v1/user/get/me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/json'
            }
        });

        if (!profileRes.ok) {
            return NextResponse.json({ success: false, message: 'Failed to fetch user profile.' }, { status: profileRes.status });
        }

        const profile = await profileRes.json();

        // 3. Set cookies and return success
        const response = NextResponse.json({ success: true, profile });
        
        response.cookies.set("access_token", tokens.access_token, { 
            httpOnly: true, 
            secure: true, 
            sameSite: "lax", 
            path: "/",
            maxAge: tokens.expires_in || 3600
        });

        if (tokens.refresh_token) {
            response.cookies.set("refresh_token", tokens.refresh_token, { 
                httpOnly: true, 
                secure: true, 
                sameSite: "lax", 
                path: "/" 
            });
        }

        return response;

    } catch (error) {
        console.error('SSO Callback Route Error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}
