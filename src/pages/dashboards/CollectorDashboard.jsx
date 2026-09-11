import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Clock, CheckCircle, AlertCircle, RefreshCw,
  User, Phone, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { rescue as rescueApi } from '../../services/api';

const STATUS_COLORS = {
  REPORTED: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  COLLECTOR_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function UpdateStatusModal({ request, onClose, onSuccess }) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) return setError('Select a status.');
    setSaving(true);
    try {
      await rescueApi.updateStatus(request.id, {
        status,
        collector_notes: notes || undefined,
        honey_quantity_kg: qty ? parseFloat(qty) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h3 className="font-display font-bold text-lg">Update Rescue Status</h3>
          <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1">New Status *</label>
            <select className="input-field" value={status} onChange={e => setStatus(e.target.value)} required>
              <option value="">Select status</option>
              {['SCHEDULED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-charcoal-600 block mb-1">Notes</label>
            <textarea className="input-field" rows="2" placeholder="Any relevant notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {(status === 'COLLECTED' || status === 'COMPLETED') && (
            <div>
              <label className="text-xs font-semibold text-charcoal-600 block mb-1">Honey Collected (kg)</label>
              <input className="input-field" type="number" min="0" step="0.1" placeholder="e.g. 5.5" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CollectorDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [toast, setToast] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rescueApi.list();
      setRequests(res.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load rescue requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await rescueApi.accept(id);
      setToast('Rescue request accepted!');
      setTimeout(() => setToast(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    } finally {
      setAccepting(null);
    }
  };

  const myRequests = requests.filter(r => r.assigned_collector === user?.id);
  const openRequests = requests.filter(r => r.status === 'REPORTED');

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium">Collector Dashboard</p>
            <h1 className="font-display font-black text-2xl mt-0.5">Welcome, {user?.name?.split(' ')[0]}! 🐝</h1>
          </div>
          <button onClick={loadData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6">
          <div className="text-center">
            <p className="text-xl font-display font-black text-amber-600">{openRequests.length}</p>
            <p className="text-xs text-charcoal-500">Open Requests</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-black text-indigo-600">{myRequests.length}</p>
            <p className="text-xs text-charcoal-500">My Assignments</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-black text-green-600">
              {requests.filter(r => r.status === 'COMPLETED' && r.assigned_collector === user?.id).length}
            </p>
            <p className="text-xs text-charcoal-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-cream-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 py-1">
            {[
              { id: 'requests', label: 'Open Requests' },
              { id: 'mine', label: 'My Assignments' },
              { id: 'profile', label: 'Profile' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-charcoal-500 hover:text-charcoal-700'
                }`}
              >
                {t.label}
                {t.id === 'requests' && openRequests.length > 0 && (
                  <span className="ml-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-xs inline-flex items-center justify-center font-bold">{openRequests.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle size={16} />
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* OPEN REQUESTS */}
        {tab === 'requests' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">Available Rescue Requests</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
            ) : openRequests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                <div className="text-6xl mb-4">🐝</div>
                <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No active rescue requests</h3>
                <p className="text-charcoal-400 text-sm">New requests will appear here when reported by the community.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openRequests.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-charcoal-400">{r.request_number}</p>
                        <p className="text-sm font-semibold text-charcoal-800 mt-0.5">{r.description}</p>
                        <div className="flex items-center gap-1 text-xs text-charcoal-500 mt-1">
                          <MapPin size={10} />{r.location_description}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </div>
                    {r.approximate_size && (
                      <p className="text-xs text-charcoal-500 mb-3">Approximate size: <strong>{r.approximate_size}</strong></p>
                    )}
                    {r.reporter_name && (
                      <div className="flex items-center gap-1 text-xs text-charcoal-400 mb-3">
                        <User size={10} /> Reported by {r.reporter_name}
                        {r.reporter_phone && <><Phone size={10} className="ml-2" />{r.reporter_phone}</>}
                      </div>
                    )}
                    <button
                      onClick={() => handleAccept(r.id)}
                      disabled={accepting === r.id}
                      className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
                    >
                      {accepting === r.id ? (
                        <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Accepting...</>
                      ) : (
                        <>Accept Request <ChevronRight size={14} /></>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY ASSIGNMENTS */}
        {tab === 'mine' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">My Assignments</h2>
            {myRequests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No assignments yet</h3>
                <p className="text-charcoal-400 text-sm">Accept an open rescue request to see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-xs text-charcoal-400">{r.request_number}</p>
                        <p className="text-sm font-semibold text-charcoal-800">{r.description}</p>
                        <div className="flex items-center gap-1 text-xs text-charcoal-500 mt-1">
                          <MapPin size={10} />{r.location_description}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </div>
                    {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setUpdateModal(r)}
                        className="mt-3 btn-secondary text-sm flex items-center gap-1"
                      >
                        <Clock size={12} /> Update Status
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">My Profile</h2>
            <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0]}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{user?.name}</h3>
                  <p className="text-sm text-charcoal-500">{user?.email}</p>
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">COLLECTOR</span>
                </div>
              </div>
              <button onClick={logout} className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {updateModal && (
        <UpdateStatusModal
          request={updateModal}
          onClose={() => setUpdateModal(null)}
          onSuccess={() => { setUpdateModal(null); loadData(); }}
        />
      )}
    </div>
  );
}
