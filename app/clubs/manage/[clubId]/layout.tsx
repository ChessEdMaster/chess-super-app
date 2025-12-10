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
    GraduationCap,
    Lock,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CLUB_NAVIGATION } from '@/lib/config/club-navigation';
import { ClubType } from '@/types/club';

export default function ClubManageLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const clubId = params.clubId as string;
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const [clubName, setClubName] = useState<string>('Carregant...');
    const [clubType, setClubType] = useState<string>('online'); // Use string to accept 'physical_club' if DB has it
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
                setClubType(club.type);

                // 2. Verificar membresía
                const { data: member, error: memberError } = await supabase
                    .from('club_members')
                    .select('role')
                    .eq('club_id', clubId)
                    .eq('user_id', user.id)
                    .maybeSingle(); // Use maybeSingle to avoid 406 if row doesn't exist

                if (memberError) {
                    console.error('[Club ERP] Member check error:', memberError);
                    setAccessDenied('Database error checking membership.');
                    return;
                }

                if (!member) {
                    setAccessDenied('No ets membre d\'aquest club.');
                    return;
                }

                // 3. Verificar permisos de rol
                if (!['owner', 'admin'].includes(member.role)) {
                    setAccessDenied('No tens permisos d\'administrador per accedir a aquest panell.');
                    return;
                }

                // Success
                setLoading(false);

            } catch (err: any) {
                console.error('[Club ERP] Unexpected error:', err);
                setAccessDenied(err.message || 'Error desconegut.');
            }
        };

        checkPermission();
    }, [user, clubId, authLoading, router]);

    if (loading && !accessDenied) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="text-neutral-400 text-sm animate-pulse">Verificant permisos...</p>
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Accés Denegat</h2>
                    <p className="text-neutral-400 mb-6">{accessDenied}</p>
                    <Link href="/clubs">
                        <Button variant="outline" className="w-full">
                            Tornar als Clubs
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const navItems = CLUB_NAVIGATION[clubType] || CLUB_NAVIGATION['online'];

    return (
        <div className="min-h-screen bg-neutral-950 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-neutral-800">
                        <Link href={`/clubs/${clubId}`} className="flex items-center text-sm text-neutral-400 hover:text-white mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tornar al Club
                        </Link>
                        <h2 className="text-xl font-bold text-white truncate" title={clubName}>
                            {clubName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Panell de Gestió</p>
                            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium uppercase text-neutral-400 border border-neutral-700">
                                {clubType.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href(clubId);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href(clubId)}
                                    className={cn(
                                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-neutral-800">
                        <div className="flex items-center p-3 rounded-lg bg-neutral-800/50">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                                <p className="text-xs text-neutral-500">Administrador</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-800">
                    <h1 className="text-lg font-bold text-white">{clubName}</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                </header>

                <main className="flex-1 overflow-y-auto bg-neutral-950 p-4 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
