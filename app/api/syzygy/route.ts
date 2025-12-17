import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fen = searchParams.get('fen');

    if (!fen) {
        return NextResponse.json({ error: 'FEN is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://syzygy-tables.info/api/v2?fen=${encodeURIComponent(fen)}`, {
            headers: {
                'User-Agent': 'ChessSuperApp/1.0 (https://chess-super-app.vercel.app)'
            }
        });

        if (!response.ok) {
            // If the external API fails, forward the status or 500
            return NextResponse.json({ error: 'Failed to fetch from Syzygy' }, { status: response.status });
        }

        const data = await response.json();

        // Set cache headers to avoid hitting the external API too often for the same position
        const res = NextResponse.json(data);
        res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

        return res;

    } catch (error) {
        console.error('Syzygy Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
