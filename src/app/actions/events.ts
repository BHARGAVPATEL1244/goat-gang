'use server';

import { supabase } from '@/lib/supabase';
import { EventDB } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getEvents() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }); // Fallback sorting

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return data as EventDB[];
}

export async function createEvent(event: Partial<EventDB>) {
    const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select();

    if (error) {
        console.error('Error creating event:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/events');
    revalidatePath('/admin');
    return { success: true, data };
}

export async function updateEvent(id: string, event: Partial<EventDB>) {
    const { data, error } = await supabase
        .from('events')
        .update(event)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating event:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/events');
    revalidatePath('/admin');
    return { success: true, data };
}

export async function deleteEvent(id: string) {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting event:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/events');
    revalidatePath('/admin');
    return { success: true };
}
