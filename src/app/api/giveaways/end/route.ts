import { NextResponse } from 'next/server';

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001'; // Should be env var
const BOT_API_KEY = process.env.BOT_API_KEY || process.env.API_KEY || 'goat_gang_secret_key_12345';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { guildId, channelId, messageId, winners } = body;

        // Call Bot API to end giveaway
        const botRes = await fetch(`${BOT_API_URL}/giveaways/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': BOT_API_KEY
            },
            body: JSON.stringify({
                guildId,
                channelId,
                messageId,
                winners // Array of user IDs
            })
        });

        const botData = await botRes.json();

        if (!botData.success) {
            return NextResponse.json({ success: false, error: botData.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: botData });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
