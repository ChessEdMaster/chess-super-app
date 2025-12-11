'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, MoreVertical, Shield, UserCheck, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClubMember {
    id: string;
    user_id: string | null;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    joined_at: string;
    shadow_name?: string;
    profiles?: {
        username: string;
        full_name: string;
        avatar_url: string;
    };
}

export default function ClubMembersPage() {
    const params = useParams();
    const clubId = params.clubId as string;
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Invite/Add Member State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [clubId]);

    const fetchMembers = async () => {
        try {
            console.log('Fetching members for club:', clubId);
            // Use explicit relationship syntax if possible, or rely on inference
            // profiles:user_id(...) is the resource embedding syntax where 'profiles' is the table and 'user_id' is the FK column
            // However, sometimes standard embedding profiles(...) works better if there's only one FK.
            const { data, error } = await supabase
                .from('club_members')
                .select(`
                    *,
                    profiles (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('club_id', clubId);

            if (error) {
                console.error('Error fetching members:', error);
                return;
            }

            console.log('Fetched members:', data);
            if (data) setMembers(data as unknown as ClubMember[]);
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddShadowMember = async () => {
        if (!newMemberName.trim()) return;
        setIsSubmitting(true);

        const { error } = await supabase.from('club_members').insert({
            club_id: clubId,
            role: 'member',
            shadow_name: newMemberName,
            user_id: null
        });

        if (error) {
            console.error('Error adding member:', error);
        } else {
            setNewMemberName('');
            setIsInviteOpen(false);
            fetchMembers();
        }
        setIsSubmitting(false);
    };

    const filteredMembers = members.filter(member => {
        const searchLower = searchTerm.toLowerCase();
        const username = member.profiles?.username?.toLowerCase() || '';
        const fullName = member.profiles?.full_name?.toLowerCase() || '';
        const shadowName = member.shadow_name?.toLowerCase() || '';

        return username.includes(searchLower) ||
            fullName.includes(searchLower) ||
            shadowName.includes(searchLower);
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'moderator': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            default: return 'bg-neutral-800 text-neutral-400 border-neutral-700';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Socis i Membres</h1>
                    <p className="text-neutral-400 mt-2">Gestiona els membres del teu club i els seus rols.</p>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            AFEGIR MEMBRE
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Afegir nou membre</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="manual" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
                                <TabsTrigger value="manual">Manual (Soci)</TabsTrigger>
                                <TabsTrigger value="invite">Invitar (App)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="manual" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom i Cognoms</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Joan Garcia"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800"
                                    />
                                    <p className="text-xs text-neutral-500">
                                        Aquest usuari no tindrà accés a l&apos;app, però podràs gestionar el seu expedient.
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                                    onClick={handleAddShadowMember}
                                    disabled={!newMemberName.trim() || isSubmitting}
                                >
                                    {isSubmitting ? 'Afegint...' : 'Crear Soci'}
                                </Button>
                            </TabsContent>
                            <TabsContent value="invite" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email o Nom d&apos;usuari</Label>
                                    <Input
                                        id="email"
                                        placeholder="usuari@exemple.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-neutral-950 border-neutral-800"
                                    />
                                </div>
                                <Button className="w-full" variant="secondary" disabled>
                                    Pròximament
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cercar per nom o usuari..."
                        className="w-full bg-neutral-950 border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="border-neutral-700 text-neutral-300">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                </Button>
            </div>

            {/* Members Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-neutral-950 border-b border-neutral-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Membre</th>
                            <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Data d&apos;unió</th>
                            <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Estat</th>
                            <th className="px-6 py-4 text-right">Accions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-neutral-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold mr-3">
                                            {member.profiles?.username?.[0]?.toUpperCase() || member.shadow_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {member.profiles?.full_name || member.shadow_name || 'Sense nom'}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {member.profiles ? `@${member.profiles.username}` : <span className="text-emerald-500/70 flex items-center gap-1"><Users className="w-3 h-3" /> Soci Manual</span>}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                                        {member.role === 'owner' && <Shield className="w-3 h-3 mr-1" />}
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-neutral-400">
                                    {new Date(member.joined_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                        Actiu
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                    No s&apos;han trobat membres.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
