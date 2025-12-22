'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Crown, Tag } from 'lucide-react';
import { Product, formatPrice, calculateDiscount, getStockStatus } from '@/types/ecommerce';
import { useCartStore } from '@/lib/cart-store';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore(state => state.addItem);
    const isLoading = useCartStore(state => state.isLoading);

    const discount = calculateDiscount(product.price, product.sale_price);
    const stockStatus = getStockStatus(product.stock_quantity, product.low_stock_threshold);
    const currentPrice = product.sale_price || product.price;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await addItem(product.id, 1);
    };

    // Determine Rarity/Style based on price or features (Mock logic for visual flair)
    // In a real app, this could be a property of the product
    const isPremium = product.price > 50;
    const cardVariant = isPremium ? 'gold' : 'default';

    return (
        <Link
            href={`/shop/products/${product.slug}`}
            className="group block h-full"
        >
            <GameCard variant={cardVariant} className="h-full flex flex-col p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                {/* Image Section */}
                <div className="relative aspect-square bg-[var(--background)] border-b-4 border-[var(--border)] group-hover:border-transparent transition-colors">
                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] bg-[url('/patterns/grid.svg')]">
                            <ShoppingCart size={48} className="opacity-50" />
                        </div>
                    )}

                    {/* Overlays / Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        {discount > 0 && (
                            <span className="bg-red-500 border-2 border-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg transform -rotate-2 uppercase tracking-wide">
                                -{discount}% SALE
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="bg-amber-500 border-2 border-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg transform rotate-1 uppercase tracking-wide flex items-center gap-1">
                                <Crown size={10} /> Featured
                            </span>
                        )}
                    </div>

                    {stockStatus.status === 'out_of_stock' && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
                            <span className="text-white font-black text-xl uppercase tracking-widest border-4 border-white p-4 rotate-12">Sold Out</span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1 bg-[var(--card-bg)]/90 relative">
                    {/* Category Tag */}
                    {product.category && (
                        <div className="absolute -top-3 right-3 bg-[var(--panel-bg)] border border-[var(--border)] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-[var(--color-secondary)] shadow-sm z-10">
                            {product.category.name}
                        </div>
                    )}

                    <h3 className="font-bold text-[var(--foreground)] mb-1 line-clamp-2 text-sm uppercase tracking-wide group-hover:text-amber-400 transition-colors h-10 flex items-center">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={12}
                                className={star <= 4 ? 'fill-amber-400 text-amber-500' : 'fill-[var(--card-border)] text-[var(--color-muted)]'}
                            />
                        ))}
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-end justify-between mb-3">
                            <div className="flex flex-col">
                                {product.sale_price && (
                                    <span className="text-xs text-[var(--color-muted)] line-through font-bold decoration-red-500/50">
                                        {formatPrice(product.price)}
                                    </span>
                                )}
                                <span className={`text-xl font-black ${product.sale_price ? 'text-amber-400' : 'text-[var(--foreground)]'} font-mono`}>
                                    {formatPrice(currentPrice)}
                                </span>
                            </div>
                            {stockStatus.status !== 'out_of_stock' && stockStatus.status === 'low_stock' && (
                                <span className="text-[9px] text-orange-500 font-black uppercase animate-pulse">Low Stock!</span>
                            )}
                        </div>

                        <ShinyButton
                            variant={stockStatus.status === 'out_of_stock' ? 'neutral' : 'success'}
                            disabled={stockStatus.status === 'out_of_stock' || isLoading}
                            onClick={handleAddToCart}
                            className="w-full text-xs py-2 h-9"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ShoppingCart size={14} />
                                {stockStatus.status === 'out_of_stock' ? 'Sold Out' : 'Add to Cart'}
                            </div>
                        </ShinyButton>
                    </div>
                </div>
            </GameCard>
        </Link>
    );
}
