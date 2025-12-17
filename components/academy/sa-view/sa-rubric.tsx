import React, { useState } from 'react';
import { Award, AlertCircle, CheckCircle2, Circle, Save, Loader2 } from 'lucide-react';
import { AcademyModule } from '@/types/academy';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SARubricProps {
    module: AcademyModule;
    userProgressId?: string | null; // ID of the user_module_progress record
    existingEvaluation?: any;
    onEvaluationSaved?: (evaluation: any) => void;
    userId?: string;
}

const LEVELS = [
    { key: 'expert', label: 'Expert (Excel·lent)', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500', activeBorder: 'border-purple-500', icon: Award },
    { key: 'avancat', label: 'Avançat (Notable)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500', activeBorder: 'border-emerald-500', icon: CheckCircle2 },
    { key: 'aprenent', label: 'Aprenent (Bàsic)', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hoverBorder: 'hover:border-amber-500', activeBorder: 'border-amber-500', icon: Circle },
    { key: 'novell', label: 'Novell (En procés)', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700', hoverBorder: 'hover:border-slate-500', activeBorder: 'border-slate-400', icon: AlertCircle },
];

export function SARubric({ module, userProgressId, existingEvaluation, onEvaluationSaved, userId }: SARubricProps) {
    const criteria = (module.evaluation_criteria as any)?.rubrica;
    const [selectedLevel, setSelectedLevel] = useState<string | null>(existingEvaluation?.selected_level || null);
    const [isSaving, setIsSaving] = useState(false);

    if (!criteria) return null;

    const handleSelect = async (levelKey: string) => {
        if (!userId) {
            toast.error("Error d'usuari: No s'ha pogut identificar l'usuari.");
            return;
        }

        setSelectedLevel(levelKey);
        setIsSaving(true);

        try {
            const payload = {
                selected_level: levelKey,
                updated_at: new Date().toISOString()
            };

            // If we have an existing progress ID, update it
            if (userProgressId) {
                const { error } = await supabase
                    .from('user_module_progress')
                    .update({ self_evaluation: payload })
                    .eq('id', userProgressId);

                if (error) throw error;
            } else {
                // Otherwise insert new progress record
                const { data, error } = await supabase
                    .from('user_module_progress')
                    .insert({
                        user_id: userId,
                        module_id: module.id,
                        self_evaluation: payload
                    })
                    .select('id')
                    .single();

                if (error) throw error;

                // Notify parent if we created a new record
                if (onEvaluationSaved && data) {
                    // @ts-ignore
                    onEvaluationSaved(data);
                }
            }

            toast.success("Autoavaluació guardada!");
            if (onEvaluationSaved) onEvaluationSaved(payload);

        } catch (error: any) {
            console.error("Error saving evaluation:", error);
            toast.error("No s'ha pogut guardar l'autoavaluació.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                        <Award size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Rúbrica d'Autoavaluació</h3>
                        <p className="text-sm text-slate-400">Selecciona el nivell que creus haver assolit:</p>
                    </div>
                </div>
                {isSaving && <Loader2 className="animate-spin text-indigo-500" />}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {LEVELS.map((level) => {
                    const desc = criteria[level.key];
                    if (!desc) return null;

                    const Icon = level.icon;
                    const isSelected = selectedLevel === level.key;

                    return (
                        <button
                            key={level.key}
                            onClick={() => handleSelect(level.key)}
                            disabled={isSaving}
                            className={`
                                relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 w-full group
                                ${level.bg} 
                                ${isSelected ? `${level.activeBorder} ring-2 ring-offset-2 ring-offset-slate-900 ${level.activeBorder.replace('border', 'ring')}` : `${level.border} ${level.hoverBorder} opacity-70 hover:opacity-100 hover:scale-[1.01]`}
                            `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-full bg-slate-950/30 ${level.color} transition-transform ${isSelected ? 'scale-110' : ''}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${level.color} flex items-center gap-2`}>
                                        {level.label}
                                        {isSelected && <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">SELECCIONAT</span>}
                                    </h4>
                                    <p className="text-slate-200 text-sm leading-relaxed">
                                        {desc}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
                <p className="text-xs text-slate-500">
                    * La teva autoavaluació ajuda al professor a entendre com veus el teu propi aprenentatge. Sigues honest!
                </p>
            </div>
        </div>
    );
}
