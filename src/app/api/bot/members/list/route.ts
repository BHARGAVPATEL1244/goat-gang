import { NextResponse } from 'next/server';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
const BOT_API_KEY = process.env.BOT_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId') || '';

    if (!roleId) {
        return NextResponse.json({ error: 'Role ID required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${BOT_API_URL}/members/list?roleId=${roleId}`, {
            headers: {
                'x-api-key': BOT_API_KEY!,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch members' }, { status: 500 });
    }
}
