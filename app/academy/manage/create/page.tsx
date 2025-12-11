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
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800 p-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button onClick={handleBack} className="text-slate-400 hover:text-white transition">
                        <ArrowLeft size={24} />
                    </button>

                    <div className="text-center">
                        <h1 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nova Situació d'Aprenentatge</h1>
                        <p className="font-bold text-white text-lg">{STEPS[currentStep - 1].title}</p>
                    </div>

                    <button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition disabled:opacity-50"
                        disabled={false} // Todo: validation
                    >
                        <Save size={16} />
                        <span className="hidden md:inline">Desar Esborrany</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12">
                    {STEPS.map((step, idx) => {
                        const isCurrent = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex flex-col items-center gap-2 cursor-pointer group`} onClick={() => setStep(step.id)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all 
                                        ${isCurrent ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' :
                                            isCompleted ? 'border-emerald-500 bg-emerald-500 text-slate-950' :
                                                'border-slate-800 bg-slate-900 text-slate-500 group-hover:border-slate-700'}`}>
                                        {isCompleted ? <Check size={18} /> : <span className="font-bold">{step.id}</span>}
                                    </div>
                                    <div className="hidden md:block text-center w-24">
                                        <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{step.title}</div>
                                    </div>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`w-12 md:w-24 h-0.5 mx-2 md:mx-4 ${currentStep > step.id ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 min-h-[400px]">
                    {currentStep === 1 && <StepIdentification />}
                    {currentStep === 2 && <StepArchitecture />}
                    {currentStep === 3 && <StepEvaluation />}
                    {currentStep === 4 && <StepReview />}
                </div>

                {/* Bottom Navigation */}
                {currentStep < 4 && (
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleNext}
                            className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-lg hover:bg-indigo-50 transition flex items-center gap-2 shadow-xl shadow-indigo-500/10"
                        >
                            Següent Pas <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
