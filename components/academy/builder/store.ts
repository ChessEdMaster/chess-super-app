import { create } from 'zustand';
import { AcademyModule } from '@/types/academy';

interface SABuilderState {
    currentStep: number;
    moduleData: Partial<AcademyModule>;

    // Actions
    setStep: (step: number) => void;
    updateData: (data: Partial<AcademyModule>) => void;
    reset: () => void;

    // Rubric Helpers
    setRubricLevel: (level: 'novell' | 'aprenent' | 'avancat' | 'expert', text: string) => void;
}

const INITIAL_DATA: Partial<AcademyModule> = {
    title: '',
    description: '',
    level: 'Principiant',
    duration: '',
    context_description: '',
    challenge_description: '',
    final_product: '',
    competencies: {},
    transversal_vectors: [],
    evaluation_criteria: {
        rubrica: {
            novell: '',
            aprenent: '',
            avancat: '',
            expert: ''
        }
    }
};

export const useSABuilder = create<SABuilderState>((set) => ({
    currentStep: 1,
    moduleData: INITIAL_DATA,

    setStep: (step) => set({ currentStep: step }),

    updateData: (data) => set((state) => ({
        moduleData: { ...state.moduleData, ...data }
    })),

    reset: () => set({ currentStep: 1, moduleData: INITIAL_DATA }),

    setRubricLevel: (level, text) => set((state) => ({
        moduleData: {
            ...state.moduleData,
            evaluation_criteria: {
                ...state.moduleData.evaluation_criteria,
                rubrica: {
                    ...state.moduleData.evaluation_criteria?.rubrica,
                    [level]: text
                }
            }
        }
    }))
}));
