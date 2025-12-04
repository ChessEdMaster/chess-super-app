'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Database } from 'lucide-react';
import { populateAcademyDatabase, checkExistingData, clearAcademyData } from '@/lib/academy/utils';

export default function SetupPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [existingData, setExistingData] = useState<any>(null);

    const handleCheckData = async () => {
        setLoading(true);
        try {
            const data = await checkExistingData();
            setExistingData(data);
        } catch (error: any) {
            setResult({ success: false, message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePopulate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const data = await populateAcademyDatabase();
            setResult({
                success: true,
                message: `✅ Base de dades poblada amb èxit!\n${data.modules?.length} mòduls, ${data.lessons?.length} lliçons, ${data.exercises?.length} exercicis, ${data.achievements?.length} assoliments`
            });
            await handleCheckData();
        } catch (error: any) {
            setResult({ success: false, message: `❌ Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm('Estàs segur que vols esborrar totes les dades de l\'acadèmia? Aquesta acció no es pot desfer.')) {
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            await clearAcademyData();
            setResult({ success: true, message: '✅ Totes les dades han estat esborrades' });
            setExistingData(null);
        } catch (error: any) {
            setResult({ success: false, message: `❌ Error: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="text-indigo-400" size={32} />
                        <h1 className="text-3xl font-bold text-white">Configuració de l'Acadèmia</h1>
                    </div>

                    <p className="text-slate-400 mb-8">
                        Utilitza aquesta pàgina per poblar la base de dades amb les dades inicials de l'acadèmia.
                    </p>

                    {existingData && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-white mb-4">Dades Existents</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Mòduls:</span>
                                    <span className="text-white font-bold">{existingData.modules}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Lliçons:</span>
                                    <span className="text-white font-bold">{existingData.lessons}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Exercicis:</span>
                                    <span className="text-white font-bold">{existingData.exercises}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={`border rounded-xl p-4 mb-6 ${result.success
                            ? 'bg-emerald-900/20 border-emerald-500/30'
                            : 'bg-red-900/20 border-red-500/30'
                            }`}>
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <CheckCircle className="text-emerald-400 mt-0.5" size={20} />
                                ) : (
                                    <XCircle className="text-red-400 mt-0.5" size={20} />
                                )}
                                <p className={`text-sm whitespace-pre-line ${result.success ? 'text-emerald-200' : 'text-red-200'
                                    }`}>
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleCheckData}
                            disabled={loading}
                            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                            Comprovar Dades Existents
                        </button>

                        <button
                            onClick={handlePopulate}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                            Poblar Base de Dades
                        </button>

                        <button
                            onClick={handleClear}
                            disabled={loading}
                            className="w-full bg-red-900/20 hover:bg-red-900/30 disabled:opacity-50 text-red-400 border border-red-500/30 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                            Esborrar Totes les Dades
                        </button>
                    </div>

                    <div className="mt-8 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-200">
                            <strong>Nota:</strong> Abans de poblar la base de dades, assegura't d'haver executat l'script SQL <code className="bg-slate-800 px-2 py-1 rounded">academy-setup.sql</code> al Supabase SQL Editor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
