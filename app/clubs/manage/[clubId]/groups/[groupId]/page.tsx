'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Users,
    Calendar,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    Search,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import toast from 'react-hot-toast';
import Link from 'next/link';

interface GroupDetails {
    id: string;
    name: string;
    description: string;
    capacity: number;
}

interface ClubMemberProfile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
}

interface GroupMember {
    id: string;
    club_member_id: string;
    joined_at: string;
    club_members?: {
        id: string;
        user_id: string | null;
        shadow_name: string | null;
        profiles?: ClubMemberProfile | null;
    };
}

interface AvailableClubMember {
    id: string;
    shadow_name: string | null;
    user_id: string | null;
    profiles?: ClubMemberProfile | null;
}

interface Schedule {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

export default function GroupDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const clubId = params.clubId as string;
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<GroupDetails | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Member State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [clubMembers, setClubMembers] = useState<AvailableClubMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Attendance State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceState, setAttendanceState] = useState<Set<string>>(new Set());
    const [savingAttendance, setSavingAttendance] = useState(false);

    // Academic Records State
    const [studentStats, setStudentStats] = useState<Record<string, { completed: number, lastActivity: string | null }>>({});

    // Schedule State
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [newSchedule, setNewSchedule] = useState({
        day_of_week: '1',
        start_time: '18:00',
        end_time: '19:30'
    });

    useEffect(() => {
        fetchGroupDetails();
        fetchGroupMembers();
        fetchSchedules();
    }, [groupId]);

    useEffect(() => {
        if (members.length > 0) {
            fetchStudentStats();
        }
    }, [members]);

    useEffect(() => {
        if (groupId && selectedDate) {
            fetchAttendance();
        }
    }, [groupId, selectedDate]);

    useEffect(() => {
        if (isAddMemberOpen) {
            fetchClubMembers();
        }
    }, [isAddMemberOpen]);

    const fetchStudentStats = async () => {
        // Only fetch stats for members with a user_id
        const userIds = members
            .map(m => m.club_members?.user_id)
            .filter(id => id);

        if (userIds.length === 0) return;

        try {
            // Fetch completed lessons count per user
            const { data, error } = await supabase
                .from('user_lesson_progress')
                .select('user_id, completed_at')
                .in('user_id', userIds)
                .eq('completed', true);

            if (error) throw error;

            const stats: Record<string, { completed: number, lastActivity: string | null }> = {};

            // Initialize
            userIds.forEach(id => {
                stats[id] = { completed: 0, lastActivity: null };
            });

            // Aggregate
            data?.forEach((record: unknown) => {
                const rec = record as { user_id: string; completed_at: string | null };
                if (stats[rec.user_id]) {
                    stats[rec.user_id].completed++;
                    if (rec.completed_at) {
                        const currentLast = stats[rec.user_id].lastActivity;
                        if (!currentLast || new Date(rec.completed_at) > new Date(currentLast)) {
                            stats[rec.user_id].lastActivity = rec.completed_at;
                        }
                    }
                }
            });

            setStudentStats(stats);
        } catch (error) {
            console.error('Error fetching student stats:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const { data, error } = await supabase
                .from('club_attendance')
                .select('present_students')
                .eq('group_id', groupId)
                .eq('date', selectedDate)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"

            if (data) {
                // Map any legacy user_ids to club_member_ids
                const presentIds = new Set<string>();
                const storedIds = data.present_students || [];

                // Create a map of user_id -> club_member_id from current members
                const userIdToMemberId = new Map<string, string>();
                members.forEach(m => {
                    const uid = m.club_members?.user_id;
                    if (uid) {
                        userIdToMemberId.set(uid as string, m.club_member_id);
                    }
                });

                storedIds.forEach((id: string) => {
                    // Check if it's a user_id that needs mapping
                    if (userIdToMemberId.has(id)) {
                        presentIds.add(userIdToMemberId.get(id)!);
                    } else {
                        // Assume it's already a club_member_id
                        presentIds.add(id);
                    }
                });

                setAttendanceState(presentIds);
            } else {
                setAttendanceState(new Set()); // Reset if no record found
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const toggleAttendance = (memberId: string) => {
        const newSet = new Set(attendanceState);
        if (newSet.has(memberId)) {
            newSet.delete(memberId);
        } else {
            newSet.add(memberId);
        }
        setAttendanceState(newSet);
    };

    const saveAttendance = async () => {
        setSavingAttendance(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // Let's try to find existing record first
            const { data: existing } = await supabase
                .from('club_attendance')
                .select('id')
                .eq('group_id', groupId)
                .eq('date', selectedDate)
                .single();

            const payload = {
                group_id: groupId,
                date: selectedDate,
                present_students: Array.from(attendanceState),
                teacher_id: user.id
            };

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('club_attendance')
                    .update({
                        present_students: Array.from(attendanceState),
                        teacher_id: user.id
                    })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('club_attendance')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success('Assistència guardada correctament');
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Error guardant assistència: ' + (error as Error).message);
        } finally {
            setSavingAttendance(false);
        }
    };

    const fetchGroupDetails = async () => {
        const { data, error } = await supabase
            .from('club_groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (data) setGroup(data);
    };

    const fetchGroupMembers = async () => {
        const { data, error } = await supabase
            .from('club_group_members')
            .select(`
                *,
                club_members:club_member_id (
                    id,
                    shadow_name,
                    user_id,
                    profiles:user_id (
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('group_id', groupId);

        if (data) setMembers(data as unknown as GroupMember[]);
        setLoading(false);
    };

    const fetchClubMembers = async () => {
        // Fetch all club members who are NOT in this group
        const { data: allClubMembers } = await supabase
            .from('club_members')
            .select(`
                id,
                shadow_name,
                user_id,
                profiles:user_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq('club_id', clubId);

        if (allClubMembers) {
            // Filter out existing group members
            const existingMemberIds = new Set(members.map(m => m.club_member_id));
            const available = allClubMembers.filter(m => !existingMemberIds.has(m.id)) as unknown as AvailableClubMember[];
            setClubMembers(available);
        }
    };

    const handleAddMember = async (clubMemberId: string) => {
        try {
            const { error } = await supabase
                .from('club_group_members')
                .insert({
                    group_id: groupId,
                    club_member_id: clubMemberId,
                    status: 'active'
                });

            if (error) throw error;

            toast.success('Alumne afegit al grup');
            fetchGroupMembers();
            setIsAddMemberOpen(false);
        } catch (error) {
            toast.error('Error afegint alumne: ' + (error as Error).message);
        }
    };

    const handleRemoveMember = async (clubMemberId: string) => {
        if (!confirm('Segur que vols eliminar aquest alumne del grup?')) return;

        try {
            const { error } = await supabase
                .from('club_group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('club_member_id', clubMemberId);

            if (error) throw error;

            toast.success('Alumne eliminat del grup');
            setMembers(members.filter(m => m.club_member_id !== clubMemberId));
        } catch (error) {
            toast.error('Error eliminant alumne: ' + (error as Error).message);
        }
    };

    const fetchSchedules = async () => {
        const { data, error } = await supabase
            .from('club_group_schedules')
            .select('*')
            .eq('group_id', groupId)
            .order('day_of_week', { ascending: true });

        if (data) setSchedules(data as unknown as Schedule[]);
    };

    const handleAddSchedule = async () => {
        try {
            const { error } = await supabase
                .from('club_group_schedules')
                .insert({
                    group_id: groupId,
                    day_of_week: parseInt(newSchedule.day_of_week),
                    start_time: newSchedule.start_time,
                    end_time: newSchedule.end_time
                });

            if (error) throw error;

            toast.success('Horari afegit');
            fetchSchedules();
        } catch (error) {
            toast.error('Error afegint horari: ' + (error as Error).message);
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        try {
            const { error } = await supabase
                .from('club_group_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Horari eliminat');
            setSchedules(schedules.filter(s => s.id !== id));
        } catch (error) {
            toast.error('Error eliminant horari: ' + (error as Error).message);
        }
    };

    const daysOfWeek = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];

    if (loading) return <div className="p-8 text-center">Carregant...</div>;
    if (!group) return <div className="p-8 text-center">Grup no trobat</div>;

    const filteredClubMembers = clubMembers.filter(m =>
        (m.profiles?.full_name || m.shadow_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.profiles?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link
                    href={`/clubs/manage/${clubId}/groups`}
                    className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tornar als Grups
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                        <p className="text-neutral-400 mt-1">{group.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-sm border border-neutral-700">
                            {members.length} / {group.capacity} Alumnes
                        </span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="members" className="w-full">
                <TabsList className="bg-neutral-900 border border-neutral-800">
                    <TabsTrigger value="members">Alumnes</TabsTrigger>
                    <TabsTrigger value="attendance">Assistència</TabsTrigger>
                    <TabsTrigger value="records">Expedient</TabsTrigger>
                    <TabsTrigger value="schedule">Horari</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Llistat d&apos;Alumnes</h3>
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Afegir Alumne
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                                <DialogHeader>
                                    <DialogTitle>Afegir Alumne al Grup</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-4 h-4" />
                                        <Input
                                            placeholder="Cercar soci..."
                                            className="pl-10 bg-neutral-800 border-neutral-700"
                                            value={searchTerm}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {filteredClubMembers.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={member.profiles?.avatar_url} />
                                                        <AvatarFallback>{(member.profiles?.username || member.shadow_name)?.[0]?.toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{member.profiles?.full_name || member.shadow_name}</p>
                                                        <p className="text-xs text-neutral-500">
                                                            {member.profiles ? `@${member.profiles.username}` : 'Soci Manual'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={() => handleAddMember(member.id)}>
                                                    Afegir
                                                </Button>
                                            </div>
                                        ))}
                                        {filteredClubMembers.length === 0 && (
                                            <p className="text-center text-neutral-500 py-4">No s&apos;han trobat socis disponibles.</p>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        {members.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">
                                Aquest grup encara no té alumnes.
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-neutral-950 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Alumne</th>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Data d&apos;Alta</th>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Estat</th>
                                        <th className="px-6 py-4 text-right">Accions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-neutral-800/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={member.club_members?.profiles?.avatar_url} />
                                                        <AvatarFallback>{(member.club_members?.profiles?.username || member.club_members?.shadow_name)?.[0]?.toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{member.club_members?.profiles?.full_name || member.club_members?.shadow_name}</p>
                                                        <p className="text-xs text-neutral-500">
                                                            {member.club_members?.profiles ? `@${member.club_members?.profiles.username}` : 'Soci Manual'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-400">
                                                {new Date(member.joined_at || new Date()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                                    Actiu
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-neutral-400 hover:text-red-400"
                                                    onClick={() => handleRemoveMember(member.club_member_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="attendance" className="mt-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Control d&apos;Assistència</h3>
                                <p className="text-neutral-400">Passa llista dels alumnes per a la sessió d&apos;avui.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-neutral-800 p-1 rounded-lg border border-neutral-700">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() - 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                >
                                    ←
                                </Button>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-white focus:ring-0 cursor-pointer"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() + 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                >
                                    →
                                </Button>
                            </div>
                        </div>

                        {members.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                                No hi ha alumnes en aquest grup. Afegeix alumnes per passar llista.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {members.map((member) => {
                                        // Use club_member_id for attendance tracking
                                        const memberId = member.club_member_id;
                                        const isPresent = attendanceState.has(memberId);
                                        return (
                                            <div
                                                key={memberId}
                                                onClick={() => toggleAttendance(memberId)}
                                                className={`
                                                    cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between
                                                    ${isPresent
                                                        ? 'bg-emerald-500/10 border-emerald-500/50'
                                                        : 'bg-neutral-800/50 border-neutral-800 hover:border-neutral-700'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10 border border-neutral-700">
                                                        <AvatarImage src={member.club_members?.profiles?.avatar_url} />
                                                        <AvatarFallback>{(member.club_members?.profiles?.username || member.club_members?.shadow_name)?.[0]?.toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className={`font-medium ${isPresent ? 'text-white' : 'text-neutral-400'}`}>
                                                            {member.club_members?.profiles?.full_name || member.club_members?.shadow_name}
                                                        </p>
                                                        <p className="text-xs text-neutral-500">
                                                            {member.club_members?.profiles ? `@${member.club_members?.profiles.username}` : 'Soci Manual'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`
                                                    w-6 h-6 rounded-full flex items-center justify-center border
                                                    ${isPresent
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-neutral-600 text-transparent'}
                                                `}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-neutral-800">
                                    <Button
                                        onClick={saveAttendance}
                                        disabled={savingAttendance}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[150px]"
                                    >
                                        {savingAttendance ? 'Guardant...' : 'Guardar Assistència'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="records" className="mt-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white">Expedient Acadèmic</h3>
                            <p className="text-neutral-400">Seguiment del progrés dels alumnes a l&apos;Acadèmia.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-950 border-b border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Alumne</th>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Lliçons Completades</th>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Última Activitat</th>
                                        <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">Estat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {members.map((member) => {
                                        const userId = member.club_members?.user_id;
                                        // If no user_id (shadow member), they don't have app stats
                                        const stats = userId ? (studentStats[userId] || { completed: 0, lastActivity: null }) : { completed: 0, lastActivity: null };

                                        return (
                                            <tr key={member.id} className="hover:bg-neutral-800/30">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={member.club_members?.profiles?.avatar_url} />
                                                            <AvatarFallback>{(member.club_members?.profiles?.username || member.club_members?.shadow_name)?.[0]?.toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{member.club_members?.profiles?.full_name || member.club_members?.shadow_name}</p>
                                                            <p className="text-xs text-neutral-500">
                                                                {member.club_members?.profiles ? `@${member.club_members?.profiles.username}` : 'Soci Manual'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {userId ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-neutral-800 rounded-full w-24 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${Math.min((stats.completed / 20) * 100, 100)}%` }} // Assuming 20 lessons for now
                                                                />
                                                            </div>
                                                            <span className="text-sm text-white font-medium">{stats.completed}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-neutral-500">N/A (Soci Manual)</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-neutral-400">
                                                    {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : (userId ? 'Mai' : '-')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {userId ? (
                                                        stats.completed > 5 ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                                                Bon Ritme
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                                                                Poc Actiu
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400">
                                                            Presencial
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="schedule" className="mt-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white">Horari del Grup</h3>
                            <p className="text-neutral-400">Gestiona les sessions setmanals d&apos;aquest grup.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Add Schedule Form */}
                            <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 h-fit">
                                <h4 className="font-medium text-white mb-4">Afegir Sessió</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Dia de la setmana</Label>
                                        <Select
                                            value={newSchedule.day_of_week}
                                            onValueChange={(val) => setNewSchedule({ ...newSchedule, day_of_week: val })}
                                        >
                                            <SelectTrigger className="bg-neutral-900 border-neutral-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {daysOfWeek.map((day, index) => (
                                                    <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Inici</Label>
                                            <Input
                                                type="time"
                                                value={newSchedule.start_time}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                                                className="bg-neutral-900 border-neutral-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fi</Label>
                                            <Input
                                                type="time"
                                                value={newSchedule.end_time}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                                                className="bg-neutral-900 border-neutral-800"
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleAddSchedule} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Afegir Sessió
                                    </Button>
                                </div>
                            </div>

                            {/* Schedule List */}
                            <div className="lg:col-span-2 space-y-4">
                                {schedules.length === 0 ? (
                                    <div className="text-center py-12 bg-neutral-950 rounded-xl border border-neutral-800 border-dashed">
                                        <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                                        <p className="text-neutral-500">No hi ha sessions programades.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {schedules.map((schedule) => (
                                            <div key={schedule.id} className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800">
                                                        <Calendar className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{daysOfWeek[schedule.day_of_week]}</p>
                                                        <p className="text-sm text-neutral-400">
                                                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-neutral-500 hover:text-red-400"
                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}
