import React, { useState } from 'react';
import { useSABuilder } from '../store';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { SAHero } from '../sa-view/sa-hero';
import { SARubric } from '../sa-view/sa-rubric';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function StepReview() {
    const { moduleData, updateData } = useSABuilder();
    const { user } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Mock progress for preview
    const MOCK_PCT = 0;

    const handlePublish = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // 1. Create Course Wrapper (Invisible) if not selected
            // For MVP, we will assume a generic "Teacher Sandbox" course or similar.
            // But to keep it simple, let's just create the module directly if we have a course_id
            // Or create a dummy course for the User's creations.

            // Let's create a "Personal Creations" course for the user if it doesn't exist
            let courseId = moduleData.course_id;

            if (!courseId) {
                const { data: existingCourse } = await supabase
                    .from('academy_courses')
                    .select('id')
                    .eq('slug', `user-creations-${user.id}`)
                    .single();

                if (existingCourse) {
                    courseId = existingCourse.id;
                } else {
                    const { data: newCourse, error: courseError } = await supabase
                        .from('academy_courses')
                        .insert({
                            title: 'Les Meves Creacions',
                            slug: `user-creations-${user.id}`,
                            description: 'Espai personal de proves i dissenys.',
                            track: 'pedagogical',
                            target_grade: 'Professorat',
                            difficulty_level: 'Tots'
                        })
                        .select()
                        .single();

                    if (courseError) throw courseError;
                    courseId = newCourse.id;
                }
            }

            // 2. Create Module
            const { data: newModule, error: moduleError } = await supabase
                .from('academy_modules')
                .insert({
                    ...moduleData,
                    course_id: courseId,
                    level: moduleData.level || 'Principiant',
                    order: 99, // Append to end
                    icon: 'sparkles'
                })
                .select()
                .single();

            if (moduleError) throw moduleError;

            toast.success('Situació d\'Aprenentatge creada amb èxit!');

            // 3. Redirect to the newly created module
            router.push(`/academy/${newModule.id}`);

        } catch (error: any) {
            console.error('Error publishing SA:', error);
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                        <Sparkles className="text-yellow-300" /> Tot a punt per llançar?
                    </h2>
                    <p className="text-indigo-100 max-w-lg">
                        Revisa com veurà l'alumne la teva Situació d'Aprenentatge.
                        Si tot està correcte, publica-la per començar a assignar-la.
                    </p>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={isSaving}
                    className="bg-white text-indigo-600 py-3 px-8 rounded-xl font-bold hover:bg-indigo-50 transition shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Publicar Ara'}
                    {!isSaving && <ArrowRight size={20} />}
                </button>
            </div>

            <div className="space-y-8 opacity-75 pointer-events-none scale-95 origin-top border border-slate-700/50 rounded-3xl p-4 bg-slate-950/50">
                <div className="uppercase text-xs font-bold text-slate-500 text-center tracking-widest mb-4">
                    — Vista Prèvia de l'Alumne —
                </div>

                {/* Preview Hero */}
                {/* @ts-ignore - partial type match is ok for preview */}
                <SAHero module={moduleData} progressPercentage={MOCK_PCT} />

                {/* Preview Rubric */}
                {/* @ts-ignore */}
                <SARubric module={moduleData} />
            </div>

        </div>
    );
}
