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
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { importStudentsAction } from "@/app/actions/club-actions";

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
                <Button variant="secondary">
                    <Upload className="mr-2 h-4 w-4" /> Importar CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importació Massiva d'Alumnes</DialogTitle>
                    <DialogDescription>
                        Puja un fitxer CSV amb les columnes: <b>nom, cognom, grup, email_pare</b>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />

                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        <p>Exemple de format:</p>
                        <code className="block mt-1">nom,cognom,grup,email_pare</code>
                        <code className="block">Marc,Vidal,1r Primària,pare@test.com</code>
                    </div>

                    {result && (
                        <div className="space-y-2">
                            {result.success > 0 && (
                                <Alert className="border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Èxit</AlertTitle>
                                    <AlertDescription>S'han importat {result.success} alumnes correctament.</AlertDescription>
                                </Alert>
                            )}

                            {result.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Errors ({result.errors.length})</AlertTitle>
                                    <div className="text-destructive max-h-[100px] overflow-y-auto text-xs">
                                        {result.errors.map((err, i) => <div key={i}>• {err}</div>)}
                                    </div>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleUpload} disabled={!file || isLoading}>
                        {isLoading ? "Processant..." : "Importar Alumnes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
