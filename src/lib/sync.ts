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

    // 4. Fetch Neighborhood Configuration (Fixed Leader ID)
    const { data: hoodConfig } = await supabaseAdmin
        .from('map_districts')
        .select('leader_discord_id, name')
        .eq('id', hoodId)
        .single();

    const fixedLeaderId = hoodConfig?.leader_discord_id?.trim();
    const hoodNameLog = hoodConfig?.name || hoodId;

    // 5. Process & Map Members to DB Structure
    // Simplified Logic: 
    // - Leader: Matches fixedLeaderId
    // - Member: Everyone else
    // - No Co-Leaders, No Elders

    const processedMembers = discordMembers
        .filter(m => {
            const valid = (m.user && m.user.id) || (m as any).id;
            if (!valid) console.warn('[Sync] Skipping invalid member object:', m);
            return valid;
        })
        .map((m, idx) => {
            let rank = 'Member';

            // Normalize structure
            const discordId = m.user?.id || (m as any).id;

            // Username Priority: Nickname (Server Profile) -> Global Name -> Username -> Unknown
            const rawNickname = (m as any).nick || (m as any).nickname;
            const rawUsername = rawNickname || m.user?.global_name || m.user?.username || (m as any).username || (m as any).user?.username || 'Unknown';

            // Clean the name
            // Note: We store the RAW name in the DB to preserve Level/Tag info for the UI to parse.
            // Converting to cleanName here would lose the level data forever.
            const username = rawUsername;

            // Strict Leader Check
            if (fixedLeaderId && discordId === fixedLeaderId) {
                rank = 'Leader';
                console.log(`[Sync] Identified Leader: ${username} (${discordId})`);
            }

            return {
                hood_id: hoodId,
                user_id: discordId,
                username: username,
                rank: rank
            };
        });

    // 6. Upsert to Supabase
    if (processedMembers.length > 0) {
        const { error: upsertError } = await supabaseAdmin
            .from('hood_memberships')
            .upsert(processedMembers, {
                onConflict: 'user_id,hood_id',
                ignoreDuplicates: false // Update rank if changed (e.g. Member -> Leader)
            });

        if (upsertError) {
            console.error('[Sync] Database Upsert Failed:', upsertError);
            throw new Error(`Database error: ${upsertError.message}`);
        }
    } else {
        console.log('[Sync] No members found in Discord Role. Proceeding to cleanup...');
    }

    // 7. Auto-Update Neighborhood Leader Name
    const newLeader = processedMembers.find(m => m.rank === 'Leader');
    if (newLeader) {
        console.log(`[Sync] Updating Hood Leader Name in map_districts to: ${newLeader.username}`);
        await supabaseAdmin
            .from('map_districts')
            .update({ leader_name: newLeader.username })
            .eq('id', hoodId);
    }

    // 8. Prune Stale Members (Cleanup)
    const currentMemberIds = processedMembers.map(m => m.user_id);

    // Fetch existing members
    const { data: existingMembers } = await supabaseAdmin
        .from('hood_memberships')
        .select('user_id')
        .eq('hood_id', hoodId);

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
