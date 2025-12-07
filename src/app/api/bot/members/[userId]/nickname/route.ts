import { NextResponse } from 'next/server';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001';
const BOT_API_KEY = process.env.BOT_API_KEY;

export async function PATCH(request: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;
    const userId = params.userId;
    const body = await request.json();

    try {
        const response = await fetch(`${BOT_API_URL}/members/${userId}/nickname`, {
            method: 'PATCH',
            headers: {
                'x-api-key': BOT_API_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update nickname' }, { status: 500 });
    }
}
