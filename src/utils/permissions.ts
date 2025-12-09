/**
 * Centralized RBAC Permissions Logic with Hierarchy
 */

import { RolePermission } from '@/lib/types';

const ROLES = {
    ADMIN: (process.env.NEXT_PUBLIC_DISCORD_ADMIN_ROLE_IDS || '').split(','),
    LEADER: process.env.NEXT_PUBLIC_DISCORD_LEADER_ROLE_ID || '',
    CO_LEADER: process.env.NEXT_PUBLIC_DISCORD_COLEADER_ROLE_ID || '',
    BAR_COLLECTOR: process.env.NEXT_PUBLIC_DISCORD_BAR_COLLECTOR_ROLE_ID || '',
};

// ... (rest of constants)




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
    hasAdminAccess: (userRoles: string[], userId: string, dbPermissions?: RolePermission[]): boolean => {
        if (SUPER_ADMINS.includes(userId)) return true;

        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'VIEW_ADMIN_DASHBOARD') || PERMISSIONS.isAdmin(userRoles);
        }

        // Fallback or Legacy check
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.CO_LEADER) ||
            PERMISSIONS.hasRole(userRoles, ROLES.BAR_COLLECTOR);
    },

    canManageNeighborhoods: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'MANAGE_NEIGHBORHOODS') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.ADMIN);
    },

    canManageEvents: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'MANAGE_EVENTS') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.ADMIN);
    },

    canManageFarmNames: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'MANAGE_FARM_NAMES') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.CO_LEADER);
    },

    canManageData: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'MANAGE_FARM_DATA') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.isAdmin(userRoles) || PERMISSIONS.hasRole(userRoles, ROLES.BAR_COLLECTOR);
    },

    canViewBarLeaderboard: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'VIEW_BAR_LEADERBOARD') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.isAdmin(userRoles) || PERMISSIONS.hasRole(userRoles, ROLES.BAR_COLLECTOR);
    },

    canManageEmbeds: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'MANAGE_EMBEDS') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.isAdmin(userRoles);
    },

    canManageGiveaways: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        if (dbPermissions) {
            return PERMISSIONS.hasPermission(userRoles, dbPermissions, 'MANAGE_GIVEAWAYS') || PERMISSIONS.isAdmin(userRoles);
        }
        return PERMISSIONS.isAdmin(userRoles);
    },

    canManagePermissions: (userRoles: string[], dbPermissions?: RolePermission[]): boolean => {
        // Permissions management is restricted to Super Admins (via isAdmin) for now to prevent lockout
        // or specifically granted via DB if we want self-managing admins.
        // Let's allow it if explicitly granted 'MANAGE_PERMISSIONS' (if we add that key) 
        // OR simply restrict to hardcoded Admins for safety during transition.
        return PERMISSIONS.hasMinRoleLevel(userRoles, ROLE_LEVELS.ADMIN);
    },

    /**
     * Checks if user has a specific permission based on the DB check.
     */
    hasPermission: (userRoles: string[], rolePermissions: RolePermission[], requiredPermission: string): boolean => {
        const matchingRules = rolePermissions.filter(rule => userRoles.includes(rule.role_id));
        return matchingRules.some(rule => rule.permissions.includes(requiredPermission));
    }
};
