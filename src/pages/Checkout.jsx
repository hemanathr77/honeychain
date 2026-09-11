import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, Shield, ChevronRight, MapPin, AlertCircle, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orders as ordersApi } from '../services/api';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart, showToast } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: address, 2: payment
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    line1: '',
    city: '',
    state: 'Tamil Nadu',
    pin: '',
  });

  const delivery = cartTotal >= 1000 ? 0 : 60;
  const total = cartTotal + delivery;

  // Guard: cart must not be empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-display font-bold text-xl text-charcoal-800 mb-2">Your cart is empty</h2>
          <p className="text-charcoal-500 mb-4">Add some products before checking out.</p>
          <Link to="/marketplace" className="btn-primary inline-block">Browse Marketplace</Link>
        </div>
      </div>
    );
  }

  // Guard: must be logged in as CUSTOMER
  if (!isAuthenticated || user?.role !== 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4"><LogIn className="w-16 h-16 mx-auto text-honey-500" /></div>
          <h2 className="font-display font-bold text-xl text-charcoal-800 mb-2">Sign in required</h2>
          <p className="text-charcoal-500 mb-4">You must be signed in as a customer to place an order.</p>
          <Link to="/login" state={{ from: { pathname: '/checkout' } }} className="btn-primary inline-block">Sign In</Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setError('');

    if (!address.name.trim() || !address.line1.trim() || !address.city.trim()) {
      setError('Please fill in your delivery address.');
      return;
    }

    setPlacing(true);
    try {
      // Build items from cart using real product IDs
      const items = cartItems.map(item => ({
        product_id: item.productId,
        quantity: parseFloat(item.quantity) || 1,
        batch_id: item.batchId || undefined,
      }));

      const shippingAddress = `${address.line1}, ${address.city}, ${address.state} - ${address.pin}`;

      const result = await ordersApi.place({
        items,
        shipping_address: shippingAddress,
        shipping_name: address.name.trim(),
        shipping_phone: address.phone.trim() || undefined,
        payment_method: paymentMethod,
      });

      clearCart();
      showToast('success', 'Order placed successfully!');
      navigate(`/order/${result.order.id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="page-header">
        <div className="max-w-4xl mx-auto">
          <h1 className="section-title flex items-center gap-3"><CreditCard className="text-honey-600" />Checkout</h1>
          <div className="flex items-center gap-2 mt-3">
            {['Delivery Address', 'Payment', 'Confirmation'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  step > i + 1 ? 'bg-forest-500 text-white' :
                  step === i + 1 ? 'bg-honey-500 text-white' :
                  'bg-cream-200 text-charcoal-500'
                }`}>{s}</div>
                {i < 2 && <div className="flex-1 h-0.5 bg-cream-200 hidden sm:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
                <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-honey-600" />Delivery Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name *', key: 'name', placeholder: 'Your full name' },
                    { label: 'Phone', key: 'phone', placeholder: '+91 XXXXX XXXXX' },
                    { label: 'Address *', key: 'line1', placeholder: '45, Main Street...' },
                    { label: 'City *', key: 'city', placeholder: 'City' },
                  ].map(f => (
                    <div key={f.key} className={f.key === 'line1' ? 'md:col-span-2' : ''}>
                      <label className="text-sm font-semibold text-charcoal-700 block mb-1">{f.label}</label>
                      <input
                        value={address[f.key]}
                        onChange={e => setAddress({ ...address, [f.key]: e.target.value })}
                        className="input-field"
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-semibold text-charcoal-700 block mb-1">State</label>
                    <select value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="input-field">
                      {['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi', 'Other'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-charcoal-700 block mb-1">Pincode</label>
                    <input
                      value={address.pin}
                      onChange={e => setAddress({ ...address, pin: e.target.value })}
                      className="input-field"
                      placeholder="641001"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!address.name.trim() || !address.line1.trim() || !address.city.trim()) {
                      setError('Please fill in name, address, and city.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
                >
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
                <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-honey-600" />Payment Method
                </h2>

                <div className="mt-4 space-y-3">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive your honey', emoji: '💵' },
                    { id: 'upi', label: 'UPI / PhonePe / GPay', sub: 'Integration coming soon', emoji: '📱' },
                    { id: 'card', label: 'Credit / Debit Card', sub: 'Integration coming soon', emoji: '💳' },
                  ].map(method => (
                    <label key={method.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? 'border-honey-400 bg-honey-50'
                        : 'border-cream-200 bg-white hover:border-honey-300 hover:bg-honey-50'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="accent-honey-500"
                      />
                      <span className="text-xl">{method.emoji}</span>
                      <div>
                        <p className="font-semibold text-charcoal-800 text-sm">{method.label}</p>
                        <p className="text-xs text-charcoal-400">{method.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {placing ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order...</>
                    ) : (
                      <>Place Order — ₹{total.toFixed(0)} <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5 sticky top-20">
              <h3 className="font-semibold text-charcoal-800 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="text-xl">🍯</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal-700 truncate">{item.productName}</p>
                      <p className="text-xs text-charcoal-400">{item.size}g × {item.quantity}</p>
                    </div>
                    <span className="font-bold text-charcoal-800">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-cream-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-charcoal-500">Subtotal</span><span>₹{cartTotal.toFixed(0)}</span></div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Delivery</span>
                  <span className={delivery === 0 ? 'text-forest-600 font-medium' : ''}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2"><span className="font-bold">Total</span><span className="font-black text-lg">₹{total.toFixed(0)}</span></div>
              </div>
              <div className="mt-4 p-3 bg-cream-50 rounded-xl text-xs text-charcoal-500 flex items-start gap-2">
                <Shield size={14} className="text-forest-600 flex-shrink-0 mt-0.5" />
                Each honey batch traceable from farm to your door.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
