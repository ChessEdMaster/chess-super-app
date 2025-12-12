'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChessLocation, EntityType, MapFilters, MapLayerType } from '@/types/chess-map';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Layers, Calendar, Filter, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FiltresMapaProps {
    locations: ChessLocation[];
    onFilterChange: (filters: MapFilters) => void;
    currentLayer: MapLayerType;
    onLayerChange: (layer: MapLayerType) => void;
}

const ENTITY_TYPES: EntityType[] = [
    'Club',
    'Tournament',
    'School',
    'Business',
    'Conference',
    'Official_Act'
];

export function FiltresMapa({ locations, onFilterChange, currentLayer, onLayerChange }: FiltresMapaProps) {
    const [provincia, setProvincia] = useState<string>('all');
    const [comarca, setComarca] = useState<string>('all');
    const [municipi, setMunicipi] = useState<string>('all');
    const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]); // Empty = All by default logic in parent, but let's make it explicit if needed.
    const [onlyUpcoming, setOnlyUpcoming] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Derive unique values
    const provincies = useMemo(() => Array.from(new Set(locations.map(l => l.provincia_nom).filter(Boolean))).sort() as string[], [locations]);

    const comarques = useMemo(() => {
        let filtered = locations;
        if (provincia !== 'all') filtered = filtered.filter(l => l.provincia_nom === provincia);
        return Array.from(new Set(filtered.map(l => l.comarca_nom).filter(Boolean))).sort() as string[];
    }, [locations, provincia]);

    const municipis = useMemo(() => {
        let filtered = locations;
        if (provincia !== 'all') filtered = filtered.filter(l => l.provincia_nom === provincia);
        if (comarca !== 'all') filtered = filtered.filter(l => l.comarca_nom === comarca);
        return Array.from(new Set(filtered.map(l => l.municipi_nom).filter(Boolean))).sort() as string[];
    }, [locations, provincia, comarca]);

    // Update Parent
    useEffect(() => {
        onFilterChange({
            provincia: provincia === 'all' ? undefined : provincia,
            comarca: comarca === 'all' ? undefined : comarca,
            municipi: municipi === 'all' ? undefined : municipi,
            types: selectedTypes.length > 0 ? selectedTypes : ENTITY_TYPES,
            onlyUpcoming
        });
    }, [provincia, comarca, municipi, selectedTypes, onlyUpcoming, onFilterChange]);

    const toggleType = (type: EntityType) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    return (
        <Card className="p-3 bg-slate-900/90 backdrop-blur border-slate-700 text-slate-100 shadow-xl z-20">
            <div className="flex flex-col gap-3">
                {/* Top Row: Compact & Critical Controls */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">

                    {/* Left: Layer Selector (Important) */}
                    <div className="flex items-center gap-2 mr-4">
                        <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1"><Layers size={14} /> VISTA</span>
                        <div className="flex bg-slate-800 rounded-md p-0.5 border border-slate-700/50">
                            <button
                                onClick={() => onLayerChange('provincies')}
                                className={`text-xs px-3 py-1.5 rounded-sm transition-all ${currentLayer === 'provincies' ? 'bg-amber-500 text-black font-bold shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                Províncies
                            </button>
                            <button
                                onClick={() => onLayerChange('comarques')}
                                className={`text-xs px-3 py-1.5 rounded-sm transition-all ${currentLayer === 'comarques' ? 'bg-amber-500 text-black font-bold shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                Comarques
                            </button>
                            <button
                                onClick={() => onLayerChange('municipis')}
                                className={`text-xs px-3 py-1.5 rounded-sm transition-all ${currentLayer === 'municipis' ? 'bg-amber-500 text-black font-bold shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                Municipis
                            </button>
                        </div>
                    </div>

                    {/* Middle: Quick Toggles */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={onlyUpcoming ? "default" : "outline"}
                            size="sm"
                            className={`h-8 text-xs ${onlyUpcoming ? 'bg-emerald-600 hover:bg-emerald-700 border-none' : 'border-slate-600 text-slate-300'}`}
                            onClick={() => setOnlyUpcoming(!onlyUpcoming)}
                        >
                            <Calendar className="mr-1.5 h-3 w-3" />
                            {onlyUpcoming ? 'Pròxims' : 'Tots els events'}
                        </Button>
                    </div>

                    {/* Right: Expand Advanced Filters */}
                    <div className="ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                            <Filter className="mr-1.5 h-3 w-3" />
                            Filtres {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                        </Button>
                    </div>
                </div>

                {/* Expanded Row: Dropdowns & Entity Types */}
                {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2 border-t border-slate-800 animate-in slide-in-from-top-2">

                        {/* Geogràfic */}
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Província</Label>
                            <Select value={provincia} onValueChange={(val) => { setProvincia(val); setComarca('all'); setMunicipi('all'); }}>
                                <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Totes" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectItem value="all">Totes</SelectItem>
                                    {provincies.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Comarca</Label>
                            <Select value={comarca} onValueChange={(val) => { setComarca(val); setMunicipi('all'); }}>
                                <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" disabled={provincia === 'all' && comarques.length > 50}>
                                    <SelectValue placeholder="Totes" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectItem value="all">Totes</SelectItem>
                                    {comarques.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Municipi</Label>
                            <Select value={municipi} onValueChange={setMunicipi}>
                                <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" disabled={comarca === 'all' && municipis.length > 50}>
                                    <SelectValue placeholder="Tots" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectItem value="all">Tots</SelectItem>
                                    {municipis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Entity Types Tags */}
                        <div className="md:col-span-4 pt-2">
                            <Label className="text-xs text-slate-400 block mb-2">Categories</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {ENTITY_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleType(type)}
                                        className={`
                                    px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border transition-all
                                    ${selectedTypes.includes(type)
                                                ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                                : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}
                                `}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </Card>
    );
}
