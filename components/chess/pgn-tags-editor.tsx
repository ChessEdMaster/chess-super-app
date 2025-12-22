'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Info } from 'lucide-react';
import { PGNMetadata } from '@/types/pgn';

interface PGNTagsEditorProps {
    isOpen: boolean;
    onClose: () => void;
    metadata: PGNMetadata;
    onSave: (metadata: PGNMetadata) => void;
}

const STANDARD_TAGS = [
    { key: 'Event', label: 'Event' },
    { key: 'Site', label: 'Site' },
    { key: 'Date', label: 'Date', placeholder: 'YYYY.MM.DD' },
    { key: 'Round', label: 'Round' },
    { key: 'White', label: 'White' },
    { key: 'Black', label: 'Black' },
    { key: 'Result', label: 'Result', placeholder: '1-0, 0-1, 1/2-1/2, or *' },
];

const COMMON_TAGS = [
    { key: 'WhiteElo', label: 'White Elo' },
    { key: 'BlackElo', label: 'Black Elo' },
    { key: 'ECO', label: 'ECO Code' },
    { key: 'Opening', label: 'Opening' },
    { key: 'Annotator', label: 'Annotator' },
    { key: 'TimeControl', label: 'Time Control' },
];

export function PGNTagsEditor({ isOpen, onClose, metadata, onSave }: PGNTagsEditorProps) {
    const [editMetadata, setEditMetadata] = useState<PGNMetadata>({ ...metadata });
    const [newTagKey, setNewTagKey] = useState('');
    const [newTagValue, setNewTagValue] = useState('');

    const handleTagChange = (key: string, value: string) => {
        setEditMetadata(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleAddCustomTag = () => {
        if (!newTagKey.trim()) return;
        setEditMetadata(prev => ({
            ...prev,
            [newTagKey.trim()]: newTagValue
        }));
        setNewTagKey('');
        setNewTagValue('');
    };

    const handleRemoveTag = (key: string) => {
        const next = { ...editMetadata };
        delete next[key];
        setEditMetadata(next);
    };

    const handleSave = () => {
        onSave(editMetadata);
        onClose();
    };

    const customTags = Object.keys(editMetadata).filter(
        k => !STANDARD_TAGS.find(s => s.key === k) && !COMMON_TAGS.find(c => c.key === k)
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 border-b border-zinc-800 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="text-amber-500" size={20} />
                        Game Information
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Seven Tag Roster */}
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Mandatory Tags (Seven Tag Roster)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {STANDARD_TAGS.map(tag => (
                                    <div key={tag.key} className="space-y-1.5 font-sans">
                                        <Label htmlFor={`tag-${tag.key}`} className="text-xs text-zinc-400">{tag.label}</Label>
                                        <Input
                                            id={`tag-${tag.key}`}
                                            value={editMetadata[tag.key] || ''}
                                            onChange={e => handleTagChange(tag.key, e.target.value)}
                                            placeholder={tag.placeholder || `Enter ${tag.label.toLowerCase()}...`}
                                            className="h-9 bg-zinc-950 border-zinc-800 text-sm focus:ring-amber-500/20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Common Tags */}
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Common Tags</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {COMMON_TAGS.map(tag => (
                                    <div key={tag.key} className="space-y-1.5">
                                        <Label htmlFor={`tag-${tag.key}`} className="text-xs text-zinc-400">{tag.label}</Label>
                                        <Input
                                            id={`tag-${tag.key}`}
                                            value={editMetadata[tag.key] || ''}
                                            onChange={e => handleTagChange(tag.key, e.target.value)}
                                            placeholder={`Enter ${tag.label.toLowerCase()}...`}
                                            className="h-9 bg-zinc-950 border-zinc-800 text-sm focus:ring-amber-500/20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Custom Tags */}
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Custom Tags</h3>
                            <div className="space-y-3">
                                {customTags.map(key => (
                                    <div key={key} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-1.5">
                                            <Label className="text-xs text-zinc-400">{key}</Label>
                                            <Input
                                                value={editMetadata[key] || ''}
                                                onChange={e => handleTagChange(key, e.target.value)}
                                                className="h-9 bg-zinc-950 border-zinc-800 text-sm"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveTag(key)}
                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 mb-0.5"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}

                                {/* Add New Tag */}
                                <div className="flex gap-2 items-end pt-2 border-t border-zinc-800/50">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-zinc-400">New Tag Key</Label>
                                        <Input
                                            placeholder="e.g. MyTag"
                                            value={newTagKey}
                                            onChange={e => setNewTagKey(e.target.value)}
                                            className="h-9 bg-zinc-950 border-zinc-800 text-sm italic"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-zinc-400">Value</Label>
                                        <Input
                                            placeholder="Value..."
                                            value={newTagValue}
                                            onChange={e => setNewTagValue(e.target.value)}
                                            className="h-9 bg-zinc-950 border-zinc-800 text-sm italic"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddCustomTag}
                                        disabled={!newTagKey.trim()}
                                        variant="secondary"
                                        className="h-9 px-3 gap-2 border border-zinc-700 hover:bg-zinc-800"
                                    >
                                        <Plus size={16} />
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t border-zinc-800 bg-zinc-950/50 shrink-0">
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
                    <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-500 text-white font-bold">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
