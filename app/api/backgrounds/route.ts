import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const bgDir = path.join(process.cwd(), 'public/assets/backgrounds/desktop');

        // Ensure directory exists
        if (!fs.existsSync(bgDir)) {
            return NextResponse.json({ files: [] });
        }

        const files = fs.readdirSync(bgDir)
            .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
            .map(file => `/assets/backgrounds/desktop/${file}`);

        return NextResponse.json({ files });
    } catch (error) {
        console.error('Error fetching backgrounds:', error);
        return NextResponse.json({ error: 'Failed to fetch backgrounds' }, { status: 500 });
    }
}
