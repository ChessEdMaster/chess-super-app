'use client'

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, AlertCircle, CheckCircle, FileUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { importStudentsAction } from "@/app/actions/club-actions";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";
import { GameCard } from "@/components/ui/design-system/GameCard";

export function BulkImportModal({ clubId }: { clubId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
    const [open, setOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                // results.data és un array d'objectes: [{nom: 'Pol', grup: '1A'}, ...]
                try {
                    const response = await importStudentsAction(clubId, results.data);
                    setResult(response);
                    if (response.success > 0 && response.errors.length === 0) {
                        // Opcional: Tancar modal automàticament si tot és perfecte
                        // setOpen(false); 
                    }
                } catch (error: any) {
                    setResult({ success: 0, errors: ["Error de connexió amb el servidor: " + error.message] });
                } finally {
                    setIsLoading(false);
                }
            },
            error: (error) => {
                setIsLoading(false);
                setResult({ success: 0, errors: [`Error llegint CSV: ${error.message}`] });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <ShinyButton variant="secondary" className="h-[40px] px-4 py-2">
                    <Upload className="mr-2 h-4 w-4" /> Importar CSV
                </ShinyButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-none shadow-none text-white">
                <GameCard variant="default" className="p-0 overflow-hidden w-full">
                    {/* Header */}
                    <div className="p-6 bg-zinc-900 border-b border-zinc-700">
                        <DialogTitle className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                            <FileUp className="text-amber-500" /> Importació Massiva
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-bold uppercase mt-1">
                            Puja un fitxer CSV amb les columnes: <span className="text-zinc-300">nom, cognom, grup, email_pare</span>.
                        </DialogDescription>
                    </div>

                    <div className="p-6 space-y-4 bg-zinc-950/50">
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isLoading}
                                className="block w-full text-sm text-zinc-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-xl file:border-0
                                file:text-xs file:font-black file:uppercase file:tracking-wider
                                file:bg-zinc-800 file:text-zinc-300
                                hover:file:bg-zinc-700
                                cursor-pointer focus:outline-none"
                            />
                        </div>

                        <div className="text-xs text-zinc-500 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 border-dashed">
                            <p className="font-bold uppercase mb-2 text-zinc-600">Exemple de format:</p>
                            <code className="block font-mono text-amber-500/80 mb-1">nom,cognom,grup,email_pare</code>
                            <code className="block font-mono text-zinc-400">Marc,Vidal,1r Primària,pare@test.com</code>
                        </div>

                        {result && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                {result.success > 0 && (
                                    <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertTitle className="font-black uppercase">Èxit</AlertTitle>
                                        <AlertDescription className="text-xs font-medium">S'han importat {result.success} alumnes correctament.</AlertDescription>
                                    </Alert>
                                )}

                                {result.errors.length > 0 && (
                                    <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-black uppercase">Errors ({result.errors.length})</AlertTitle>
                                        <div className="text-red-300/80 max-h-[100px] overflow-y-auto text-xs mt-1 custom-scrollbar">
                                            {result.errors.map((err, i) => <div key={i}>• {err}</div>)}
                                        </div>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-zinc-900 border-t border-zinc-700 flex justify-end gap-3">
                        <ShinyButton variant="neutral" onClick={() => setOpen(false)}>
                            Tancar
                        </ShinyButton>
                        <ShinyButton
                            variant="primary"
                            onClick={handleUpload}
                            disabled={!file || isLoading}
                        >
                            {isLoading ? "Processant..." : "Importar Alumnes"}
                        </ShinyButton>
                    </div>
                </GameCard>
            </DialogContent>
        </Dialog>
    );
}
