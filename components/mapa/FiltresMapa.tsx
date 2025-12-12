'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChessLocation, EntityType, MapFilters } from '@/types/chess-map';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
// import { Switch } from '@/components/ui/switch'; // Assuming Switch exists or I use Button toggle
import { Card } from '@/components/ui/card';

interface FiltresMapaProps {
    locations: ChessLocation[];
    onFilterChange: (filters: MapFilters) => void;
}

const ENTITY_TYPES: EntityType[] = [
    'Club',
    'Tournament',
    'School',
    'Business',
    'Conference',
    'Official_Act'
];

export function FiltresMapa({ locations, onFilterChange }: FiltresMapaProps) {
    const [provincia, setProvincia] = useState<string>('all');
    const [comarca, setComarca] = useState<string>('all');
    const [municipi, setMunicipi] = useState<string>('all');
    const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]);
    const [onlyUpcoming, setOnlyUpcoming] = useState(false);

    // Derive unique values for dropdowns
    const provincies = useMemo(() => {
        return Array.from(new Set(locations.map(l => l.provincia_nom).filter(Boolean))) as string[];
    }, [locations]);

    const comarques = useMemo(() => {
        let filtered = locations;
        if (provincia !== 'all') {
            filtered = filtered.filter(l => l.provincia_nom === provincia);
        }
        return Array.from(new Set(filtered.map(l => l.comarca_nom).filter(Boolean))) as string[];
    }, [locations, provincia]);

    const municipis = useMemo(() => {
        let filtered = locations;
        if (provincia !== 'all') {
            filtered = filtered.filter(l => l.provincia_nom === provincia);
        }
        if (comarca !== 'all') {
            filtered = filtered.filter(l => l.comarca_nom === comarca);
        }
        return Array.from(new Set(filtered.map(l => l.municipi_nom).filter(Boolean))) as string[];
    }, [locations, provincia, comarca]);

    // Handle updates
    useEffect(() => {
        onFilterChange({
            provincia: provincia === 'all' ? undefined : provincia,
            comarca: comarca === 'all' ? undefined : comarca,
            municipi: municipi === 'all' ? undefined : municipi,
            types: selectedTypes.length > 0 ? selectedTypes : ENTITY_TYPES, // If none selected, show all? Or show none? Usually "all" if empty. Prompt says "Checkboxes/Toggle", usually implies additive. Let's assume empty = all or handle explicit "All". Let's default to all types if empty.
            onlyUpcoming
        });
    }, [provincia, comarca, municipi, selectedTypes, onlyUpcoming, onFilterChange]);

    const toggleType = (type: EntityType) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    return (
        <Card className="p-4 space-y-4 bg-background/90 backdrop-blur top-4 z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Geogràfic */}
                <div className="space-y-2">
                    <Label>Província</Label>
                    <Select value={provincia} onValueChange={(val) => { setProvincia(val); setComarca('all'); setMunicipi('all'); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Totes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Totes</SelectItem>
                            {provincies.sort().map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Comarca</Label>
                    <Select value={comarca} onValueChange={(val) => { setComarca(val); setMunicipi('all'); }} disabled={provincia === 'all' && comarques.length > 100}>
                        {/* Disable logic not strictly needed but good for UX if list is huge. */}
                        <SelectTrigger>
                            <SelectValue placeholder="Totes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Totes</SelectItem>
                            {comarques.sort().map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Municipi</Label>
                    <Select value={municipi} onValueChange={setMunicipi}>
                        <SelectTrigger>
                            <SelectValue placeholder="Tots" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tots</SelectItem>
                            {municipis.sort().map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tipus */}
                <div className="space-y-2">
                    <Label>Tipus d'Entitat</Label>
                    <div className="flex flex-wrap gap-2">
                        {ENTITY_TYPES.map(type => (
                            <Button
                                key={type}
                                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleType(type)}
                                className="text-xs"
                            >
                                {type}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Temps - Placeholder simple logic */}
                <div className="space-y-2 flex items-center md:col-span-4">
                    {/* Checkbox for upcoming */}
                    <Button
                        variant={onlyUpcoming ? "default" : "secondary"}
                        onClick={() => setOnlyUpcoming(!onlyUpcoming)}
                    >
                        {onlyUpcoming ? '✓ Només Pròxims' : 'Mostrar Tots els Esdeveniments'}
                    </Button>
                </div>

            </div>
        </Card>
    );
}
