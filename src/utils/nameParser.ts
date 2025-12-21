export interface ParsedUser {
    cleanName: string;
    level: string | null;
}

export function parseUser(name: string): ParsedUser {
    if (!name) return { cleanName: 'Unknown', level: null };

    // 1. Extract Level from [123] or (123)
    const levelMatch = name.match(/\[(\d+)\]/) || name.match(/\((\d+)\)/);
    let level = levelMatch ? levelMatch[1] : null;

    // 2. Strict Clean: Search for first '[' and take everything before it
    const clean = name.split('[')[0].trim();

    return {
        cleanName: clean || name, // Fallback to original if valid
        level
    };
}
