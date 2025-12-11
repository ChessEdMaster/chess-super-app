
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

// Prevent Next.js from caching the route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // 1. Auth Check
    const supabase = await createClient();

    // Check specific user as requested
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== 'marc.pozanco@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { commands } = await req.json();

        if (!Array.isArray(commands)) {
            return NextResponse.json({ error: 'Invalid commands format' }, { status: 400 });
        }

        // 2. Setup Stream
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            start(controller) {
                // 3. Spawn Stockfish
                // Assuming binary is in project_root/bin/
                const binPath = path.join(process.cwd(), 'bin', 'stockfish-windows-x86-64-avx2.exe');

                console.log('Spawning stockfish at:', binPath);

                const stockfish = spawn(binPath);

                stockfish.stdout.on('data', (data) => {
                    const lines = data.toString();
                    controller.enqueue(encoder.encode(lines));
                });

                stockfish.stderr.on('data', (data) => {
                    console.error('Stockfish stderr:', data.toString());
                });

                stockfish.on('error', (err) => {
                    console.error('Stockfish spawn error:', err);
                    controller.enqueue(encoder.encode(`info string Error spawning stockfish: ${err.message}\n`));
                    controller.close();
                });

                stockfish.on('close', () => {
                    controller.close();
                });

                // 4. Send Commands
                commands.forEach(cmd => {
                    stockfish.stdin.write(cmd + '\n');
                });

                // Ensure we close input so it knows to finish if it wasn't an infinite search (though 'go' usually is)
                // Note: 'go depth 20' finishes on its own. 'go infinite' needs 'stop'.
                // Since this is a one-off request, we keep it running until the client closes the stream or it finishes.

                // Handle client disconnect
                req.signal.addEventListener('abort', () => {
                    stockfish.kill();
                });
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
