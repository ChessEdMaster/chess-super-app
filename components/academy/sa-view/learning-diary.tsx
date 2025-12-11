import React, { useState } from 'react';
import { Book, Smile, Meh, Frown, Save, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserLessonProgress } from '@/types/academy';
import { toast } from 'sonner';

interface LearningDiaryProps {
    lessonId: string;
    userId: string;
    existingReflection?: UserLessonProgress['reflection'];
    className?: string;
    onSave?: (savedReflection: any) => void;
}

export function LearningDiary({ lessonId, userId, existingReflection, className, onSave }: LearningDiaryProps) {
    const [reflection, setReflection] = useState(existingReflection?.text || '');
    const [mood, setMood] = useState<'happy' | 'neutral' | 'confused' | undefined>(existingReflection?.mood);
    const [isOpen, setIsOpen] = useState(!existingReflection); // Open by default if no reflection exists
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!reflection.trim()) {
            toast.error("Si us plau, escriu alguna cosa al teu diari.");
            return;
        }

        setIsSaving(true);
        try {
            const reflectionData = {
                text: reflection,
                mood: mood,
                created_at: new Date().toISOString()
            };

            // First get the progress record ID
            const { data: progress } = await supabase
                .from('user_lesson_progress')
                .select('id')
                .eq('user_id', userId)
                .eq('lesson_id', lessonId)
                .single();

            if (progress) {
                const { error } = await supabase
                    .from('user_lesson_progress')
                    .update({ reflection: reflectionData })
                    .eq('id', progress.id);

                if (error) throw error;

                toast.success("Reflexió guardada al teu Diari d'Aprenentatge!");
                setIsOpen(false);
                if (onSave) onSave(reflectionData);
            } else {
                toast.error("No s'ha trobat el progrés de la lliçó.");
            }

        } catch (error) {
            console.error('Error saving diary:', error);
            toast.error("Error al guardar la reflexió.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen && existingReflection) {
        return (
            <div className={`bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 ${className}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-indigo-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Book size={16} /> Diari d'Aprenentatge
                    </h3>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                        Editar
                    </button>
                </div>
                <p className="text-slate-300 italic text-sm">"{effectiveReflectionText(existingReflection.text)}"</p>
                {existingReflection.mood && (
                    <div className="mt-2 flex justify-end">
                        {getMoodIcon(existingReflection.mood, "text-indigo-400")}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl ${className}`}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Book className="text-pink-400" />
                Diari d'Aprenentatge
            </h3>
            <p className="text-slate-400 text-sm mb-4">
                Reflexiona sobre el que has après en aquesta fase. Què t'ha sorprès? Què ha estat difícil?
            </p>

            <div className="space-y-4">
                {/* Mood Selector */}
                <div className="flex gap-4 justify-center py-2 bg-slate-950/50 rounded-xl">
                    <MoodOption
                        type="happy" selected={mood === 'happy'} onClick={() => setMood('happy')}
                        label="Ho he entès bé"
                    />
                    <MoodOption
                        type="neutral" selected={mood === 'neutral'} onClick={() => setMood('neutral')}
                        label="Normal"
                    />
                    <MoodOption
                        type="confused" selected={mood === 'confused'} onClick={() => setMood('confused')}
                        label="Tinc dubtes"
                    />
                </div>

                {/* Text Area */}
                <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder:text-slate-600 resize-none text-sm leading-relaxed"
                    placeholder="Avui he après que els peons doblats..."
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                />

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Guardar al Diari
                    </button>
                </div>
            </div>
        </div>
    );
}

function effectiveReflectionText(text: string) {
    if (text.length > 100) return text.substring(0, 100) + '...';
    return text;
}

function MoodOption({ type, selected, onClick, label }: any) {
    const isSelected = selected;
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isSelected ? 'bg-slate-800 scale-110' : 'hover:bg-slate-800/50 opacity-60 hover:opacity-100'}`}
        >
            {getMoodIcon(type, isSelected ? 'text-yellow-400' : 'text-slate-400')}
            <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        </button>
    );
}

function getMoodIcon(type: string, className: string) {
    switch (type) {
        case 'happy': return <Smile className={className} />;
        case 'neutral': return <Meh className={className} />;
        case 'confused': return <Frown className={className} />;
        default: return <Smile className={className} />;
    }
}
