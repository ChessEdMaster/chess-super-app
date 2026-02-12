'use client';

import Link from 'next/link';
import { Map as MapIcon, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { Panel } from '@/components/ui/design-system/Panel';

export default function SitemapPage() {
    // Hardcoded list of all detected pages (2026-02-12)
    const routes = [
        '/',
        '/academy',
        '/academy/concepts',
        '/academy/concepts/[conceptName]',
        '/academy/course/[courseId]',
        '/academy/exercises',
        '/academy/manage',
        '/academy/manage/create',
        '/academy/setup',
        '/academy/[moduleId]',
        '/academy/[moduleId]/[lessonId]',
        '/activate',
        '/admin',
        '/admin/permissions',
        '/admin/roles',
        '/admin/users',
        '/analysis',
        '/auth/auth-code-error',
        '/auth/verify',
        '/books/los-100-finales',
        '/business/dashboard',
        '/business/manage/[clubId]',
        '/cards',
        '/clubs',
        '/clubs/[id]',
        '/clubs/manage/[clubId]',
        '/clubs/manage/[clubId]/academy',
        '/clubs/manage/[clubId]/groups',
        '/clubs/manage/[clubId]/groups/[groupId]',
        '/clubs/manage/[clubId]/matches',
        '/clubs/manage/[clubId]/members',
        '/clubs/manage/[clubId]/plans',
        '/clubs/manage/[clubId]/settings',
        '/events',
        '/events/[id]',
        '/features',
        '/improve',
        '/kingdom',
        '/lobby',
        '/login',
        '/mapa-escacs',
        '/messages',
        '/minigames',
        '/minigames/8-queens',
        '/minigames/futchess',
        '/openings',
        '/play',
        '/play/online',
        '/play/online/[id]',
        '/profile',
        '/profile/games',
        '/profile/[id]',
        '/puzzles',
        '/register',
        '/shop',
        '/shop/cart',
        '/shop/checkout',
        '/shop/orders/[id]',
        '/shop/products',
        '/shop/products/[slug]',
        '/social',
        '/studio',
        '/tree',
        '/welcome'
    ].sort();

    // Group routes by top-level section
    const groupedRoutes: Record<string, string[]> = {};
    routes.forEach(route => {
        const root = route.split('/')[1] || 'root';
        if (!groupedRoutes[root]) groupedRoutes[root] = [];
        groupedRoutes[root].push(route);
    });

    const sections = Object.keys(groupedRoutes).sort();

    return (
        <div className="min-h-screen bg-zinc-950 p-8 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <MapIcon className="text-amber-500" size={32} />
                            Site Index
                        </h1>
                        <p className="text-zinc-500 mt-2 font-medium">
                            Manual index of <span className="text-white font-bold">{routes.length}</span> pages.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {sections.map(section => (
                        <Panel key={section} className="bg-zinc-900/50 border-zinc-800">
                            <h2 className="text-xl font-black text-zinc-400 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                {section === 'root' ? 'Landing / Core' : section}
                            </h2>
                            <ul className="space-y-2">
                                {groupedRoutes[section].map((route) => {
                                    const isDynamic = route.includes('[');
                                    return (
                                        <li key={route} className="group">
                                            <Link
                                                href={isDynamic ? '#' : route}
                                                className={`
                                                    flex items-center justify-between p-3 rounded-lg border transition-all
                                                    ${isDynamic
                                                        ? 'bg-zinc-950/30 border-dashed border-zinc-800 text-zinc-500 cursor-not-allowed'
                                                        : 'bg-zinc-950 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                                                    }
                                                `}
                                                onClick={e => isDynamic && e.preventDefault()}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {isDynamic ? (
                                                        <AlertTriangle size={16} className="text-amber-500/50 flex-shrink-0" />
                                                    ) : (
                                                        <FileText size={16} className="text-indigo-500/50 group-hover:text-indigo-400 flex-shrink-0" />
                                                    )}
                                                    <span className="font-mono text-sm truncate" title={route}>
                                                        {route}
                                                    </span>
                                                </div>

                                                {isDynamic ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-600 px-2 py-1 rounded">
                                                        Dynamic
                                                    </span>
                                                ) : (
                                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Panel>
                    ))}
                </div>
            </div>
        </div>
    );
}
