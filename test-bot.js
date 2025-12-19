// const fetch = require('node_fetch'); // Using native fetch in Node 18+

const BOT_API_URL = 'https://goat-gang-bot.onrender.com'; // Hardcoded for test
const ROLE_ID = '1365416266306813992'; // User provided ID
const API_KEY = process.env.BOT_API_KEY || ''; // Optional

async function testBot() {
    console.log(`Testing Bot API at: ${BOT_API_URL}/members/list?roleId=${ROLE_ID}`);
    try {
        const response = await fetch(`${BOT_API_URL}/members/list?roleId=${ROLE_ID}`, {
            headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Body: ${text}`);
    } catch (e) {
        console.error('Error:', e);
    }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
    console.error('This script requires Node 18+ or node-fetch.');
} else {
    testBot();
}
