import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  resolveRole,
  getRoleDisplay,
  ROLE_PERMISSIONS,
  type AppRole,
} from '@/lib/rbac';

describe('RBAC System', () => {
  describe('resolveRole', () => {
    it('resolves valid GDD roles', () => {
      expect(resolveRole('SuperAdmin')).toBe('SuperAdmin');
      expect(resolveRole('Governor')).toBe('Governor');
      expect(resolveRole('Mentor')).toBe('Mentor');
      expect(resolveRole('Hero')).toBe('Hero');
      expect(resolveRole('Gladiator')).toBe('Gladiator');
      expect(resolveRole('Steward')).toBe('Steward');
      expect(resolveRole('Guest')).toBe('Guest');
    });

    it('maps legacy roles to GDD roles', () => {
      expect(resolveRole('ClubMember')).toBe('Hero');
      expect(resolveRole('NewUser')).toBe('Hero');
      expect(resolveRole('Monitor')).toBe('Mentor');
      expect(resolveRole('Student')).toBe('Hero');
    });

    it('returns undefined for null/undefined/unknown', () => {
      expect(resolveRole(null)).toBeUndefined();
      expect(resolveRole(undefined)).toBeUndefined();
      expect(resolveRole('')).toBeUndefined();
      expect(resolveRole('RandomRole')).toBeUndefined();
    });
  });

  describe('hasPermission', () => {
    it('SuperAdmin has all permissions', () => {
      expect(hasPermission('SuperAdmin', 'admin.all')).toBe(true);
      expect(hasPermission('SuperAdmin', 'manage.organization')).toBe(true);
      expect(hasPermission('SuperAdmin', 'play.arena')).toBe(true);
    });

    it('Governor can manage but not admin', () => {
      expect(hasPermission('Governor', 'manage.organization')).toBe(true);
      expect(hasPermission('Governor', 'manage.billing')).toBe(true);
      expect(hasPermission('Governor', 'admin.all')).toBe(false);
    });

    it('Mentor can validate and assign but not manage org', () => {
      expect(hasPermission('Mentor', 'validate.progress')).toBe(true);
      expect(hasPermission('Mentor', 'assign.tasks')).toBe(true);
      expect(hasPermission('Mentor', 'manage.organization')).toBe(false);
      expect(hasPermission('Mentor', 'manage.billing')).toBe(false);
    });

    it('Hero has classroom and play but no management', () => {
      expect(hasPermission('Hero', 'view.classroom')).toBe(true);
      expect(hasPermission('Hero', 'play.arena')).toBe(true);
      expect(hasPermission('Hero', 'manage.members')).toBe(false);
      expect(hasPermission('Hero', 'admin.all')).toBe(false);
    });

    it('Guest has minimal access', () => {
      expect(hasPermission('Guest', 'view.clubs')).toBe(true);
      expect(hasPermission('Guest', 'view.shop')).toBe(true);
      expect(hasPermission('Guest', 'play.arena')).toBe(false);
      expect(hasPermission('Guest', 'admin.all')).toBe(false);
    });

    it('handles legacy roles through resolveRole', () => {
      expect(hasPermission('ClubMember', 'view.classroom')).toBe(true);
      expect(hasPermission('Monitor', 'validate.progress')).toBe(true);
    });

    it('returns false for undefined/null role', () => {
      expect(hasPermission(undefined, 'view.clubs')).toBe(false);
      expect(hasPermission('', 'view.clubs')).toBe(false);
    });
  });

  describe('getRoleDisplay', () => {
    it('returns correct display for each role', () => {
      const governor = getRoleDisplay('Governor');
      expect(governor.icon).toBe('🏛️');
      expect(governor.label).toBe('The Governor');
      expect(governor.color).toContain('purple');

      const hero = getRoleDisplay('Hero');
      expect(hero.icon).toBe('⚔️');
      expect(hero.label).toBe('The Hero');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('all roles have view.clubs permission except none', () => {
      const roles = Object.keys(ROLE_PERMISSIONS) as AppRole[];
      roles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toContain('view.clubs');
      });
    });

    it('permission hierarchy is respected (SuperAdmin ⊃ Governor ⊃ Hero)', () => {
      const superAdminPerms = ROLE_PERMISSIONS.SuperAdmin;
      const governorPerms = ROLE_PERMISSIONS.Governor;
      const heroPerms = ROLE_PERMISSIONS.Hero;

      // Governor permissions should be subset of SuperAdmin
      governorPerms.forEach(perm => {
        expect(superAdminPerms).toContain(perm);
      });

      // Hero permissions should be subset of Governor
      heroPerms.forEach(perm => {
        expect(governorPerms).toContain(perm);
      });
    });
  });
});
