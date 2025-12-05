import Link from 'next/link';
import { ArrowRight, Crown, Grid3x3, Clock, Book, Laptop, GraduationCap, Shirt, ShoppingBag, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/shop/product-card';
import { Product } from '@/types/ecommerce';

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
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-emerald-900/20 via-slate-900 to-slate-950 border-b border-slate-800">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-bold text-slate-100 mb-6">
                            Botiga d'Escacs
                            <span className="block text-emerald-400 mt-2">Tot el que necessites</span>
                        </h1>
                        <p className="text-lg text-slate-300 mb-8">
                            Descobreix la nostra selecció de taulers, peces, rellotges, llibres, software, cursos i molt més.
                            Productes de qualitat per a jugadors de tots els nivells.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/shop/products"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                            >
                                Veure tots els productes
                                <ArrowRight size={20} />
                            </Link>
                            <Link
                                href="/shop/products?featured=true"
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-8 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Productes destacats
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-slate-100 mb-8">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categories?.map((category) => {
                        const IconComponent = categoryIcons[category.icon || 'ShoppingBag'];
                        return (
                            <Link
                                key={category.id}
                                href={`/shop/products?category=${category.id}`}
                                className="group bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                                        {IconComponent && <IconComponent size={32} className="text-emerald-400" />}
                                    </div>
                                    <h3 className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                                        {category.name}
                                    </h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Featured Products */}
            {featuredProducts && featuredProducts.length > 0 && (
                <section className="container mx-auto px-4 py-16 bg-slate-900/30">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-100">Productes Destacats</h2>
                        <Link
                            href="/shop/products?featured=true"
                            className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-2"
                        >
                            Veure tots
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product as Product} />
                        ))}
                    </div>
                </section>
            )}

            {/* New Arrivals */}
            {newProducts && newProducts.length > 0 && (
                <section className="container mx-auto px-4 py-16">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-100">Novetats</h2>
                        <Link
                            href="/shop/products"
                            className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-2"
                        >
                            Veure tots
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {newProducts.map((product) => (
                            <ProductCard key={product.id} product={product as Product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Benefits Section */}
            <section className="container mx-auto px-4 py-16 bg-slate-900/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">Enviament Gratuït</h3>
                        <p className="text-slate-400">En comandes superiors a 50€</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Crown size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">Qualitat Premium</h3>
                        <p className="text-slate-400">Productes seleccionats amb cura</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-2">Enviament Ràpid</h3>
                        <p className="text-slate-400">Entrega en 24-48 hores</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

