'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Save, Trash2, Upload, Globe, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClubSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const clubId = params.clubId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        is_public: true,
        slug: '',
        image_url: '',
        banner_url: ''
    });

    useEffect(() => {
        fetchClub();
    }, [clubId]);

    const fetchClub = async () => {
        try {
            const { data, error } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', clubId)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    short_description: data.short_description || '',
                    is_public: data.is_public,
                    slug: data.slug || '',
                    image_url: data.image_url || '',
                    banner_url: data.banner_url || ''
                });
            }
        } catch (error) {
            console.error('Error fetching club:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('clubs')
                .update({
                    name: formData.name,
                    description: formData.description,
                    short_description: formData.short_description,
                    is_public: formData.is_public,
                    slug: formData.slug,
                    image_url: formData.image_url,
                    banner_url: formData.banner_url
                })
                .eq('id', clubId);

            if (error) throw error;
            alert('Configuració guardada correctament');
        } catch (error: any) {
            console.error('Error saving club:', error);
            alert(error.message || 'Error al guardar la configuració');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Estàs segur que vols eliminar aquest club? Aquesta acció no es pot desfer.')) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('clubs')
                .delete()
                .eq('id', clubId);

            if (error) throw error;

            router.push('/clubs');
        } catch (error: any) {
            console.error('Error deleting club:', error);
            alert(error.message || 'Error al eliminar el club');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Configuració del Club</h1>
                <p className="text-neutral-400 mt-2">Gestiona la informació i configuració del teu club.</p>
            </div>

            {/* General Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Informació General
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Nom del Club</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Slug (URL)</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Descripció Curta</label>
                    <input
                        type="text"
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Descripció Completa</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                </div>
            </div>

            {/* Images */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-bold text-white">Imatges</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">URL del Logo</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        {formData.image_url && (
                            <img src={formData.image_url} alt="Logo preview" className="w-16 h-16 rounded-full object-cover mt-2 border border-neutral-700" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">URL del Banner</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.banner_url}
                                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        {formData.banner_url && (
                            <img src={formData.banner_url} alt="Banner preview" className="w-full h-24 rounded-lg object-cover mt-2 border border-neutral-700" />
                        )}
                    </div>
                </div>
            </div>

            {/* Visibility */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-bold text-white">Visibilitat</h2>

                <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${formData.is_public ? 'bg-indigo-500/20 text-indigo-400' : 'bg-neutral-700/50 text-neutral-400'}`}>
                            {formData.is_public ? <Globe size={24} /> : <Lock size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">
                                {formData.is_public ? 'Club Públic' : 'Club Privat'}
                            </h3>
                            <p className="text-sm text-neutral-400">
                                {formData.is_public
                                    ? 'Qualsevol usuari pot veure i unir-se al club.'
                                    : 'Només els membres convidats poden veure el contingut.'}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_public}
                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 text-lg"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Guardant...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Guardar Canvis
                        </>
                    )}
                </Button>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-900/50 rounded-xl p-6 bg-red-950/10 mt-12">
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2 mb-4">
                    <AlertTriangle size={24} />
                    Zona de Perill
                </h2>
                <p className="text-neutral-400 mb-6">
                    Aquestes accions són destructives i no es poden desfer.
                </p>

                <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/30">
                    <div>
                        <h3 className="font-bold text-white">Eliminar Club</h3>
                        <p className="text-sm text-neutral-400">
                            Eliminarà permanentment el club i totes les seves dades.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
