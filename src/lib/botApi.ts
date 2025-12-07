import 'server-only';

const API_URL = process.env.BOT_API_URL;
const API_KEY = process.env.BOT_API_KEY;

if (!API_URL || !API_KEY) {
    console.error('BOT_API_URL or BOT_API_KEY is missing in environment variables');
}

type ApiMethod = 'GET' | 'POST';

async function fetchBot(endpoint: string, method: ApiMethod = 'GET', body?: any) {
    if (!API_URL || !API_KEY) {
        throw new Error('Bot API configuration missing');
    }

    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        cache: 'no-store', // Always fetch fresh data
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Bot API Error: ${response.statusText}`);
        }

        return data;
    } catch (error: any) {
        console.error(`[BotAPI] Error fetching ${endpoint}:`, error);
        throw error;
    }
}

export const botApi = {
    getGuilds: () => fetchBot('/guilds'),
    getChannels: (guildId: string) => fetchBot(`/guilds/${guildId}/channels`),
    sendEmbed: (payload: any) => fetchBot('/messages/send', 'POST', payload),
    editEmbed: (payload: any) => fetchBot('/messages/edit', 'POST', payload),
    resendEmbed: (payload: any) => fetchBot('/messages/resend', 'POST', payload),
    deleteMessage: (payload: any) => fetchBot('/messages/delete', 'POST', payload),
};
