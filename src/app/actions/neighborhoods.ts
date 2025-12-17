'use server';

import { supabase } from '@/lib/supabase';
import { NeighborhoodDB } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from './audit';

export async function getNeighborhoods() {
    const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching neighborhoods:', error);
        return [];
    }

    return data as NeighborhoodDB[];
}

export async function createNeighborhood(neighborhood: Partial<NeighborhoodDB>) {
    const { data, error } = await supabase
        .from('neighborhoods')
        .insert([neighborhood])
        .select();

    if (error) {
        console.error('Error creating neighborhood:', error);
        return { success: false, error: error.message };
    }

    // Log Action
    await logAdminAction('CREATE_HOOD', { name: neighborhood.name });

    revalidatePath('/neighborhoods');
    revalidatePath('/admin');
    return { success: true, data };
}

export async function updateNeighborhood(id: string, neighborhood: Partial<NeighborhoodDB>) {
    const { data, error } = await supabase
        .from('neighborhoods')
        .update(neighborhood)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating neighborhood:', error);
        return { success: false, error: error.message };
    }

    // Log Action
    await logAdminAction('UPDATE_HOOD', { id, updates: Object.keys(neighborhood) });

    revalidatePath('/neighborhoods');
    revalidatePath('/admin');
    return { success: true, data };
}

export async function deleteNeighborhood(id: string) {
    const { error } = await supabase
        .from('neighborhoods')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting neighborhood:', error);
        return { success: false, error: error.message };
    }

    // Log Action
    await logAdminAction('DELETE_HOOD', { id });

    revalidatePath('/neighborhoods');
    revalidatePath('/admin');
    return { success: true };
}
