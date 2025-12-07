import { NextRequest, NextResponse } from 'next/server';
import { botApi } from '@/lib/botApi';

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    try {
        const params = await props.params;
        // console.log('[API Proxy] GET params:', params);
        if (!params || !params.path) {
            return NextResponse.json({ error: 'Invalid path parameters' }, { status: 400 });
        }

        const path = params.path.join('/');

        // Map path to botApi calls
        if (path === 'guilds') {
            const data = await botApi.getGuilds();
            return NextResponse.json(data);
        }

        if (path.match(/^guilds\/\d+\/channels$/)) {
            const guildId = params.path[1];
            const data = await botApi.getChannels(guildId);
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
    } catch (error: any) {
        console.error('[API Proxy] GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    try {
        const params = await props.params;
        // console.log('[API Proxy] POST params:', params);
        if (!params || !params.path) {
            return NextResponse.json({ error: 'Invalid path parameters' }, { status: 400 });
        }

        const path = params.path.join('/');
        const body = await req.json();

        if (path === 'messages/send') {
            const data = await botApi.sendEmbed(body);
            return NextResponse.json(data);
        }
        if (path === 'messages/edit') {
            const data = await botApi.editEmbed(body);
            return NextResponse.json(data);
        }
        if (path === 'messages/resend') {
            const data = await botApi.resendEmbed(body);
            return NextResponse.json(data);
        }
        if (path === 'messages/delete') {
            const data = await botApi.deleteMessage(body);
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
    } catch (error: any) {
        console.error('[API Proxy] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
