'use client';

import React from 'react';
import { GamificationSection } from '@/types/lesson_content';
import { GamificationPanel } from '../lesson-parts/GamificationPanel';

interface GamificationSectionRendererProps {
    data: GamificationSection;
    onFinish: () => void;
}

export const GamificationSectionRenderer: React.FC<GamificationSectionRendererProps> = ({ data, onFinish }) => {
    // Map LessonSection data to GamificationPanel props
    // We might need to fetch badge details if we only have ID, but for now we'll assume we pass title/desc or mock it
    const panelData = {
        badge_name: data.title || 'Lliçó Completada!',
        badge_emoji: '🏆', // Could be dynamic based on badgeId lookup
        badge_description: data.congratulationMessage || `Has guanyat ${data.xpReward} XP i completat la lliçó.`,
    };

    return <GamificationPanel data={panelData} onFinish={onFinish} />;
};
