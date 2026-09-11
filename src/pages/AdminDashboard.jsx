import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Users, Package, AlertTriangle, ShieldCheck,
  CheckCircle, XCircle, RefreshCw, AlertCircle,
  Siren, MessageSquare, Flag, Shield, MapPin, Eye,
  ShoppingBag, FlaskConical, Link2, Image, Clock, User,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import { admin as adminApi, orders as ordersApi, blockchain as blockchainApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/Badges';
import { useApp } from '../context/AppContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

function StatTile({ icon, label, value, color = 'honey' }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100`}>
          <span className={`text-${color}-600`}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-display font-black text-charcoal-800">
        {value != null ? Number(value).toLocaleString('en-IN') : '—'}
      </p>
      <p className="text-sm text-charcoal-500 mt-1">{label}</p>
    </div>
  );
}

const SEVERITY_COLORS = {
  HIGH: 'text-red-700 bg-red-100',
  MEDIUM: 'text-amber-700 bg-amber-100',
  LOW: 'text-blue-700 bg-blue-100',
};

const RESCUE_STATUS_COLORS = {
  REPORTED: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  COLLECTOR_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const ORDER_STATUS_COLORS = {
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

// ─── Image URL resolver ──────────────────────────────────────────────────────
function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url; // Cloudinary or external
  return `${API_BASE}${url}`; // Local uploads
}

// ─── Assign Modal ────────────────────────────────────────────────────────────
function AssignModal({ rescueId, onClose, onAssigned, showToast }) {
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.nearbyAssignees(rescueId)
      .then(r => setAssignees(r.assignees || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [rescueId]);

  const handleAssign = async (assignee) => {
    setAssigning(assignee.id);
    try {
      await adminApi.assignRescue(rescueId, { assignee_id: assignee.id, assignment_notes: notes || undefined });
      showToast(`✅ Assigned to ${assignee.role} "${assignee.name}"`);
      onAssigned();
      onClose();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-cream-200 sticky top-0 bg-white z-10">
          <h3 className="font-display font-bold text-lg text-charcoal-900">Assign Seller / Collector</h3>
          <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600"><X size={20} /></button>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <label className="text-xs font-semibold text-charcoal-600 block mb-1">Assignment Notes (optional)</label>
            <textarea className="input-field" rows="2" placeholder="Any instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {loading && <div className="text-center py-8"><RefreshCw size={24} className="animate-spin text-honey-500 mx-auto" /><p className="text-sm text-charcoal-400 mt-2">Finding nearby assignees...</p></div>}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

          {!loading && assignees.length === 0 && <p className="text-sm text-charcoal-400 text-center py-6">No verified sellers or collectors with GPS coordinates found.</p>}

          {!loading && assignees.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-charcoal-500 mb-2">{assignees.length} nearby verified assignees (sorted by distance)</p>
              {assignees.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 bg-cream-50 rounded-xl border border-cream-200 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-charcoal-800 text-sm">{a.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.role === 'SELLER' ? 'bg-forest-100 text-forest-700' : 'bg-orange-100 text-orange-700'}`}>{a.role}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-charcoal-500">
                      <span>📍 {a.distance_km} km away</span>
                      {a.district && <span>• {[a.district, a.state].filter(Boolean).join(', ')}</span>}
                      {a.active_assignments > 0 && <span className="text-amber-600">• {a.active_assignments} active</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(a)}
                    disabled={!!assigning}
                    className="px-3 py-2 bg-honey-500 text-white rounded-xl text-xs font-semibold hover:bg-honey-600 disabled:opacity-60 flex-shrink-0"
                  >
                    {assigning === a.id ? <RefreshCw size={13} className="animate-spin" /> : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Rescue Image Viewer ─────────────────────────────────────────────────────
function ImageViewer({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="relative max-w-2xl max-h-[85vh]">
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg z-10"><X size={18} /></button>
        <img src={resolveImageUrl(url)} alt="Rescue photo" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useApp();
  const tr = t?.admin || {};

  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingExperts, setPendingExperts] = useState([]);
  const [fraudFlags, setFraudFlags] = useState([]);
  const [rescueRequests, setRescueRequests] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [bcStatus, setBcStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  // Image / assign modals
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [assignRescueId, setAssignRescueId] = useState(null);
  const [expandedRescue, setExpandedRescue] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, sellersRes, expertsRes, fraudRes] = await Promise.all([
        adminApi.dashboard(),
        adminApi.pendingSellers(),
        adminApi.pendingExperts(),
        adminApi.fraudFlags(),
      ]);
      setStats(dashRes.stats);
      setRecentUsers(dashRes.recent_users || []);
      setPendingSellers(sellersRes.sellers || []);
      setPendingExperts(expertsRes.experts || []);
      setFraudFlags(fraudRes.flags || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy-load tab data
  const loadRescues = useCallback(async () => {
    try { const r = await adminApi.rescues(); setRescueRequests(r.requests || []); } catch {}
  }, []);
  const loadOrders = useCallback(async () => {
    try { const r = await ordersApi.adminAll(); setAllOrders(r.orders || []); } catch {}
  }, []);
  const loadBatches = useCallback(async () => {
    try { const r = await adminApi.batches(); setAllBatches(r.batches || []); } catch {}
  }, []);
  const loadBlockchain = useCallback(async () => {
    try { const r = await blockchainApi.getStatus(); setBcStatus(r); } catch {}
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'rescue') loadRescues();
    if (tab === 'orders') loadOrders();
    if (tab === 'batches') loadBatches();
    if (tab === 'blockchain') loadBlockchain();
  };

  const handleSellerAction = async (userId, action) => {
    setActionLoading(`seller-${userId}-${action}`);
    try {
      await adminApi.verifySeller(userId, action);
      showToast(`${action === 'verify' ? '✅ Approved' : '❌ Rejected'} successfully.`);
      await loadAll();
    } catch (err) {
      showToast(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpertAction = async (userId, action) => {
    setActionLoading(`expert-${userId}-${action}`);
    try {
      await adminApi.verifyExpert(userId, action);
      showToast(`${action === 'verify' ? '✅ Expert approved' : '❌ Expert rejected'}.`);
      await loadAll();
    } catch (err) {
      showToast(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'rescue', label: 'Rescue', icon: Siren, badge: stats ? parseInt(stats.open_rescues) : 0 },
    { id: 'sellers', label: 'Sellers', icon: Shield, badge: pendingSellers.length },
    { id: 'experts', label: 'Experts', icon: Users, badge: pendingExperts.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'batches', label: 'Batches', icon: FlaskConical },
    { id: 'blockchain', label: 'Blockchain', icon: Link2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'fraud', label: 'Fraud', icon: Flag, badge: fraudFlags.filter(f => f.status === 'PENDING_REVIEW').length },
  ];

  return (
    <div className="min-h-screen bg-charcoal-50">
      {/* Toast */}
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-charcoal-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm text-center">{toast}</div>}

      {/* Image viewer */}
      {viewImageUrl && <ImageViewer url={viewImageUrl} onClose={() => setViewImageUrl(null)} />}

      {/* Assign modal */}
      {assignRescueId && <AssignModal rescueId={assignRescueId} onClose={() => setAssignRescueId(null)} onAssigned={loadRescues} showToast={showToast} />}

      {/* Header */}
      <div className="bg-charcoal-900 text-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={22} className="text-honey-400" />
              <h1 className="font-display font-bold text-xl">HoneyChain Admin</h1>
            </div>
            <p className="text-xs text-charcoal-400">
              Logged in as <span className="text-honey-300 font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="flex items-center gap-1.5 text-xs text-charcoal-300 hover:text-white bg-charcoal-800 px-3 py-2 rounded-lg"><RefreshCw size={13} /> Refresh</button>
            <button onClick={logout} className="text-xs text-charcoal-300 hover:text-red-400 px-3 py-2">Sign Out</button>
          </div>
        </div>
      </div>

      {/* Loading / error */}
      {loading && <div className="max-w-7xl mx-auto px-4 py-20 text-center"><RefreshCw size={32} className="animate-spin text-honey-500 mx-auto mb-4" /><p className="text-charcoal-400">Loading dashboard data...</p></div>}
      {!loading && error && <div className="max-w-7xl mx-auto px-4 py-20 text-center"><AlertCircle size={36} className="text-red-400 mx-auto mb-3" /><p className="text-charcoal-700 mb-4">{error}</p><button onClick={loadAll} className="btn-primary text-sm">Try Again</button></div>}

      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab navigation — horizontally scrollable on mobile */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 bg-white rounded-2xl p-1 shadow-card border border-cream-200">
            {TABS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === id ? 'bg-honey-500 text-white shadow-honey' : 'text-charcoal-500 hover:text-charcoal-800 hover:bg-cream-50'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.slice(0, 3)}</span>
                {badge > 0 && <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${activeTab === id ? 'bg-white text-honey-600' : 'bg-red-500 text-white'}`}>{badge}</span>}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatTile icon={<Users size={18} />} label="Total Users" value={stats?.total_users} color="charcoal" />
                <StatTile icon={<Shield size={18} />} label="Sellers" value={stats?.sellers} color="forest" />
                <StatTile icon={<Package size={18} />} label="Products" value={stats?.total_products} color="honey" />
                <StatTile icon={<Siren size={18} />} label="Rescue Requests" value={stats?.total_rescues} color="orange" />
                <StatTile icon={<AlertTriangle size={18} />} label="Pending Sellers" value={stats?.pending_sellers} color="amber" />
                <StatTile icon={<Users size={18} />} label="Pending Experts" value={stats?.pending_experts} color="blue" />
                <StatTile icon={<ShoppingBag size={18} />} label="Total Orders" value={stats?.total_orders} color="purple" />
                <StatTile icon={<Flag size={18} />} label="Fraud Flags" value={stats?.fraud_flags} color="red" />
              </div>

              {recentUsers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-cream-200"><h3 className="font-display font-bold text-charcoal-800">Recent Registrations</h3></div>
                  <div className="divide-y divide-cream-100">
                    {recentUsers.map(u => (
                      <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                        <div><p className="font-medium text-charcoal-800 text-sm">{u.name}</p><p className="text-xs text-charcoal-400">{u.email}</p></div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'SELLER' ? 'bg-forest-100 text-forest-700' : u.role === 'EXPERT' ? 'bg-blue-100 text-blue-700' : u.role === 'COLLECTOR' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                          <p className="text-xs text-charcoal-400 mt-0.5">{new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESCUE TAB ── */}
          {activeTab === 'rescue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-display font-bold text-charcoal-800">Bee Rescue Requests ({rescueRequests.length})</h3>
                <button onClick={loadRescues} className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-charcoal-800 bg-white px-3 py-2 rounded-lg border border-cream-200"><RefreshCw size={13} /> Refresh</button>
              </div>

              {rescueRequests.length === 0 && <div className="text-center py-12 bg-white rounded-2xl border border-cream-200"><Siren size={32} className="text-charcoal-300 mx-auto mb-3" /><p className="text-charcoal-400">No rescue requests yet.</p></div>}

              {rescueRequests.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-charcoal-800">{r.request_number}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RESCUE_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status?.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-charcoal-400 mt-0.5">
                          {r.reporter_name || r.reporter_user_name || 'Unknown'} {r.reporter_email ? `(${r.reporter_email})` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        {r.photo_url && (
                          <button onClick={() => setViewImageUrl(r.photo_url)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100">
                            <Image size={13} /> View Image
                          </button>
                        )}
                        {['REPORTED', 'UNDER_REVIEW'].includes(r.status) && (
                          <button onClick={() => setAssignRescueId(r.id)} className="flex items-center gap-1 px-3 py-1.5 bg-honey-500 text-white rounded-lg text-xs font-semibold hover:bg-honey-600">
                            <MapPin size={13} /> Assign
                          </button>
                        )}
                        <button onClick={() => setExpandedRescue(expandedRescue === r.id ? null : r.id)} className="text-charcoal-400 hover:text-charcoal-600 p-1">
                          {expandedRescue === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Photo thumbnail */}
                    {r.photo_url && (
                      <div className="mb-3">
                        <img src={resolveImageUrl(r.photo_url)} alt="Rescue" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover cursor-pointer border-2 border-cream-200 hover:border-honey-400 transition-colors" onClick={() => setViewImageUrl(r.photo_url)} />
                      </div>
                    )}

                    {/* Brief info */}
                    <p className="text-sm text-charcoal-600 mb-2">{r.description?.slice(0, 150)}{r.description?.length > 150 ? '...' : ''}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-charcoal-500">
                      {r.location_description && <span>📍 {r.location_description.slice(0, 60)}</span>}
                      {r.approximate_size && <span>📐 {r.approximate_size}</span>}
                      <span>🕐 {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {/* Expanded details */}
                    {expandedRescue === r.id && (
                      <div className="mt-4 pt-4 border-t border-cream-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {r.latitude && <div><span className="text-charcoal-400 text-xs">GPS:</span> <span className="text-charcoal-700">{parseFloat(r.latitude).toFixed(6)}, {parseFloat(r.longitude).toFixed(6)}</span></div>}
                          {r.location_accuracy && <div><span className="text-charcoal-400 text-xs">Accuracy:</span> <span className="text-charcoal-700">±{Math.round(r.location_accuracy)}m</span></div>}
                          {r.reporter_phone && <div><span className="text-charcoal-400 text-xs">Phone:</span> <span className="text-charcoal-700">{r.reporter_phone}</span></div>}
                          {r.assigned_collector_name && <div><span className="text-charcoal-400 text-xs">Assigned to:</span> <span className="text-charcoal-700">{r.assigned_collector_name} ({r.assigned_collector_role})</span></div>}
                          {r.assignment_notes && <div className="col-span-2"><span className="text-charcoal-400 text-xs">Notes:</span> <span className="text-charcoal-700">{r.assignment_notes}</span></div>}
                        </div>

                        {/* Collection photo */}
                        {r.collection_photo_url && (
                          <div>
                            <p className="text-xs font-semibold text-charcoal-600 mb-1">Collection Photo:</p>
                            <img src={resolveImageUrl(r.collection_photo_url)} alt="Collection" className="w-24 h-24 rounded-xl object-cover cursor-pointer border-2 border-cream-200" onClick={() => setViewImageUrl(r.collection_photo_url)} />
                          </div>
                        )}
                        {r.collection_notes && <div><span className="text-charcoal-400 text-xs">Collection Notes:</span> <span className="text-charcoal-700 text-sm">{r.collection_notes}</span></div>}
                        {r.honey_quantity_kg && <div><span className="text-charcoal-400 text-xs">Honey Collected:</span> <span className="text-charcoal-700 text-sm">{r.honey_quantity_kg} kg</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between">
                <h3 className="font-display font-bold text-charcoal-800">All Orders ({allOrders.length})</h3>
                <button onClick={loadOrders} className="flex items-center gap-1 text-xs text-charcoal-500 hover:text-charcoal-800"><RefreshCw size={13} /> Refresh</button>
              </div>
              {allOrders.length === 0 ? (
                <div className="text-center py-12"><ShoppingBag size={32} className="text-charcoal-300 mx-auto mb-3" /><p className="text-charcoal-400">No orders yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-cream-50 border-b border-cream-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Order</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {allOrders.map(o => (
                        <tr key={o.id}>
                          <td className="px-4 py-3 font-medium text-charcoal-800">{o.order_number}</td>
                          <td className="px-4 py-3 text-charcoal-500">{o.customer_name}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[o.order_status] || 'bg-gray-100 text-gray-600'}`}>{o.order_status?.replace(/_/g, ' ')}</span></td>
                          <td className="px-4 py-3 text-right font-semibold text-charcoal-800">₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-xs text-charcoal-400">{new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── BATCHES TAB ── */}
          {activeTab === 'batches' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between">
                <h3 className="font-display font-bold text-charcoal-800">All Batches ({allBatches.length})</h3>
                <button onClick={loadBatches} className="flex items-center gap-1 text-xs text-charcoal-500 hover:text-charcoal-800"><RefreshCw size={13} /> Refresh</button>
              </div>
              {allBatches.length === 0 ? (
                <div className="text-center py-12"><FlaskConical size={32} className="text-charcoal-300 mx-auto mb-3" /><p className="text-charcoal-400">No batches yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-cream-50 border-b border-cream-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Batch ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Seller</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Qty</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Lab</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Blockchain</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {allBatches.map(b => (
                        <tr key={b.id}>
                          <td className="px-4 py-3 font-medium text-charcoal-800 font-mono text-xs">{b.batch_id}</td>
                          <td className="px-4 py-3 text-charcoal-600 text-xs">{b.product_name || '—'}</td>
                          <td className="px-4 py-3 text-charcoal-600 text-xs">{b.seller_name}</td>
                          <td className="px-4 py-3 text-right text-charcoal-800">{b.quantity} {b.unit || 'kg'}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.lab_status === 'COMPLIANT' ? 'bg-green-100 text-green-700' : b.lab_status === 'NON_COMPLIANT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{b.lab_status || 'NONE'}</span></td>
                          <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.blockchain_status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : b.blockchain_status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{b.blockchain_status || 'PENDING'}</span></td>
                          <td className="px-4 py-3 text-xs text-charcoal-400">{b.harvest_date ? new Date(b.harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── BLOCKCHAIN TAB ── */}
          {activeTab === 'blockchain' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-display font-bold text-charcoal-800">Blockchain Status</h3>
                <button onClick={loadBlockchain} className="flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-charcoal-800 bg-white px-3 py-2 rounded-lg border border-cream-200"><RefreshCw size={13} /> Refresh</button>
              </div>

              {!bcStatus ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-cream-200"><RefreshCw size={24} className="animate-spin text-honey-500 mx-auto mb-3" /><p className="text-charcoal-400 text-sm">Loading blockchain status...</p></div>
              ) : (
                <>
                  {/* Connection status */}
                  <div className={`rounded-2xl p-5 border ${bcStatus.blockchainAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {bcStatus.blockchainAvailable ? <CheckCircle size={22} className="text-emerald-600" /> : <AlertCircle size={22} className="text-red-600" />}
                      <p className="font-bold text-lg">{bcStatus.blockchainAvailable ? 'Blockchain Connected' : 'Blockchain Unavailable'}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {bcStatus.contractAddress && <div><span className="text-charcoal-400 text-xs">Contract:</span><p className="font-mono text-xs text-charcoal-700 break-all">{bcStatus.contractAddress}</p></div>}
                      {bcStatus.backendWallet && <div><span className="text-charcoal-400 text-xs">Backend Wallet:</span><p className="font-mono text-xs text-charcoal-700 break-all">{bcStatus.backendWallet}</p></div>}
                      {bcStatus.network?.chainId && <div><span className="text-charcoal-400 text-xs">Chain ID:</span><p className="text-charcoal-700">{bcStatus.network.chainId}</p></div>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatTile icon={<Package size={18} />} label="Total Batches" value={bcStatus.stats?.total} color="charcoal" />
                    <StatTile icon={<CheckCircle size={18} />} label="Confirmed" value={bcStatus.stats?.confirmed} color="forest" />
                    <StatTile icon={<Clock size={18} />} label="Pending" value={bcStatus.stats?.pending} color="amber" />
                    <StatTile icon={<AlertTriangle size={18} />} label="Failed" value={bcStatus.stats?.failed} color="red" />
                  </div>

                  {!bcStatus.blockchainAvailable && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                      <p className="font-semibold mb-1">⚠️ Blockchain Configuration Required</p>
                      <p>Set these environment variables on Render:</p>
                      <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                        <li><code>BLOCKCHAIN_RPC_URL</code> — Sepolia/Polygon testnet RPC</li>
                        <li><code>BLOCKCHAIN_PRIVATE_KEY</code> — Backend wallet private key (NEVER expose)</li>
                        <li><code>HONEYCHAIN_CONTRACT_ADDRESS</code> — Deployed contract address</li>
                        <li><code>BLOCKCHAIN_CHAIN_ID</code> — Chain ID</li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Sellers Tab ── */}
          {activeTab === 'sellers' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200">
                <h3 className="font-display font-bold text-charcoal-800">
                  Pending Seller Verifications
                  {pendingSellers.length > 0 && <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{pendingSellers.length} pending</span>}
                </h3>
              </div>
              {pendingSellers.length === 0 ? (
                <div className="text-center py-12"><CheckCircle size={32} className="text-forest-400 mx-auto mb-3" /><p className="text-charcoal-500">No pending seller verifications.</p></div>
              ) : (
                <div className="divide-y divide-cream-100">
                  {pendingSellers.map(seller => (
                    <div key={seller.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-charcoal-800">{seller.name}</p>
                        <p className="text-xs text-charcoal-400">{seller.email}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-charcoal-500">
                          {seller.farm_name && <span>🌾 {seller.farm_name}</span>}
                          {seller.district && <span>📍 {[seller.district, seller.state].filter(Boolean).join(', ')}</span>}
                          {seller.number_of_colonies && <span>🐝 {seller.number_of_colonies} colonies</span>}
                          {seller.experience_years != null && <span>⏱ {seller.experience_years} yrs exp</span>}
                        </div>
                        <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${seller.verification_status === 'PENDING' ? 'bg-amber-100 text-amber-700' : seller.verification_status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{seller.verification_status?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleSellerAction(seller.id, 'verify')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-2 bg-forest-500 text-white rounded-xl text-xs font-semibold hover:bg-forest-600 disabled:opacity-60">
                          {actionLoading === `seller-${seller.id}-verify` ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                        </button>
                        <button onClick={() => handleSellerAction(seller.id, 'reject')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-60">
                          {actionLoading === `seller-${seller.id}-reject` ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />} Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Experts Tab ── */}
          {activeTab === 'experts' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200">
                <h3 className="font-display font-bold text-charcoal-800">
                  Pending Expert Verifications
                  {pendingExperts.length > 0 && <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{pendingExperts.length} pending</span>}
                </h3>
              </div>
              {pendingExperts.length === 0 ? (
                <div className="text-center py-12"><CheckCircle size={32} className="text-forest-400 mx-auto mb-3" /><p className="text-charcoal-500">No pending expert verifications.</p></div>
              ) : (
                <div className="divide-y divide-cream-100">
                  {pendingExperts.map(expert => (
                    <div key={expert.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-charcoal-800">{expert.name}</p>
                        <p className="text-xs text-charcoal-400">{expert.email}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-charcoal-500">
                          {expert.qualification && <span>🎓 {expert.qualification}</span>}
                          {expert.specialization && <span>🔬 {expert.specialization}</span>}
                          {expert.experience_years != null && <span>⏱ {expert.experience_years} yrs exp</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleExpertAction(expert.id, 'verify')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-2 bg-forest-500 text-white rounded-xl text-xs font-semibold hover:bg-forest-600 disabled:opacity-60">
                          {actionLoading === `expert-${expert.id}-verify` ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                        </button>
                        <button onClick={() => handleExpertAction(expert.id, 'reject')} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-60">
                          {actionLoading === `expert-${expert.id}-reject` ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />} Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200"><h3 className="font-display font-bold text-charcoal-800">All Users</h3></div>
              {recentUsers.length === 0 ? (
                <div className="text-center py-12"><Users size={32} className="text-charcoal-300 mx-auto mb-3" /><p className="text-charcoal-400">No users registered yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-cream-50 border-b border-cream-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase">Role</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {recentUsers.map(u => (
                        <tr key={u.id}>
                          <td className="px-5 py-3 font-medium text-charcoal-800">{u.name}</td>
                          <td className="px-5 py-3 text-charcoal-500">{u.email}</td>
                          <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'SELLER' ? 'bg-forest-100 text-forest-700' : u.role === 'EXPERT' ? 'bg-blue-100 text-blue-700' : u.role === 'COLLECTOR' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                          <td className="px-5 py-3 text-charcoal-400 text-xs">{new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Fraud Tab ── */}
          {activeTab === 'fraud' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200"><h3 className="font-display font-bold text-charcoal-800">Fraud Flags</h3></div>
              {fraudFlags.length === 0 ? (
                <div className="text-center py-12"><CheckCircle size={32} className="text-forest-400 mx-auto mb-3" /><p className="text-charcoal-500">No fraud flags at this time.</p></div>
              ) : (
                <div className="divide-y divide-cream-100">
                  {fraudFlags.map(flag => (
                    <div key={flag.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-charcoal-800 text-sm">{flag.flag_type || flag.type}</p>
                          <p className="text-xs text-charcoal-500 mt-0.5">{flag.flagged_user_name && `User: ${flag.flagged_user_name}`}{flag.flagged_user_email && ` (${flag.flagged_user_email})`}</p>
                          {flag.description && <p className="text-xs text-charcoal-400 mt-1">{flag.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {flag.severity && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[flag.severity?.toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>{flag.severity?.toUpperCase()}</span>}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${flag.status === 'PENDING_REVIEW' ? 'bg-red-100 text-red-700' : flag.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{flag.status?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
