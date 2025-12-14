import React from 'react';
import Link from 'next/link';
import { Castle, Users, Trophy, ShoppingBag, Palette, LayoutDashboard, Shield } from 'lucide-react';

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 pb-24 space-y-6">
            <header>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    SuperAdmin Features
                </h1>
                <p className="text-zinc-400 text-sm">
                    Access to hidden features not available in the Beta.
                </p>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <FeatureCard
                    href="/kingdom"
                    icon={Castle}
                    title="Kingdom"
                    description="Clans and territories"
                    color="bg-amber-500"
                />
                <FeatureCard
                    href="/social"
                    icon={Users}
                    title="Social"
                    description="Events and community"
                    color="bg-blue-500"
                />
                <FeatureCard
                    href="/improve"
                    icon={Trophy}
                    title="Improve"
                    description="Legacy improvement tools"
                    color="bg-emerald-500"
                />
                <FeatureCard
                    href="/shop"
                    icon={ShoppingBag}
                    title="Shop"
                    description="Store and currency"
                    color="bg-pink-500"
                />
                <FeatureCard
                    href="/studio"
                    icon={Palette}
                    title="Studio"
                    description="Content creation"
                    color="bg-violet-500"
                />
                <FeatureCard
                    href="/minigames"
                    icon={LayoutDashboard}
                    title="Minigames"
                    description="Extra games"
                    color="bg-orange-500"
                />
                <FeatureCard
                    href="/admin/users"
                    icon={Shield}
                    title="Admin Panel"
                    description="User management"
                    color="bg-red-500"
                />
            </div>
        </div>
    );
}

function FeatureCard({ href, icon: Icon, title, description, color }: { href: string, icon: any, title: string, description: string, color: string }) {
    return (
        <Link
            href={href}
            className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
        >
            <div className={`w-10 h-10 rounded-lg ${color} bg-opacity-20 flex items-center justify-center text-${color.replace('bg-', '')}`}>
                <Icon size={20} className="text-white" />
            </div>
            <div>
                <h3 className="font-bold text-zinc-100">{title}</h3>
                <p className="text-xs text-zinc-500 leading-tight">{description}</p>
            </div>
        </Link>
    );
}
