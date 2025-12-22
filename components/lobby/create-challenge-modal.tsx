'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTimeControl?: 'bullet' | 'blitz' | 'rapid';
}

export function CreateChallengeModal({ isOpen, onClose, defaultTimeControl = 'blitz' }: CreateChallengeModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [opponentType, setOpponentType] = useState<'human' | 'bot'>('human');
    const [botDifficulty, setBotDifficulty] = useState('medium');

    // Human options
    const [color, setColor] = useState<'white' | 'black' | 'random'>('random');
    const [timeControl, setTimeControl] = useState<string>(defaultTimeControl);
    const [mode, setMode] = useState<'rated' | 'casual'>('rated');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!user) return;
        setLoading(true);

        try {
            if (opponentType === 'bot') {
                const gameId = `bot-${crypto.randomUUID()}`;
                router.push(`/play/online/${gameId}?difficulty=${botDifficulty}`);
                onClose();
                setLoading(false);
                return;
            }

            // Generate a shared ID for both challenge and game
            const challengeId = crypto.randomUUID();

            // Determine initial white player based on color preference
            const isHostWhite = color === 'white' || (color === 'random' && Math.random() > 0.5);
            const timeLimit = timeControl === 'bullet' ? 60 : timeControl === 'blitz' ? 3 * 60 : 10 * 60;

            // Create challenge
            const { error: challengeError } = await supabase
                .from('challenges')
                .insert({
                    id: challengeId,
                    host_id: user.id,
                    player_color: color,
                    time_control_type: timeControl,
                    rated: mode === 'rated',
                    status: 'open',
                    map_x: Math.floor(Math.random() * 80) + 10,
                    map_y: Math.floor(Math.random() * 80) + 10
                });

            if (challengeError) throw challengeError;

            // Also create the game in pending status (host is already assigned)
            const { error: gameError } = await supabase
                .from('games')
                .insert({
                    id: challengeId,  // Same ID as challenge for easy matching
                    white_player_id: isHostWhite ? user.id : null,
                    black_player_id: isHostWhite ? null : user.id,
                    status: 'pending',  // Will become 'active' when opponent joins
                    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                    white_time: timeLimit,
                    black_time: timeLimit,
                    pgn: ''
                });

            if (gameError) throw gameError;

            // Redirect to game page to wait
            router.push(`/play/online/${challengeId}`);
            onClose();
            setLoading(false);

        } catch (e) {
            console.error(e);
            setLoading(false);
            alert('Error creating challenge. Please try again.');
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[var(--panel-bg)] border-[var(--border)] text-[var(--foreground)]">
                <DialogHeader>
                    <DialogTitle>Jugar una Partida</DialogTitle>
                </DialogHeader>

                {/* Opponent Selector */}
                <div className="flex gap-2 mb-4 p-1 bg-[var(--card-bg)] rounded-lg">
                    <button
                        onClick={() => setOpponentType('human')}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${opponentType === 'human' ? 'bg-[var(--panel-bg)] text-[var(--foreground)] shadow' : 'text-[var(--color-secondary)] hover:text-[var(--foreground)]'}`}
                    >
                        Vs Human
                    </button>
                    <button
                        onClick={() => setOpponentType('bot')}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${opponentType === 'bot' ? 'bg-[var(--panel-bg)] text-[var(--foreground)] shadow' : 'text-[var(--color-secondary)] hover:text-[var(--foreground)]'}`}
                    >
                        Vs Bot
                    </button>
                </div>

                <div className="grid gap-4 py-4">
                    {opponentType === 'human' ? (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="color" className="text-right">Color</Label>
                                <Select value={color} onValueChange={(v: any) => setColor(v)}>
                                    <SelectTrigger className="col-span-3 bg-[var(--card-bg)] border-[var(--border)]">
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border)]">
                                        <SelectItem value="white">Blanques</SelectItem>
                                        <SelectItem value="black">Negres</SelectItem>
                                        <SelectItem value="random">Aleatori</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">Temps</Label>
                                <Select value={timeControl} onValueChange={setTimeControl}>
                                    <SelectTrigger className="col-span-3 bg-[var(--card-bg)] border-[var(--border)]">
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border)]">
                                        <SelectItem value="bullet">Bullet (1+0)</SelectItem>
                                        <SelectItem value="blitz">Blitz (3+2)</SelectItem>
                                        <SelectItem value="rapid">Rapid (10+0)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="mode" className="text-right">Mode</Label>
                                <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                                    <SelectTrigger className="col-span-3 bg-[var(--card-bg)] border-[var(--border)]">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--card-bg)] border-[var(--border)]">
                                        <SelectItem value="rated">Competitiu</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="difficulty" className="text-right">Nivell</Label>
                            <Select value={botDifficulty} onValueChange={setBotDifficulty}>
                                <SelectTrigger className="col-span-3 bg-[var(--card-bg)] border-[var(--border)]">
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--card-bg)] border-[var(--border)]">
                                    <SelectItem value="easy">Fàcil (800)</SelectItem>
                                    <SelectItem value="medium">Mitjà (1200)</SelectItem>
                                    <SelectItem value="hard">Difícil (1800)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="border-[var(--border)] hover:bg-[var(--card-bg)] text-[var(--foreground)] hover:text-[var(--foreground)]">Cancel·lar</Button>
                    <Button onClick={handleCreate} disabled={loading} className="bg-[var(--color-primary)] hover:opacity-90 text-black font-bold border-none">
                        {loading ? 'Creant...' : (opponentType === 'bot' ? 'Jugar contra Bot' : 'Crear Sala')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
