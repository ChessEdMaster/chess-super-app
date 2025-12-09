'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, CalendarDays, UserPlus } from "lucide-react";

export function ClubDashboard({ clubId }: { clubId: string }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Administració del Club</h2>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <CalendarDays className="mr-2 h-4 w-4" /> Nou Event
                    </Button>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" /> Alta Soci
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Socis Actius</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142</div>
                        <p className="text-xs text-muted-foreground">12 quotes pendents</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingressos Mensuals</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1.250€</div>
                        <p className="text-xs text-muted-foreground">+20% vs mes passat</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
