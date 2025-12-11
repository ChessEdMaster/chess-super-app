'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Permission = {
    id: string
    code: string
    description: string | null
    created_at?: string
}

interface Props {
    initialPermissions: Permission[]
}

export function PermissionManagementTable({ initialPermissions }: Props) {
    const [permissions, setPermissions] = useState<Permission[]>(initialPermissions)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ code: '', description: '' })
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleOpenCreate = () => {
        setEditingId(null)
        setFormData({ code: '', description: '' })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (perm: Permission) => {
        setEditingId(perm.id)
        setFormData({ code: perm.code, description: perm.description || '' })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.code) return toast.error('El codi és obligatori')

        setIsLoading(true)
        try {
            if (editingId) {
                // Update
                const { error } = await supabase
                    .from('app_permissions')
                    .update({ code: formData.code, description: formData.description })
                    .eq('id', editingId)
                if (error) throw error
                toast.success('Permís actualitzat')
            } else {
                // Create
                const { error } = await supabase
                    .from('app_permissions')
                    .insert({ code: formData.code, description: formData.description })
                if (error) throw error
                toast.success('Permís creat')
            }

            setIsDialogOpen(false)
            router.refresh()
            // Typically permissions list is small, full reload is fine or just router.refresh
            window.location.reload()

        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar aquest permís?')) return

        try {
            const { error } = await supabase.from('app_permissions').delete().eq('id', id)
            if (error) throw error
            toast.success('Permís eliminat')
            setPermissions(permissions.filter(p => p.id !== id))
        } catch (error: any) {
            toast.error('Error eliminant: ' + error.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-500">
                    <Plus size={16} className="mr-2" />
                    Nou Permís
                </Button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Codi</th>
                            <th className="px-6 py-4">Descripció</th>
                            <th className="px-6 py-4 text-right">Accions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {permissions.map(perm => (
                            <tr key={perm.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-mono text-indigo-300 font-bold">{perm.code}</td>
                                <td className="px-6 py-4">{perm.description}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(perm)}>
                                            <Pencil size={16} className="text-blue-400" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(perm.id)}>
                                            <Trash2 size={16} className="text-red-400" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Permís' : 'Nou Permís'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Codi (ex: USERS_READ)</Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                className="bg-slate-950 border-slate-800 font-mono placeholder:text-slate-600"
                                placeholder="MODULE_ACTION"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripció</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="bg-slate-950 border-slate-800"
                            />
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
