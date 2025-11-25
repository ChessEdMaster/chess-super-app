'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Users, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface ClubGroup {
    id: string;
    name: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'master';
    capacity: number;
    schedule_json: any;
    _count?: {
        members: number;
    };
}

export default function ClubGroupsPage() {
    const params = useParams();
    const router = useRouter();
    const clubId = params.clubId as string;
    const [groups, setGroups] = useState<ClubGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: '',
        level: 'beginner',
        capacity: 10,
        schedule_json: {}
    });

    useEffect(() => {
        fetchGroups();
    }, [clubId]);

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('club_groups')
                .select(`
                    *,
                    members:club_group_members(count)
                `)
                .eq('club_id', clubId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to include member count more easily
            const formattedGroups = data.map((group: any) => ({
                ...group,
                _count: {
                    members: group.members?.[0]?.count || 0
                }
            }));

            setGroups(formattedGroups);
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Error carregant els grups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroup.name) {
            toast.error('El nom del grup és obligatori');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('club_groups')
                .insert([{
                    club_id: clubId,
                    name: newGroup.name,
                    description: newGroup.description,
                    level: newGroup.level,
                    capacity: newGroup.capacity,
                    schedule_json: newGroup.schedule_json
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Grup creat correctament');
            setGroups([data, ...groups]);
            setIsCreateOpen(false);
            setNewGroup({
                name: '',
                description: '',
                level: 'beginner',
                capacity: 10,
                schedule_json: {}
            });
        } catch (error: any) {
            console.error('Error creating group:', error);
            toast.error('Error creant el grup: ' + error.message);
        }
    };

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'intermediate': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'advanced': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'master': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-neutral-800 text-neutral-400';
        }
    };

    const getLevelLabel = (level: string) => {
        switch (level) {
            case 'beginner': return 'Iniciació';
            case 'intermediate': return 'Intermig';
            case 'advanced': return 'Avançat';
            case 'master': return 'Mestratge';
            default: return level;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Acadèmia i Grups</h1>
                    <p className="text-neutral-400 mt-2">Gestiona els grups d'entrenament i les classes.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            NOU GRUP
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Crear Nou Grup d'Entrenament</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom del Grup</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Iniciació Dimarts"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Nivell</Label>
                                <Select
                                    value={newGroup.level}
                                    onValueChange={(value: any) => setNewGroup({ ...newGroup, level: value })}
                                >
                                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                                        <SelectValue placeholder="Selecciona nivell" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-800 border-neutral-700">
                                        <SelectItem value="beginner">Iniciació</SelectItem>
                                        <SelectItem value="intermediate">Intermig</SelectItem>
                                        <SelectItem value="advanced">Avançat</SelectItem>
                                        <SelectItem value="master">Mestratge</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacitat Màxima</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={newGroup.capacity}
                                    onChange={(e) => setNewGroup({ ...newGroup, capacity: parseInt(e.target.value) })}
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripció</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detalls sobre el grup..."
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel·lar</Button>
                            <Button onClick={handleCreateGroup} className="bg-emerald-500 hover:bg-emerald-600">Crear Grup</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-neutral-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No hi ha grups creats</h3>
                    <p className="text-neutral-400 max-w-md mx-auto mb-6">
                        Crea el teu primer grup d'entrenament per començar a gestionar l'acadèmia.
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        Crear el primer grup
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/clubs/manage/${clubId}/groups/${group.id}`)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getLevelBadgeColor(group.level)}`}>
                                    {getLevelLabel(group.level)}
                                </span>
                                <ChevronRight className="text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>
                            <p className="text-neutral-400 text-sm mb-6 line-clamp-2">{group.description || 'Sense descripció'}</p>

                            <div className="flex items-center justify-between text-sm text-neutral-500 border-t border-neutral-800 pt-4">
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span>{group._count?.members || 0} / {group.capacity} alumnes</span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Setmanal</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
