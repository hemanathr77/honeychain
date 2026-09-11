import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { role: 'CUSTOMER', emoji: '🛍️', label: 'Customer', desc: 'Browse & buy verified honey' },
  { role: 'SELLER', emoji: '👨‍🌾', label: 'Seller / Farmer', desc: 'Manage farm & products' },
  { role: 'EXPERT', emoji: '🏅', label: 'Expert', desc: 'Answer questions & mentor' },
  { role: 'COLLECTOR', emoji: '🐝', label: 'Collector', desc: 'Handle bee rescue requests' },
  { role: 'ADMIN', emoji: '🛡️', label: 'Admin', desc: 'Platform administration' },
];

const REGISTER_LINKS = {
  CUSTOMER: '/register/customer',
  SELLER: '/register/seller',
  EXPERT: '/register/expert',
  COLLECTOR: '/register/collector',
};

const DASHBOARD_ROUTES = {
  CUSTOMER: '/customer-dashboard',
  SELLER: '/seller-dashboard',
  EXPERT: '/expert-dashboard',
  COLLECTOR: '/collector-dashboard',
  ADMIN: '/admin',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      const dest = from || DASHBOARD_ROUTES[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-honey-50 via-cream-50 to-forest-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍯</div>
          <h1 className="font-display font-black text-3xl text-charcoal-900">HoneyChain</h1>
          <p className="text-charcoal-500 text-sm mt-1">Real Honey. Real Farmers. Real Traceability.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-display font-bold text-charcoal-800 mb-5">Sign In to Your Account</h2>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-charcoal-700 block mb-1">Email Address</label>
                <input
                  className="input-field"
                  placeholder="email@example.com"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-charcoal-700 block mb-1">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-11"
                    placeholder="Your password"
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>Sign In <ChevronRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Register section */}
          <div className="border-t border-cream-200 px-6 py-5 bg-cream-50">
            <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-3">New to HoneyChain?</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.filter(r => REGISTER_LINKS[r.role]).map(r => (
                <Link
                  key={r.role}
                  to={REGISTER_LINKS[r.role]}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-cream-200 bg-white hover:border-honey-300 hover:bg-honey-50 transition-all text-left"
                >
                  <span className="text-lg">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-800 text-xs">Register as {r.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="px-6 pb-5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-700 flex items-start gap-1.5">
                <Shield size={12} className="flex-shrink-0 mt-0.5" />
                Admin accounts are created securely by the system administrator and cannot be registered publicly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
