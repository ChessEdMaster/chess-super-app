import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/product-card';
import { Product } from '@/lib/ecommerce-types';
import Link from 'next/link';

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
        <div className="min-h-screen bg-slate-950 py-8">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 mb-2">Productes</h1>
                        <p className="text-slate-400">
                            {products?.length || 0} productes trobats
                        </p>
                    </div>
                    <Link
                        href="/shop"
                        className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                        ← Tornar a la botiga
                    </Link>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sticky top-20">
                            <h2 className="text-lg font-bold text-slate-100 mb-4">Filtres</h2>

                            {/* Categories */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-300 mb-3">Categories</h3>
                                <div className="space-y-2">
                                    <Link
                                        href="/shop/products"
                                        className={`block text-sm py-1 transition-colors ${!searchParams.category
                                                ? 'text-emerald-400 font-medium'
                                                : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        Totes
                                    </Link>
                                    {categories?.map((category) => (
                                        <Link
                                            key={category.id}
                                            href={`/shop/products?category=${category.id}`}
                                            className={`block text-sm py-1 transition-colors ${searchParams.category === category.id
                                                    ? 'text-emerald-400 font-medium'
                                                    : 'text-slate-400 hover:text-slate-200'
                                                }`}
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Featured Filter */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-300 mb-3">Altres</h3>
                                <Link
                                    href="/shop/products?featured=true"
                                    className={`block text-sm py-1 transition-colors ${searchParams.featured === 'true'
                                            ? 'text-emerald-400 font-medium'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Només destacats
                                </Link>
                            </div>
                        </div>
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
                            <div className="text-center py-12">
                                <p className="text-slate-400 text-lg">No s'han trobat productes</p>
                                <Link
                                    href="/shop/products"
                                    className="text-emerald-400 hover:text-emerald-300 font-medium mt-4 inline-block"
                                >
                                    Veure tots els productes
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
