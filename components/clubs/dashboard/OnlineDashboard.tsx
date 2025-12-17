'use client';

import { Swords, Trophy, MessageSquare } from "lucide-react";
import { GameCard } from "@/components/ui/design-system/GameCard";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";
import { Panel } from "@/components/ui/design-system/Panel";

export function OnlineDashboard({ clubId }: { clubId: string }) {
    return (
        <div className="space-y-6">
            <Panel className="flex items-center justify-between p-6 bg-zinc-900 border-zinc-700">
                <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display text-stroke">Comunitat Online</h2>
                <ShinyButton variant="primary">
                    <Trophy className="mr-2 h-4 w-4" /> Crear Torneig
                </ShinyButton>
            </Panel>

            <div className="grid gap-4 md:grid-cols-3">
                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Partides Avui</span>
                        <Swords className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">56</div>
                    </div>
                </GameCard>

                {/* Placeholders for other stats */}
                <GameCard variant="default" className="p-0 overflow-hidden opacity-50">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Torneigs Actius</span>
                        <Trophy className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">0</div>
                    </div>
                </GameCard>
            </div>
        </div>
    );
}
