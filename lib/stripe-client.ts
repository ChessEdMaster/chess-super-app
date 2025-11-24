import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!key) {
            console.error('❌ Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
            return Promise.resolve(null);
        }

        stripePromise = loadStripe(key);
    }

    return stripePromise;
};

export async function redirectToCheckout(): Promise<void> {
    // Note: stripe.redirectToCheckout() is deprecated in newer versions of Stripe.js
    // The modern approach is to redirect directly to the checkout URL:
    // window.location.href = checkoutUrl;
    // This function is kept for backwards compatibility but should be replaced
    // with direct URL redirection in the calling code.

    const stripe = await getStripe();

    if (!stripe) {
        throw new Error('Stripe no està disponible');
    }

    // For now, we'll construct the checkout URL manually
    // In production, the backend should return the full checkout URL
    throw new Error('redirectToCheckout is deprecated. Use direct URL redirection instead.');
}
