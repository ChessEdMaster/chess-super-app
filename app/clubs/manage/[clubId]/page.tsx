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

    const [activeSection, setActiveSection] = useState('overview');

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

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-8">
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
            case 'members':
                return (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Gestió de Socis</h2>
                        <p className="text-neutral-400">Llistat de membres, rols i estats de subscripció.</p>
                        {/* Placeholder for members table */}
                        <div className="mt-8 text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl">
                            <Users className="mx-auto text-neutral-600 mb-4" size={48} />
                            <p className="text-neutral-500">Taula de socis en construcció...</p>
                        </div>
                    </div>
                );
            case 'finance':
                return (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Finances i Quotes</h2>
                        <p className="text-neutral-400">Gestió de plans de preus, facturació i despeses.</p>
                        {/* Placeholder */}
                        <div className="mt-8 text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl">
                            <CreditCard className="mx-auto text-neutral-600 mb-4" size={48} />
                            <p className="text-neutral-500">Mòdul financer en construcció...</p>
                        </div>
                    </div>
                );
            case 'meetings':
                return (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Actes i Reunions</h2>
                        <p className="text-neutral-400">Gestió d'assemblees, actes de reunions i votacions.</p>
                        {/* Placeholder */}
                        <div className="mt-8 text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl">
                            <Activity className="mx-auto text-neutral-600 mb-4" size={48} />
                            <p className="text-neutral-500">Mòdul d'actes en construcció...</p>
                        </div>
                    </div>
                );
            case 'tournaments':
                return (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Torneigs i Activitats</h2>
                        <p className="text-neutral-400">Organització de competicions internes i interclubs.</p>
                        {/* Placeholder */}
                        <div className="mt-8 text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl">
                            <TrendingUp className="mx-auto text-neutral-600 mb-4" size={48} />
                            <p className="text-neutral-500">Gestor de torneigs en construcció...</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-neutral-900 border-r border-neutral-800 hidden md:flex flex-col">
                <div className="p-6 border-b border-neutral-800">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Activity className="text-indigo-500" />
                        Club Manager
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveSection('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'overview' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                    >
                        <Activity size={20} />
                        <span>Visió General</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('members')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'members' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                    >
                        <Users size={20} />
                        <span>Socis</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('finance')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'finance' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                    >
                        <CreditCard size={20} />
                        <span>Finances</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('meetings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'meetings' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                    >
                        <Users size={20} />
                        <span>Actes i Reunions</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('tournaments')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'tournaments' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                    >
                        <TrendingUp size={20} />
                        <span>Torneigs</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}
