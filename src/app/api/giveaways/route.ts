import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BOT_API_URL = 'http://localhost:3001'; // Should be env var in prod
const BOT_API_KEY = process.env.API_KEY || 'goat_gang_secret_key_12345'; // Should be env var

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { guildId, channelId, title, description, prize, winners, duration, createdBy } = body;

        // 1. Call Bot API to create Discord Message
        const botRes = await fetch(`${BOT_API_URL}/giveaways/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': BOT_API_KEY
            },
            body: JSON.stringify({
                guildId,
                channelId,
                title,
                description,
                prize,
                winners,
                duration, // ms
                createdBy
            })
        });

        const botData = await botRes.json();

        if (!botData.success) {
            return NextResponse.json({ success: false, error: botData.error }, { status: 500 });
        }

        // 2. Save to Supabase
        const { data, error } = await supabase
            .from('giveaways')
            .insert([{
                guild_id: guildId,
                channel_id: channelId,
                message_id: botData.messageId,
                title,
                description,
                prize,
                winners,
                end_time: botData.endTime,
                created_by: createdBy,
                status: 'running'
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            console.error('Data attempted:', {
                guild_id: guildId,
                channel_id: channelId,
                message_id: botData.messageId,
                title,
                description,
                prize,
                winners,
                end_time: botData.endTime,
                created_by: createdBy,
                status: 'running'
            });
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Fetch all giveaways
    const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}
