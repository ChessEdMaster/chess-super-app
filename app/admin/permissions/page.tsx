import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PermissionManagementTable } from './permission-management-table'

export default async function AdminPermissionsPage() {
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

    const { data: permissions, error } = await supabase
        .from('app_permissions')
        .select('*')
        .order('code')

    if (error) {
        console.error("Error permissions", error)
        return <div className="text-red-400">Error carregant permisos.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-100">Gestió de Permisos</h2>
            </div>
            <PermissionManagementTable initialPermissions={permissions || []} />
        </div>
    )
}
