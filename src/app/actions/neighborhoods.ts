'use server';

import { supabase } from '@/lib/supabase';
import { NeighborhoodDB } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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

    revalidatePath('/neighborhoods');
    revalidatePath('/admin');
    return { success: true };
}
