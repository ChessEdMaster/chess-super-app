import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fen = searchParams.get('fen');

    if (!fen) {
        return NextResponse.json({ error: 'FEN is required' }, { status: 400 });
    }

    try {
        // Use Lichess Tablebase (more reliable and open, supports active 7-piece query)
        // https://tablebase.lichess.ovh/standard?fen=...
        const response = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`, {
            headers: {
                // Good practice to identify
                'User-Agent': 'ChessSuperApp/1.0 (https://chess-super-app.vercel.app)'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch from Tablebase' }, { status: response.status });
        }

        const data = await response.json();

        // Transform Lichess response to SyzygyResponse format expected by our frontend
        // Lichess format: { category: 'draw', moves: [{ uci: 'e4e5', category: 'draw', ... }] }
        // Our format: { wdl: 0, moves: { 'e4e5': { wdl: 0, ... } } }

        const syzygyData = {
            wdl: mapCategoryToWdl(data.category),
            dtz: data.dtz,
            dtm: data.dtm,
            moves: {} as Record<string, { wdl: number, dtz: number, dtm?: number }>
        };

        if (Array.isArray(data.moves)) {
            data.moves.forEach((move: any) => {
                syzygyData.moves[move.uci] = {
                    wdl: mapCategoryToWdl(move.category),
                    dtz: move.dtz,
                    dtm: move.dtm
                };
            });
        }

        const res = NextResponse.json(syzygyData);
        // Cache heavily as endgames are static
        res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

        return res;

    } catch (error) {
        console.error('Syzygy/Lichess Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function mapCategoryToWdl(category: string): number {
    switch (category) {
        case 'win': return 2;
        case 'cursed-win': return 1; // Win but 50-move rule might prevent it
        case 'draw': return 0;
        case 'blessed-loss': return -1; // Loss but 50-move rule might save it
        case 'loss': return -2;
        case 'unknown': return 0;
        case 'maybe-win': return 1;
        case 'maybe-loss': return -1;
        default: return 0;
    }
}
