import React from 'react';
import { SAHero } from './sa-hero';
import { SAContext } from './sa-context';
import { SATimeline } from './sa-timeline';
import { SARubric } from './sa-rubric';
import { AcademyModule, AcademyLesson } from '@/types/academy';
import { Brain, Heart, Globe, BookOpen } from 'lucide-react';

interface LearningSituationDashboardProps {
    module: AcademyModule;
    lessons: AcademyLesson[];
    completedLessons: Set<string>;
    userId?: string;
    userModuleProgress?: any; // The record from user_module_progress table
}

export function LearningSituationDashboard({ module, lessons, completedLessons, userId, userModuleProgress }: LearningSituationDashboardProps) {
    // Calculate progress
    const completedCount = lessons.filter(l => completedLessons.has(l.id)).length;
    const progressPercentage = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Hero Section */}
            <SAHero module={module} progressPercentage={progressPercentage} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    <SAContext module={module} />
                    <SATimeline
                        moduleId={module.id}
                        lessons={lessons}
                        completedLessons={completedLessons}
                    />
                </div>

                {/* Sidebar (Right) */}
                <div className="space-y-6">
                    {/* Rubric Card (Interactive) */}
                    <SARubric
                        module={module}
                        userId={userId}
                        userProgressId={userModuleProgress?.id}
                        existingEvaluation={userModuleProgress?.self_evaluation}
                    />

                    {/* Competencies & Vectors */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Brain size={20} className="text-indigo-400" />
                            Competències
                        </h3>

                        {module.competencies && Object.entries(module.competencies).map(([key, desc]: [string, any]) => (
                            <div key={key} className="mb-4 last:mb-0">
                                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase mb-1 inline-block">
                                    {key}
                                </span>
                                <p className="text-sm text-slate-300">
                                    {String(desc)}
                                </p>
                            </div>
                        ))}

                        {!module.competencies && <p className="text-slate-500 text-sm italic">Sense competències definides.</p>}
                    </div>

                    {module.transversal_vectors && module.transversal_vectors.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Heart size={20} className="text-pink-400" />
                                Valors (Vectors)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {module.transversal_vectors.map((vector) => (
                                    <span key={vector} className="text-xs font-bold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
                                        {vector}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
