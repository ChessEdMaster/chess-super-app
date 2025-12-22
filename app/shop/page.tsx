import Link from 'next/link';
import { ArrowRight, Crown, Grid3x3, Clock, Book, Laptop, GraduationCap, Shirt, ShoppingBag, Pencil, Coins, Gem, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/product-card';
import { Product } from '@/types/ecommerce';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

const categoryIcons: Record<string, any> = {
    'Grid3x3': Grid3x3,
    'Crown': Crown,
    'Clock': Clock,
    'Book': Book,
    'Laptop': Laptop,
    'GraduationCap': GraduationCap,
    'Shirt': Shirt,
    'ShoppingBag': ShoppingBag,
    'Pencil': Pencil,
};

export default async function ShopPage() {
    // Fetch categories
    const { data: categories } = await supabase
        .from('shop_categories')
        .select('*')
        .order('order');

    // Fetch featured products
    const { data: featuredProducts } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(8);

    // Fetch new arrivals
    const { data: newProducts } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24 font-sans">
            {/* Hero Section */}
            <section className="relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 via-[var(--background)] to-[var(--background)] z-0"></div>
                <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10 z-0 animate-pulse-slow"></div>

                <div className="container mx-auto px-4 pt-12 pb-8 relative z-10 flex flex-col items-center text-center">
                    <div className="mb-4 animate-bounce-slow">
                        <ShoppingBag size={64} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-[var(--foreground)] font-display text-stroke shadow-black drop-shadow-xl mb-4">
                        Royal Store
                    </h1>
                    <p className="text-[var(--color-secondary)] text-lg md:text-xl font-bold max-w-2xl mx-auto mb-8 leading-relaxed text-shadow-sm">
                        Upgrade your arsenal with premium boards, pieces, and exclusive content.
                        <span className="block text-emerald-400 mt-2">Dominate the arena in style!</span>
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/shop/products">
                            <ShinyButton variant="success" className="px-8 py-4 text-lg">
                                <Sparkles className="mr-2 animate-pulse" /> Shop Now
                            </ShinyButton>
                        </Link>
                        <Link href="/shop/products?featured=true">
                            <ShinyButton variant="secondary" className="px-8 py-4 text-lg">
                                <Crown className="mr-2" /> Featured
                            </ShinyButton>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Daily Deals / Featured */}
            {featuredProducts && featuredProducts.length > 0 && (
                <section className="container mx-auto px-4 py-8">
                    <Panel className="p-6 md:p-8 bg-gradient-to-br from-indigo-900/50 to-[var(--card-bg)]/50 border-indigo-500/30">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-amber-400 animate-spin-slow" size={32} />
                                <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-wide font-display text-stroke">Daily Deals</h2>
                            </div>
                            <div className="flex items-center gap-2 bg-[var(--background)]/40 px-4 py-2 rounded-full border border-[var(--border)]">
                                <Clock size={16} className="text-amber-500" />
                                <span className="text-amber-500 font-black uppercase tracking-widest text-xs">Ends in 08:42:15</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <div key={product.id} className="transform hover:scale-105 transition-transform duration-300">
                                    <ProductCard product={product as Product} />
                                </div>
                            ))}
                        </div>
                    </Panel>
                </section>
            )}

            {/* Categories */}
            <section className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <Grid3x3 className="text-[var(--color-secondary)]" size={24} />
                    <h2 className="text-xl font-black text-[var(--color-secondary)] uppercase tracking-widest font-display">Categories</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categories?.map((category) => {
                        const IconComponent = categoryIcons[category.icon || 'ShoppingBag'];
                        return (
                            <Link
                                key={category.id}
                                href={`/shop/products?category=${category.id}`}
                                className="group"
                            >
                                <GameCard variant="default" className="p-6 flex flex-col items-center justify-center gap-4 h-full hover:bg-[var(--card-bg)] transition-colors border-[var(--border)] hover:border-emerald-500/50 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                                    <div className="p-4 rounded-2xl bg-[var(--panel-bg)] border border-[var(--border)] group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:border-emerald-500/30">
                                        {IconComponent && <IconComponent size={32} className="text-[var(--color-secondary)] group-hover:text-emerald-400 transition-colors" />}
                                    </div>
                                    <h3 className="font-bold text-[var(--color-secondary)] uppercase tracking-wide text-sm group-hover:text-[var(--foreground)] text-center">
                                        {category.name}
                                    </h3>
                                </GameCard>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* New Arrivals */}
            {newProducts && newProducts.length > 0 && (
                <section className="container mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <Crown className="text-purple-400" size={24} />
                            <h2 className="text-xl font-black text-[var(--color-secondary)] uppercase tracking-widest font-display">New Arrivals</h2>
                        </div>
                        <Link href="/shop/products">
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1">
                                View All <ArrowRight size={12} />
                            </span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {newProducts.map((product) => (
                            <ProductCard key={product.id} product={product as Product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Value Props / Secure Banner */}
            <section className="container mx-auto px-4 py-12">
                <GameCard variant="default" className="p-8 bg-[var(--card-bg)]/50 border-dashed border-[var(--border)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
                        <div className="text-center px-4 pt-4 md:pt-0">
                            <ShoppingBag size={40} className="text-emerald-500 mx-auto mb-4 drop-shadow-md" />
                            <h3 className="font-black text-[var(--foreground)] uppercase tracking-wide mb-2">Free Shipping</h3>
                            <p className="text-[var(--color-muted)] text-sm font-bold">On all orders over 50€</p>
                        </div>
                        <div className="text-center px-4 pt-8 md:pt-0">
                            <Crown size={40} className="text-amber-500 mx-auto mb-4 drop-shadow-md" />
                            <h3 className="font-black text-[var(--foreground)] uppercase tracking-wide mb-2">Premium Quality</h3>
                            <p className="text-[var(--color-muted)] text-sm font-bold">Grandmaster approved gear</p>
                        </div>
                        <div className="text-center px-4 pt-8 md:pt-0">
                            <Clock size={40} className="text-blue-500 mx-auto mb-4 drop-shadow-md" />
                            <h3 className="font-black text-[var(--foreground)] uppercase tracking-wide mb-2">Fast Delivery</h3>
                            <p className="text-[var(--color-muted)] text-sm font-bold">24-48h Express Shipping</p>
                        </div>
                    </div>
                </GameCard>
            </section>
        </div>
    );
}
