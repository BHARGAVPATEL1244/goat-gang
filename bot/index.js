const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Initialize the Client with necessary intents
// GuildMembers is required to listen to member updates
// ManageNicknames permission is required for the bot in the server
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.GuildMember]
});

// Regex to detect Country Flag Emojis (Regional Indicator Symbols)
// Matches any sequence of 2 regional indicator characters
const FLAG_REGEX = /[\uD83C\uDDE6-\uD83C\uDDFF]{2}/u;

client.on('ready', () => {
    console.log(`logged in as ${client.user.tag}`);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        // 1. Check if nickname changed (or if they just joined/updated roles and still have a bad name)
        const oldNick = oldMember.nickname || oldMember.user.username;
        const newNick = newMember.nickname || newMember.user.username;

        // If name hasn't changed, we might still want to check (e.g. role update), 
        // but primarily we care about the current state of 'newMember'

        // 2. Check for Flags in the CURRENT name
        if (FLAG_REGEX.test(newNick)) {
            console.log(`[FlagFilter] Flag detected in user: ${newMember.user.tag} (${newNick})`);

            // 3. Remove flags
            // Replace all instances of the flag pattern with an empty string
            // We use a global regex for replacement
            const cleanNick = newNick.replace(/[\uD83C\uDDE6-\uD83C\uDDFF]{2}/gu, '').trim();

            // 4. Update the nickname
            // Ensure the bot has permissions and isn't trying to enforce on owner/higher roles
            if (newMember.manageable) {
                // If the name becomes empty (e.g. name was just a flag), fallback to username or default
                const finalNick = cleanNick.length > 0 ? cleanNick : 'Member';

                await newMember.setNickname(finalNick);
                console.log(`[FlagFilter] Renamed ${newMember.user.tag} to "${finalNick}"`);
            } else {
                console.log(`[FlagFilter] Cannot manage user: ${newMember.user.tag} (Role hierarchy or missing permissions)`);
            }
        }
    } catch (error) {
        console.error('[FlagFilter] Error processing member update:', error);
    }
});

// Start the bot
// Ensure DISCORD_TOKEN is set in your environment
if (!process.env.DISCORD_TOKEN) {
    console.error('Error: DISCORD_TOKEN is missing in environment variables.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
