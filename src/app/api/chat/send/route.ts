import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BRIDGE_CHANNEL_ID = process.env.BRIDGE_CHANNEL_ID;

export async function POST(request: Request) {
    // 1. Check Configuration
    if (!DISCORD_WEBHOOK_URL) {
        return NextResponse.json({ error: 'Chat Bridge not configured (Missing Webhook)' }, { status: 503 });
    }

    try {
        // 2. Authenticate User
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Parse Metadata (To simulate the user "Clone")
        // We use the metadata stored in Supabase Auth (provider info)
        const { full_name, name, avatar_url, picture } = user.user_metadata;
        const username = full_name || name || user.email?.split('@')[0] || 'Unknown User';
        const avatar = avatar_url || picture || 'https://cdn.discordapp.com/embed/avatars/0.png';

        const body = await request.json();
        const content = body.content?.trim();

        if (!content) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        if (content.length > 2000) {
            return NextResponse.json({ error: 'Message too long' }, { status: 400 });
        }

        // 4. Rate Limiting (Basic)
        // Ideally we check Redis, but for MVP we rely on Discord's own webhook rate limits or add a simple check.
        // We will skip complex rate limiting for now.

        // 5. Send to Discord Webhook
        const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content,
                username: username, // Send pure username
                avatar_url: avatar,
                // allowed_mentions: { parse: [] } // Disable @everyone
            })
        });

        if (!discordRes.ok) {
            console.error('[ChatBridge] Webhook failed:', await discordRes.text());
            return NextResponse.json({ error: 'Failed to send to Discord' }, { status: 502 });
        }

        // 6. Insert into Supabase (So it appears on Web immediately without waiting for Bot sync)
        // Wait, if we insert here, AND the bot syncs it back from Discord, we get duplicates?
        // Ah! The Bot listener ignores messages from Webhooks?
        // Bot listener code: `if (message.author.bot) return;`
        // Webhooks ARE considered bots. So the Bot listener will IGNORE this message.
        // THEREFORE, we MUST insert it into Supabase manuall here.

        const { error: dbError } = await supabase
            .from('chat_messages')
            .insert({
                content: content,
                author_name: username,
                author_avatar: avatar,
                source: 'web',
                created_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('[ChatBridge] DB Insert failed:', dbError.message);
            // We don't fail the request because Discord sent ok.
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[ChatBridge] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
