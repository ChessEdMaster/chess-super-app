'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'month' | 'year' | 'one_time';
    is_active: boolean;
    features: string[];
}

export default function ClubPlansPage() {
    const params = useParams();
    const clubId = params.clubId as string;
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
        name: '',
        description: '',
        price: 0,
        interval: 'month',
        features: []
    });

    useEffect(() => {
        fetchPlans();
    }, [clubId]);

    const fetchPlans = async () => {
        const { data, error } = await supabase
            .from('club_subscription_plans')
            .select('*')
            .eq('club_id', clubId)
            .order('price', { ascending: true });

        if (data) setPlans(data);
        setLoading(false);
    };

    const handleCreatePlan = async () => {
        if (!newPlan.name || newPlan.price === undefined) {
            toast.error('Si us plau, omple els camps obligatoris');
            return;
        }

        // Prepare data for DB (Stripe integration will be added here later)
        const planData = {
            club_id: clubId,
            name: newPlan.name,
            description: newPlan.description,
            price: newPlan.price,
            interval: newPlan.interval,
            features: newPlan.features || [],
            is_active: true,
            // stripe_price_id: null // Pending Stripe Integration
        };

        const { data, error } = await supabase
            .from('club_subscription_plans')
            .insert([planData])
            .select();

        if (error) {
            toast.error('Error creant el pla: ' + error.message);
        } else {
            toast.success('Pla creat correctament (Mode Local)');
            setPlans([...plans, data[0]]);
            setIsCreating(false);
            setNewPlan({ name: '', description: '', price: 0, interval: 'month', features: [] });
        }
    };

    const togglePlanStatus = async (plan: SubscriptionPlan) => {
        const { error } = await supabase
            .from('club_subscription_plans')
            .update({ is_active: !plan.is_active })
            .eq('id', plan.id);

        if (!error) {
            setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
            toast.success(`Pla ${!plan.is_active ? 'activat' : 'desactivat'}`);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Plans i Quotes</h1>
                    <p className="text-neutral-400 mt-2">Gestiona les subscripcions del teu club.</p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nou Pla
                </Button>
            </div>

            {/* Info Banner for Stripe */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                    <strong>Nota:</strong> Actualment els plans es creen només a la base de dades local.
                    La sincronització automàtica amb Stripe s'activarà quan es configuri l'API Key.
                </p>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">Nou Pla de Subscripció</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Nom del Pla (ex: Soci General)"
                            className="bg-neutral-800 border-neutral-700 rounded-lg px-4 py-2 text-white w-full"
                            value={newPlan.name}
                            onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                        />
                        <div className="flex space-x-2">
                            <input
                                type="number"
                                placeholder="Preu (€)"
                                className="bg-neutral-800 border-neutral-700 rounded-lg px-4 py-2 text-white w-full"
                                value={newPlan.price}
                                onChange={e => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                            />
                            <select
                                className="bg-neutral-800 border-neutral-700 rounded-lg px-4 py-2 text-white"
                                value={newPlan.interval}
                                onChange={e => setNewPlan({ ...newPlan, interval: e.target.value as any })}
                            >
                                <option value="month">/mes</option>
                                <option value="year">/any</option>
                                <option value="one_time">pagament únic</option>
                            </select>
                        </div>
                        <textarea
                            placeholder="Descripció breu..."
                            className="bg-neutral-800 border-neutral-700 rounded-lg px-4 py-2 text-white w-full md:col-span-2"
                            value={newPlan.description}
                            onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel·lar</Button>
                        <Button onClick={handleCreatePlan} className="bg-emerald-500 hover:bg-emerald-600">Crear Pla</Button>
                    </div>
                </div>
            )}

            {/* Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className={cn(
                        "bg-neutral-900 border rounded-xl p-6 relative overflow-hidden",
                        plan.is_active ? "border-neutral-800" : "border-red-900/30 opacity-75"
                    )}>
                        {!plan.is_active && (
                            <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-bl-lg">
                                Inactiu
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <p className="text-neutral-400 text-sm">{plan.description}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-emerald-400">{plan.price}€</span>
                            <span className="text-neutral-500 text-sm">
                                {plan.interval === 'one_time' ? ' pagament únic' : ` / ${plan.interval === 'month' ? 'mes' : 'any'}`}
                            </span>
                        </div>

                        <div className="flex space-x-2 mt-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-neutral-700 hover:bg-neutral-800"
                                onClick={() => togglePlanStatus(plan)}
                            >
                                {plan.is_active ? 'Desactivar' : 'Activar'}
                            </Button>
                            {/* Future: Edit Button */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
