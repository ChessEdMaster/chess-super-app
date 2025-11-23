import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Paràmetres de filtre
        const category = searchParams.get('category');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const search = searchParams.get('search');
        const featured = searchParams.get('featured');
        const inStock = searchParams.get('inStock');

        // Paràmetres d'ordenació
        const sortField = searchParams.get('sortField') || 'created_at';
        const sortDirection = searchParams.get('sortDirection') || 'desc';

        // Paràmetres de paginació
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        // Construir la query
        let query = supabase
            .from('shop_products')
            .select('*, category:shop_categories(*)', { count: 'exact' })
            .eq('is_active', true);

        // Aplicar filtres
        if (category) {
            query = query.eq('category_id', category);
        }

        if (minPrice) {
            query = query.gte('price', parseFloat(minPrice));
        }

        if (maxPrice) {
            query = query.lte('price', parseFloat(maxPrice));
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }

        if (inStock === 'true') {
            query = query.gt('stock_quantity', 0);
        }

        // Aplicar ordenació
        const ascending = sortDirection === 'asc';
        query = query.order(sortField, { ascending });

        // Aplicar paginació
        query = query.range(offset, offset + limit - 1);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json(
                { error: 'Error obtenint productes' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: products || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });

    } catch (error: any) {
        console.error('Products API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
