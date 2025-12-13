export interface ParsedUser {
    cleanName: string;
    level: string | null;
}

export function parseUser(name: string): ParsedUser {
    if (!name) return { cleanName: 'Unknown', level: null };

    // 1. Extract Level from [123] or (123)
    const levelMatch = name.match(/\[(\d+)\]/) || name.match(/\((\d+)\)/);
    let level = levelMatch ? levelMatch[1] : null;

    // 2. Remove tags like [TAG] or [123] from name
    let clean = name
        .replace(/\[.*?\]/g, '') // Remove [] content
        .replace(/\(.*?\)/g, '') // Remove () content
        .trim();

    // 3. Remove leading/trailing symbols often used in gamer tags


    return {
        cleanName: clean || name, // Fallback to original if everything removed
        level
    };
}
