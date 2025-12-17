import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { fetchSyzygyData, canUseSyzygy, SyzygyResult, getHumanEval, SyzygyMove } from '@/lib/syzygy';

export function useSyzygy(fen: string) {
    const [data, setData] = useState<SyzygyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [isApplicable, setIsApplicable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Validar si aplica (<= 7 peces)
        const applicable = canUseSyzygy(fen);
        setIsApplicable(applicable);
        setError(null);

        if (!applicable) {
            setData(null);
            return;
        }

        // 2. Fetch de dades
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchSyzygyData(fen);

                if (result) {
                    // Trobar el millor moviment (els moviments venen ordenats per qualitat normalment, 
                    // però l'API retorna un objecte, cal iterar per trobar el millor WDL/DTZ)

                    // Simplificació: Agafem el millor WDL
                    let bestMoveUci = null;
                    let bestWdl = -2; // Valor impossible

                    const movesList: SyzygyMove[] = [];
                    const chess = new Chess(fen); // For SAN generation

                    if (result.moves) {
                        Object.entries(result.moves).forEach(([uci, stats]) => {
                            // Generate SAN
                            let san = null;
                            try {
                                // We need a fresh chess instance or clone for each move check ideally, 
                                // or just use move() and undo()
                                const moveObj = chess.move({ from: uci.substring(0, 2), to: uci.substring(2, 4), promotion: uci.length > 4 ? uci[4] : 'q' });
                                if (moveObj) {
                                    san = moveObj.san;
                                    chess.undo();
                                }
                            } catch (e) {
                                // invalid move?
                            }

                            movesList.push({
                                uci,
                                san,
                                wdl: stats.wdl,
                                dtz: stats.dtz,
                                dtm: stats.dtm
                            });

                            if (stats.wdl > bestWdl) {
                                bestWdl = stats.wdl;
                                bestMoveUci = uci;
                            }
                        });
                    }

                    // Sort moves: Best WDL first, then Best DTZ (shortest for win, longest for loss?)
                    // Syzygy convention: 
                    // Win (wdl=2): smaller DTZ is better (faster win)
                    // Loss (wdl=-2): larger DTZ is better (delay loss)
                    // Draw (wdl=0): equal
                    movesList.sort((a, b) => {
                        if (a.wdl !== b.wdl) return b.wdl - a.wdl; // Higher WDL is better
                        // If both winning, smaller DTZ is better
                        if (a.wdl > 0) return Math.abs(a.dtz) - Math.abs(b.dtz);
                        // If both losing, larger DTZ is better
                        if (a.wdl < 0) return Math.abs(b.dtz) - Math.abs(a.dtz);
                        return 0;
                    });

                    setData({
                        evaluation: getHumanEval(result.wdl, result.dtz),
                        wdl: result.wdl,
                        bestMove: bestMoveUci,
                        moves: movesList
                    });
                } else {
                    // If result is null but applicable, implies error
                    setError("Error connectant amb Syzygy API");
                }
            } catch (err) {
                setError("Error desconegut");
            }
            setLoading(false);
        };

        // Debounce petit per no saturar si l'usuari arrossega peces ràpid
        const timeoutId = setTimeout(fetchData, 500);

        return () => clearTimeout(timeoutId);
    }, [fen]);

    return { data, loading, isApplicable, error };
}
