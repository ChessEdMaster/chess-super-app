export type AppRole = 'SuperAdmin' | 'ClubMember' | 'Guest' | 'NewUser';

export type Permission =
    | 'admin.all'
    | 'view.clubs'
    | 'manage.club'
    | 'view.academy'
    | 'view.profile'
    | 'view.market';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
    SuperAdmin: [
        'admin.all',
        'view.clubs',
        'manage.club',
        'view.academy',
        'view.profile',
        'view.market'
    ],
    ClubMember: [
        'view.clubs',
        'view.academy',
        'view.profile'
    ],
    NewUser: [
        'view.clubs',
        'view.profile'
    ],
    Guest: [
        'view.clubs'
    ]
};

export function hasPermission(role: AppRole | undefined, permission: Permission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission) || permissions.includes('admin.all');
}
