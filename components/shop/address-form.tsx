'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddressFormProps {
    onAddressAdded: (addressId: string) => void;
    onCancel: () => void;
}

export function AddressForm({ onAddressAdded, onCancel }: AddressFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'Espanya' // Default
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Has d\'iniciar sessió');
                return;
            }

            const { data, error } = await supabase
                .from('shop_addresses')
                .insert({
                    user_id: user.id,
                    ...formData,
                    is_default: false // Logic can be improved
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Adreça guardada correctament');
            onAddressAdded(data.id);
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error('Error guardant l\'adreça');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/50 p-6 rounded-lg border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Nova Adreça d'Enviament</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Nom Complet</label>
                    <input
                        required
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Telèfon</label>
                    <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-slate-400">Adreça</label>
                <input
                    required
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    placeholder="Carrer, número, pis..."
                    className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm text-slate-400">Adreça (continuació)</label>
                <input
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Apartament, bloc, etc. (Opcional)"
                    className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Ciutat</label>
                    <input
                        required
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Província</label>
                    <input
                        required
                        name="state_province"
                        value={formData.state_province}
                        onChange={handleChange}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Codi Postal</label>
                    <input
                        required
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm text-slate-400">País</label>
                    <input
                        required
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full bg-slate-800 border-slate-700 rounded-md p-2 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                    Cancel·lar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {isLoading && <Loader2 className="animate-spin" size={16} />}
                    Guardar Adreça
                </button>
            </div>
        </form>
    );
}
