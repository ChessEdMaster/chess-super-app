import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/product-card';
import { Product } from '@/types/ecommerce';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Filter, Sparkles } from 'lucide-react';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

interface SearchParams {
    category?: string;
    search?: string;
    featured?: string;
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    // Build query
    let query = supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('is_active', true);

    // Apply filters
    if (searchParams.category) {
        query = query.eq('category_id', searchParams.category);
    }

    if (searchParams.search) {
        query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`);
    }

    if (searchParams.featured === 'true') {
        query = query.eq('is_featured', true);
    }

    // Fetch products
    const { data: products } = await query.order('created_at', { ascending: false });

    // Fetch categories for filter
    const { data: categories } = await supabase
        .from('shop_categories')
        .select('*')
        .order('order');

    return (
        <div className="min-h-screen bg-zinc-950 pb-24 font-sans">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20 shadow-lg">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/shop" className="text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-xl font-black text-white uppercase tracking-wide font-display text-stroke flex items-center gap-2">
                            <ShoppingBag className="text-emerald-400" size={20} />
                            Royal Market
                        </h1>
                    </div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {products?.length || 0} Items Found
                    </span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:col-span-1">
                        <Panel className="p-4 sticky top-24">
                            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Filter size={14} /> Filters
                            </h2>

                            {/* Categories */}
                            <div className="mb-6 space-y-1">
                                <Link href="/shop/products">
                                    <div className={`p-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center justify-between ${!searchParams.category ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                                        All Items
                                    </div>
                                </Link>
                                {categories?.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/shop/products?category=${category.id}`}
                                    >
                                        <div className={`p-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center justify-between ${searchParams.category === category.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                                            {category.name}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Featured Filter */}
                            <div>
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 border-t border-zinc-700 pt-4">Special</h3>
                                <Link
                                    href="/shop/products?featured=true"
                                >
                                    <div className={`p-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-2 ${searchParams.featured === 'true' ? 'bg-amber-600 text-white shadow-lg' : 'text-amber-500 hover:bg-zinc-800'}`}>
                                        <Sparkles size={16} /> Featured Only
                                    </div>
                                </Link>
                            </div>
                        </Panel>
                    </div>

                    {/* Products Grid */}
                    <div className="lg:col-span-3">
                        {products && products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product as Product} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
                                <ShoppingBag size={64} className="text-zinc-600 mb-4" />
                                <p className="text-zinc-400 text-xl font-black uppercase tracking-wide">No items found</p>
                                <Link href="/shop/products" className="mt-4">
                                    <ShinyButton variant="neutral">Reset Filters</ShinyButton>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
