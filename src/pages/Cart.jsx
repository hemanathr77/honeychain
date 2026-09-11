import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Link2, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { VerifiedBadge, LabTestedBadge } from '../components/ui/Badges';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-2">Your cart is empty</h2>
          <p className="text-charcoal-500 mb-6">Find verified honey from real beekeepers.</p>
          <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
            <ShoppingCart size={18} /> Find Real Honey
          </Link>
        </div>
      </div>
    );
  }

  const delivery = cartTotal >= 1000 ? 0 : 60;
  const total = cartTotal + delivery;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="page-header">
        <div className="max-w-5xl mx-auto">
          <h1 className="section-title flex items-center gap-3">
            <ShoppingCart className="text-honey-600" /> Your Cart
          </h1>
          <p className="text-charcoal-500 mt-2">All items are from verified farmers with traceable batches.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-card border border-cream-200 p-5">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-honey-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">🍯</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-charcoal-800 leading-tight">{item.productName}</p>
                        <p className="text-xs text-charcoal-400 mt-0.5">{item.size}g jar</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.verified && <VerifiedBadge />}
                      {item.labTested && <LabTestedBadge status="compliant" />}
                      {item.batchId && (
                        <button
                          onClick={() => navigate(`/traceability/${item.batchId}`)}
                          className="badge-traceable cursor-pointer hover:bg-purple-200 transition-colors"
                        >
                          <Link2 size={11} /> Trace
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg border border-cream-200 flex items-center justify-center text-charcoal-600 hover:bg-cream-100 transition-colors">
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center font-bold text-charcoal-800">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg border border-cream-200 flex items-center justify-center text-charcoal-600 hover:bg-cream-100 transition-colors">
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-charcoal-800">₹{(item.price * item.quantity).toFixed(0)}</p>
                        <p className="text-xs text-charcoal-400">₹{item.price}/jar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 sticky top-20">
              <h2 className="font-display font-bold text-lg text-charcoal-800 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-500">Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">₹{cartTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-500">Delivery</span>
                  <span className={`font-semibold ${delivery === 0 ? 'text-forest-600' : ''}`}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                {delivery === 0 && (
                  <p className="text-xs text-forest-600">🎉 Free delivery on orders above ₹1,000</p>
                )}
                {delivery > 0 && (
                  <p className="text-xs text-charcoal-400">Add ₹{(1000 - cartTotal).toFixed(0)} more for free delivery</p>
                )}
                <div className="border-t border-cream-200 pt-3 flex justify-between">
                  <span className="font-bold text-charcoal-800">Total</span>
                  <span className="font-black text-xl text-charcoal-900">₹{total.toFixed(0)}</span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <div className="mt-4 p-3 bg-cream-50 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-charcoal-500">
                  <Shield size={14} className="text-forest-600 flex-shrink-0" />
                  All sellers are verified. Each batch is traceable. Lab reports available.
                </div>
              </div>

              <Link to="/marketplace" className="block text-center text-sm text-honey-700 mt-4 hover:underline">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
