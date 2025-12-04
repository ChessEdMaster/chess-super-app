'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/types/ecommerce';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const router = useRouter();
    const items = useCartStore(state => state.items);
    const isLoading = useCartStore(state => state.isLoading);
    const subtotal = useCartStore(state => state.subtotal);
    const updateQuantity = useCartStore(state => state.updateQuantity);
    const removeItem = useCartStore(state => state.removeItem);
    const loadCart = useCartStore(state => state.loadCart);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const shippingCost = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.21;
    const total = subtotal + shippingCost + tax;

    if (items.length === 0 && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <ShoppingBag size={64} className="mx-auto mb-4 text-slate-600" />
                    <h1 className="text-2xl font-bold text-slate-200 mb-2">La teva cistella està buida</h1>
                    <p className="text-slate-400 mb-6">Afegeix alguns productes per començar</p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Anar a la botiga
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-bold text-slate-100 mb-8">Cistella de Compra</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => {
                            const product = item.product;
                            if (!product) return null;

                            const price = product.sale_price || product.price;

                            return (
                                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex gap-4">
                                    {/* Image */}
                                    <div className="w-24 h-24 bg-slate-800 rounded flex-shrink-0">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag size={32} className="text-slate-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/shop/products/${product.slug}`}
                                            className="font-semibold text-slate-200 hover:text-emerald-400 transition-colors block mb-1"
                                        >
                                            {product.name}
                                        </Link>
                                        {product.category && (
                                            <p className="text-xs text-slate-400 mb-2">{product.category.name}</p>
                                        )}
                                        <p className="text-lg font-bold text-emerald-400">{formatPrice(price)}</p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-end gap-3">
                                        <button
                                            onClick={() => removeItem(product.id)}
                                            className="text-slate-400 hover:text-red-400 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={20} />
                                        </button>

                                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(product.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                className="p-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-12 text-center font-medium text-slate-200">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(product.id, item.quantity + 1)}
                                                disabled={item.quantity >= product.stock_quantity}
                                                className="p-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <p className="text-sm font-semibold text-slate-300">
                                            {formatPrice(price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sticky top-20">
                            <h2 className="text-xl font-bold text-slate-100 mb-4">Resum de la Comanda</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-300">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Enviament:</span>
                                    <span className="font-semibold">
                                        {shippingCost === 0 ? 'Gratuït' : formatPrice(shippingCost)}
                                    </span>
                                </div>
                                {shippingCost > 0 && (
                                    <p className="text-xs text-emerald-400">
                                        Enviament gratuït en comandes superiors a 50€
                                    </p>
                                )}
                                <div className="flex justify-between text-slate-300">
                                    <span>IVA (21%):</span>
                                    <span className="font-semibold">{formatPrice(tax)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-3 flex justify-between text-lg font-bold">
                                    <span className="text-slate-100">Total:</span>
                                    <span className="text-emerald-400">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/shop/checkout')}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mb-3"
                            >
                                Procedir al Pagament
                                <ArrowRight size={20} />
                            </button>

                            <Link
                                href="/shop"
                                className="block text-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            >
                                Continuar comprant
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

