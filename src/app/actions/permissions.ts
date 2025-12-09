'use server';

import { supabase } from '@/lib/supabase';
import { RolePermission } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getRolePermissions() {
    const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role_name', { ascending: true });

    if (error) {
        console.error('Error fetching role permissions:', error);
        return [];
    }

    return data as RolePermission[];
}

export async function createRolePermission(permission: Partial<RolePermission>) {
    const { data, error } = await supabase
        .from('role_permissions')
        .insert([permission])
        .select();

    if (error) {
        console.error('Error creating role permission:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/permissions');
    revalidatePath('/admin');
    return { success: true, data };
}

export async function updateRolePermission(id: string, permission: Partial<RolePermission>) {
    const { data, error } = await supabase
        .from('role_permissions')
        .update(permission)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating role permission:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/permissions');
    revalidatePath('/admin');
    return { success: true, data };
}

export async function deleteRolePermission(id: string) {
    const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting role permission:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/permissions');
    revalidatePath('/admin');
    return { success: true };
}
