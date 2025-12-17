'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ChevronRight, Check } from 'lucide-react';
import { useSABuilder } from '@/components/academy/builder/store';
import { StepIdentification } from '@/components/academy/builder/step-identification';
import { StepArchitecture } from '@/components/academy/builder/step-architecture';
import { StepEvaluation } from '@/components/academy/builder/step-evaluation';
import { StepReview } from '@/components/academy/builder/step-review';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';

const STEPS = [
    { id: 1, title: 'Identificació', subtitle: 'Títol i Vectors' },
    { id: 2, title: 'Arquitectura', subtitle: 'Repte i Producte' },
    { id: 3, title: 'Avaluació', subtitle: 'Rúbrica' },
    { id: 4, title: 'Revisió', subtitle: 'Confirmar' }
];

export default function CreateSAPage() {
    const router = useRouter();
    const { currentStep, setStep, moduleData } = useSABuilder();

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setStep(currentStep - 1);
        } else {
            router.push('/academy/manage');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 p-4 shadow-xl">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="text-zinc-500 hover:text-white transition flex items-center gap-2 group"
                    >
                        <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Enrere</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Nova Situació d'Aprenentatge</h1>
                        <p className="font-black text-white text-lg font-display uppercase tracking-wide text-stroke-sm">
                            {STEPS[currentStep - 1].title}
                        </p>
                    </div>

                    <ShinyButton
                        variant="neutral"
                        className="px-4 py-2 h-10 text-xs"
                        disabled={false} // Todo: validation
                    >
                        <Save size={16} className="mr-2" />
                        <span className="hidden md:inline">Desar Esborrany</span>
                    </ShinyButton>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Progress Steps */}
                <Panel className="mb-8 p-6 lg:p-8 bg-zinc-900/80 border-zinc-700">
                    <div className="flex items-center justify-center relative z-10">
                        {STEPS.map((step, idx) => {
                            const isCurrent = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center flex-1 last:flex-none justify-center">
                                    <div className="relative">
                                        {/* Label */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap hidden md:block">
                                            <div className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${isCurrent ? 'text-amber-400' : 'text-zinc-500'}`}>
                                                {step.title}
                                            </div>
                                        </div>

                                        <div
                                            className={`
                                                w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer shadow-lg z-10 relative
                                                ${isCurrent
                                                    ? 'bg-amber-500 border-amber-300 text-white shadow-amber-500/50 scale-110'
                                                    : isCompleted
                                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20'
                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700 hover:border-zinc-600'
                                                }
                                            `}
                                            onClick={() => setStep(step.id)}
                                        >
                                            {isCompleted ? <Check size={24} strokeWidth={3} /> : <span className="font-black font-display text-lg">{step.id}</span>}
                                        </div>
                                    </div>

                                    {idx < STEPS.length - 1 && (
                                        <div className="flex-1 h-3 mx-2 md:mx-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50 min-w-[40px]">
                                            <div
                                                className={`h-full transition-all duration-500 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-transparent'}`}
                                                style={{ width: currentStep > step.id ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Panel>

                {/* Form Content */}
                <GameCard variant="default" className="p-8 md:p-12 min-h-[500px] bg-zinc-900 border-zinc-700">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentStep === 1 && <StepIdentification />}
                        {currentStep === 2 && <StepArchitecture />}
                        {currentStep === 3 && <StepEvaluation />}
                        {currentStep === 4 && <StepReview />}
                    </div>
                </GameCard>

                {/* Bottom Navigation */}
                {currentStep < 4 && (
                    <div className="flex justify-end mt-8">
                        <ShinyButton
                            variant="primary"
                            onClick={handleNext}
                            className="px-8 py-4 text-base uppercase tracking-widest font-black"
                        >
                            Següent Pas <ChevronRight size={20} className="ml-2" />
                        </ShinyButton>
                    </div>
                )}
            </div>
        </div>
    );
}
