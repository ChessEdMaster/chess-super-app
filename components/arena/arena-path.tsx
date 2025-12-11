'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { ArenaProgress, ArenaRewardNode, generateArenaPath, ARENA_TIERS } from '@/types/arena';
import { cn } from '@/lib/utils';
import { Lock, Check, Trophy, Shield, Star } from 'lucide-react';
import Image from 'next/image';

interface ArenaPathProps {
    progress: ArenaProgress;
    onClaimChest: (chestId: string) => void;
    onPlayGatekeeper: (tier: number) => void;
}

export function ArenaPath({ progress, onClaimChest, onPlayGatekeeper }: ArenaPathProps) {
    const nodes = useMemo(() => generateArenaPath(), []);
    const currentCups = progress.current_cups;

    // Reverse nodes to show 1000 at top and 0 at bottom (like climbing a mountain)
    const reversedNodes = [...nodes].reverse();

    // Ref for the scrolling container
    const activeNodeRef = useRef<HTMLDivElement>(null);

    // Scroll active node into view on mount
    useEffect(() => {
        if (activeNodeRef.current) {
            activeNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeNodeRef]);

    return (
        <div className="relative w-full max-w-md mx-auto bg-slate-900/50 rounded-xl p-4 overflow-hidden">
            {/* Background Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-slate-800 -translate-x-1/2 rounded-full" />

            {/* Progress Line (Fill) */}
            {/* This is tricky to do perfectly with a simple div for a reversed list, 
                so we might just color the nodes or use a calculated height. 
                For now, let's stick to node coloring. */}

            <div className="relative z-10 space-y-8 py-8">
                {reversedNodes.map((node, index) => {
                    const isReached = currentCups >= node.cups;
                    // Determine if this is the "active" or next target node
                    // It's the first unreached node OR the last reached node if checking from bottom up
                    // In a reversed list (Top=High Cups), the active node is the one just above the reached threshold.

                    // Simple logic: Highlight the node if it's the next goal or just reached
                    const isNext = !isReached && (index === reversedNodes.length - 1 || currentCups >= reversedNodes[index + 1]?.cups);

                    return (
                        <div key={node.cups} ref={isNext ? activeNodeRef : null}>
                            <PathNode
                                node={node}
                                isReached={isReached}
                                progress={progress}
                                onClaimChest={onClaimChest}
                                onPlayGatekeeper={onPlayGatekeeper}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PathNode({ node, isReached, progress, onClaimChest, onPlayGatekeeper }: {
    node: ArenaRewardNode,
    isReached: boolean,
    progress: ArenaProgress,
    onClaimChest: (id: string) => void,
    onPlayGatekeeper: (tier: number) => void
}) {
    const isClaimed = node.chestId ? progress.chests_claimed.includes(node.chestId) : false;

    // Determine Tier for Gatekeeper
    const tierInfo = node.type === 'GATEKEEPER'
        ? ARENA_TIERS.find(t => t.maxCups === node.cups)
        : null;

    const isGatekeeperDefeated = tierInfo
        ? progress.gatekeepers_defeated.includes(tierInfo.tier)
        : false;

    return (
        <div className={cn(
            "flex items-center justify-center relative",
            node.type === 'START' || node.type === 'END' ? "mb-4" : ""
        )}>
            {/* Left Side (Cups Label) */}
            <div className="absolute left-4 text-right w-20">
                <span className={cn(
                    "font-bold text-sm",
                    isReached ? "text-indigo-400" : "text-slate-600"
                )}>
                    {node.cups} 🏆
                </span>
            </div>

            {/* Center Node */}
            <div className={cn(
                "w-12 h-12 rounded-full border-4 flex items-center justify-center z-20 transition-all shadow-lg",
                isReached
                    ? "bg-indigo-600 border-indigo-400 shadow-indigo-500/50"
                    : "bg-slate-800 border-slate-700"
            )}>
                {node.type === 'START' && <Star size={20} className="text-white" />}
                {node.type === 'END' && <Trophy size={20} className="text-yellow-400" />}
                {node.type === 'CHEST' && (
                    <div className="relative">
                        {isClaimed ? (
                            <Check size={20} className="text-green-400" />
                        ) : (
                            <Lock size={18} className={isReached ? "text-white" : "text-slate-500"} />
                        )}
                    </div>
                )}
                {node.type === 'GATEKEEPER' && (
                    <Shield size={20} className={isGatekeeperDefeated ? "text-green-400" : "text-red-400"} />
                )}
            </div>

            {/* Right Side (Content/Action) */}
            <div className="absolute right-4 w-32 text-left pl-4">
                {node.type === 'CHEST' && (
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase">{node.chestType} Chest</span>
                        {isReached && !isClaimed && (
                            <button
                                onClick={() => node.chestId && onClaimChest(node.chestId)}
                                className="mt-1 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded animate-pulse"
                            >
                                CLAIM
                            </button>
                        )}
                        {isClaimed && <span className="text-[10px] text-green-500">Claimed</span>}
                    </div>
                )}

                {node.type === 'GATEKEEPER' && tierInfo && (
                    <div className="flex flex-col">
                        <span className="text-xs text-red-400 font-bold uppercase">Boss: {tierInfo.bossName}</span>
                        {isReached && !isGatekeeperDefeated && (
                            <button
                                onClick={() => onPlayGatekeeper(tierInfo.tier)}
                                className="mt-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                                BATTLE
                            </button>
                        )}
                        {isGatekeeperDefeated && <span className="text-[10px] text-green-500">Defeated</span>}
                    </div>
                )}

                {node.type === 'END' && (
                    <span className="text-xs text-yellow-400 font-bold">LEAGUE UNLOCK</span>
                )}
            </div>
        </div>
    );
}
