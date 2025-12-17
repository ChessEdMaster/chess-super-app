import React from 'react';
import { useSyzygy } from '@/hooks/use-syzygy';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Skull, Minus } from 'lucide-react';

interface EndgamePanelProps {
    fen: string;
}

export const EndgamePanel = ({ fen }: EndgamePanelProps) => {
    const { data, loading, isApplicable, error } = useSyzygy(fen);

    if (!isApplicable) return null;

    return (
        <Card className="mt-4 border-amber-500/50 bg-amber-950/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Base de Dades de Finals (Syzygy)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                        <Skull className="h-3 w-3" /> {error}
                    </div>
                ) : loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-3 w-3 animate-spin" /> Consultant l'oracle...
                    </div>
                ) : data ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Veredicte:</span>
                            <Badge variant={data.wdl > 0 ? "default" : data.wdl < 0 ? "destructive" : "secondary"}>
                                {data.evaluation}
                            </Badge>
                        </div>
                        {data.bestMove && (
                            <div className="text-xs font-mono bg-background/50 p-2 rounded border">
                                Millor jugada: <span className="text-primary font-bold">{data.bestMove}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">Dades no disponibles</p>
                )}
            </CardContent>
        </Card>
    );
};
