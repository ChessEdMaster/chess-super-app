'use client';

import React from 'react';
import { Video, Mic, Layout, Upload } from 'lucide-react';

export default function StudioPage() {
    return (
        <div className="h-full w-full bg-zinc-950 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Video size={48} className="text-pink-500" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Content Studio</h1>
            <p className="text-zinc-400 max-w-md mb-8">
                Create educational content, record analysis videos, and build your own chess courses.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition">
                    <Mic size={24} className="text-blue-400" />
                    <span className="text-sm font-bold text-white">Record</span>
                </button>
                <button className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition">
                    <Layout size={24} className="text-green-400" />
                    <span className="text-sm font-bold text-white">Study Editor</span>
                </button>
                <button className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition">
                    <Upload size={24} className="text-purple-400" />
                    <span className="text-sm font-bold text-white">Upload PGN</span>
                </button>
                <button className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition">
                    <Video size={24} className="text-red-400" />
                    <span className="text-sm font-bold text-white">Go Live</span>
                </button>
            </div>
        </div>
    );
}
