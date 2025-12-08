import { NextResponse } from 'next/server';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001'; // Should be env var
const BOT_API_KEY = process.env.BOT_API_KEY || process.env.API_KEY || 'goat_gang_secret_key_12345';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const botRes = await fetch(`${BOT_API_URL}/members/${userId}`, {
            headers: {
                'x-api-key': BOT_API_KEY
            },
            cache: 'no-store'
        });

        const contentType = botRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await botRes.json();
            return NextResponse.json(data);
        } else {
            const text = await botRes.text();
            console.error('Bot API returned non-JSON:', text.slice(0, 500)); // Log first 500 chars
            return NextResponse.json({ success: false, error: 'Bot API returned invalid response', details: text.slice(0, 100) }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Membership API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


