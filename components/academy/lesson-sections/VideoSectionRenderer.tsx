'use client';

import React from 'react';
import { VideoSection } from '@/types/lesson_content';
import { Panel } from '@/components/ui/design-system/Panel';
import { PlayCircle } from 'lucide-react';

interface VideoSectionRendererProps {
    data: VideoSection;
    onComplete: () => void;
}

export const VideoSectionRenderer: React.FC<VideoSectionRendererProps> = ({ data, onComplete }) => {
    // Helper to get embed URL
    const getEmbedUrl = (url: string, provider: string) => {
        if (provider === 'youtube') {
            const videoId = url.split('v=')[1] || url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url; // Default/Supastorage
    };

    return (
        <div className="flex flex-col gap-6 h-full max-w-4xl mx-auto w-full">
            <Panel className="bg-black/50 border-zinc-800 p-1 rounded-2xl overflow-hidden aspect-video relative group">
                <iframe
                    src={getEmbedUrl(data.url, data.provider)}
                    className="w-full h-full rounded-xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </Panel>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white mb-2">{data.title || 'Vídeo de la lliçó'}</h2>
                <button
                    onClick={onComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all"
                >
                    Continuar <PlayCircle size={20} />
                </button>
            </div>
        </div>
    );
};
