'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Users,
    TrendingUp,
    CreditCard,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

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

    useEffect(() => {
        const fetchStats = async () => {
            // Mock data for now, eventually replace with real aggregations
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
            setLoading(false);
        };

        fetchStats();
    }, [clubId]);

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

    function cn(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Visió General</h1>
                <p className="text-neutral-400 mt-2">Benvingut al panell de control del teu club.</p>
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

            {/* Recent Activity Section (Placeholder) */}
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
