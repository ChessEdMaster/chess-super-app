'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { Product, formatPrice, calculateDiscount, getStockStatus } from '@/lib/ecommerce-types';
import { useCartStore } from '@/lib/cart-store';

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

    return (
        <Link
            href={`/shop/products/${product.slug}`}
            className="group block bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
        >
            {/* Image */}
            <div className="relative aspect-square bg-slate-800 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ShoppingCart size={48} />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {discount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{discount}%
                        </span>
                    )}
                    {product.is_featured && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Destacat
                        </span>
                    )}
                </div>

                {stockStatus.status === 'out_of_stock' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Esgotat</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Category */}
                {product.category && (
                    <p className="text-xs text-emerald-400 mb-1">{product.category.name}</p>
                )}

                {/* Title */}
                <h3 className="font-semibold text-slate-200 mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {product.name}
                </h3>

                {/* Rating (placeholder - you can implement real ratings) */}
                <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={14}
                            className={star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                        />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">(4.0)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-emerald-400">
                        {formatPrice(currentPrice)}
                    </span>
                    {product.sale_price && (
                        <span className="text-sm text-slate-500 line-through">
                            {formatPrice(product.price)}
                        </span>
                    )}
                </div>

                {/* Stock Status */}
                <p className={`text-xs mb-3 ${stockStatus.color}`}>
                    {stockStatus.label}
                </p>

                {/* Add to Cart Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={stockStatus.status === 'out_of_stock' || isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <ShoppingCart size={18} />
                    {stockStatus.status === 'out_of_stock' ? 'Esgotat' : 'Afegir a la cistella'}
                </button>
            </div>
        </Link>
    );
}
