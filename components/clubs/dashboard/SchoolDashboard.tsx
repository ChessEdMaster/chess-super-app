'use client';

import { GraduationCap, BookOpen, Trophy, Plus, Activity } from "lucide-react";
import { BulkImportModal } from "../bulk-import-modal";
import { GameCard } from "@/components/ui/design-system/GameCard";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";
import { Panel } from "@/components/ui/design-system/Panel";

export function SchoolDashboard({ clubId }: { clubId: string }) {
    return (
        <div className="space-y-6">
            <Panel className="flex items-center justify-between p-6 bg-zinc-900 border-zinc-700">
                <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display text-stroke">Aula Virtual</h2>
                <div className="flex gap-2">
                    <BulkImportModal clubId={clubId} />
                    <ShinyButton variant="primary">
                        <Plus className="mr-2 h-4 w-4" /> Nou Alumne
                    </ShinyButton>
                </div>
            </Panel>

            {/* KPIs de l'Escola */}
            <div className="grid gap-4 md:grid-cols-3">
                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Alumnes</span>
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">24</div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">+4 aquest mes</p>
                    </div>
                </GameCard>

                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Deures Entregats</span>
                        <BookOpen className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">85%</div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Setmana actual</p>
                    </div>
                </GameCard>

                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nivell Mitjà</span>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">1250 ELO</div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">+15 punts de millora</p>
                    </div>
                </GameCard>
            </div>

            {/* Secció d'Accions Ràpides per a Professors */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <GameCard variant="default" className="col-span-4 p-0 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                            <Activity size={16} className="text-zinc-500" /> Activitat Recent de l'Aula
                        </h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-medium text-zinc-500 italic">
                            (Aquí hi anirà el llistat d'exercicis completats pels alumnes)
                        </p>
                        {/* TODO: Connectar amb la taula d'activitat real */}
                    </div>
                </GameCard>
            </div>
        </div>
    );
}
