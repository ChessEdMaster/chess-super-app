// ============================================
// E-COMMERCE TYPE DEFINITIONS
// ============================================

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    image_url: string | null;
    order: number;
    created_at: string;
}

export interface Product {
    id: string;
    category_id: string | null;
    name: string;
    slug: string;
    description: string;
    short_description: string | null;
    price: number;
    sale_price: number | null;
    sku: string | null;
    images: string[];
    specifications: Record<string, unknown>;
    stock_quantity: number;
    low_stock_threshold: number;
    is_active: boolean;
    is_featured: boolean;
    weight: number | null;
    meta_title: string | null;
    meta_description: string | null;
    created_at: string;
    updated_at: string;

    // Relations (populated when joined)
    category?: Category;
    average_rating?: number;
    review_count?: number;
}

export interface InventoryStatus {
    id: string;
    product_id: string;
    quantity_available: number;
    quantity_reserved: number;
    last_restocked_at: string | null;
    updated_at: string;
}

export interface CartItem {
    id: string;
    user_id: string;
    product_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;

    // Relations
    product?: Product;
}

export interface Address {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state_province: string | null;
    postal_code: string;
    country: string;
    is_default: boolean;
    created_at: string;
}

export type OrderStatus =
    | 'pending'
    | 'paid'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export type PaymentStatus =
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded';

export interface Order {
    id: string;
    order_number: string;
    user_id: string | null;
    status: OrderStatus;

    // Pricing
    subtotal: number;
    shipping_cost: number;
    tax: number;
    total: number;

    // Shipping address
    shipping_full_name: string;
    shipping_phone: string;
    shipping_address_line1: string;
    shipping_address_line2: string | null;
    shipping_city: string;
    shipping_state_province: string | null;
    shipping_postal_code: string;
    shipping_country: string;

    // Payment
    stripe_checkout_session_id: string | null;
    stripe_payment_intent_id: string | null;
    payment_status: PaymentStatus;
    paid_at: string | null;

    // Tracking
    tracking_number: string | null;
    shipped_at: string | null;
    delivered_at: string | null;

    // Notes
    customer_notes: string | null;
    admin_notes: string | null;

    created_at: string;
    updated_at: string;

    // Relations
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;

    // Product snapshot
    product_name: string;
    product_sku: string | null;
    product_image: string | null;

    quantity: number;
    unit_price: number;
    total_price: number;

    created_at: string;
}

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    order_id: string | null;

    rating: number;
    title: string | null;
    comment: string | null;
    is_verified_purchase: boolean;
    is_approved: boolean;

    created_at: string;
    updated_at: string;

    // Relations (when populated)
    user_email?: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
    featured?: boolean;
}

export interface ProductSort {
    field: 'price' | 'created_at' | 'name';
    direction: 'asc' | 'desc';
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CheckoutSessionRequest {
    cartItems: {
        product_id: string;
        quantity: number;
    }[];
    shipping_address_id: string;
    customer_notes?: string;
}

export interface CheckoutSessionResponse {
    sessionId: string;
    url: string;
}

// ============================================
// CART STORE TYPES
// ============================================

export interface CartState {
    items: CartItem[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addItem: (productId: string, quantity?: number) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    loadCart: (userId?: string) => Promise<void>;

    // Computed
    itemCount: number;
    subtotal: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface OrderStatusInfo {
    label: string;
    color: string;
    icon: string;
}

export const ORDER_STATUS_INFO: Record<OrderStatus, OrderStatusInfo> = {
    pending: { label: 'Pendent', color: 'text-yellow-500', icon: 'Clock' },
    paid: { label: 'Pagat', color: 'text-green-500', icon: 'CheckCircle' },
    processing: { label: 'Processant', color: 'text-blue-500', icon: 'Package' },
    shipped: { label: 'Enviat', color: 'text-purple-500', icon: 'Truck' },
    delivered: { label: 'Entregat', color: 'text-green-600', icon: 'Home' },
    cancelled: { label: 'Cancel·lat', color: 'text-red-500', icon: 'XCircle' },
    refunded: { label: 'Reemborsat', color: 'text-gray-500', icon: 'RotateCcw' },
};

export function formatPrice(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('ca-ES', {
        style: 'currency',
        currency,
    }).format(amount);
}

export function calculateDiscount(price: number, salePrice: number | null): number {
    if (!salePrice || salePrice >= price) return 0;
    return Math.round(((price - salePrice) / price) * 100);
}

export function getStockStatus(quantity: number, threshold: number): {
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    label: string;
    color: string;
} {
    if (quantity === 0) {
        return { status: 'out_of_stock', label: 'Esgotat', color: 'text-red-500' };
    }
    if (quantity <= threshold) {
        return { status: 'low_stock', label: `Només ${quantity} unitats`, color: 'text-orange-500' };
    }
    return { status: 'in_stock', label: 'En estoc', color: 'text-green-500' };
}
