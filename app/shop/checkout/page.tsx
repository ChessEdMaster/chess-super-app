'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/types/ecommerce';
import { AddressForm } from '@/components/shop/address-form';
import { MapPin, Plus, Loader2, CreditCard, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Address {
    id: string;
    full_name: string;
    address_line1: string;
    city: string;
    postal_code: string;
    country: string;
    is_default: boolean;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, loadCart, isLoading: isCartLoading } = useCartStore();

    const [user, setUser] = useState<any>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        checkAuth();
        loadCart();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login?next=/shop/checkout');
            return;
        }
        setUser(user);
        fetchAddresses(user.id);
    };

    const fetchAddresses = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('shop_addresses')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false });

            if (error) throw error;

            setAddresses(data || []);
            if (data && data.length > 0) {
                setSelectedAddressId(data[0].id);
            } else {
                setIsAddingAddress(true);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error('Error carregant les adreces');
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            toast.error('Selecciona una adreça d\'enviament');
            return;
        }

        setIsProcessing(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    cartItems: items,
                    shipping_address_id: selectedAddressId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el procés de pagament');
            }

            // Redirect to Stripe
            window.location.href = data.url;

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error instanceof Error ? error.message : 'Error desconegut');
            setIsProcessing(false);
        }
    };

    const shippingCost = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.21;
    const total = subtotal + shippingCost + tax;

    if (isCartLoading || isLoadingAddresses) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (items.length === 0) {
        router.push('/shop/cart');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-bold text-slate-100 mb-8 flex items-center gap-3">
                    <Lock className="text-emerald-500" />
                    Pagament Segur
                </h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Address & Details */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Address Section */}
                        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                                    <MapPin className="text-emerald-400" />
                                    Adreça d'Enviament
                                </h2>
                                {!isAddingAddress && (
                                    <button
                                        onClick={() => setIsAddingAddress(true)}
                                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Nova Adreça
                                    </button>
                                )}
                            </div>

                            {isAddingAddress ? (
                                <AddressForm
                                    onAddressAdded={(id) => {
                                        setIsAddingAddress(false);
                                        if (user) fetchAddresses(user.id);
                                        setSelectedAddressId(id);
                                    }}
                                    onCancel={() => {
                                        setIsAddingAddress(false);
                                        if (addresses.length === 0) {
                                            toast('Necessites una adreça per continuar');
                                        }
                                    }}
                                />
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            onClick={() => setSelectedAddressId(address.id)}
                                            className={`
                                                cursor-pointer p-4 rounded-lg border-2 transition-all
                                                ${selectedAddressId === address.id
                                                    ? 'border-emerald-500 bg-emerald-900/10'
                                                    : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-slate-200">{address.full_name}</span>
                                                {selectedAddressId === address.id && (
                                                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-emerald-300" />
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                {address.address_line1}<br />
                                                {address.city}, {address.postal_code}<br />
                                                {address.country}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Payment Method Preview */}
                        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 opacity-75">
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <CreditCard className="text-emerald-400" />
                                Mètode de Pagament
                            </h2>
                            <p className="text-slate-400">
                                El pagament es processarà de forma segura a través de Stripe.
                                Seràs redirigit a la pàgina de pagament en el següent pas.
                            </p>
                            <div className="flex gap-4 mt-4 text-slate-500">
                                {/* Placeholders for card logos */}
                                <div className="bg-slate-800 p-2 rounded">Visa</div>
                                <div className="bg-slate-800 p-2 rounded">Mastercard</div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-100 mb-6">Resum de la Comanda</h2>

                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3 text-sm">
                                        <div className="w-12 h-12 bg-slate-800 rounded flex-shrink-0 overflow-hidden">
                                            {item.product?.images?.[0] && (
                                                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-200 truncate">{item.product?.name}</p>
                                            <p className="text-slate-400">Qt: {item.quantity}</p>
                                        </div>
                                        <p className="text-slate-200 font-medium">
                                            {formatPrice((item.product?.sale_price || item.product?.price || 0) * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 mb-6 border-t border-slate-800 pt-4">
                                <div className="flex justify-between text-slate-300">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Enviament</span>
                                    <span>{shippingCost === 0 ? 'Gratuït' : formatPrice(shippingCost)}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>IVA (21%)</span>
                                    <span>{formatPrice(tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-emerald-400 pt-2 border-t border-slate-800">
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || !selectedAddressId}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" /> Processant...
                                    </>
                                ) : (
                                    'Pagar Ara'
                                )}
                            </button>

                            <p className="text-xs text-slate-500 text-center mt-4">
                                En fer clic a "Pagar Ara", acceptes els nostres termes de servei.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
