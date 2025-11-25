'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Search, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

// Types
type Role = {
    id: string
    name: string
    description?: string
}

type Profile = {
    id: string
    username: string | null
    avatar_url: string | null
    created_at: string | null
    role_id: string | null
    app_roles: {
        id: string
        name: string
    } | null
}

interface UserManagementTableProps {
    initialProfiles: Profile[]
    roles: Role[]
}

export function UserManagementTable({ initialProfiles, roles }: UserManagementTableProps) {
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleRoleChange = async (userId: string, newRoleId: string) => {
        setLoadingId(userId)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role_id: newRoleId })
                .eq('id', userId)

            if (error) throw error

            // Update local state
            setProfiles(profiles.map(p =>
                p.id === userId
                    ? {
                        ...p,
                        role_id: newRoleId,
                        app_roles: roles.find(r => r.id === newRoleId) || p.app_roles
                    } as Profile
                    : p
            ))

            toast.success('Rol actualitzat correctament')
            router.refresh()
        } catch (error) {
            console.error('Error updating role:', error)
            toast.error('Error al actualitzar el rol')
        } finally {
            setLoadingId(null)
        }
    }

    const filteredProfiles = profiles.filter(profile =>
        (profile.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        profile.id.includes(searchTerm)
    )

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('ca-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Cercar per usuari o ID..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase font-medium border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Usuari</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Registrat</th>
                                <th className="px-6 py-4">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredProfiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-slate-800/50 transition duration-150">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 relative border border-slate-700">
                                                {profile.avatar_url ? (
                                                    <Image
                                                        src={profile.avatar_url}
                                                        alt={profile.username || 'User'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                                        <span className="text-xs font-bold">{profile.username?.substring(0, 2).toUpperCase() || '??'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{profile.username || 'Sense nom'}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    {profile.app_roles?.name === 'SuperAdmin' && <ShieldAlert size={10} className="text-red-500" />}
                                                    {profile.app_roles?.name || 'Sense rol'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative inline-block">
                                            {loadingId === profile.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10 rounded">
                                                    <Loader2 className="animate-spin text-indigo-500" size={16} />
                                                </div>
                                            )}
                                            <select
                                                className={`
                          bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 
                          focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer
                          ${profile.app_roles?.name === 'SuperAdmin' ? 'text-red-400 border-red-900/50' : ''}
                        `}
                                                value={profile.role_id || ''}
                                                onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                                disabled={loadingId === profile.id}
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(profile.created_at)}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-[100px]" title={profile.id}>
                                        {profile.id}
                                    </td>
                                </tr>
                            ))}

                            {filteredProfiles.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No s'han trobat usuaris que coincideixin amb la cerca.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
