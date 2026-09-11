import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle, Clock, Package, Truck, Home, Link2,
  AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import { orders as ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Full order lifecycle steps for the timeline
const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: '🛍️' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { key: 'PROCESSING', label: 'Processing', icon: '⚙️' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: '📦' },
  { key: 'PICKED_UP', label: 'Picked Up', icon: '🚗' },
  { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '📍' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🏠' },
];

const STATUS_COLOR = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700 border-purple-200',
  PICKED_UP: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  SHIPPED: 'bg-sky-100 text-sky-700 border-sky-200',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 border-orange-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.get(id);
      setOrder(res.order);
      setStatusHistory(res.status_history || []);
    } catch (err) {
      setError(err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🍯</div>
          <p className="text-charcoal-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-charcoal-800 mb-2">Order Not Found</h2>
          <p className="text-charcoal-500 mb-4">{error || 'This order does not exist or you do not have permission to view it.'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadOrder} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={14} /> Try Again
            </button>
            <Link to="/customer-dashboard" className="btn-primary">My Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === order.order_status);
  const isCancelled = order.order_status === 'CANCELLED';
  const isDelivered = order.order_status === 'DELIVERED';

  // Find the first batch ID from order items
  const firstBatchRef = order.items?.find(i => i?.batch_ref)?.batch_ref;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-8 text-center mb-6">
          <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            {isDelivered ? '🏠' : isCancelled ? '❌' : '✅'}
          </div>
          <h1 className="font-display font-black text-3xl text-charcoal-900 mb-2">
            {isDelivered ? 'Order Delivered!' : isCancelled ? 'Order Cancelled' : 'Order Confirmed!'}
          </h1>
          <p className="text-charcoal-500 mb-3">
            {isDelivered
              ? 'Your verified honey has arrived. Thank you for your order!'
              : isCancelled
              ? 'This order has been cancelled.'
              : 'Your order has been placed and is being processed.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <p className="font-mono text-sm font-bold text-honey-700">{order.order_number}</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[order.order_status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {order.order_status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-2">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-charcoal-800">Order Progress</h2>
              <button onClick={loadOrder} className="flex items-center gap-1 text-xs text-charcoal-400 hover:text-charcoal-600">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {/* Compact timeline */}
            <div className="overflow-x-auto">
              <div className="flex items-start gap-1 min-w-max pb-2">
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i < currentStatusIndex;
                  const isCurrent = i === currentStatusIndex;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center min-w-[68px]">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                          isDone ? 'bg-forest-500 text-white' :
                          isCurrent ? 'bg-honey-500 text-white ring-4 ring-honey-200' :
                          'bg-cream-200 text-charcoal-400'
                        }`}>
                          {isDone ? <CheckCircle size={16} /> : <span>{step.icon}</span>}
                        </div>
                        <p className={`text-xs mt-1.5 text-center leading-tight font-medium max-w-[64px] ${
                          isDone || isCurrent ? 'text-charcoal-700' : 'text-charcoal-400'
                        }`}>{step.label}</p>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-1 rounded-full mt-4 min-w-[16px] transition-all ${i < currentStatusIndex ? 'bg-forest-400' : 'bg-cream-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Status history list */}
            {statusHistory.length > 0 && (
              <div className="mt-5 border-t border-cream-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2">History</p>
                {statusHistory.map((h, i) => (
                  <div key={h.id || i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-honey-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-charcoal-800">{h.status?.replace(/_/g, ' ')}</span>
                      {h.notes && <span className="text-charcoal-500 ml-1">— {h.notes}</span>}
                    </div>
                    <span className="text-xs text-charcoal-400 flex-shrink-0">
                      {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 mb-6">
          <h2 className="font-semibold text-charcoal-800 mb-4">Order Details</h2>

          {/* Items */}
          <div className="space-y-3 mb-4">
            {(order.items || []).filter(Boolean).map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-honey-50 rounded-xl border border-honey-100">
                <span className="text-2xl">🍯</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal-800">{item.product_name}</p>
                  <p className="text-xs text-charcoal-500">{item.quantity} kg</p>
                  {item.batch_ref && (
                    <p className="text-xs text-honey-700 font-mono mt-0.5">Batch: {item.batch_ref}</p>
                  )}
                </div>
                <p className="font-bold text-charcoal-800">₹{Number(item.price).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm border-t border-cream-100 pt-3">
            <div className="flex justify-between"><span className="text-charcoal-500">Total Amount</span><span className="font-bold">₹{Number(order.total_amount).toLocaleString()}</span></div>
            {order.shipping_name && <div className="flex justify-between"><span className="text-charcoal-500">Ship to</span><span>{order.shipping_name}</span></div>}
            {order.shipping_address && <div className="flex justify-between gap-4"><span className="text-charcoal-500 flex-shrink-0">Address</span><span className="text-right">{order.shipping_address}</span></div>}
          </div>
        </div>

        {/* Traceability link — only if batch is linked */}
        {firstBatchRef && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Link2 size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-purple-800 mb-1">Trace Your Honey</p>
                <p className="text-sm text-purple-600 mb-3">
                  Your honey came from batch <span className="font-mono font-bold">{firstBatchRef}</span>.
                  View the complete supply chain from hive to your door.
                </p>
                <Link
                  to={`/traceability/${firstBatchRef}`}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  <Link2 size={14} /> Trace This Batch <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/marketplace" className="flex-1 btn-secondary text-sm text-center">Continue Shopping</Link>
          <Link to="/customer-dashboard" className="flex-1 btn-primary text-sm text-center">My Orders</Link>
        </div>
      </div>
    </div>
  );
}
