'use client';

import React from 'react';
import { QuizSection } from '@/types/lesson_content';
import { QuizPanel } from '../lesson-parts/QuizPanel';

interface QuizSectionRendererProps {
    data: QuizSection;
    onComplete: (score: number) => void;
}

export const QuizSectionRenderer: React.FC<QuizSectionRendererProps> = ({ data, onComplete }) => {
    // Map existing QuizPanel format
    const questions = data.questions.map(q => ({
        question: q.question,
        options: q.options,
        correct_option_index: q.correctIndex,
    }));

    return <QuizPanel questions={questions} onComplete={onComplete} />;
};
