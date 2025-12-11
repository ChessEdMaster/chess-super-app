import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { RoleManagementTable } from './role-management-table'

export default async function AdminRolesPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    )

    // Parallel fetch
    const [rolesRes, permissionsRes, rolePermissionsRes] = await Promise.all([
        supabase.from('app_roles').select('*').order('name'),
        supabase.from('app_permissions').select('*').order('code'),
        supabase.from('app_role_permissions').select('*')
    ])

    if (rolesRes.error || permissionsRes.error || rolePermissionsRes.error) {
        console.error("Error fetching roles data", {
            roles: rolesRes.error,
            perms: permissionsRes.error,
            rp: rolePermissionsRes.error
        })
        return (
            <div className="p-4 border border-red-800 bg-red-900/20 rounded-lg text-red-400">
                Error loading roles data.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-100">Gestió de Rols</h2>
            </div>

            <RoleManagementTable
                initialRoles={rolesRes.data || []}
                permissions={permissionsRes.data || []}
                initialRolePermissions={rolePermissionsRes.data || []}
            />
        </div>
    )
}
