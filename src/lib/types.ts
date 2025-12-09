export interface BarCounts {
    silver: number;
    gold: number;
    platinum: number;
    iron: number;
    coal: number;
}

export interface Entry {
    id: string;
    type: 'donation' | 'request';
    farmName: string;
    username: string;
    neighborhood: string;
    bars: BarCounts;
    timestamp: string;
}

export interface Neighborhood {
    id: string;
    name: string;
    image: string;
    text_color: string; // Changed from textColor to match DB convention if needed, or keep camelCase and map it. Let's keep camelCase in TS and map in actions.
    // Actually, let's stick to the SQL snake_case for the DB columns but map them. 
    // For simplicity, I'll use camelCase here and handle mapping in the fetcher.
    // Wait, Supabase returns snake_case by default. Let's use snake_case in types to avoid manual mapping hell.
    textColor?: string; // keeping for backward compat with mock for a moment, but will switch.
    requirements: string[];
    derby_requirements?: string;
    tag: string;
    leader: string;
}

// Let's redefine to match Supabase response exactly for easier integration
export interface NeighborhoodDB {
    id: string;
    name: string;
    image: string;
    text_color: string;
    requirements: string[];
    derby_requirements: string[];
    tag: string;
    leader: string;
    created_at?: string;
}

export interface EventDB {
    id: string;
    name: string;
    image: string;
    category: 'Main' | 'Mini' | 'Weekly Derby';
    date?: string;
    winners: string[];
    host: string;
    sponsors: { name: string; amount: string }[];
    created_at?: string;
}

export interface RolePermission {
    id: string;
    role_id: string;
    role_name: string;
    permissions: string[];
    created_at?: string;
}
