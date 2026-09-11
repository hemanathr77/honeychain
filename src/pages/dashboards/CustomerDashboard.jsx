import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, User, Search, AlertCircle, RefreshCw,
  MapPin, Package, Clock, CheckCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orders as ordersApi, rescue as rescueApi } from '../../services/api';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'rescue', label: 'Rescue Reports', icon: '🐝' },
  { id: 'trace', label: 'Trace a Batch', icon: Search },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('orders');
  const [myOrders, setMyOrders] = useState([]);
  const [myRescues, setMyRescues] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, rescueRes] = await Promise.all([
        ordersApi.mine(),
        rescueApi.list(),
      ]);
      setMyOrders(ordersRes.orders || []);
      setMyRescues(rescueRes.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load your data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const orderStatusColor = (s) => {
    const m = {
      PENDING: 'bg-amber-100 text-amber-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-indigo-100 text-indigo-700',
      READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
      PICKED_UP: 'bg-cyan-100 text-cyan-700',
      SHIPPED: 'bg-sky-100 text-sky-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  };

  const rescueStatusColor = (s) => {
    const m = { REPORTED: 'bg-amber-100 text-amber-700', COLLECTOR_ASSIGNED: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };
    return m[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-600 to-forest-500 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-forest-100 text-sm font-medium">Customer Dashboard</p>
            <h1 className="font-display font-black text-2xl mt-0.5">Welcome, {user?.name?.split(' ')[0]}! 🛍️</h1>
            <p className="text-forest-100 text-sm">{user?.email}</p>
          </div>
          <button onClick={loadData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-cream-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-forest-50 text-forest-700 font-semibold' : 'text-charcoal-500 hover:text-charcoal-700'
                }`}
              >
                {typeof t.icon === 'string' ? <span>{t.icon}</span> : <t.icon size={14} />}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">My Orders</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No orders yet</h3>
                <p className="text-charcoal-400 text-sm mb-4">Browse the marketplace and buy your first jar of verified honey.</p>
                <Link to="/marketplace" className="btn-primary inline-block">Browse Marketplace</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(o => (
                  <div key={o.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-charcoal-500">{o.order_number}</p>
                        <p className="text-sm text-charcoal-500">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-charcoal-800">₹{Number(o.total_amount).toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orderStatusColor(o.order_status)}`}>{o.order_status}</span>
                      </div>
                    </div>
                    {o.items && o.items.filter(Boolean).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-charcoal-600 mt-1">
                        <span className="text-honey-500">•</span>
                        <span>{item.product_name}</span>
                        <span className="text-charcoal-400">· {item.quantity} kg</span>
                      </div>
                    ))}
                    {o.items?.some(item => item?.batch_id) && (
                      <Link to={`/traceability/${o.items.find(i => i?.batch_id)?.batch_id}`} className="mt-3 flex items-center gap-1 text-xs text-honey-700 font-semibold hover:underline">
                        View Traceability <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESCUE */}
        {tab === 'rescue' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-charcoal-800">My Rescue Reports</h2>
              <Link to="/bee-rescue" className="btn-primary text-sm">Submit Rescue Request</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
            ) : myRescues.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                <div className="text-6xl mb-4">🐝</div>
                <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No rescue reports yet</h3>
                <p className="text-charcoal-400 text-sm mb-4">Spotted a bee swarm? Report it and a collector will help.</p>
                <Link to="/bee-rescue" className="btn-primary inline-block">Report a Swarm</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myRescues.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-charcoal-500">{r.request_number}</p>
                        <p className="text-sm font-semibold text-charcoal-800 mt-0.5">{r.description}</p>
                        <p className="text-xs text-charcoal-400 flex items-center gap-1 mt-1"><MapPin size={10} />{r.location_description}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rescueStatusColor(r.status)}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRACE */}
        {tab === 'trace' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">Trace a Honey Batch</h2>
            <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-6">
              <p className="text-sm text-charcoal-500 mb-4">Enter a batch ID (e.g. HC-TN-2026-000001) to see its full journey from farm to your door.</p>
              <div className="flex gap-3">
                <input
                  className="input-field flex-1"
                  placeholder="HC-TN-2026-000001"
                  value={batchId}
                  onChange={e => setBatchId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && batchId && window.location.assign(`/traceability/${batchId}`)}
                />
                <Link
                  to={batchId ? `/traceability/${batchId}` : '#'}
                  className={`btn-primary whitespace-nowrap ${!batchId && 'opacity-50 pointer-events-none'}`}
                >
                  Trace It
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">My Profile</h2>
            <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-honey-400 to-honey-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-charcoal-900">{user?.name}</h3>
                  <p className="text-sm text-charcoal-500">{user?.email}</p>
                  <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full font-medium">{user?.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-200">
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide">Member Since</p>
                  <p className="text-sm font-semibold text-charcoal-800">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide">Account Status</p>
                  <p className="text-sm font-semibold text-green-700">Active</p>
                </div>
              </div>
              <button onClick={logout} className="w-full mt-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
