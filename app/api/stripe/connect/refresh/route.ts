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

        const accountLink = await stripe.accountLinks.create({
            account: club.stripe_account_id,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh?clubId=${clubId}`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/return?clubId=${clubId}`,
            type: 'account_onboarding',
        });

        redirect(accountLink.url);

    } catch (error: any) {
        console.error('Stripe Refresh Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
