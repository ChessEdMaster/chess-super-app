'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    Trophy,
    ArrowLeft,
    Menu,
    ShieldAlert,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CLUB_NAVIGATION } from '@/lib/config/club-navigation';
import { ClubType } from '@/types/club';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';

export default function ClubManageLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const clubId = params.clubId as string;
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const [clubName, setClubName] = useState<string>('Carregant...');
    const [clubType, setClubType] = useState<ClubType>('online');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState<string | null>(null);

    useEffect(() => {
        const checkPermission = async () => {
            if (authLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            if (!clubId) return;

            try {
                setLoading(true);
                // 1. Obtener nombre y tipo del club FIRST to debug
                const { data: club, error: clubError } = await supabase
                    .from('clubs')
                    .select('name, type')
                    .eq('id', clubId)
                    .single();

                if (clubError || !club) {
                    console.error('[Club ERP] Error fetching club:', clubError);
                    setAccessDenied('Club not found or error loading details.');
                    return;
                }

                setClubName(club.name);
                setClubType(club.type as ClubType);

                // 2. Verificar membresía
                const { data: member, error: memberError } = await supabase
                    .from('club_members')
                    .select('role')
                    .eq('club_id', clubId)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (memberError) {
                    console.error('[Club ERP] Member check error:', memberError);
                    setAccessDenied('Database error checking membership.');
                    return;
                }

                if (!member) {
                    setAccessDenied('No ets membre d&apos;aquest club.');
                    return;
                }

                // 3. Verificar permisos de rol
                if (!['owner', 'admin'].includes(member.role)) {
                    setAccessDenied('No tens permisos d&apos;administrador per accedir a aquest panell.');
                    return;
                }

                // Success
                setLoading(false);

            } catch (err) {
                console.error('[Club ERP] Unexpected error:', err);
                setAccessDenied((err as Error).message || 'Error desconegut.');
            }
        };

        checkPermission();
    }, [user, clubId, authLoading, router]);

    if (loading && !accessDenied) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
                    <p className="text-amber-500 font-bold uppercase tracking-widest text-xs animate-pulse">Verificant permisos...</p>
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <GameCard variant="default" className="p-8 max-w-md w-full text-center border-red-900/50">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Accés Denegat</h2>
                    <p className="text-zinc-400 mb-6 font-medium">{accessDenied}</p>
                    <Link href="/clubs">
                        <ShinyButton variant="neutral" className="w-full">
                            Tornar als Clubs
                        </ShinyButton>
                    </Link>
                </GameCard>
            </div>
        );
    }

    const navItems = CLUB_NAVIGATION[clubType] || CLUB_NAVIGATION['online'];

    return (
        <div className="min-h-screen bg-zinc-950 flex font-sans">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900/95 backdrop-blur-md border-r border-zinc-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col shadow-2xl",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 border-b border-zinc-800 bg-zinc-900">
                    <Link href={`/clubs/${clubId}`} className="flex items-center text-[10px] font-bold text-zinc-500 hover:text-white mb-4 uppercase tracking-widest transition-colors group">
                        <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Tornar al Club
                    </Link>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20">
                            <Shield size={20} className="text-amber-500" />
                        </div>
                        <h2 className="text-lg font-black text-white truncate font-display uppercase tracking-wide leading-none" title={clubName}>
                            {clubName}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-11">
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[9px] font-black uppercase text-zinc-400 border border-zinc-700 tracking-wider">
                            {clubType.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4 py-2 mb-2">
                        Menu Principal
                    </div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href(clubId);
                        return (
                            <Link
                                key={item.label}
                                href={item.href(clubId)}
                                className={cn(
                                    "flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group border border-transparent",
                                    isActive
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-amber-500" : "text-zinc-600 group-hover:text-zinc-300")} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg border border-indigo-400/30">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Administrador</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
                    <h1 className="text-lg font-black text-white font-display uppercase">{clubName}</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400">
                        <Menu className="w-6 h-6" />
                    </Button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-20">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
