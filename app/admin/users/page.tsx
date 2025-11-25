import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { UserManagementTable } from './user-management-table'

// Define types locally since we don't have the generated types handy or they are problematic
type AppRole = {
    id: string
    name: string
    description?: string
    created_at?: string
}

type Profile = {
    id: string
    username: string | null
    avatar_url: string | null
    created_at: string | null
    role_id: string | null
}

type ProfileWithRole = Profile & {
    app_roles: {
        id: string
        name: string
    } | null
}

export default async function AdminUsersPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }
                },
            },
        }
    )

    // Fetch users from profiles table
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
      *,
      app_roles (
        id,
        name
      )
    `)
        .order('created_at', { ascending: false })

    const { data: roles, error: rolesError } = await supabase
        .from('app_roles')
        .select('*')
        .order('name')

    if (profilesError || rolesError) {
        console.error("Error fetching admin data", profilesError, rolesError)
        return (
            <div className="p-4 border border-red-800 bg-red-900/20 rounded-lg text-red-400">
                <h3 className="font-bold mb-2">Error carregant dades</h3>
                <p>No s'han pogut carregar els usuaris o els rols. Si us plau, torna-ho a provar més tard.</p>
                <pre className="mt-4 text-xs bg-black/50 p-2 rounded overflow-auto">
                    {JSON.stringify({ profilesError, rolesError }, null, 2)}
                </pre>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-100">Gestió d'Usuaris</h2>
                <div className="text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    Total: <span className="text-indigo-400 font-bold">{profiles?.length || 0}</span>
                </div>
            </div>

            <UserManagementTable
                initialProfiles={profiles as unknown as ProfileWithRole[]}
                roles={roles as unknown as AppRole[]}
            />
        </div>
    )
}
