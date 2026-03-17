import { NextResponse } from 'next/server';

export async function POST() {
    const res = NextResponse.json({ ok: true, message: 'Logged out successfully' });

    // Clear authentication cookies
    res.cookies.set('access_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date(0)
    });

    res.cookies.set('refresh_token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        expires: new Date(0)
    });

    return res;
}
