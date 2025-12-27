import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';

interface OpeningInfo {
    eco: string;
    name: string;
    moves: string;
}

export function useOpeningRecognition(currentFen: string) {
    const [opening, setOpening] = useState<OpeningInfo | null>(null);
    const [dbOpenings, setDbOpenings] = useState<OpeningInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Load of Encyclopedia
    useEffect(() => {
        const loadOpenings = async () => {
            try {
                // Fetch the Encyclopedia Collection ID first
                const { data: col } = await supabase.from('pgn_collections')
                    .select('id')
                    .eq('type', 'system_opening')
                    .single();
                
                if(!col) return;

                // Fetch all games (lightweight selection)
                // We'll limit to 3000 common ones for performance if needed, or paginate.
                // For now, let's fetch a chunk. 
                // Optimization: We could store this in localStorage or a JSON file to avoid heavy DB hits on every refresh.
                
                const { data, error } = await supabase
                    .from('pgn_games')
                    .select('white, black, pgn') // white=ECO, black=Name
                    .eq('collection_id', col.id);

                if (error) throw error;

                const parsed = (data || []).map(g => {
                    // PGN: extract pure moves for simpler matching
                    const movesMatch = g.pgn.split('\n\n')[1]; // naive split
                    return {
                        eco: g.white.replace('ECO ', ''),
                        name: g.black,
                        moves: movesMatch ? movesMatch.trim() : ''
                    };
                });

                setDbOpenings(parsed);
            } catch (e) {
                console.error("Failed to load opening DB", e);
            } finally {
                setLoading(false);
            }
        };

        loadOpenings();
    }, []);

    // Detect Opening on FEN change
    useEffect(() => {
        if (loading || dbOpenings.length === 0) return;

        // Current approach: reliable FEN matching is hard because transposition.
        // Better: Match Move History (SAN). 
        // BUT `currentFen` doesn't give history.
        // We really need the PGN or Move History passed in.
        // However, we can try to find a game in our DB that *reaches* this FEN.
        // That is very expensive (replay all).
        
        // Alternative: If the parent component passes the PGN/History, we match that string.
        // Let's assume for now we match by FEN for exact positions if we had them pre-calc.
        // Since we only have PGNs, we must replay them to get FENs? That's too slow for 3000 games on client.
        
        // REVISED STRATEGY: 
        // The effective way is to use a Trie of moves.
        // But since we can't easily replay 3000 games on mount without lag.
        
        // Let's rely on the `lichess-data` we just imported???
        // Wait, `lichess-data` TSV has `pgn` column (1. e4 e5 ...).
        // If we want "Instant" detection, we should map "Sequence of SANs" -> Opening Name.
        
        // If this hook receives the current game's history (SAN array), we can join it and match.
        
    }, [currentFen, loading]);

    return { opening, loading };
}

// Re-write to accept moves history
export function useOpeningRecognitionByMoves(moves: string[]) {
    const [opening, setOpening] = useState<OpeningInfo | null>(null);
    const [openingMap, setOpeningMap] = useState<Record<string, OpeningInfo>>({});
    
    useEffect(() => {
        const fetchMap = async () => {
             // We can fetch the raw TSVs directly from public so we don't spam Supabase?
             // It's faster and cheaper.
             const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
             const map: Record<string, OpeningInfo> = {};
             
             for(const f of files) {
                 const res = await fetch(`/databases/openings/${f}`);
                 const txt = await res.text();
                 txt.split('\n').slice(1).forEach(line => {
                     const [eco, name, pgn] = line.split('\t');
                     if(pgn) {
                         // Normalize PGN: "1. e4 e5" -> "e4 e5" matching the input format?
                         // Usually inputs are ["e4", "e5"]. Join with space?
                         // The TSV has "1. e4 e5 2. Nf3". 
                         // We need to strip move numbers.
                         const cleanMoves = pgn.replace(/\d+\./g, '').replace(/\s+/g, ' ').trim();
                         map[cleanMoves] = { eco, name, moves: cleanMoves };
                     }
                 });
             }
             setOpeningMap(map);
        };
        fetchMap();
    }, []);

    useEffect(() => {
        if (!moves || moves.length === 0) {
            setOpening(null);
            return;
        }
        
        // Construct current PGN string from moves array
        // Input: ['e4', 'e5', 'Nf3']
        // Join: "e4 e5 Nf3"
        const currentParams = moves.join(' ');
        
        // Exact match
        if (openingMap[currentParams]) {
            setOpening(openingMap[currentParams]);
        } 
        // We could also look for "Longest Prefix Match" if exact not found?
        // E.g. user played a move that deviates. We show the *last* known opening.
        else {
            // Find longest key in map that starts with currentParams? No, currentParams is longer.
            // Find longest key in map that is a prefix of currentParams?
            // Actually, we usually want the opening that *matches* the current state.
            // If I vary, I am "out of book".
            // If I am sub-line, I want the name of that sub-line.
            
            // Optimization: The map keys are the "definition" of the opening.
            // If I have played "e4 e5 Nf3", and map has "e4 e5 Nf3" -> "King's Knight", I match.
            // If I play "e4 e5 Nf3 a6", and map doesn't have it, I am out of book or still in King's Knight variation?
            // Usually we show the *last/deepest* matched opening.
            
            // Let's implement iterative fallback
            let candidate: OpeningInfo | null = null;
            let tempParams = currentParams;
            
            while(tempParams.length > 0) {
                 if(openingMap[tempParams]) {
                     candidate = openingMap[tempParams];
                     break;
                 }
                 // Remove last move
                 const lastSpace = tempParams.lastIndexOf(' ');
                 if(lastSpace === -1) break;
                 tempParams = tempParams.substring(0, lastSpace);
            }
            setOpening(candidate);
        }
        
    }, [moves, openingMap]);

    return opening;
}
