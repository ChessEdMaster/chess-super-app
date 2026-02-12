'use client';

import { Users, CreditCard, CalendarDays, UserPlus, ExternalLink, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { GameCard } from "@/components/ui/design-system/GameCard";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";
import { Panel } from "@/components/ui/design-system/Panel";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

export function ClubDashboard({ clubId }: { clubId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stripeStatus, setStripeStatus] = useState<{
        accountId: string | null;
        detailsSubmitted: boolean;
        chargesEnabled: boolean;
    } | null>(null);

    useEffect(() => {
        // Check for return params
        const stripeParam = searchParams.get('stripe');
        if (stripeParam === 'success') toast.success("Compte d'Stripe connectat correctament");
        if (stripeParam === 'error') toast.error("Error connectant amb Stripe");

        fetchClubDetails();
    }, [clubId, searchParams]);

    async function fetchClubDetails() {
        try {
            const { data, error } = await supabase
                .from('clubs')
                .select('stripe_account_id, stripe_details_submitted, stripe_charges_enabled')
                .eq('id', clubId)
                .single();

            if (data) {
                setStripeStatus({
                    accountId: data.stripe_account_id,
                    detailsSubmitted: data.stripe_details_submitted,
                    chargesEnabled: data.stripe_charges_enabled
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleConnectStripe() {
        setStripeLoading(true);
        try {
            const res = await fetch('/api/stripe/connect/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clubId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Error iniciant connexió");
            }
        } catch (error) {
            toast.error("Error de xarxa");
        } finally {
            setStripeLoading(false);
        }
    }

    async function handleLoginStripe() {
        setStripeLoading(true);
        try {
            const res = await fetch('/api/stripe/connect/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clubId })
            });
            const data = await res.json();
            if (data.url) {
                window.open(data.url, '_blank');
            } else {
                toast.error(data.error || "Error obtenint enllaç");
            }
        } catch (error) {
            toast.error("Error de xarxa");
        } finally {
            setStripeLoading(false);
        }
    }

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>;

    const isStripeReady = stripeStatus?.chargesEnabled;
    const isStripePending = stripeStatus?.accountId && !stripeStatus?.detailsSubmitted;

    return (
        <div className="space-y-6">
            <Panel className="flex items-center justify-between p-6 bg-zinc-900 border-zinc-700">
                <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display text-stroke">Administració del Club</h2>
                <div className="flex gap-2">
                    <ShinyButton variant="secondary">
                        <CalendarDays className="mr-2 h-4 w-4" /> Nou Event
                    </ShinyButton>
                    <ShinyButton variant="primary">
                        <UserPlus className="mr-2 h-4 w-4" /> Alta Soci
                    </ShinyButton>
                </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-3">
                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Socis Actius</span>
                        <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">142</div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">12 quotes pendents</p>
                    </div>
                </GameCard>

                {/* Stripe / Finance Card */}
                <GameCard variant="default" className="p-0 overflow-hidden relative group">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Finances (Stripe)</span>
                        <CreditCard className={`h-4 w-4 ${isStripeReady ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    </div>
                    <div className="p-6 flex flex-col items-start justify-between h-full min-h-[100px]">
                        {isStripeReady ? (
                            <>
                                <div className="text-3xl font-black text-white font-display">Actiu</div>
                                <div className="mt-2 w-full">
                                    <ShinyButton onClick={handleLoginStripe} disabled={stripeLoading} variant="secondary" className="w-full text-xs h-8">
                                        {stripeLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <ExternalLink className="mr-2 h-3 w-3" />}
                                        Tauler Stripe
                                    </ShinyButton>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-medium text-zinc-400 mb-2">
                                    {isStripePending ? "Configuració incompleta" : "Connecta amb Stripe per rebre pagaments"}
                                </div>
                                <ShinyButton onClick={handleConnectStripe} disabled={stripeLoading} variant="primary" className="w-full text-xs">
                                    {stripeLoading ? <Loader2 className="animate-spin h-3 w-3" /> : (
                                        isStripePending ? "Continuar Configuració" : "Connectar Stripe"
                                    )}
                                </ShinyButton>
                            </>
                        )}
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2">
                        {isStripeReady && <CheckCircle className="text-emerald-500 h-4 w-4" />}
                        {isStripePending && <AlertTriangle className="text-amber-500 h-4 w-4" />}
                    </div>
                </GameCard>

                <GameCard variant="default" className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ingressos Mensuals</span>
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="p-6">
                        <div className="text-3xl font-black text-white font-display">1.250€</div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">+20% vs mes passat</p>
                    </div>
                </GameCard>
            </div>
        </div>
    );
}
