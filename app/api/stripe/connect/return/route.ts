import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');

    if (!clubId) return NextResponse.json({ error: 'Missing clubId' }, { status: 400 });

    try {
        const { data: club } = await supabaseAdmin
            .from('clubs')
            .select('stripe_account_id')
            .eq('id', clubId)
            .single();

        if (!club?.stripe_account_id) {
            return NextResponse.json({ error: 'Club has no Stripe account' }, { status: 400 });
        }

        // Fetch account status from Stripe
        const account = await stripe.accounts.retrieve(club.stripe_account_id);

        // Update DB
        await supabaseAdmin
            .from('clubs')
            .update({
                stripe_details_submitted: account.details_submitted,
                stripe_charges_enabled: account.charges_enabled,
            })
            .eq('id', clubId);

        // Redirect back to dashboard
        redirect(`/clubs/manage/${clubId}?stripe=success`);

    } catch (error: any) {
        console.error('Stripe Return Error:', error);
        redirect(`/clubs/manage/${clubId}?stripe=error`);
    }
}
