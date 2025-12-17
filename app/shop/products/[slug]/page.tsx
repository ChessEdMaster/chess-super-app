import { supabase } from '@/lib/supabase';
import { Product } from '@/types/ecommerce';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Star, Crown, Truck, ShieldCheck, Gamepad2, Heart, Share2, Sparkles } from 'lucide-react';
import { formatPrice, calculateDiscount, getStockStatus } from '@/types/ecommerce';

import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { AddToCart } from '@/components/shop/add-to-cart'; // I'll create this client component

export default async function ProductPage({ params }: { params: { slug: string } }) {
    const { data: product } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('slug', params.slug)
        .single();

    if (!product) {
        notFound();
    }

    const { data: relatedProducts } = await supabase
        .from('shop_products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(4);

    const discount = calculateDiscount(product.price, product.sale_price);
    const stockStatus = getStockStatus(product.stock_quantity, product.low_stock_threshold);
    const currentPrice = product.sale_price || product.price;

    return (
        <div className="min-h-screen bg-zinc-950 pb-24 font-sans">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20 shadow-lg">
                <div className="container mx-auto flex items-center gap-4">
                    <Link href="/shop/products" className="text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-lg font-bold text-zinc-300 uppercase tracking-wide truncate">
                        {product.name}
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-zinc-800 bg-zinc-900 shadow-2xl">
                            {product.images && product.images.length > 0 ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover hover:scale-110 transition-transform duration-700"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-[url('/patterns/grid.svg')]">
                                    <ShoppingCart size={64} className="opacity-50" />
                                </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {discount > 0 && (
                                    <span className="bg-red-500 border-2 border-red-700 text-white text-xs font-black px-3 py-1 rounded-lg shadow-xl shadow-black/50 transform -rotate-3 uppercase tracking-wide animate-bounce-slow">
                                        Save {discount}%
                                    </span>
                                )}
                                {product.is_featured && (
                                    <span className="bg-amber-500 border-2 border-amber-700 text-white text-xs font-black px-3 py-1 rounded-lg shadow-xl shadow-black/50 transform rotate-2 uppercase tracking-wide flex items-center gap-1">
                                        <Crown size={12} /> Royal Choice
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails (Mockup if multiple images existed) */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img: string, i: number) => (
                                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-zinc-700 cursor-pointer hover:border-emerald-500 transition-colors shrink-0">
                                        <Image src={img} alt={`${product.name} ${i}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            {product.category && (
                                <Link href={`/shop/products?category=${product.category.id}`} className="inline-block mb-2">
                                    <span className="text-emerald-400 text-xs font-black tracking-widest hover:underline">
                                        {product.category.name}
                                    </span>
                                </Link>
                            )}
                            <h1 className="text-3xl lg:text-4xl font-black text-white font-display text-stroke shadow-black drop-shadow-lg mb-2 leading-tight">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={16} className="fill-amber-400 text-amber-500" />
                                    ))}
                                    <span className="text-sm font-bold text-zinc-400 ml-2">(4.8/5)</span>
                                </div>
                                <div className="h-4 w-px bg-zinc-700"></div>
                                <span className={`text-sm font-black tracking-wide ${stockStatus.color}`}>
                                    {stockStatus.label}
                                </span>
                            </div>

                            {/* Price Card */}
                            <GameCard variant="default" className="p-6 mb-8 bg-zinc-900/50 border-indigo-500/20">
                                <div className="flex items-end gap-3 mb-6">
                                    <span className="text-4xl font-black text-amber-400 font-mono text-shadow-glow">
                                        {formatPrice(currentPrice)}
                                    </span>
                                    {product.sale_price && (
                                        <span className="text-lg text-zinc-500 line-through font-bold mb-1 decoration-red-500/50">
                                            {formatPrice(product.price)}
                                        </span>
                                    )}
                                </div>

                                <AddToCart product={product} stockStatus={stockStatus} maxQuantity={product.stock_quantity} />

                                <div className="mt-4 flex items-center justify-center gap-4 text-zinc-500">
                                    <button className="flex items-center gap-2 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                                        <Heart size={16} /> Wishlist
                                    </button>
                                    <button className="flex items-center gap-2 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                                        <Share2 size={16} /> Share
                                    </button>
                                </div>
                            </GameCard>

                            {/* Description */}
                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-lg font-black text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <Sparkles size={18} className="text-indigo-400" /> Description
                                </h3>
                                <p className="text-zinc-400 leading-relaxed font-medium bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                                    {product.description || "No description available for this item."}
                                </p>
                            </div>

                            {/* Features / Benefits */}
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <Truck className="text-emerald-400" size={20} />
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase">Fast Shipping</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">Worldwide delivery</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <ShieldCheck className="text-blue-400" size={20} />
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase">Secure Payment</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">Encrypted transactions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
