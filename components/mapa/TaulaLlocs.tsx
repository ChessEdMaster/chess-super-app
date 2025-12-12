'use client';

import { useState } from 'react';
import { ChessLocation, EntityType } from '@/types/chess-map'; // Updated types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

interface TaulaLlocsProps {
    locations: ChessLocation[];
}

type SortField = 'name' | 'entity_type' | 'municipi_nom' | 'start_date' | 'registered_players';
type SortDirection = 'asc' | 'desc';

export function TaulaLlocs({ locations }: TaulaLlocsProps) {
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    if (locations.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                No s'han trobat resultats amb els filtres actuals.
            </div>
        );
    }

    // Detect if dominant type is Tournament to show special columns
    // Logic: If > 50% of filtered items are tournaments, or if the list is only tournaments.
    // Actually, better: if ANY tournament is present, maybe show? Or just check if the user is filtering by Tournament?
    // Let's check if we have any tournament in the filtered list.
    const hasTournaments = locations.some(l => l.entity_type === 'Tournament');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedLocations = [...locations].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Handle "registered_players" which might be undefined/null on non-tournaments
        if (sortField === 'registered_players') {
            valA = a.registered_players || 0;
            valB = b.registered_players || 0;
        }

        if (valA === valB) return 0;
        // Handle undefineds generally
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        const res = valA > valB ? 1 : -1;
        return sortDirection === 'asc' ? res : -res;
    });

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-slate-900 hover:bg-slate-900">
                    <TableRow className="border-slate-800 hover:bg-slate-900">
                        <TableHead className="w-[300px]">
                            <Button variant="ghost" onClick={() => handleSort('name')} className="hover:bg-slate-800 hover:text-white text-slate-400 px-0">
                                Nom <ArrowUpDown className="ml-2 h-3 w-3" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => handleSort('entity_type')} className="hover:bg-slate-800 hover:text-white text-slate-400 px-0">
                                Tipus <ArrowUpDown className="ml-2 h-3 w-3" />
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => handleSort('municipi_nom')} className="hover:bg-slate-800 hover:text-white text-slate-400 px-0">
                                Municipi <ArrowUpDown className="ml-2 h-3 w-3" />
                            </Button>
                        </TableHead>
                        {hasTournaments && (
                            <>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('start_date')} className="hover:bg-slate-800 hover:text-white text-slate-400 px-0">
                                        Data Inici <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>Ritme</TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('registered_players')} className="hover:bg-slate-800 hover:text-white text-slate-400 px-0">
                                        Inscrits <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                            </>
                        )}
                        <TableHead className="text-right text-slate-400">Enllaç</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedLocations.map((loc) => (
                        <TableRow key={loc.id} className="border-slate-800 hover:bg-slate-900/50 transition-colors">
                            <TableCell className="font-exosar font-medium text-slate-200">{loc.name}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${loc.entity_type === 'Tournament' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                        loc.entity_type === 'Club' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                    }
                `}>
                                    {loc.entity_type}
                                </span>
                            </TableCell>
                            <TableCell className="text-slate-400">{loc.municipi_nom || '-'}</TableCell>

                            {hasTournaments && (
                                <>
                                    <TableCell className="text-slate-300">
                                        {loc.start_date ? format(new Date(loc.start_date), 'dd/MM/yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-xs">
                                        {loc.time_control || (loc.entity_type === 'Tournament' ? 'Standard' : '-')}
                                    </TableCell>
                                    <TableCell className="text-slate-300 font-mono">
                                        {loc.entity_type === 'Tournament' ? (loc.registered_players || 0) : '-'}
                                    </TableCell>
                                </>
                            )}

                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {loc.rules_url && loc.entity_type === 'Tournament' && (
                                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-300">
                                            <a href={loc.rules_url} target="_blank" rel="noopener noreferrer">Bases</a>
                                        </Button>
                                    )}
                                    {loc.url ? (
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 text-slate-400 hover:text-white">
                                            <a href={loc.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink size={14} />
                                            </a>
                                        </Button>
                                    ) : '-'}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
