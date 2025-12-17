'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { Product, StockStatus } from '@/types/ecommerce';
import { useCartStore } from '@/lib/cart-store';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { toast } from 'sonner';

interface AddToCartProps {
    product: Product;
    stockStatus: StockStatus;
    maxQuantity: number;
}

export function AddToCart({ product, stockStatus, maxQuantity }: AddToCartProps) {
    const [quantity, setQuantity] = useState(1);
    const addItem = useCartStore(state => state.addItem);
    const isLoading = useCartStore(state => state.isLoading);

    const handleAddToCart = async () => {
        if (stockStatus.status === 'out_of_stock') return;

        try {
            await addItem(product.id, quantity);
            toast.success(`Added ${quantity} x ${product.name} to cart!`);
        } catch (error) {
            toast.error("Failed to add to cart");
        }
    };

    const isOutOfStock = stockStatus.status === 'out_of_stock';

    return (
        <div className="flex flex-col gap-4">
            {!isOutOfStock && (
                <div className="flex items-center gap-4 bg-zinc-950 p-2 rounded-xl border border-zinc-800 w-fit">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        disabled={quantity <= 1}
                    >
                        <Minus size={16} />
                    </button>
                    <span className="font-black text-white w-8 text-center text-lg font-mono">{quantity}</span>
                    <button
                        onClick={() => setQuantity(Math.min(maxQuantity || 99, quantity + 1))}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        disabled={quantity >= (maxQuantity || 99)}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}

            <ShinyButton
                variant={isOutOfStock ? 'neutral' : 'success'}
                disabled={isOutOfStock || isLoading}
                onClick={handleAddToCart}
                className="w-full py-4 text-base"
            >
                <div className="flex items-center justify-center gap-3">
                    {isLoading ? <Loader2 className="animate-spin" /> : <ShoppingCart size={20} />}
                    <span className="font-bold uppercase tracking-wider">
                        {isOutOfStock ? 'Sold Out' : `Add to Cart - ${(quantity * (product.sale_price || product.price)).toFixed(2)}€`}
                    </span>
                </div>
            </ShinyButton>
        </div>
    );
}
