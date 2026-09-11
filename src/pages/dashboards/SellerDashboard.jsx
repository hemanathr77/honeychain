import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Package, FlaskConical, ShoppingBag, Star, Plus,
  TrendingUp, MapPin, ChevronRight, AlertCircle, RefreshCw, Home,
  Edit, Beaker, X, CheckCircle, Clock, Leaf, Siren, Image, Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellers, products as productsApi, farms as farmsApi, batches as batchesApi, orders as ordersApi, rescue as rescueApi } from '../../services/api';
import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
function resolveImg(url) { if (!url) return null; if (url.startsWith('http')) return url; return `${API_BASE}${url}`; }


const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'rescue', label: 'Rescues', icon: Siren },
  { id: 'farm', label: 'My Farm', icon: Home },
  { id: 'products', label: 'Honey Products', icon: Package },
  { id: 'batches', label: 'Batches', icon: FlaskConical },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
];

const RESCUE_STATUS_COLORS = { COLLECTOR_ASSIGNED: 'bg-indigo-100 text-indigo-700', SCHEDULED: 'bg-purple-100 text-purple-700', COLLECTED: 'bg-teal-100 text-teal-700', COMPLETED: 'bg-green-100 text-green-700' };

function StatCard({ icon: Icon, label, value, color = 'honey', sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100`}>
          <Icon size={18} className={`text-${color}-600`} />
        </div>
        <TrendingUp size={14} className="text-forest-500" />
      </div>
      <p className="text-2xl font-display font-black text-charcoal-800">{value ?? '—'}</p>
      <p className="text-sm text-charcoal-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-forest-600 font-medium mt-1">{sub}</p>}
    </div>
  );
}

function AddProductModal({ myFarms, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', honey_type: '', description: '', price_per_kg: '', available_quantity: '', harvest_date: '', farm_id: '', image_url: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price_per_kg) return setError('Product name and price are required.');
    setSaving(true);
    try {
      await productsApi.create({ ...form, price_per_kg: parseFloat(form.price_per_kg), available_quantity: parseFloat(form.available_quantity) || 0, farm_id: form.farm_id ? parseInt(form.farm_id) : undefined });
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h3 className="font-display font-bold text-lg text-charcoal-900">Add Honey Product</h3>
          <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertCircle size={14} className="mt-0.5 flex-shrink-0" />{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Product Name *</label>
              <input className="input-field" placeholder="e.g. Wild Forest Honey" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Honey Type</label>
              <select className="input-field" value={form.honey_type} onChange={set('honey_type')}>
                <option value="">Select type</option>
                {['Multi-Floral', 'Single-Floral', 'Forest Honey', 'Tulsi', 'Jamun', 'Mustard', 'Litchi', 'Acacia'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Price / kg (₹) *</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="450" value={form.price_per_kg} onChange={set('price_per_kg')} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Available Quantity (kg)</label>
              <input className="input-field" type="number" min="0" step="0.1" placeholder="50" value={form.available_quantity} onChange={set('available_quantity')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Harvest Date</label>
              <input className="input-field" type="date" value={form.harvest_date} onChange={set('harvest_date')} />
            </div>
            {myFarms.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-charcoal-600 block mb-1">Farm</label>
                <select className="input-field" value={form.farm_id} onChange={set('farm_id')}>
                  <option value="">No farm selected</option>
                  {myFarms.map(f => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Description</label>
              <textarea className="input-field" rows="2" placeholder="Describe your honey..." value={form.description} onChange={set('description')} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Image URL (optional)</label>
              <input className="input-field" type="url" placeholder="https://..." value={form.image_url} onChange={set('image_url')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddFarmModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ farm_name: '', address: '', village: '', district: '', state: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farm_name) return setError('Farm name is required.');
    setSaving(true);
    try {
      await farmsApi.create(form);
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h3 className="font-display font-bold text-lg text-charcoal-900">Add Farm</h3>
          <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1">Farm Name *</label>
            <input className="input-field" placeholder="e.g. Green Valley Bee Farm" value={form.farm_name} onChange={set('farm_name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Village</label>
              <input className="input-field" placeholder="Village" value={form.village} onChange={set('village')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">District</label>
              <input className="input-field" placeholder="District" value={form.district} onChange={set('district')} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1">State</label>
            <input className="input-field" placeholder="State" value={form.state} onChange={set('state')} />
          </div>
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1">Description</label>
            <textarea className="input-field" rows="2" placeholder="Describe your farm..." value={form.description} onChange={set('description')} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : 'Add Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [sellerAllOrders, setSellerAllOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);

  const [myFarms, setMyFarms] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState(null);
  const [orderActionError, setOrderActionError] = useState('');
  const [orderActionToast, setOrderActionToast] = useState('');

  // Rescue state
  const [myRescues, setMyRescues] = useState([]);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [collectingId, setCollectingId] = useState(null);
  const [collectionPhoto, setCollectionPhoto] = useState(null);
  const [collectionNotes, setCollectionNotes] = useState('');
  const collectionFileRef = useRef();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, productsRes, farmsRes, batchesRes] = await Promise.all([
        sellers.dashboardStats(),
        productsApi.mine(),
        farmsApi.mine(),
        batchesApi.mine(),
      ]);
      setStats(statsRes.stats);
      setRecentOrders(statsRes.recent_orders || []);
      setMyProducts(productsRes.products || []);
      setMyFarms(farmsRes.farms || []);
      setMyBatches(batchesRes.batches || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all seller orders (called when orders tab is selected)
  const loadSellerOrders = useCallback(async () => {
    try {
      const res = await ordersApi.sellerOrders();
      setSellerAllOrders(res.orders || []);
    } catch (err) {
      console.error('loadSellerOrders error:', err.message);
    }
  }, []);

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    setOrderActionLoading(orderId);
    setOrderActionError('');
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setOrderActionToast(`Order updated to ${newStatus.replace(/_/g, ' ')} ✓`);
      setTimeout(() => setOrderActionToast(''), 3000);
      await loadSellerOrders();
    } catch (err) {
      setOrderActionError(err.message || 'Failed to update order.');
    } finally {
      setOrderActionLoading(null);
    }
  };

  // Determine next action for a given order status (SELLER perspective)
  const getNextAction = (currentStatus) => {
    const map = {
      PENDING: { label: 'Confirm Order', next: 'CONFIRMED', color: 'bg-blue-500 hover:bg-blue-600' },
      CONFIRMED: { label: 'Start Processing', next: 'PROCESSING', color: 'bg-indigo-500 hover:bg-indigo-600' },
      PROCESSING: { label: 'Mark Ready for Pickup', next: 'READY_FOR_PICKUP', color: 'bg-purple-500 hover:bg-purple-600' },
    };
    return map[currentStatus] || null;
  };


  // Load rescues assigned to me
  const loadMyRescues = useCallback(async () => {
    setRescueLoading(true);
    try {
      const res = await rescueApi.list();
      setMyRescues(res.requests || []);
    } catch {}
    finally { setRescueLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (tab === 'orders') loadSellerOrders();
    if (tab === 'rescue') loadMyRescues();
  }, [tab, loadSellerOrders, loadMyRescues]);

  const handleCollect = async (rescueId) => {
    if (!collectionPhoto) return;
    setCollectingId(rescueId);
    const formData = new FormData();
    formData.append('collection_photo', collectionPhoto);
    if (collectionNotes.trim()) formData.append('collection_notes', collectionNotes.trim());
    try {
      await rescueApi.completeCollection(rescueId, formData);
      setOrderActionToast('Collection completed! ✅');
      setTimeout(() => setOrderActionToast(''), 3000);
      setCollectingId(null);
      setCollectionPhoto(null);
      setCollectionNotes('');
      if (collectionFileRef.current) collectionFileRef.current.value = '';
      loadMyRescues();
    } catch (err) {
      setOrderActionToast(`Failed: ${err.message}`);
      setTimeout(() => setOrderActionToast(''), 3000);
      setCollectingId(null);
    }
  };

  const statusColor = (s) => {
    const m = { ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-gray-100 text-gray-600', OUT_OF_STOCK: 'bg-red-100 text-red-700', PENDING_APPROVAL: 'bg-amber-100 text-amber-700' };
    return m[s] || 'bg-gray-100 text-gray-600';
  };

  const orderStatusColor = (s) => {
    const m = {
      PENDING: 'bg-amber-100 text-amber-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-indigo-100 text-indigo-700',
      READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
      PICKED_UP: 'bg-cyan-100 text-cyan-700',
      PACKED: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-sky-100 text-sky-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-honey-600 to-honey-500 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-honey-100 text-sm font-medium">Seller Dashboard</p>
              <h1 className="font-display font-black text-2xl mt-0.5">Welcome, {user?.name?.split(' ')[0]}! 🍯</h1>
              {stats?.verification_status === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full mt-1">
                  <CheckCircle size={10} /> Verified Seller
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-400/30 text-amber-100 text-xs px-2 py-0.5 rounded-full mt-1">
                  <Clock size={10} /> Pending Verification
                </span>
              )}
            </div>
            <button onClick={loadData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-cream-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-honey-50 text-honey-700 font-semibold' : 'text-charcoal-500 hover:text-charcoal-700'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Package} label="Total Products" value={stats?.total_products || 0} color="honey" />
                  <StatCard icon={FlaskConical} label="Honey Batches" value={stats?.total_batches || 0} color="forest" />
                  <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.total_orders || 0} color="blue" />
                  <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${Number(stats?.total_revenue || 0).toLocaleString()}`} color="green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <h3 className="font-display font-bold text-charcoal-800 mb-4">Recent Orders</h3>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-8 text-charcoal-400">
                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No orders yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                            <div>
                              <p className="text-xs font-mono text-charcoal-500">{o.order_number}</p>
                              <p className="text-sm font-semibold text-charcoal-800">{o.customer_name}</p>
                              <p className="text-xs text-charcoal-400 truncate max-w-[180px]">{o.products}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-charcoal-800">₹{Number(o.order_total).toLocaleString()}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orderStatusColor(o.order_status)}`}>{o.order_status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <h3 className="font-display font-bold text-charcoal-800 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => { setTab('products'); setShowAddProduct(true); }} className="w-full flex items-center gap-3 p-3 bg-honey-50 hover:bg-honey-100 rounded-xl transition-colors text-left">
                        <Plus size={16} className="text-honey-600" />
                        <span className="text-sm font-semibold text-charcoal-800">Add Honey Product</span>
                      </button>
                      <button onClick={() => { setTab('farm'); setShowAddFarm(true); }} className="w-full flex items-center gap-3 p-3 bg-forest-50 hover:bg-forest-100 rounded-xl transition-colors text-left">
                        <Plus size={16} className="text-forest-600" />
                        <span className="text-sm font-semibold text-charcoal-800">Add Farm</span>
                      </button>
                      <button onClick={() => setTab('batches')} className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left">
                        <FlaskConical size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-charcoal-800">Create Batch</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FARM TAB */}
            {tab === 'farm' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl text-charcoal-800">My Farms</h2>
                  <button onClick={() => setShowAddFarm(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={14} /> Add Farm
                  </button>
                </div>
                {myFarms.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                    <div className="text-6xl mb-4">🌿</div>
                    <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No farms added yet</h3>
                    <p className="text-charcoal-400 text-sm mb-4">Add your bee farm to associate with your honey products.</p>
                    <button onClick={() => setShowAddFarm(true)} className="btn-primary">Add Your First Farm</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myFarms.map(farm => (
                      <div key={farm.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-display font-bold text-charcoal-800">{farm.farm_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${farm.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {farm.verification_status}
                          </span>
                        </div>
                        {(farm.village || farm.district || farm.state) && (
                          <div className="flex items-center gap-1 text-xs text-charcoal-500 mb-2">
                            <MapPin size={12} />
                            {[farm.village, farm.district, farm.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {farm.description && <p className="text-sm text-charcoal-500">{farm.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS TAB */}
            {tab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl text-charcoal-800">My Honey Products</h2>
                  <button onClick={() => setShowAddProduct(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={14} /> Add Product
                  </button>
                </div>
                {myProducts.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                    <div className="text-6xl mb-4">🍯</div>
                    <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No honey products added yet</h3>
                    <p className="text-charcoal-400 text-sm mb-4">Add your first honey product to start selling on HoneyChain.</p>
                    <button onClick={() => setShowAddProduct(true)} className="btn-primary flex items-center gap-2 mx-auto">
                      <Plus size={14} /> Add Honey Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-cream-200 shadow-card overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" onError={e => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-honey-100 to-honey-50 flex items-center justify-center">
                            <span className="text-5xl">🍯</span>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-display font-bold text-charcoal-800">{p.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(p.status)}`}>{p.status}</span>
                          </div>
                          {p.honey_type && <p className="text-xs text-charcoal-400 mb-2">{p.honey_type}</p>}
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-honey-700">₹{p.price_per_kg}/kg</p>
                            <p className="text-xs text-charcoal-500">{p.available_quantity} kg available</p>
                          </div>
                          {p.farm_name && (
                            <div className="flex items-center gap-1 text-xs text-charcoal-400 mt-1">
                              <MapPin size={10} />{p.farm_name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BATCHES TAB */}
            {tab === 'batches' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl text-charcoal-800">Honey Batches</h2>
                  <Link to="/traceability" className="btn-secondary flex items-center gap-2 text-sm">
                    <FlaskConical size={14} /> View Traceability
                  </Link>
                </div>
                {myBatches.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                    <div className="text-6xl mb-4">🔬</div>
                    <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No batches created yet</h3>
                    <p className="text-charcoal-400 text-sm">Batches allow full traceability from farm to customer.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBatches.map(b => (
                      <div key={b.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-4 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-honey-700">{b.batch_id}</p>
                          <p className="text-sm text-charcoal-700">{b.product_name || 'No product linked'}</p>
                          <p className="text-xs text-charcoal-400">{b.quantity} {b.unit} · Harvested {b.harvest_date ? new Date(b.harvest_date).toLocaleDateString('en-IN') : '—'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium block mb-1 ${
                            b.batch_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            b.batch_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{b.batch_status}</span>
                          <p className="text-xs text-charcoal-400">Lab: {b.lab_status || 'PENDING'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl text-charcoal-800">Customer Orders</h2>
                  <button onClick={loadSellerOrders} className="p-2 text-charcoal-400 hover:text-charcoal-600">
                    <RefreshCw size={16} />
                  </button>
                </div>

                {orderActionToast && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} /> {orderActionToast}
                  </div>
                )}
                {orderActionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} /> {orderActionError}
                  </div>
                )}

                {sellerAllOrders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No orders yet</h3>
                    <p className="text-charcoal-400 text-sm">Orders will appear here when customers purchase your honey.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sellerAllOrders.map(o => {
                      const nextAction = getNextAction(o.order_status);
                      return (
                        <div key={o.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-mono text-xs text-charcoal-500">{o.order_number}</p>
                              <p className="text-sm font-semibold text-charcoal-800 mt-0.5">{o.customer_name}</p>
                              <p className="text-xs text-charcoal-400">
                                {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-charcoal-800">₹{Number(o.total_amount).toLocaleString()}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orderStatusColor(o.order_status)}`}>
                                {o.order_status?.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>

                          {(o.items || []).filter(Boolean).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-charcoal-600 mb-1">
                              <span className="text-honey-500">•</span>
                              <span>{item.product_name}</span>
                              <span className="text-charcoal-400">· {item.quantity} kg</span>
                              {item.batch_ref && <span className="font-mono text-honey-600 ml-1">[{item.batch_ref}]</span>}
                            </div>
                          ))}

                          {nextAction && (
                            <div className="mt-3 pt-3 border-t border-cream-200 flex gap-2">
                              <button
                                onClick={() => handleOrderStatusUpdate(o.id, nextAction.next)}
                                disabled={orderActionLoading === o.id}
                                className={`text-sm text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 ${nextAction.color} disabled:opacity-60`}
                              >
                                {orderActionLoading === o.id ? (
                                  <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                                ) : nextAction.label}
                              </button>
                              <button
                                onClick={() => handleOrderStatusUpdate(o.id, 'CANCELLED')}
                                disabled={orderActionLoading === o.id}
                                className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── RESCUE TAB ── */}
            {tab === 'rescue' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="font-display font-bold text-charcoal-800">Assigned Rescues ({myRescues.length})</h3>
                  <button onClick={loadMyRescues} className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-charcoal-800 bg-white px-3 py-2 rounded-lg border border-cream-200"><RefreshCw size={13} /> Refresh</button>
                </div>

                {rescueLoading && <div className="text-center py-12"><RefreshCw size={24} className="animate-spin text-honey-500 mx-auto" /></div>}

                {!rescueLoading && myRescues.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-cream-200">
                    <Siren size={32} className="text-charcoal-300 mx-auto mb-3" />
                    <p className="text-charcoal-400">No rescue requests assigned to you yet.</p>
                  </div>
                )}

                {myRescues.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow-card border border-cream-200 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-charcoal-800">{r.request_number}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESCUE_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status?.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-charcoal-400 mt-0.5">{r.reporter_name} • {new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Farmer's rescue image */}
                    {r.photo_url && (
                      <img src={resolveImg(r.photo_url)} alt="Rescue" className="w-full max-w-xs h-40 rounded-xl object-cover mb-3 border-2 border-cream-200" />
                    )}

                    <p className="text-sm text-charcoal-600 mb-2">{r.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-charcoal-500 mb-4">
                      {r.location_description && <span>📍 {r.location_description}</span>}
                      {r.approximate_size && <span>📐 {r.approximate_size}</span>}
                      {r.latitude && <span>🛰 {parseFloat(r.latitude).toFixed(5)}, {parseFloat(r.longitude).toFixed(5)}</span>}
                      {r.location_accuracy && <span>±{Math.round(r.location_accuracy)}m</span>}
                    </div>
                    {r.assignment_notes && <p className="text-xs text-charcoal-500 mb-3 bg-cream-50 p-2 rounded-lg">📝 {r.assignment_notes}</p>}

                    {/* Already collected */}
                    {r.collection_photo_url && (
                      <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                        <p className="text-xs font-semibold text-teal-700 mb-1">✅ Collection completed</p>
                        <img src={resolveImg(r.collection_photo_url)} alt="Collection" className="w-32 h-24 rounded-lg object-cover" />
                        {r.collection_notes && <p className="text-xs text-teal-600 mt-1">{r.collection_notes}</p>}
                      </div>
                    )}

                    {/* Collection form — only for assigned statuses */}
                    {['COLLECTOR_ASSIGNED', 'SCHEDULED'].includes(r.status) && (
                      <div className="border-t border-cream-200 pt-4 mt-3">
                        <p className="text-sm font-semibold text-charcoal-800 mb-2">Complete Collection</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-charcoal-600 block mb-1">Collection Photo *</label>
                            <input
                              ref={collectionFileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              capture="environment"
                              onChange={e => setCollectionPhoto(e.target.files?.[0] || null)}
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-charcoal-600 block mb-1">Notes</label>
                            <textarea className="input-field" rows="2" placeholder="Describe the collection..." value={collectionNotes} onChange={e => setCollectionNotes(e.target.value)} />
                          </div>
                          <button
                            onClick={() => handleCollect(r.id)}
                            disabled={!collectionPhoto || collectingId === r.id}
                            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {collectingId === r.id ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
                            {collectingId === r.id ? 'Uploading...' : 'Submit Collection'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddProduct && (
        <AddProductModal myFarms={myFarms} onClose={() => setShowAddProduct(false)} onSuccess={loadData} />
      )}
      {showAddFarm && (
        <AddFarmModal onClose={() => setShowAddFarm(false)} onSuccess={loadData} />
      )}
    </div>
  );
}
