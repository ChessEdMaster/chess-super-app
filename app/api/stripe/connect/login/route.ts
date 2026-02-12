import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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

        // 1. Verify permissions
        const { data: membership } = await supabase
            .from('club_members')
            .select('role')
            .eq('club_id', clubId)
            .eq('user_id', user.id)
            .in('role', ['owner', 'admin'])
            .single();

        if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 2. Get Account ID
        const { data: club } = await supabase
            .from('clubs')
            .select('stripe_account_id')
            .eq('id', clubId)
            .single();
        
        if (!club?.stripe_account_id) return NextResponse.json({ error: 'No Stripe Account' }, { status: 404 });

        // 3. Create Login Link
        const loginLink = await stripe.accounts.createLoginLink(club.stripe_account_id);

        return NextResponse.json({ url: loginLink.url });

    } catch (error: any) {
        console.error('Stripe Login Link Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
