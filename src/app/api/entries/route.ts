import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Entry } from '@/lib/types';

// Helper to map DB row to Entry type
const mapRowToEntry = (row: any): Entry => ({
    id: row.id,
    type: row.type as 'donation' | 'request',
    farmName: row.farm_name,
    username: row.username,
    neighborhood: row.neighborhood,
    bars: row.bars,
    timestamp: row.timestamp
});

export async function GET() {
    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries = data.map(mapRowToEntry);
    return NextResponse.json(entries);
}

export async function POST(request: Request) {
    try {
        const entry: Entry = await request.json();

        const { data, error } = await supabase
            .from('entries')
            .insert([{
                type: entry.type,
                farm_name: entry.farmName,
                username: entry.username,
                neighborhood: entry.neighborhood,
                bars: entry.bars,
                timestamp: entry.timestamp || new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: mapRowToEntry(data) });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to save entry' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const entry: Entry = await request.json();

        const { data, error } = await supabase
            .from('entries')
            .update({
                type: entry.type,
                farm_name: entry.farmName,
                username: entry.username,
                neighborhood: entry.neighborhood,
                bars: entry.bars,
                // timestamp: entry.timestamp // Usually don't update timestamp on edit, or maybe update a 'updated_at' field
            })
            .eq('id', entry.id)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: mapRowToEntry(data) });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update entry' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
        }

        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete entry' }, { status: 500 });
    }
}
