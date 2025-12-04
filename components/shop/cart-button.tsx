'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/types/ecommerce';
import { useEffect, useState } from 'react';

export function CartButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const items = useCartStore(state => state.items);
    const itemCount = useCartStore(state => state.itemCount);
    const subtotal = useCartStore(state => state.subtotal);
    const removeItem = useCartStore(state => state.removeItem);
    const loadCart = useCartStore(state => state.loadCart);

    useEffect(() => {
        setMounted(true);
        loadCart();
    }, [loadCart]);

    if (!mounted) {
        return (
            <button className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors">
                <ShoppingCart size={24} />
            </button>
        );
    }

    return (
        <div className="relative">
            {/* Cart Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors"
            >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {itemCount}
                    </span>
                )}
            </button>

            {/* Dropdown Mini Cart */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                        {items.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                <p>La teva cistella està buida</p>
                            </div>
                        ) : (
                            <>
                                {/* Items List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3 bg-slate-800/50 p-2 rounded">
                                            {/* Image */}
                                            <div className="w-16 h-16 bg-slate-700 rounded flex-shrink-0 relative overflow-hidden">
                                                {item.product?.images && item.product.images.length > 0 ? (
                                                    <Image
                                                        src={item.product.images[0]}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover rounded"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingCart size={24} className="text-slate-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-200 truncate">
                                                    {item.product?.name}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    Quantitat: {item.quantity}
                                                </p>
                                                <p className="text-sm font-semibold text-emerald-400">
                                                    {formatPrice((item.product?.sale_price || item.product?.price || 0) * item.quantity)}
                                                </p>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeItem(item.product_id)}
                                                className="text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-slate-800 p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Subtotal:</span>
                                        <span className="font-semibold text-emerald-400">{formatPrice(subtotal)}</span>
                                    </div>

                                    <Link
                                        href="/shop/cart"
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        Veure cistella
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

