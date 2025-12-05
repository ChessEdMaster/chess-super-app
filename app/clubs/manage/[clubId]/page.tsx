'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import {
    Users,
    TrendingUp,
    CreditCard,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClubDashboardPage() {
    const params = useParams();
    const clubId = params.clubId as string;
    const [stats, setStats] = useState({
        members: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        pendingRequests: 0
    });
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const checkAccessAndFetchStats = async () => {
            if (!user) return;

            try {
                // 1. Verify Access
                const { data: club, error: clubError } = await supabase
                    .from('clubs')
                    .select('owner_id, type')
                    .eq('id', clubId)
                    .single();

                if (clubError || !club) {
                    toast.error('Club not found');
                    router.push('/clubs');
                    return;
                }

                if (club.owner_id !== user.id) {
                    toast.error('Only the owner can access the ERP');
                    router.push(`/clubs/${clubId}`);
                    return;
                }

                if (club.type !== 'club' && club.type !== 'school') {
                    toast.error('ERP is only available for Clubs and Schools');
                    router.push(`/clubs/${clubId}`);
                    return;
                }

                // 2. Fetch Stats (Mock for now)
                // In a real app, we might create a Postgres View or RPC for this dashboard
                const { count: memberCount } = await supabase
                    .from('club_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('club_id', clubId);

                // Mock revenue calculation
                setStats({
                    members: memberCount || 0,
                    activeSubscriptions: Math.floor((memberCount || 0) * 0.8),
                    monthlyRevenue: Math.floor((memberCount || 0) * 15), // Example: 15€ avg
                    pendingRequests: 2 // Mock
                });
            } catch (error) {
                console.error('Error loading dashboard:', error);
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        checkAccessAndFetchStats();
    }, [clubId, user, router]);


    const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtext }: any) => (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-400">{title}</h3>
                <div className="p-2 bg-neutral-800 rounded-lg text-emerald-500">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="flex items-baseline space-x-2">
                <h2 className="text-3xl font-bold text-white">{value}</h2>
                {trend && (
                    <span className={cn("flex items-center text-xs font-medium",
                        trend === 'up' ? "text-emerald-500" : "text-red-500"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {trendValue}
                    </span>
                )}
            </div>
            {subtext && <p className="text-xs text-neutral-500 mt-2">{subtext}</p>}
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Visió General</h1>
                <p className="text-neutral-400 mt-2">Benvingut al panell de gestió del teu club.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Socis Totals"
                    value={stats.members}
                    icon={Users}
                    trend="up"
                    trendValue="+12%"
                    subtext="Respecte al mes passat"
                />
                <StatCard
                    title="Subscripcions Actives"
                    value={stats.activeSubscriptions}
                    icon={Activity}
                    trend="up"
                    trendValue="+5%"
                    subtext="80% dels membres"
                />
                <StatCard
                    title="Ingressos Mensuals"
                    value={`${stats.monthlyRevenue}€`}
                    icon={CreditCard}
                    trend="up"
                    trendValue="+8%"
                    subtext="Projecció actual"
                />
                <StatCard
                    title="Sol·licituds Pendents"
                    value={stats.pendingRequests}
                    icon={TrendingUp}
                    subtext="Requereixen atenció"
                />
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Activitat Recent</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center p-3 hover:bg-neutral-800/50 rounded-lg transition-colors">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-4" />
                                <div>
                                    <p className="text-sm text-white">Nou soci registrat: <span className="font-bold">Marc G.</span></p>
                                    <p className="text-xs text-neutral-500">Fa 2 hores</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Accions Ràpides</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left transition-colors">
                            <CreditCard className="w-6 h-6 text-emerald-500 mb-2" />
                            <span className="block text-sm font-bold text-white">Crear Pla</span>
                            <span className="text-xs text-neutral-400">Nova quota de soci</span>
                        </button>
                        <button className="p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left transition-colors">
                            <Users className="w-6 h-6 text-blue-500 mb-2" />
                            <span className="block text-sm font-bold text-white">Afegir Membre</span>
                            <span className="text-xs text-neutral-400">Registre manual</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
