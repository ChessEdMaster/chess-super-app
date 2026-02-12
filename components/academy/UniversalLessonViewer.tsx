'use client';

import React, { useState } from 'react';
import { AcademyLessonNewContent, LessonSection } from '@/types/lesson_content';
import { VideoSectionRenderer } from './lesson-sections/VideoSectionRenderer';
import { TextSectionRenderer } from './lesson-sections/TextSectionRenderer';
import { ChessboardSectionRenderer } from './lesson-sections/ChessboardSectionRenderer';
import { QuizSectionRenderer } from './lesson-sections/QuizSectionRenderer';
import { GamificationSectionRenderer } from './lesson-sections/GamificationSectionRenderer';
import { ChevronRight, ChevronLeft, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversalLessonViewerProps {
    lessonTitle: string;
    content: AcademyLessonNewContent;
    onCompleteLesson: () => void;
    onExit: () => void;
}

export const UniversalLessonViewer: React.FC<UniversalLessonViewerProps> = ({
    lessonTitle,
    content,
    onCompleteLesson,
    onExit
}) => {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [completedSections, setCompletedSections] = useState<number[]>([]);

    const sections = content.sections || [];
    const currentSection = sections[currentSectionIndex];

    const markSectionComplete = () => {
        if (!completedSections.includes(currentSectionIndex)) {
            setCompletedSections(prev => [...prev, currentSectionIndex]);
        }
    };

    const handleNext = () => {
        markSectionComplete();
        if (currentSectionIndex < sections.length - 1) {
            setCurrentSectionIndex(prev => prev + 1);
        } else {
            // End of lesson
            onCompleteLesson();
        }
    };

    const handlePrevious = () => {
        if (currentSectionIndex > 0) {
            setCurrentSectionIndex(prev => prev - 1);
        }
    };

    // Auto-advance logic pass-through
    const onSectionComplete = () => {
        handleNext();
    };

    const renderSection = (section: LessonSection) => {
        switch (section.type) {
            case 'video':
                return <VideoSectionRenderer data={section} onComplete={onSectionComplete} />;
            case 'text':
                return <TextSectionRenderer data={section} onComplete={onSectionComplete} />;
            case 'chessboard':
                return <ChessboardSectionRenderer data={section} onComplete={onSectionComplete} />;
            case 'quiz':
                return <QuizSectionRenderer data={section} onComplete={() => onSectionComplete()} />; // Score handling can be added here
            case 'gamification':
                return <GamificationSectionRenderer data={section} onFinish={onCompleteLesson} />;
            default:
                return <div className="p-10 text-center text-red-500">Tipus de secció desconegut</div>;
        }
    };

    return (
        <div className="h-screen w-full bg-[#020617] text-white flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <Menu size={20} />
                    </button>
                    <h1 className="font-bold text-lg tracking-tight hidden md:block">
                        {lessonTitle}
                    </h1>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-1.5">
                    {sections.map((_, idx) => (
                        <div
                            key={idx}
                            className={`
                                h-1.5 rounded-full transition-all duration-300 
                                ${idx === currentSectionIndex ? 'w-8 bg-amber-500' : 'w-4 bg-zinc-800'}
                                ${idx < currentSectionIndex ? 'bg-indigo-500' : ''}
                            `}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSectionIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full p-4 md:p-8 flex items-center justify-center"
                    >
                        {renderSection(currentSection)}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Nav (Optional, mostly controlled by section interactions but good to have) */}
            <div className="h-16 border-t border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md md:hidden">
                <button
                    onClick={handlePrevious}
                    disabled={currentSectionIndex === 0}
                    className="p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft />
                </button>
                <span className="text-xs uppercase font-bold text-zinc-500">
                    Secció {currentSectionIndex + 1} / {sections.length}
                </span>
                <button
                    onClick={handleNext}
                    disabled={currentSectionIndex === sections.length - 1} // Can only advance if section allows?
                    className="p-2 disabled:opacity-30"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
};
