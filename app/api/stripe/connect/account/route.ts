import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe'; // Need to make sure this exports a server-side stripe instance
import { supabaseAdmin } from '@/lib/supabase-admin'; // Need a service-role supabase client
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                         // We don't need to set cookies here for auth read
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { clubId } = body;

        // 1. Verify user is owner/admin of the club
        const { data: membership } = await supabase
            .from('club_members')
            .select('role')
            .eq('club_id', clubId)
            .eq('user_id', user.id)
            .in('role', ['owner', 'admin'])
            .single();

        if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 2. Check if club already has an account
        const { data: club } = await supabase
            .from('clubs')
            .select('stripe_account_id, stripe_details_submitted')
            .eq('id', clubId)
            .single();
        
        if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

        let accountId = club.stripe_account_id;

        // 3. Create Stripe Account if needed
        if (!accountId) {
             const account = await stripe.accounts.create({
                type: 'express',
                country: 'ES', // Default to Spain for now, or make dynamic
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    clubId: clubId
                }
            });
            accountId = account.id;

            // Save to DB
            await supabaseAdmin
                .from('clubs')
                .update({ stripe_account_id: accountId })
                .eq('id', clubId);
        }

        // 4. Create Account Link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh?clubId=${clubId}`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/return?clubId=${clubId}`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error: any) {
        console.error('Stripe Connect Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
