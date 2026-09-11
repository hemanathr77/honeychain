import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Users, Package, AlertTriangle, ShieldCheck,
  CheckCircle, XCircle, RefreshCw, AlertCircle,
  Siren, MessageSquare, Flag, Shield
} from 'lucide-react';
import { admin as adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/Badges';
import { useApp } from '../context/AppContext';

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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

  useEffect(() => { loadAll(); }, [loadAll]);

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
    { id: 'overview', label: tr.tabs?.overview || 'Overview', icon: BarChart2 },
    { id: 'sellers', label: tr.tabs?.sellers || 'Sellers', icon: Shield, badge: pendingSellers.length },
    { id: 'experts', label: tr.tabs?.experts || 'Experts', icon: Users, badge: pendingExperts.length },
    { id: 'users', label: tr.tabs?.users || 'Users', icon: Users },
    { id: 'fraud', label: tr.tabs?.fraud || 'Fraud Flags', icon: Flag, badge: fraudFlags.filter(f => f.status === 'PENDING_REVIEW').length },
  ];

  return (
    <div className="min-h-screen bg-charcoal-50">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-charcoal-800 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Admin header */}
      <div className="bg-charcoal-900 text-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={22} className="text-honey-400" />
              <h1 className="font-display font-bold text-xl">
                {tr.title || 'HoneyChain Admin Dashboard'}
              </h1>
            </div>
            <p className="text-xs text-charcoal-400">
              Logged in as <span className="text-honey-300 font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="flex items-center gap-1.5 text-xs text-charcoal-300 hover:text-white bg-charcoal-800 px-3 py-2 rounded-lg">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={logout} className="text-xs text-charcoal-300 hover:text-red-400 px-3 py-2">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Loading / error */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <RefreshCw size={32} className="animate-spin text-honey-500 mx-auto mb-4" />
          <p className="text-charcoal-400">Loading dashboard data...</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
          <p className="text-charcoal-700 mb-4">{error}</p>
          <button onClick={loadAll} className="btn-primary text-sm">Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab navigation */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 bg-white rounded-2xl p-1 shadow-card border border-cream-200">
            {TABS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === id ? 'bg-honey-500 text-white shadow-honey' : 'text-charcoal-500 hover:text-charcoal-800 hover:bg-cream-50'
                }`}
              >
                <Icon size={15} />
                {label}
                {badge != null && badge > 0 && (
                  <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    activeTab === id ? 'bg-white text-honey-600' : 'bg-red-500 text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatTile icon={<Users size={18} />} label={tr.stats?.totalUsers || 'Total Users'} value={stats?.total_users} color="charcoal" />
                <StatTile icon={<Shield size={18} />} label={tr.stats?.verifiedSellers || 'Verified Sellers'} value={stats?.sellers} color="forest" />
                <StatTile icon={<Package size={18} />} label={tr.stats?.totalProducts || 'Total Products'} value={stats?.total_products} color="honey" />
                <StatTile icon={<Siren size={18} />} label={tr.stats?.rescueRequests || 'Rescue Requests'} value={stats?.total_rescues} color="orange" />
                <StatTile icon={<AlertTriangle size={18} />} label={tr.stats?.pendingSellers || 'Pending Sellers'} value={stats?.pending_sellers} color="amber" />
                <StatTile icon={<Users size={18} />} label={tr.stats?.pendingExperts || 'Pending Experts'} value={stats?.pending_experts} color="blue" />
                <StatTile icon={<BarChart2 size={18} />} label={tr.stats?.totalOrders || 'Total Orders'} value={stats?.total_orders} color="purple" />
                <StatTile icon={<Flag size={18} />} label={tr.stats?.fraudFlags || 'Fraud Flags'} value={stats?.fraud_flags} color="red" />
              </div>

              {/* Recent users */}
              {recentUsers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-cream-200">
                    <h3 className="font-display font-bold text-charcoal-800">Recent Registrations</h3>
                  </div>
                  <div className="divide-y divide-cream-100">
                    {recentUsers.map(u => (
                      <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-charcoal-800 text-sm">{u.name}</p>
                          <p className="text-xs text-charcoal-400">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'SELLER' ? 'bg-forest-100 text-forest-700' :
                            u.role === 'EXPERT' ? 'bg-blue-100 text-blue-700' :
                            u.role === 'COLLECTOR' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{u.role}</span>
                          <p className="text-xs text-charcoal-400 mt-0.5">
                            {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Pending Sellers Tab ── */}
          {activeTab === 'sellers' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200">
                <h3 className="font-display font-bold text-charcoal-800">
                  {tr.pendingSellers || 'Pending Seller Verifications'}
                  {pendingSellers.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {pendingSellers.length} pending
                    </span>
                  )}
                </h3>
              </div>

              {pendingSellers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={32} className="text-forest-400 mx-auto mb-3" />
                  <p className="text-charcoal-500">{tr.noPendingSellers || 'No pending seller verifications.'}</p>
                </div>
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
                        <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          seller.verification_status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          seller.verification_status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {seller.verification_status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSellerAction(seller.id, 'verify')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-forest-500 text-white rounded-xl text-xs font-semibold hover:bg-forest-600 disabled:opacity-60"
                        >
                          {actionLoading === `seller-${seller.id}-verify` ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          {tr.verifyAction || 'Approve'}
                        </button>
                        <button
                          onClick={() => handleSellerAction(seller.id, 'reject')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-60"
                        >
                          {actionLoading === `seller-${seller.id}-reject` ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
                          {tr.rejectAction || 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Pending Experts Tab ── */}
          {activeTab === 'experts' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200">
                <h3 className="font-display font-bold text-charcoal-800">
                  {tr.pendingExperts || 'Pending Expert Verifications'}
                  {pendingExperts.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {pendingExperts.length} pending
                    </span>
                  )}
                </h3>
              </div>

              {pendingExperts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={32} className="text-forest-400 mx-auto mb-3" />
                  <p className="text-charcoal-500">{tr.noPendingExperts || 'No pending expert verifications.'}</p>
                </div>
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
                        <button
                          onClick={() => handleExpertAction(expert.id, 'verify')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-forest-500 text-white rounded-xl text-xs font-semibold hover:bg-forest-600 disabled:opacity-60"
                        >
                          {actionLoading === `expert-${expert.id}-verify` ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          {tr.verifyAction || 'Approve'}
                        </button>
                        <button
                          onClick={() => handleExpertAction(expert.id, 'reject')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-60"
                        >
                          {actionLoading === `expert-${expert.id}-reject` ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
                          {tr.rejectAction || 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── All Users Tab ── */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200">
                <h3 className="font-display font-bold text-charcoal-800">Recent Registrations</h3>
              </div>
              {recentUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={32} className="text-charcoal-300 mx-auto mb-3" />
                  <p className="text-charcoal-400">No users registered yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-50 border-b border-cream-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Role</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-charcoal-500 uppercase tracking-wide">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {recentUsers.map(u => (
                        <tr key={u.id}>
                          <td className="px-5 py-3 font-medium text-charcoal-800">{u.name}</td>
                          <td className="px-5 py-3 text-charcoal-500">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'SELLER' ? 'bg-forest-100 text-forest-700' :
                              u.role === 'EXPERT' ? 'bg-blue-100 text-blue-700' :
                              u.role === 'COLLECTOR' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-5 py-3 text-charcoal-400 text-xs">
                            {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Fraud Flags Tab ── */}
          {activeTab === 'fraud' && (
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200">
                <h3 className="font-display font-bold text-charcoal-800">
                  {tr.fraudFlags || 'Fraud Flags'}
                </h3>
              </div>

              {fraudFlags.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={32} className="text-forest-400 mx-auto mb-3" />
                  <p className="text-charcoal-500">{tr.noFraudFlags || 'No fraud flags at this time.'}</p>
                </div>
              ) : (
                <div className="divide-y divide-cream-100">
                  {fraudFlags.map(flag => (
                    <div key={flag.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-charcoal-800 text-sm">{flag.flag_type || flag.type}</p>
                          <p className="text-xs text-charcoal-500 mt-0.5">
                            {flag.flagged_user_name && `User: ${flag.flagged_user_name}`}
                            {flag.flagged_user_email && ` (${flag.flagged_user_email})`}
                          </p>
                          {flag.description && (
                            <p className="text-xs text-charcoal-400 mt-1">{flag.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {flag.severity && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[flag.severity?.toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
                              {flag.severity?.toUpperCase()}
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            flag.status === 'PENDING_REVIEW' ? 'bg-red-100 text-red-700' :
                            flag.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {flag.status?.replace(/_/g, ' ')}
                          </span>
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
