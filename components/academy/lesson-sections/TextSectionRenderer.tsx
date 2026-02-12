'use client';

import React from 'react';
import { TextSection } from '@/types/lesson_content';
import { Panel } from '@/components/ui/design-system/Panel';
import { ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TextSectionRendererProps {
    data: TextSection;
    onComplete: () => void;
}

export const TextSectionRenderer: React.FC<TextSectionRendererProps> = ({ data, onComplete }) => {
    return (
        <div className="flex flex-col gap-8 h-full max-w-3xl mx-auto w-full py-8">
            <Panel className="bg-zinc-900/50 border-zinc-800 p-8 rounded-2xl">
                {data.title && (
                    <h2 className="text-3xl font-black text-amber-500 mb-6 font-display uppercase tracking-wide">
                        {data.title}
                    </h2>
                )}

                <div className="prose prose-invert prose-lg max-w-none prose-p:text-zinc-300 prose-headings:text-white prose-strong:text-amber-400">
                    <ReactMarkdown>{data.content}</ReactMarkdown>
                </div>

                {data.imageUrl && (
                    <div className="mt-8 rounded-xl overflow-hidden border border-zinc-700 shadow-lg">
                        <img src={data.imageUrl} alt={data.title || 'Image'} className="w-full object-cover" />
                    </div>
                )}
            </Panel>

            <div className="flex justify-end">
                <button
                    onClick={onComplete}
                    className="flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                    Següent <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};
