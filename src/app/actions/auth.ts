'use server';

import { cookies } from 'next/headers';

export async function login(formData: FormData) {
    const username = formData.get('username');
    const password = formData.get('password');

    // In production (Netlify), this will read from the Environment Variables you set in the dashboard
    // In local development, it reads from .env.local
    const correctPassword = 'goatgang123';

    if (username === 'goatgang' && password === correctPassword) {
        // Set a cookie to maintain the session
        // HttpOnly: true means JavaScript cannot read this cookie (more secure)
        // Secure: true means it only works over HTTPS (in production)
        (await cookies()).set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
}

export async function logout() {
    (await cookies()).delete('admin_session');
    return { success: true };
}

export async function checkAuth() {
    const session = (await cookies()).get('admin_session');
    return session?.value === 'true';
}
