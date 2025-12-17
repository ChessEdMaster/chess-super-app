'use client';

import { Users, CreditCard, CalendarDays, UserPlus } from "lucide-react";
import { GameCard } from "@/components/ui/design-system/GameCard";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";
import { Panel } from "@/components/ui/design-system/Panel";

export function ClubDashboard({ clubId }: { clubId: string }) {
    return (
        <div className="space-y-6">
            <Panel className="flex items-center justify-between p-6 bg-zinc-900 border-zinc-700">
                <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display text-stroke">Administració del Club</h2>
                <div className="flex gap-2">
                    <ShinyButton variant="secondary">
                        <CalendarDays className="mr-2 h-4 w-4" /> Nou Event
                    </ShinyButton>
                    <ShinyButton variant="primary">
                        <UserPlus className="mr-2 h-4 w-4" /> Alta Soci
                    </ShinyButton>
                </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-3">
                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Socis Actius</span>
                        <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">142</div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">12 quotes pendents</p>
                    </div>
                </GameCard>

                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ingressos Mensuals</span>
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">1.250€</div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">+20% vs mes passat</p>
                    </div>
                </GameCard>
            </div>
        </div>
    );
}
