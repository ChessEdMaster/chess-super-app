'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Save, Trash2, Upload, Globe, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClubSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const clubId = params.clubId as string;

    const [club, setClub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        is_public: true,
        slug: ''
    });

    useEffect(() => {
        if (clubId && user) {
            fetchClub();
        }
    }, [clubId, user]);

    const fetchClub = async () => {
        try {
            const { data, error } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', clubId)
                .single();

            if (error) throw error;

            if (data) {
                setClub(data);
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    short_description: data.short_description || '',
                    is_public: data.is_public ?? true,
                    slug: data.slug || ''
                });
            }
        } catch (error: any) {
            console.error('Error fetching club:', error);
            alert('Error carregant la informació del club: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('El nom del club és obligatori');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('clubs')
                .update({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    short_description: formData.short_description.trim().substring(0, 150) || null,
                    is_public: formData.is_public
                })
                .eq('id', clubId);

            if (error) throw error;

            alert('Configuració guardada correctament!');
            fetchClub(); // Recargar datos
        } catch (error: any) {
            console.error('Error saving club:', error);
            alert('Error guardant la configuració: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('ESTÀS SEGUR? Això eliminarà el club permanentment i totes les seves dades. Aquesta acció NO es pot desfer.')) {
            return;
        }

        if (!confirm('Confirma una segona vegada: Vols eliminar aquest club?')) {
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('clubs')
                .delete()
                .eq('id', clubId);

            if (error) throw error;

            alert('Club eliminat correctament');
            router.push('/clubs');
        } catch (error: any) {
            console.error('Error deleting club:', error);
            alert('Error eliminant el club: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Configuració del Club</h1>
                <p className="text-neutral-400 mt-2">Gestiona la informació i configuració del teu club.</p>
            </div>

            {/* Informació Bàsica */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Informació Bàsica</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Nom del Club *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder="Nom del club"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Descripció
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                            placeholder="Descriu el teu club..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Descripció Curta (màx. 150 caràcters)
                        </label>
                        <textarea
                            value={formData.short_description}
                            onChange={(e) => setFormData({ ...formData, short_description: e.target.value.substring(0, 150) })}
                            rows={2}
                            maxLength={150}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                            placeholder="Descripció breu que apareixerà a la llista de clubs..."
                        />
                        <p className="text-xs text-neutral-500 mt-1">{formData.short_description.length}/150</p>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={formData.is_public}
                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="isPublic" className="text-sm text-neutral-300 flex items-center gap-2">
                            {formData.is_public ? <Globe size={16} /> : <Lock size={16} />}
                            Club públic (qualsevol pot unir-se)
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving || !formData.name.trim()}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        {saving ? 'Guardant...' : (
                            <>
                                <Save size={16} className="mr-2" />
                                Guardar Canvis
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Zona de Perill */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-400 mt-1" size={24} />
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Zona de Perill</h2>
                        <p className="text-sm text-red-300 mb-4">
                            Les accions d'aquesta secció són permanents i no es poden desfer.
                        </p>
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? 'Eliminant...' : (
                                <>
                                    <Trash2 size={16} className="mr-2" />
                                    Eliminar Club Permanentment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
