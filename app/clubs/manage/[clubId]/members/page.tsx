'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, MoreVertical, Shield, UserCheck, UserPlus, Users, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

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
            case 'owner': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'admin': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'moderator': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    return (
        <div className="space-y-8">
            <Panel className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900 border-zinc-700">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-wide font-display text-stroke">Socis i Membres</h1>
                    <p className="text-zinc-500 mt-1 font-bold text-sm uppercase tracking-wider">Gestiona els membres del teu club i els seus rols.</p>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <ShinyButton variant="primary" className="whitespace-nowrap">
                            <UserPlus className="w-4 h-4 mr-2" />
                            AFEGIR MEMBRE
                        </ShinyButton>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px] p-0 overflow-hidden shadow-2xl">
                        <DialogHeader className="p-6 bg-zinc-950 border-b border-zinc-800">
                            <DialogTitle className="text-xl font-black uppercase tracking-wide text-white">Afegir nou membre</DialogTitle>
                        </DialogHeader>

                        <Tabs defaultValue="manual" className="w-full">
                            <div className="px-6 pt-6">
                                <TabsList className="grid w-full grid-cols-2 bg-zinc-800 p-1 rounded-xl">
                                    <TabsTrigger value="manual" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 rounded-lg font-bold text-xs uppercase">Manual (Soci)</TabsTrigger>
                                    <TabsTrigger value="invite" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 rounded-lg font-bold text-xs uppercase">Invitar (App)</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="manual" className="space-y-4 p-6 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase text-zinc-400">Nom i Cognoms</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Joan Garcia"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        className="bg-zinc-950 border-zinc-700 text-white focus:border-amber-500"
                                    />
                                    <p className="text-[10px] text-zinc-500 font-bold">
                                        Aquest usuari no tindrà accés a l&apos;app, però podràs gestionar el seu expedient.
                                    </p>
                                </div>
                                <ShinyButton
                                    variant="success"
                                    className="w-full"
                                    onClick={handleAddShadowMember}
                                    disabled={!newMemberName.trim() || isSubmitting}
                                >
                                    {isSubmitting ? 'Afegint...' : 'Crear Soci'}
                                </ShinyButton>
                            </TabsContent>

                            <TabsContent value="invite" className="space-y-4 p-6 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase text-zinc-400">Email o Nom d&apos;usuari</Label>
                                    <Input
                                        id="email"
                                        placeholder="usuari@exemple.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-zinc-950 border-zinc-700 text-white focus:border-amber-500"
                                    />
                                </div>
                                <ShinyButton variant="neutral" className="w-full opacity-50 cursor-not-allowed">
                                    Pròximament
                                </ShinyButton>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </Panel>

            {/* Filters */}
            <GameCard variant="default" className="flex items-center space-x-4 p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cercar per nom o usuari..."
                        className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-white focus:border-amber-500 focus:outline-none transition-colors text-sm font-medium placeholder-zinc-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ShinyButton variant="neutral" className="h-[42px] px-4">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                </ShinyButton>
            </GameCard>

            {/* Members Table */}
            <GameCard variant="default" className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950/80 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Membre</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rol</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Data d&apos;unió</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estat</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Accions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-black mr-3 border border-zinc-700 shadow-sm group-hover:border-zinc-600 transition-colors">
                                                {member.profiles?.username?.[0]?.toUpperCase() || member.shadow_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors">
                                                    {member.profiles?.full_name || member.shadow_name || 'Sense nom'}
                                                </p>
                                                <p className="text-xs text-zinc-500 font-medium">
                                                    {member.profiles ? `@${member.profiles.username}` : <span className="text-indigo-400/80 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"><Users className="w-3 h-3" /> Soci Manual</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRoleBadgeColor(member.role)}`}>
                                            {member.role === 'owner' && <Shield className="w-3 h-3 mr-1" />}
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-400 font-medium">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                            Actiu
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users size={32} className="opacity-20" />
                                            <p className="font-bold">No s&apos;han trobat membres.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GameCard>
        </div>
    );
}
