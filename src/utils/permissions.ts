/**
 * Centralized RBAC Permissions Logic with Hierarchy
 */

const ROLES = {
    ADMIN: (process.env.NEXT_PUBLIC_DISCORD_ADMIN_ROLE_IDS || '').split(','),
    LEADER: process.env.NEXT_PUBLIC_DISCORD_LEADER_ROLE_ID || '',
    CO_LEADER: process.env.NEXT_PUBLIC_DISCORD_COLEADER_ROLE_ID || '',
    BAR_COLLECTOR: process.env.NEXT_PUBLIC_DISCORD_BAR_COLLECTOR_ROLE_ID || '',
};

// Super‑admin user IDs (override all role checks)
const SUPER_ADMINS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');

// Hierarchy Levels (Higher number = Higher Rank)
const ROLE_LEVELS = {
    ADMIN: 3,
    LEADER: 2,
    CO_LEADER: 1,
    MEMBER: 0
};

export const PERMISSIONS = {
    ROLES,

    /**
     * Checks if a user has any of the required roles (Basic Check).
     */
    hasRole: (userRoles: string[], requiredRoles: string | string[]): boolean => {
        if (!userRoles || userRoles.length === 0) return false;
        const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return userRoles.some(role => required.includes(role));
    },

    /**
     * Helper to get the numeric level of a user's highest role.
     */
    getRoleLevel: (userRoles: string[]): number => {
        if (!userRoles || userRoles.length === 0) return ROLE_LEVELS.MEMBER;

        if (PERMISSIONS.hasRole(userRoles, ROLES.ADMIN)) return ROLE_LEVELS.ADMIN;
        if (PERMISSIONS.hasRole(userRoles, ROLES.LEADER)) return ROLE_LEVELS.LEADER;
        if (PERMISSIONS.hasRole(userRoles, ROLES.CO_LEADER)) return ROLE_LEVELS.CO_LEADER;

        return ROLE_LEVELS.MEMBER;
    },

    /**
     * Checks if user meets a minimum role level (Inheritance).
     */
    hasMinRoleLevel: (userRoles: string[], minLevel: number): boolean => {
        return PERMISSIONS.getRoleLevel(userRoles) >= minLevel;
    },

    // --- Feature Permissions ---

    isAdmin: (userRoles: string[]): boolean => {
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.ADMIN);
    },
    // Determines if a user is admin either by role hierarchy or by being listed as a super‑admin
    hasAdminAccess: (userRoles: string[], userId: string): boolean => {
        if (SUPER_ADMINS.includes(userId)) return true;
        // Check if user has ANY access level (Co-Leader or above) OR the specific Bar Collector role
        // This ensures anyone who can access ANY part of the dashboard sees the link
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.CO_LEADER) ||
            PERMISSIONS.hasRole(userRoles, ROLES.BAR_COLLECTOR);
    },

    canManageNeighborhoods: (userRoles: string[]): boolean => {
        // Requires ADMIN Level (Admin only)
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.ADMIN);
    },

    canManageEvents: (userRoles: string[]): boolean => {
        // Requires ADMIN Level (Admin only)
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.ADMIN);
    },

    canManageFarmNames: (userRoles: string[]): boolean => {
        // Requires CO_LEADER Level 
        // (Automatically includes Leader and Admin due to >= check)
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.CO_LEADER);
    },

    canManageData: (userRoles: string[]): boolean => {
        // Special Case: Admin OR Bar Collector (Lateral Permission)
        return PERMISSIONS.isAdmin(userRoles) || PERMISSIONS.hasRole(userRoles, ROLES.BAR_COLLECTOR);
    },

    canViewBarLeaderboard: (userRoles: string[]): boolean => {
        // Special Case: Admin OR Bar Collector
        return PERMISSIONS.isAdmin(userRoles) || PERMISSIONS.hasRole(userRoles, ROLES.BAR_COLLECTOR);
    }
};
