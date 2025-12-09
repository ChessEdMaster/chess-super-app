'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Trophy, Plus } from "lucide-react";
import { BulkImportModal } from "../bulk-import-modal";

export function SchoolDashboard({ clubId }: { clubId: string }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Aula Virtual</h2>
                <div className="flex gap-2">
                    <BulkImportModal clubId={clubId} />
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nou Alumne
                    </Button>
                </div>
            </div>

            {/* KPIs de l'Escola */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Alumnes</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">+4 aquest mes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deures Entregats</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">85%</div>
                        <p className="text-xs text-muted-foreground">Setmana actual</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nivell Mitjà</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1250 ELO</div>
                        <p className="text-xs text-muted-foreground">+15 punts de millora</p>
                    </CardContent>
                </Card>
            </div>

            {/* Secció d'Accions Ràpides per a Professors */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Activitat Recent de l'Aula</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            (Aquí hi anirà el llistat d'exercicis completats pels alumnes)
                        </p>
                        {/* TODO: Connectar amb la taula d'activitat real */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
