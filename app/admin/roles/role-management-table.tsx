'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Role = {
    id: string
    name: string
    description: string | null
    created_at?: string
}

type Permission = {
    id: string
    code: string
    description: string | null
}

type RolePermission = {
    role_id: string
    permission_id: string
}

interface RoleManagementTableProps {
    initialRoles: Role[]
    permissions: Permission[]
    initialRolePermissions: RolePermission[]
}

export function RoleManagementTable({ initialRoles, permissions, initialRolePermissions }: RoleManagementTableProps) {
    const [roles, setRoles] = useState<Role[]>(initialRoles)
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)

    // Form state
    const [formData, setFormData] = useState({ name: '', description: '' })
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleOpenCreate = () => {
        setEditingRole(null)
        setFormData({ name: '', description: '' })
        setSelectedPermissions(new Set())
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (role: Role) => {
        setEditingRole(role)
        setFormData({ name: role.name, description: role.description || '' })
        const rolePerms = rolePermissions
            .filter(rp => rp.role_id === role.id)
            .map(rp => rp.permission_id)
        setSelectedPermissions(new Set(rolePerms))
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name) return toast.error('El nom és obligatori')

        setIsLoading(true)
        try {
            let roleId = editingRole?.id

            // 1. Create/Update Role
            if (editingRole) {
                const { error } = await supabase
                    .from('app_roles')
                    .update({ name: formData.name, description: formData.description })
                    .eq('id', roleId)
                if (error) throw error
            } else {
                const { data, error } = await supabase
                    .from('app_roles')
                    .insert({ name: formData.name, description: formData.description })
                    .select()
                    .single()
                if (error) throw error
                roleId = data.id
            }

            if (!roleId) throw new Error('No role ID')

            // 2. Update Permissions (Delete all + Insert selected)
            // This is a bit "heavy" but safe. Ideally use a transaction or stored proc, but separate calls work for low frequency admin tasks.

            // Delete existing for this role
            const { error: deleteError } = await supabase
                .from('app_role_permissions')
                .delete()
                .eq('role_id', roleId)

            if (deleteError) throw deleteError

            // Insert new
            if (selectedPermissions.size > 0) {
                const toInsert = Array.from(selectedPermissions).map(pid => ({
                    role_id: roleId,
                    permission_id: pid
                }))
                const { error: insertError } = await supabase
                    .from('app_role_permissions')
                    .insert(toInsert)

                if (insertError) throw insertError
            }

            toast.success(editingRole ? 'Rol actualitzat' : 'Rol creat')
            setIsDialogOpen(false)
            router.refresh() // Refresh server data mainly

            // Optimistic / Local update could be complex due to reloading logic, 
            // but router.refresh() handles the server state sync. 
            // We can wait for it or just force reload.
            // Let's rely on router.refresh() but we need to update state if we don't want to wait for full page reload visually.
            // For now, simple reload.
            window.location.reload()

        } catch (error: any) {
            console.error(error)
            toast.error('Error guardant el rol: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (roleId: string) => {
        if (!confirm('Segur que vols eliminar aquest rol? Asta acció no es pot desfer.')) return

        try {
            const { error } = await supabase.from('app_roles').delete().eq('id', roleId)
            if (error) throw error
            toast.success('Rol comprat')
            setRoles(roles.filter(r => r.id !== roleId))
        } catch (error: any) {
            toast.error('Error eliminant rol: ' + error.message)
        }
    }

    const togglePermission = (permId: string) => {
        const next = new Set(selectedPermissions)
        if (next.has(permId)) next.delete(permId)
        else next.add(permId)
        setSelectedPermissions(next)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-500">
                    <Plus size={16} className="mr-2" />
                    Nou Rol
                </Button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Nom</th>
                            <th className="px-6 py-4">Descripció</th>
                            <th className="px-6 py-4">Permisos</th>
                            <th className="px-6 py-4 text-right">Accions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {roles.map(role => {
                            const rolePermIds = rolePermissions.filter(rp => rp.role_id === role.id).map(rp => rp.permission_id)
                            return (
                                <tr key={role.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-bold text-white">{role.name}</td>
                                    <td className="px-6 py-4">{role.description}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {rolePermIds.slice(0, 3).map(pid => {
                                                const p = permissions.find(pm => pm.id === pid)
                                                return <span key={pid} className="text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{p?.code}</span>
                                            })}
                                            {rolePermIds.length > 3 && <span className="text-xs text-slate-500">+{rolePermIds.length - 3} més</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(role)}>
                                                <Pencil size={16} className="text-blue-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                                                <Trash2 size={16} className="text-red-400" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Editar Rol' : 'Crear Nou Rol'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Nom del Rol</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descripció</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Permisos Assignats</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
                                {permissions.map(perm => (
                                    <div
                                        key={perm.id}
                                        className={`
                                            flex items-start gap-3 p-2 rounded cursor-pointer transition-colors border
                                            ${selectedPermissions.has(perm.id)
                                                ? 'bg-indigo-900/30 border-indigo-500/50'
                                                : 'bg-slate-900 border-transparent hover:bg-slate-800'}
                                        `}
                                        onClick={() => togglePermission(perm.id)}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 
                                            ${selectedPermissions.has(perm.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}
                                        >
                                            {selectedPermissions.has(perm.id) && <Check size={10} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-mono font-bold ${selectedPermissions.has(perm.id) ? 'text-indigo-300' : 'text-slate-300'}`}>
                                                {perm.code}
                                            </p>
                                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel·lar</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500">
                            {isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
