'use client';

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, Trophy, Plus, Activity, Loader2 } from "lucide-react";
import { BulkImportModal } from "../bulk-import-modal";
import { GameCard } from "@/components/ui/design-system/GameCard";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";
import { Panel } from "@/components/ui/design-system/Panel";
import { supabase } from "@/lib/supabase";

export function SchoolDashboard({ clubId }: { clubId: string }) {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        avgElo: 0,
        assignmentsCompleted: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSchoolStats() {
            try {
                // 1. Total Students
                const { count: studentCount } = await supabase
                    .from('club_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('club_id', clubId)
                    .eq('role', 'member');

                // 2. Average ELO (from profiles of members)
                const { data: members } = await supabase
                    .from('club_members')
                    .select('profile:profiles(modifiers)')
                    .eq('club_id', clubId)
                    .eq('role', 'member');

                let totalElo = 0;
                let validEloCount = 0;
                members?.forEach((m: any) => {
                    const elo = m.profile?.modifiers?.elo || 1200;
                    totalElo += elo;
                    validEloCount++;
                });

                // 3. Mock logic for "Assignments" (until real table exists)
                // We use XP logs to guess activity
                const { count: activityCount } = await supabase
                    .from('xp_logs')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

                setStats({
                    totalStudents: studentCount || 0,
                    activeStudents: 0, // Todo: check online status
                    avgElo: validEloCount > 0 ? Math.round(totalElo / validEloCount) : 1200,
                    assignmentsCompleted: activityCount || 0
                });
            } catch (error) {
                console.error("Error fetching school stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSchoolStats();
    }, [clubId]);

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <Panel className="flex items-center justify-between p-6 bg-zinc-900 border-zinc-700">
                <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display text-stroke">Aula Virtual</h2>
                <div className="flex gap-2">
                    <BulkImportModal clubId={clubId} />
                    <ShinyButton variant="primary">
                        <Plus className="mr-2 h-4 w-4" /> Nou Alumne
                    </ShinyButton>
                </div>
            </Panel>

            {/* KPIs de l'Escola */}
            <div className="grid gap-4 md:grid-cols-3">
                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Alumnes</span>
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display text-stroke">{stats.totalStudents}</div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Actius al curs</p>
                    </div>
                </GameCard>

                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Activitat Setmanal</span>
                        <BookOpen className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display text-stroke">{stats.assignmentsCompleted}</div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Accions registrades (XP)</p>
                    </div>
                </GameCard>

                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nivell Mitjà</span>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display text-stroke">{stats.avgElo} ELO</div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Mitjana del grup</p>
                    </div>
                </GameCard>
            </div>

            {/* Secció d'Accions Ràpides per a Professors */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <GameCard variant="default" className="col-span-4 p-0 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                            <Activity size={16} className="text-zinc-500" /> Activitat Recent de l'Aula
                        </h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-medium text-zinc-500 italic">
                            (Connectant amb registres d'XP en temps real...)
                        </p>
                    </div>
                </GameCard>
            </div>
        </div>
    );
}
