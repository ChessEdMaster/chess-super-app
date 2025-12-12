'use client';

import { ChessLocation } from '@/types/chess-map';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaulaLlocsProps {
    locations: ChessLocation[];
}

export function TaulaLlocs({ locations }: TaulaLlocsProps) {
    if (locations.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No s'han trobat resultats amb els filtres actuals.</div>;
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Tipus</TableHead>
                        <TableHead>Municipi</TableHead>
                        <TableHead>Data Inici</TableHead>
                        <TableHead className="text-right">Enllaç</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {locations.map((loc) => (
                        <TableRow key={loc.id}>
                            <TableCell className="font-medium">{loc.name}</TableCell>
                            <TableCell>{loc.entity_type}</TableCell>
                            <TableCell>{loc.municipi_nom || '-'}</TableCell>
                            <TableCell>
                                {loc.start_date
                                    ? format(new Date(loc.start_date), 'dd/MM/yyyy')
                                    : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                {loc.url ? (
                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                        <a href={loc.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink size={16} />
                                        </a>
                                    </Button>
                                ) : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
