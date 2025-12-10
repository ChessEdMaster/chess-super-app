'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Users,
    BookOpen,
    Check,
    X,
    Search,
    Loader2,
    ChevronDown,
    ChevronRight,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { AcademyCourse } from '@/types/academy';

interface ClubMember {
    user_id: string;
    role: string;
    joined_at: string;
    profile?: {
        username: string;
        avatar_url: string;
    };
}

interface AcademyManagerProps {
    clubId: string;
    currentUserRole: string; // 'owner' | 'admin' | 'teacher' | 'member'
}

export function AcademyManager({ clubId, currentUserRole }: AcademyManagerProps) {
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
    const [enrollments, setEnrollments] = useState<Map<string, Set<string>>>(new Map()); // Map<userId, Set<courseId>>
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);

    // Load data
    useEffect(() => {
        loadData();
    }, [clubId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Load Members
            const { data: membersData, error: membError } = await supabase
                .from('club_members')
                .select(`
            user_id, 
            role, 
            joined_at,
            profile:profiles(username, avatar_url)
        `)
                .eq('club_id', clubId);

            if (membError) throw membError;

            // 2. Load Courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('academy_courses')
                .select('*')
                .eq('published', true)
                .order('title');

            if (coursesError) throw coursesError;

            // 3. Load Enrollments for these members
            const memberIds = membersData.map(m => m.user_id);
            const { data: enrollData, error: enrollError } = await supabase
                .from('academy_enrollments')
                .select('user_id, course_id')
                .in('user_id', memberIds);

            if (enrollError) throw enrollError;

            // Process Enrollments
            const enrollMap = new Map<string, Set<string>>();
            enrollData?.forEach(e => {
                if (!enrollMap.has(e.user_id)) {
                    enrollMap.set(e.user_id, new Set());
                }
                enrollMap.get(e.user_id)?.add(e.course_id);
            });

            setMembers(membersData as any);
            setCourses(coursesData);
            setEnrollments(enrollMap);

        } catch (error) {
            console.error('Error loading academy data:', error);
            toast.error('Error al carregar les dades de l\'acadèmia');
        } finally {
            setLoading(false);
        }
    };

    const toggleEnrollment = async (userId: string, courseId: string, currentStatus: boolean) => {
        if (assigning) return;
        setAssigning(true);

        try {
            if (currentStatus) {
                // Un-enroll
                const { error } = await supabase
                    .from('academy_enrollments')
                    .delete()
                    .eq('user_id', userId)
                    .eq('course_id', courseId);

                if (error) throw error;

                // Update local state
                const newMap = new Map(enrollments);
                newMap.get(userId)?.delete(courseId);
                setEnrollments(newMap);
                toast.success('Curs revocat');
            } else {
                // Enroll
                const { error } = await supabase
                    .from('academy_enrollments')
                    .insert({
                        user_id: userId,
                        course_id: courseId,
                        club_id: clubId
                    });

                if (error) throw error;

                // Update local state
                const newMap = new Map(enrollments);
                if (!newMap.has(userId)) newMap.set(userId, new Set());
                newMap.get(userId)?.add(courseId);
                setEnrollments(newMap);
                toast.success('Curs assignat');
            }
        } catch (error: any) {
            toast.error('Error al modificar la inscripció');
            console.error(error);
        } finally {
            setAssigning(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.profile?.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group courses by track for organized display
    const groupedCourses = courses.reduce((acc, course) => {
        const track = course.track || 'other';
        if (!acc[track]) acc[track] = [];
        acc[track].push(course);
        return acc;
    }, {} as Record<string, AcademyCourse[]>);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
        );
    }

    // Permission check
    const canManage = ['owner', 'admin', 'teacher'].includes(currentUserRole);

    if (!canManage) {
        return (
            <div className="p-6 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                <ShieldAlert className="mx-auto mb-2 text-red-500" />
                Només els professors i administradors poden gestionar els cursos.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Gestió Acadèmica</h2>
                    <p className="text-sm text-slate-400">Assigna cursos als teus alumnes</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar alumne..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Members List */}
            <div className="space-y-4">
                {filteredMembers.map(member => (
                    <div key={member.user_id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                        {/* Member Header */}
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition"
                            onClick={() => setExpandedUser(expandedUser === member.user_id ? null : member.user_id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                    {member.profile?.avatar_url ? (
                                        <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-full h-full p-2 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{member.profile?.username || 'Usuari desconegut'}</div>
                                    <div className="text-xs text-slate-400 capitalize">{member.role}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-xs text-slate-500 hidden md:block">
                                    {enrollments.get(member.user_id)?.size || 0} cursos actius
                                </div>
                                {expandedUser === member.user_id ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                            </div>
                        </div>

                        {/* Expanded Content (Courses Matrix) */}
                        {expandedUser === member.user_id && (
                            <div className="p-4 border-t border-slate-800 bg-black/20">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {Object.entries(groupedCourses).map(([track, trackCourses]) => (
                                        <div key={track}>
                                            <h4 className="text-xs font-bold text-yellow-500 uppercase mb-3 tracking-wider">{track}</h4>
                                            <div className="space-y-2">
                                                {trackCourses.map(course => {
                                                    const isEnrolled = enrollments.get(member.user_id)?.has(course.id);
                                                    return (
                                                        <div key={course.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-lg group">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <BookOpen size={16} className={isEnrolled ? "text-green-400 shrink-0" : "text-slate-600 shrink-0"} />
                                                                <Link
                                                                    href={`/academy/course/${course.id}`}
                                                                    target="_blank"
                                                                    className={`text-sm truncate hover:underline flex items-center gap-1 ${isEnrolled ? 'text-white' : 'text-slate-400'}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {course.title}
                                                                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </Link>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleEnrollment(member.user_id, course.id, !!isEnrolled);
                                                                }}
                                                                disabled={assigning}
                                                                className={`
                                                                px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 shrink-0 ml-2
                                                                ${isEnrolled
                                                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}
                                                            `}
                                                            >
                                                                {isEnrolled ? 'Revocar' : 'Assignar'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
