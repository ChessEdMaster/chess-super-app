'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/types/ecommerce';
import { Loader2, CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

interface Order {
    id: string;
    total: number;
    subtotal: number;
    tax: number;
    shipping_cost: number;
    status: string;
    created_at: string;
    shipping_address_line1: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    items: {
        id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        product_image: string | null;
    }[];
}

export default function OrderPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.id as string;
    const isSuccess = searchParams.get('success') === 'true';

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const clearCart = useCartStore(state => state.clearCart);

    useEffect(() => {
        if (isSuccess) {
            clearCart();
        }
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            // Fetch order
            const { data: orderData, error: orderError } = await supabase
                .from('shop_orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;

            // Fetch items
            const { data: itemsData, error: itemsError } = await supabase
                .from('shop_order_items')
                .select('*')
                .eq('order_id', orderId);

            if (itemsError) throw itemsError;

            setOrder({ ...orderData, items: itemsData });
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
                <h1 className="text-2xl font-bold mb-4">Comanda no trobada</h1>
                <Link href="/shop" className="text-emerald-400 hover:text-emerald-300">
                    Tornar a la botiga
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-3xl">

                {isSuccess && (
                    <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-lg p-8 text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-emerald-400 mb-2">Gràcies per la teva compra!</h1>
                        <p className="text-emerald-200/80">
                            La teva comanda ha estat confirmada i està sent processada.
                        </p>
                    </div>
                )}

                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Comanda #{order.id.slice(0, 8)}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-200 font-medium">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-slate-700 text-slate-300'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-emerald-400">{formatPrice(order.total)}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <Package size={20} className="text-emerald-500" />
                            Productes
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                        {item.product_image && (
                                            <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-200 truncate">{item.product_name}</p>
                                        <p className="text-sm text-slate-500">Qt: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-slate-300">
                                        {formatPrice(item.unit_price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping & Payment Info */}
                    <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-900/50">
                        <div>
                            <h3 className="font-semibold text-slate-200 mb-3">Enviament a</h3>
                            <address className="not-italic text-slate-400 text-sm leading-relaxed">
                                {order.shipping_address_line1}<br />
                                {order.shipping_city}, {order.shipping_postal_code}<br />
                                {order.shipping_country}
                            </address>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-200 mb-3">Resum de costos</h3>
                            <div className="space-y-2 text-sm text-slate-400">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Enviament</span>
                                    <span>{order.shipping_cost === 0 ? 'Gratuït' : formatPrice(order.shipping_cost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>IVA</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-200 pt-2 border-t border-slate-800">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <Link
                        href="/shop"
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
                    >
                        <ArrowRight size={20} className="rotate-180" />
                        Tornar a la Botiga
                    </Link>
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <Home size={20} />
                        El meu Perfil
                    </Link>
                </div>
            </div>
        </div>
    );
}
