import { useState, useEffect } from 'react';
import { fetchSyzygyData, canUseSyzygy, SyzygyResult, getHumanEval } from '@/lib/syzygy';

export function useSyzygy(fen: string) {
    const [data, setData] = useState<SyzygyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [isApplicable, setIsApplicable] = useState(false);

    useEffect(() => {
        // 1. Validar si aplica (<= 7 peces)
        const applicable = canUseSyzygy(fen);
        setIsApplicable(applicable);

        if (!applicable) {
            setData(null);
            return;
        }

        // 2. Fetch de dades
        const fetchData = async () => {
            setLoading(true);
            const result = await fetchSyzygyData(fen);

            if (result) {
                // Trobar el millor moviment (els moviments venen ordenats per qualitat normalment, 
                // però l'API retorna un objecte, cal iterar per trobar el millor WDL/DTZ)

                // Simplificació: Agafem el millor WDL
                let bestMoveUci = null;
                let bestWdl = -2; // Valor impossible

                if (result.moves) {
                    Object.entries(result.moves).forEach(([move, stats]) => {
                        // Lògica bàsica: maximitzar WDL
                        // Note: This logic assumes it's white's turn or WDL is relative to side to move.
                        // Syzygy API WDL is relative to the side to move. 1 = Win, 0 = Draw, -1 = Loss.
                        // So we always want to MAXIMIZE WDL for the current player.
                        if (stats.wdl > bestWdl) {
                            bestWdl = stats.wdl;
                            bestMoveUci = move;
                        }
                    });
                }

                setData({
                    evaluation: getHumanEval(result.wdl, result.dtz),
                    wdl: result.wdl,
                    bestMove: bestMoveUci
                });
            }
            setLoading(false);
        };

        // Debounce petit per no saturar si l'usuari arrossega peces ràpid
        const timeoutId = setTimeout(fetchData, 500);

        return () => clearTimeout(timeoutId);
    }, [fen]);

    return { data, loading, isApplicable };
}
