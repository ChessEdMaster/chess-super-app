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
        
        const { cartItems, shipping_address_id, customer_notes } = await req.json();

        // Obtenir l'usuari autenticat
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'No autenticat' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticat' },
                { status: 401 }
            );
        }

        // Validar que hi ha items
        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json(
                { error: 'La cistella està buida' },
                { status: 400 }
            );
        }

        // Obtenir informació dels productes
        const productIds = cartItems.map((item: any) => item.product_id);
        const { data: products, error: productsError } = await supabase
            .from('shop_products')
            .select('*')
            .in('id', productIds);

        if (productsError || !products) {
            return NextResponse.json(
                { error: 'Error obtenint productes' },
                { status: 500 }
            );
        }

        // Verificar estoc i calcular total
        let subtotal = 0;
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        for (const cartItem of cartItems) {
            const product = products.find((p: any) => p.id === cartItem.product_id);

            if (!product) {
                return NextResponse.json(
                    { error: `Producte ${cartItem.product_id} no trobat` },
                    { status: 400 }
                );
            }

            if (product.stock_quantity < cartItem.quantity) {
                return NextResponse.json(
                    { error: `Estoc insuficient per ${product.name}` },
                    { status: 400 }
                );
            }

            const price = product.sale_price || product.price;
            subtotal += price * cartItem.quantity;

            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product.name,
                        description: product.short_description || undefined,
                        images: product.images.length > 0 ? [product.images[0]] : undefined,
                    },
                    unit_amount: Math.round(price * 100), // Stripe usa cèntims
                },
                quantity: cartItem.quantity,
            });
        }

        // Obtenir adreça d'enviament
        const { data: address, error: addressError } = await supabase
            .from('shop_addresses')
            .select('*')
            .eq('id', shipping_address_id)
            .eq('user_id', user.id)
            .single();

        if (addressError || !address) {
            return NextResponse.json(
                { error: 'Adreça no vàlida' },
                { status: 400 }
            );
        }

        // Calcular enviament (simplificat - pots fer-ho més complex)
        const shipping_cost = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.21; // IVA 21%
        const total = subtotal + shipping_cost + tax;

        // Crear comanda a la base de dades amb estat "pending"
        const { data: order, error: orderError } = await supabase
            .from('shop_orders')
            .insert({
                user_id: user.id,
                status: 'pending',
                subtotal,
                shipping_cost,
                tax,
                total,
                shipping_full_name: address.full_name,
                shipping_phone: address.phone,
                shipping_address_line1: address.address_line1,
                shipping_address_line2: address.address_line2,
                shipping_city: address.city,
                shipping_state_province: address.state_province,
                shipping_postal_code: address.postal_code,
                shipping_country: address.country,
                customer_notes,
                payment_status: 'pending',
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Error creating order:', orderError);
            return NextResponse.json(
                { error: 'Error creant la comanda' },
                { status: 500 }
            );
        }

        // Crear items de la comanda
        const orderItems = cartItems.map((cartItem: any) => {
            const product = products.find((p: any) => p.id === cartItem.product_id)!;
            const price = product.sale_price || product.price;

            return {
                order_id: order.id,
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                product_image: product.images[0] || null,
                quantity: cartItem.quantity,
                unit_price: price,
                total_price: price * cartItem.quantity,
            };
        });

        const { error: itemsError } = await supabase
            .from('shop_order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Eliminar la comanda si no es poden crear els items
            await supabase.from('shop_orders').delete().eq('id', order.id);
            return NextResponse.json(
                { error: 'Error creant els items de la comanda' },
                { status: 500 }
            );
        }

        // Afegir línia d'enviament si cal
        if (shipping_cost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Enviament',
                    },
                    unit_amount: Math.round(shipping_cost * 100),
                },
                quantity: 1,
            });
        }

        // Crear sessió de Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/shop/orders/${order.id}?success=true`,
            cancel_url: `${req.headers.get('origin')}/shop/cart?cancelled=true`,
            customer_email: user.email,
            metadata: {
                order_id: order.id,
                user_id: user.id,
            },
        });

        // Actualitzar la comanda amb l'ID de la sessió de Stripe
        await supabase
            .from('shop_orders')
            .update({ stripe_checkout_session_id: session.id })
            .eq('id', order.id);

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Error intern del servidor' },
            { status: 500 }
        );
    }
}
