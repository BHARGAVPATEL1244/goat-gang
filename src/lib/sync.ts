import { createClient } from '@supabase/supabase-js';
import { parseUser } from '@/utils/nameParser';

// Types representing the structure of data from the Discord Bot
interface DiscordUser {
    id: string;
    username: string;
    global_name?: string;
    roles: string[];
}

interface BotResponse {
    members: {
        user: DiscordUser;
        roles: string[];
    }[];
}

// Helper: Get Supabase Admin Client (Bypasses RLS)
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('[Sync] Missing Supabase Service Role credentials.');
        return null; // Let the caller handle the error
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

/**
 * Syncs members of a specific neighborhood (district) from Discord to Supabase.
 * 
 * @param hoodId - The database ID of the neighborhood (map_districts.id)
 * @param roleId - The Discord Role ID associated with this neighborhood
 */
export async function syncNeighborhoodMembers(hoodId: string, roleId: string) {
    if (!hoodId || !roleId) {
        throw new Error('Missing hoodId or roleId for sync.');
    }

    // 1. Initialize Admin Client
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        throw new Error('Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY.');
    }

    // 2. Validate Environment Variables for Bot API
    const BOT_API_URL = process.env.BOT_API_URL;
    const BOT_API_KEY = process.env.BOT_API_KEY;

    if (!BOT_API_URL) throw new Error('Configuration Error: Missing BOT_API_URL.');
    // Note: API Key might be optional for some local setups, but required for prod
    // We will warn but proceed if missing, though the request will likely fail 401.

    // 3. Fetch Members from Discord Bot
    const requestUrl = `${BOT_API_URL}/members/list?roleId=${roleId}`;
    console.log(`[Sync] Requesting members from: ${requestUrl}`);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (BOT_API_KEY) {
        headers['x-api-key'] = BOT_API_KEY;
    }

    let discordMembers: BotResponse['members'] = [];

    try {
        const response = await fetch(requestUrl, { method: 'GET', headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Sync] Bot API Failed: ${response.status} - ${errorText}`);
            if (response.status === 401) {
                throw new Error('Bot API Unauthorized: Check BOT_API_KEY in .env.local');
            }
            throw new Error(`Bot API error: ${response.statusText} (${errorText})`);
        }

        const data = await response.json() as BotResponse;
        discordMembers = data.members || [];
        console.log(`[Sync] Successfully fetched ${discordMembers.length} members from Discord.`);

    } catch (error: any) {
        console.error('[Sync] Fetch failed:', error);
        throw error; // Re-throw to be handled by the API route
    }

    // 4. Fetch Role Configurations (Global vs Local Overrides)
    // We fetch these in parallel for speed
    const [globalConfigRes, hoodConfigRes] = await Promise.all([
        supabaseAdmin.from('app_config').select('key, value').in('key', ['coleader_role_id', 'elder_role_id']),
        supabaseAdmin.from('map_districts').select('leader_discord_id, coleader_discord_ids').eq('id', hoodId).single()
    ]);

    const globalConfig = globalConfigRes.data || [];
    const hoodConfig = hoodConfigRes.data;

    const coLeaderRoleIds = (globalConfig.find(c => c.key === 'coleader_role_id')?.value || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const elderRoleIds = (globalConfig.find(c => c.key === 'elder_role_id')?.value || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    console.log(`[Sync] Global Config - CoLeaders: [${coLeaderRoleIds.join(', ')}], Elders: [${elderRoleIds.join(', ')}]`);

    const fixedLeaderId = hoodConfig?.leader_discord_id?.trim();
    // Ensure fixedCoLeaderIds is always an array of strings
    let fixedCoLeaderIds: string[] = [];
    if (Array.isArray(hoodConfig?.coleader_discord_ids)) {
        fixedCoLeaderIds = hoodConfig.coleader_discord_ids;
    } else if (typeof hoodConfig?.coleader_discord_ids === 'string') {
        fixedCoLeaderIds = (hoodConfig.coleader_discord_ids as string).split(',').map(s => s.trim());
    }

    // 5. Process & Map Members to DB Structure
    if (discordMembers.length > 0) {
        // console.log('[Sync] First member sample:', JSON.stringify(discordMembers[0], null, 2));
    }

    const processedMembers = discordMembers
        .filter(m => {
            // Check if member matches expected structure or fallback
            const valid = (m.user && m.user.id) || (m as any).id;
            if (!valid) console.warn('[Sync] Skipping invalid member object:', m);
            return valid;
        })
        .map((m, idx) => {
            let rank = 'Member';

            // Normalize structure: handle { user: { id... } } OR { id... }
            const discordId = m.user?.id || (m as any).id;

            // Username Priority: Nickname (Server Profile) -> Global Name -> Username -> Unknown
            // Note: Bot API might return 'nick' or 'nickname' at top level
            const rawNickname = (m as any).nick || (m as any).nickname;
            const rawUsername = rawNickname || m.user?.global_name || m.user?.username || (m as any).username || (m as any).user?.username || 'Unknown';

            // Clean the name (remove clan tags like [TAG] or {TAG})
            // we use the local helper function inline or import it. importing is cleaner.
            const { cleanName } = parseUser(rawUsername);
            const username = cleanName;

            const roles = m.roles || (m as any)._roles || []; // Fallback for various formats

            // Priority 1: Fixed Overrides (Hood specific)
            if (fixedLeaderId && discordId === fixedLeaderId) {
                rank = 'Leader';
                if (idx === 0) console.log('[Sync Debug] Assigned Leader via Fixed ID');
            } else if (fixedCoLeaderIds.includes(discordId)) {
                rank = 'Co-Leader';
                if (idx === 0) console.log('[Sync Debug] Assigned Co-Leader via Fixed ID');
            }
            // Priority 2: Global Discord Roles (Checks against LIST of valid role IDs)
            else {
                // Check intersection: Does user have ANY of the Co-Leader roles?
                const isCoLeader = roles.some(r => coLeaderRoleIds.includes(r));
                const isElder = roles.some(r => elderRoleIds.includes(r));

                if (isCoLeader) {
                    rank = 'Co-Leader';
                    // if (idx === 0) console.log('[Sync Debug] Assigned Co-Leader via Global Role Match');
                } else if (isElder) {
                    rank = 'Elder';
                    // if (idx === 0) console.log('[Sync Debug] Assigned Elder via Global Role Match');
                }
            }

            return {
                hood_id: hoodId,
                user_id: discordId, // Matches 'user_id' column in DB (stores Discord ID)
                username: username,
                rank: rank
            };
        });

    // 6. Upsert to Supabase
    // Only upsert if we actually have members. If empty, we skip to pruning.
    if (processedMembers.length > 0) {
        // We use a batched upsert, which is efficient
        const { error: upsertError } = await supabaseAdmin
            .from('hood_memberships')
            .upsert(processedMembers, {
                onConflict: 'user_id,hood_id', // Ensure this matches your DB constraint
                ignoreDuplicates: false // We want to update ranks if they changed
            });

        if (upsertError) {
            console.error('[Sync] Database Upsert Failed:', upsertError);
            throw new Error(`Database error: ${upsertError.message}`);
        }
    } else {
        console.log('[Sync] No members found in Discord Role. Proceeding to cleanup...');
    }

    // 7. Auto-Update Neighborhood Leader Name
    // If we identified a Leader, we should update the map_districts.leader_name to match
    const newLeader = processedMembers.find(m => m.rank === 'Leader');
    if (newLeader) {
        console.log(`[Sync] Updating Hood Leader to: ${newLeader.username}`);
        await supabaseAdmin
            .from('map_districts')
            .update({ leader_name: newLeader.username })
            .eq('id', hoodId);
    }

    // 8. Prune Stale Members (Cleanup)
    // Remove members from DB who are no longer in the Discord list
    // We use the "Read-Diff-Delete" Approach (Fail-proof)
    const currentMemberIds = processedMembers.map(m => m.user_id);

    // Fetch checks for existing members
    const { data: existingMembers } = await supabaseAdmin
        .from('hood_memberships')
        .select('user_id')
        .eq('hood_id', hoodId);

    // Fetch hood name for better logging
    const { data: hoodData } = await supabaseAdmin
        .from('map_districts')
        .select('name')
        .eq('id', hoodId)
        .single();

    const hoodNameLog = hoodData?.name || hoodId;

    if (existingMembers) {
        const toDelete = existingMembers
            .map(m => m.user_id)
            .filter(id => !currentMemberIds.includes(id));

        console.log(`[Sync] Hood "${hoodNameLog}": DB has ${existingMembers.length}, Discord List has ${currentMemberIds.length}. Stale Members: ${toDelete.length}`);

        if (toDelete.length > 0) {
            console.log(`[Sync] Pruning ${toDelete.length} stale members from "${hoodNameLog}":`, toDelete);
            await supabaseAdmin
                .from('hood_memberships')
                .delete()
                .eq('hood_id', hoodId)
                .in('user_id', toDelete);
            console.log(`[Sync] Pruning Complete for "${hoodNameLog}".`);
        } else {
            console.log(`[Sync] No stale members to prune for "${hoodNameLog}".`);
        }
    }

    return { success: true, count: processedMembers.length };
}
