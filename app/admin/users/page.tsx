import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { UserManagementTable } from './user-management-table'
import { Users, AlertTriangle } from 'lucide-react'
import { Panel } from '@/components/ui/design-system/Panel'

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
            <Panel className="border-red-500/30 bg-red-950/20">
                <div className="flex items-center gap-4 text-red-500 mb-4">
                    <AlertTriangle size={32} />
                    <h3 className="font-black uppercase tracking-wide text-xl">Error Loading Data</h3>
                </div>
                <p className="text-zinc-400 font-bold mb-4">Could not fetch users or roles. Please try again later.</p>
                <div className="p-4 bg-black/50 rounded-xl overflow-auto border border-red-900/50">
                    <pre className="text-xs text-red-300 font-mono">
                        {JSON.stringify({ profilesError, rolesError }, null, 2)}
                    </pre>
                </div>
            </Panel>
        )
    }

    return (
        <div className="space-y-6">
            <Panel className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/30">
                            <Users size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display text-stroke">Gestió d'Usuaris</h2>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Admin Control Center</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 shadow-inner">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Total</span>
                        <span className="text-xl font-black text-white font-mono">{profiles?.length || 0}</span>
                    </div>
                </div>

                <div className="bg-zinc-950/50 rounded-xl border border-zinc-800 overflow-hidden">
                    <UserManagementTable
                        initialProfiles={profiles as unknown as ProfileWithRole[]}
                        roles={roles as unknown as AppRole[]}
                    />
                </div>
            </Panel>
        </div>
    )
}
