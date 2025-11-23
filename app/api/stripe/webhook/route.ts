import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY no està configurada');
    }
    return new Stripe(secretKey, {
        apiVersion: '2025-11-17.clover',
    });
}

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables d\'entorn de Supabase no configurades');
    }
    
    return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripe();
        const supabase = getSupabase();
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            return NextResponse.json(
                { error: 'STRIPE_WEBHOOK_SECRET no està configurada' },
                { status: 500 }
            );
        }
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'No signature' },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        // Gestionar l'event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('PaymentIntent succeeded:', paymentIntent.id);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailed(paymentIntent);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const supabase = getSupabase();
    const orderId = session.metadata?.order_id;

    if (!orderId) {
        console.error('No order_id in session metadata');
        return;
    }

    try {
        // Actualitzar la comanda
        const { error: orderError } = await supabase
            .from('shop_orders')
            .update({
                status: 'paid',
                payment_status: 'paid',
                stripe_payment_intent_id: session.payment_intent as string,
                paid_at: new Date().toISOString(),
            })
            .eq('id', orderId);

        if (orderError) {
            console.error('Error updating order:', orderError);
            return;
        }

        // Obtenir els items de la comanda
        const { data: orderItems, error: itemsError } = await supabase
            .from('shop_order_items')
            .select('product_id, quantity')
            .eq('order_id', orderId);

        if (itemsError || !orderItems) {
            console.error('Error fetching order items:', itemsError);
            return;
        }

        // Reduir l'estoc dels productes
        for (const item of orderItems) {
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                product_id: item.product_id,
                quantity: item.quantity,
            });

            if (stockError) {
                console.error('Error decrementing stock:', stockError);
                // Continuar amb els altres productes
            }
        }

        // Buidar la cistella de l'usuari
        const userId = session.metadata?.user_id;
        if (userId) {
            await supabase
                .from('shop_cart_items')
                .delete()
                .eq('user_id', userId);
        }

        console.log(`Order ${orderId} completed successfully`);

        // Aquí podries enviar un email de confirmació
        // await sendOrderConfirmationEmail(orderId);

    } catch (error) {
        console.error('Error handling checkout completed:', error);
    }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const supabase = getSupabase();
    try {
        // Buscar la comanda per payment_intent_id
        const { data: order, error } = await supabase
            .from('shop_orders')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();

        if (error || !order) {
            console.error('Order not found for failed payment');
            return;
        }

        // Actualitzar l'estat de la comanda
        await supabase
            .from('shop_orders')
            .update({
                payment_status: 'failed',
            })
            .eq('id', order.id);

        console.log(`Payment failed for order ${order.id}`);

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}
