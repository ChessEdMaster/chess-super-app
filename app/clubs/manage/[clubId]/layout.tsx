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
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function ClubManageLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const clubId = params.clubId as string;
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();
    const [clubName, setClubName] = useState<string>('Carregant...');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPermission = async () => {
            if (authLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            if (!clubId) return;

            try {
                // CRÍTICO: Separar las consultas para evitar problemas con RLS
                // 1. Verificar membresía
                const { data: member, error: memberError } = await supabase
                    .from('club_members')
                    .select('role')
                    .eq('club_id', clubId)
                    .eq('user_id', user.id)
                    .single();

                if (memberError || !member) {
                    console.error('[Club ERP] Access denied: Not a member', memberError);
                    alert('No tens accés a aquest panell de gestió. Només el propietari i els administradors poden accedir.');
                    router.push('/clubs');
                    return;
                }

                // 2. Verificar permisos
                if (!['owner', 'admin'].includes(member.role)) {
                    console.error('[Club ERP] Access denied: Insufficient permissions', { role: member.role });
                    alert('No tens permisos suficients. Només el propietari i els administradors poden accedir.');
                    router.push('/clubs');
                    return;
                }

                // 3. Obtener nombre del club (separado para evitar problemas con RLS)
                const { data: club, error: clubError } = await supabase
                    .from('clubs')
                    .select('name')
                    .eq('id', clubId)
                    .single();

                if (clubError) {
                    console.error('[Club ERP] Error fetching club:', clubError);
                    alert('Error carregant la informació del club.');
                    router.push('/clubs');
                    return;
                }

                if (club) {
                    setClubName(club.name);
                }

                setLoading(false);

            } catch (err) {
                console.error('[Club ERP] Error checking permissions:', err);
                alert('Error verificant permisos. Torna-ho a intentar.');
                router.push('/clubs');
            }
        };

        checkPermission();
    }, [user, clubId, authLoading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const navItems = [
        { href: `/clubs/manage/${clubId}`, label: 'Visió General', icon: LayoutDashboard },
        { href: `/clubs/manage/${clubId}/members`, label: 'Socis i Membres', icon: Users },
        { href: `/clubs/manage/${clubId}/plans`, label: 'Plans i Quotes', icon: CreditCard },
        { href: `/clubs/manage/${clubId}/matches`, label: 'Competicions', icon: Trophy },
        { href: `/clubs/manage/${clubId}/settings`, label: 'Configuració', icon: Settings },
    ];

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
                        <Link href={`/clubs`} className="flex items-center text-sm text-neutral-400 hover:text-white mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tornar als Clubs
                        </Link>
                        <h2 className="text-xl font-bold text-white truncate" title={clubName}>
                            {clubName}
                        </h2>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Panell de Gestió</p>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
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
