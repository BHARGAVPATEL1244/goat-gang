'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Logs an administrative action to the database.
 * @param action - A short uppercase string (e.g., "DELETE_HOOD")
 * @param details - An object containing relevant metadata (e.g., { id: "123", name: "Old Hood" })
 */
export async function logAdminAction(action: string, details: any = {}) {
    try {
        const supabase = await createClient();

        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn(`[Audit] Attempted to log action '${action}' without authenticated user.`);
            return; // Can't log if we don't know who. Or should we log as 'Anonymous'?
        }

        // 2. Derive User Info
        // Check metadata for Discord info if available
        const meta = user.user_metadata || {};
        const userName = meta.full_name || meta.name || meta.user_name || user.email || 'Unknown User';
        const userId = user.id; // Supabase ID. If you track Discord ID, maybe extract from metadata like `meta.provider_id`

        // 3. Insert Log
        const { error } = await supabase.from('admin_logs').insert([{
            user_id: userId,
            user_name: userName,
            action: action.toUpperCase(),
            details: details
        }]);

        if (error) {
            console.error('[Audit] Failed to write log:', error);
        }

    } catch (err) {
        console.error('[Audit] Unexpected error:', err);
    }
}

export async function getAuditLogs(limit = 50) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching logs:', error);
        return [];
    }

    return data;
}
