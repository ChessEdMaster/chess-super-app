import { useEffect, useRef, useState, useCallback } from 'react';

export interface Evaluation {
    type: 'cp' | 'mate';
    value: number;
    depth?: number;
}

export interface EngineLine {
    id: number;
    evaluation: Evaluation;
    bestMove: string;
    pv: string[]; // Variations
}

interface UseStockfishOptions {
    depth?: number;
    multipv?: number;
    onEval?: (evalData: Evaluation) => void;
    onLines?: (lines: EngineLine[]) => void;
}

export function useStockfish({
    depth = 20,
    multipv = 1,
    onEval,
    onLines
}: UseStockfishOptions = {}) {
    const engine = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Initialize Engine
    useEffect(() => {
        // Determine worker URL
        // Ideally we use a local file for better performance/caching
        // For now, we fallback to the same logic or the new local file
        const workerPath = '/engines/stockfish.js';

        try {
            const worker = new Worker(workerPath);
            engine.current = worker;

            worker.onmessage = (e) => {
                const msg = e.data;
                if (msg === 'readyok') {
                    setIsReady(true);
                }

                // Parse Info
                if (typeof msg === 'string' && msg.startsWith('info') && msg.includes('depth')) {
                    parseInfo(msg);
                }
            };

            worker.postMessage('uci');
            // Configure typical settings
            worker.postMessage(`setoption name Threads value ${Math.max(1, (navigator.hardwareConcurrency || 4) - 1)}`);
            worker.postMessage('setoption name Hash value 64');
            worker.postMessage('setoption name UCI_AnalyseMode value true');
            worker.postMessage('isready');

        } catch (err) {
            console.error("Failed to init Stockfish worker", err);
        }

        return () => {
            engine.current?.terminate();
            engine.current = null;
        };
    }, []);

    const parseInfo = useCallback((msg: string) => {
        // Regex for scoring
        const multipvMatch = msg.match(/multipv (\d+)/);
        const id = multipvMatch ? parseInt(multipvMatch[1]) : 1;

        const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
        const depthMatch = msg.match(/depth (\d+)/);
        const pvMatch = msg.match(/ pv (.+)/);

        if (!scoreMatch || !pvMatch) return;

        const type = scoreMatch[1] as 'cp' | 'mate';
        const value = parseInt(scoreMatch[2]);
        const d = depthMatch ? parseInt(depthMatch[1]) : 0;
        const pv = pvMatch[1].trim().split(' ');

        const evaluation: Evaluation = { type, value, depth: d };

        const line: EngineLine = {
            id,
            evaluation,
            bestMove: pv[0],
            pv
        };

        // Note: In a real implementation this should accumulate lines for MultiPV
        // For simplicity we pass the single line update, the consumer can aggregate
        if (onLines) onLines([line]);
        if (onEval && id === 1) onEval(evaluation);

    }, [onEval, onLines]);

    const startAnalysis = useCallback((fen: string) => {
        if (!engine.current || !isReady) return;
        setIsAnalyzing(true);
        engine.current.postMessage('stop');
        engine.current.postMessage(`setoption name MultiPV value ${multipv}`);
        engine.current.postMessage(`position fen ${fen}`);
        engine.current.postMessage(`go depth ${depth}`);
    }, [depth, multipv, isReady]);

    const stopAnalysis = useCallback(() => {
        if (!engine.current) return;
        engine.current.postMessage('stop');
        setIsAnalyzing(false);
    }, []);

    return {
        isReady,
        isAnalyzing,
        startAnalysis,
        stopAnalysis
    };
}
