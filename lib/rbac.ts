/**
 * RBAC System — GDD v2.0 Role-Based Access Control
 * 
 * Roles: SuperAdmin, Governor, Mentor, Hero, Gladiator, Steward, Guest
 * See GDD §2 for full role definitions and permission matrix.
 */

export type AppRole =
  | 'SuperAdmin'
  | 'Governor'
  | 'Mentor'
  | 'Hero'
  | 'Gladiator'
  | 'Steward'
  | 'Guest';

export type Permission =
  | 'admin.all'
  | 'manage.organization'
  | 'manage.billing'
  | 'manage.members'
  | 'validate.progress'
  | 'assign.tasks'
  | 'view.classroom'
  | 'view.academy'
  | 'play.arena'
  | 'play.kingdom'
  | 'view.analysis'
  | 'view.shop'
  | 'view.profile'
  | 'view.clubs';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  SuperAdmin: [
    'admin.all',
    'manage.organization',
    'manage.billing',
    'manage.members',
    'validate.progress',
    'assign.tasks',
    'view.classroom',
    'view.academy',
    'play.arena',
    'play.kingdom',
    'view.analysis',
    'view.shop',
    'view.profile',
    'view.clubs',
  ],
  Governor: [
    'manage.organization',
    'manage.billing',
    'manage.members',
    'view.classroom',
    'view.academy',
    'play.arena',
    'play.kingdom',
    'view.analysis',
    'view.shop',
    'view.profile',
    'view.clubs',
  ],
  Mentor: [
    'manage.members',
    'validate.progress',
    'assign.tasks',
    'view.classroom',
    'view.academy',
    'play.arena',
    'play.kingdom',
    'view.analysis',
    'view.shop',
    'view.profile',
    'view.clubs',
  ],
  Hero: [
    'view.classroom',
    'view.academy',
    'play.arena',
    'play.kingdom',
    'view.shop',
    'view.profile',
    'view.clubs',
  ],
  Gladiator: [
    'view.academy',
    'play.arena',
    'play.kingdom',
    'view.analysis',
    'view.shop',
    'view.profile',
    'view.clubs',
  ],
  Steward: [
    'view.academy',
    'play.arena',
    'play.kingdom',
    'view.shop',
    'view.profile',
    'view.clubs',
  ],
  Guest: [
    'view.clubs',
    'view.shop',
  ],
};

/** Legacy role mapping for backward compatibility during migration */
const LEGACY_ROLE_MAP: Record<string, AppRole> = {
  'ClubMember': 'Hero',
  'NewUser': 'Hero',
  'Monitor': 'Mentor',
  'Student': 'Hero',
};

/**
 * Resolve a role string to a valid AppRole, handling legacy role names.
 */
export function resolveRole(role: string | undefined | null): AppRole | undefined {
  if (!role) return undefined;
  if (role in ROLE_PERMISSIONS) return role as AppRole;
  return LEGACY_ROLE_MAP[role] || undefined;
}

/**
 * Check if a role has a specific permission.
 * Handles legacy role names via resolveRole().
 */
export function hasPermission(role: AppRole | string | undefined, permission: Permission): boolean {
  const resolved = resolveRole(role as string);
  if (!resolved) return false;
  const permissions = ROLE_PERMISSIONS[resolved];
  return permissions.includes(permission) || permissions.includes('admin.all');
}

/**
 * Get display info for a role (icon + label).
 */
export function getRoleDisplay(role: AppRole): { icon: string; label: string; color: string } {
  const display: Record<AppRole, { icon: string; label: string; color: string }> = {
    SuperAdmin: { icon: '👑', label: 'Super Admin', color: 'text-red-500' },
    Governor: { icon: '🏛️', label: 'The Governor', color: 'text-purple-500' },
    Mentor: { icon: '🎓', label: 'The Mentor', color: 'text-blue-500' },
    Hero: { icon: '⚔️', label: 'The Hero', color: 'text-amber-500' },
    Gladiator: { icon: '🗡️', label: 'The Gladiator', color: 'text-emerald-500' },
    Steward: { icon: '🤖', label: 'The Steward', color: 'text-cyan-500' },
    Guest: { icon: '👤', label: 'Guest', color: 'text-gray-500' },
  };
  return display[role] || display.Guest;
}
