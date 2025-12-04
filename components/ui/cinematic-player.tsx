import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CinematicPlayerProps {
    src: string;
    type: 'video' | 'image';
    loop?: boolean;
    className?: string;
    alt?: string;
}

export function CinematicPlayer({
    src,
    type,
    loop = true,
    className,
    alt = 'Cinematic asset'
}: CinematicPlayerProps) {
    if (type === 'video') {
        return (
            <div className={cn('relative overflow-hidden', className)}>
                <video
                    src={src}
                    autoPlay
                    muted
                    loop={loop}
                    playsInline
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div className={cn('relative overflow-hidden', className)}>
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
            />
        </div>
    );
}
