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

export async function redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await getStripe();

    if (!stripe) {
        throw new Error('Stripe no està disponible');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
        throw error;
    }
}
