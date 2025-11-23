import { create } from 'zustand';
import { supabase } from './supabase';
import { CartItem, Product } from './ecommerce-types';
import toast from 'react-hot-toast';

interface CartState {
    items: (CartItem & { product?: Product })[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addItem: (productId: string, quantity?: number) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    loadCart: (userId?: string) => Promise<void>;

    // Computed getters
    get itemCount(): number;
    get subtotal(): number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },

    get subtotal() {
        return get().items.reduce((sum, item) => {
            const price = item.product?.sale_price || item.product?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    },

    loadCart: async (userId?: string) => {
        set({ isLoading: true, error: null });

        try {
            // Si no hi ha userId, intentem obtenir l'usuari actual
            let currentUserId = userId;

            if (!currentUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Usuari no autenticat, carrega del localStorage
                    const localCart = localStorage.getItem('cart');
                    if (localCart) {
                        const items = JSON.parse(localCart);
                        set({ items, isLoading: false });
                    } else {
                        set({ items: [], isLoading: false });
                    }
                    return;
                }
                currentUserId = user.id;
            }

            // Carrega la cistella de Supabase
            const { data: cartItems, error } = await supabase
                .from('shop_cart_items')
                .select(`
          *,
          product:shop_products(*)
        `)
                .eq('user_id', currentUserId);

            if (error) throw error;

            set({ items: cartItems || [], isLoading: false });

        } catch (error: any) {
            console.error('Error loading cart:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addItem: async (productId: string, quantity: number = 1) => {
        set({ isLoading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Usuari no autenticat: guarda al localStorage
                const items = get().items;
                const existingItem = items.find(item => item.product_id === productId);

                if (existingItem) {
                    // Actualitza quantitat
                    const updatedItems = items.map(item =>
                        item.product_id === productId
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                    set({ items: updatedItems, isLoading: false });
                    localStorage.setItem('cart', JSON.stringify(updatedItems));
                } else {
                    // Afegeix nou item
                    const { data: product } = await supabase
                        .from('shop_products')
                        .select('*')
                        .eq('id', productId)
                        .single();

                    if (!product) throw new Error('Producte no trobat');

                    const newItem: CartItem & { product: Product } = {
                        id: `temp-${Date.now()}`,
                        user_id: 'guest',
                        product_id: productId,
                        quantity,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        product,
                    };

                    const updatedItems = [...items, newItem];
                    set({ items: updatedItems, isLoading: false });
                    localStorage.setItem('cart', JSON.stringify(updatedItems));
                }

                toast.success('Producte afegit a la cistella');
                return;
            }

            // Usuari autenticat: guarda a Supabase
            const existingItem = get().items.find(item => item.product_id === productId);

            if (existingItem) {
                // Actualitza quantitat
                const { error } = await supabase
                    .from('shop_cart_items')
                    .update({ quantity: existingItem.quantity + quantity })
                    .eq('id', existingItem.id);

                if (error) throw error;
            } else {
                // Afegeix nou item
                const { error } = await supabase
                    .from('shop_cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId,
                        quantity,
                    });

                if (error) throw error;
            }

            // Recarrega la cistella
            await get().loadCart(user.id);
            toast.success('Producte afegit a la cistella');

        } catch (error: any) {
            console.error('Error adding to cart:', error);
            set({ error: error.message, isLoading: false });
            toast.error('Error afegint el producte');
        }
    },

    removeItem: async (productId: string) => {
        set({ isLoading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Usuari no autenticat
                const items = get().items.filter(item => item.product_id !== productId);
                set({ items, isLoading: false });
                localStorage.setItem('cart', JSON.stringify(items));
                toast.success('Producte eliminat');
                return;
            }

            // Usuari autenticat
            const { error } = await supabase
                .from('shop_cart_items')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;

            await get().loadCart(user.id);
            toast.success('Producte eliminat');

        } catch (error: any) {
            console.error('Error removing from cart:', error);
            set({ error: error.message, isLoading: false });
            toast.error('Error eliminant el producte');
        }
    },

    updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            await get().removeItem(productId);
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Usuari no autenticat
                const items = get().items.map(item =>
                    item.product_id === productId
                        ? { ...item, quantity }
                        : item
                );
                set({ items, isLoading: false });
                localStorage.setItem('cart', JSON.stringify(items));
                return;
            }

            // Usuari autenticat
            const { error } = await supabase
                .from('shop_cart_items')
                .update({ quantity })
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;

            await get().loadCart(user.id);

        } catch (error: any) {
            console.error('Error updating quantity:', error);
            set({ error: error.message, isLoading: false });
            toast.error('Error actualitzant la quantitat');
        }
    },

    clearCart: async () => {
        set({ isLoading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Usuari no autenticat
                set({ items: [], isLoading: false });
                localStorage.removeItem('cart');
                return;
            }

            // Usuari autenticat
            const { error } = await supabase
                .from('shop_cart_items')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            set({ items: [], isLoading: false });

        } catch (error: any) {
            console.error('Error clearing cart:', error);
            set({ error: error.message, isLoading: false });
        }
    },
}));
