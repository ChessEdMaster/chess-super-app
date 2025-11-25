'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Filter, MoreVertical, Shield, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClubMember {
    id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    joined_at: string;
    profiles: {
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

    useEffect(() => {
        fetchMembers();
    }, [clubId]);

    const fetchMembers = async () => {
        const { data, error } = await supabase
            .from('club_members')
            .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
            .eq('club_id', clubId);

        if (data) setMembers(data as any);
        setLoading(false);
    };

    const filteredMembers = members.filter(member =>
        member.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <UserCheck className="w-4 h-4 mr-2" />
                    INVITAR MEMBRE
                </Button>
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
                            <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Data d'unió</th>
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
                                            {member.profiles?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{member.profiles?.full_name || 'Sense nom'}</p>
                                            <p className="text-xs text-neutral-500">@{member.profiles?.username}</p>
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
                                    No s'han trobat membres.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
