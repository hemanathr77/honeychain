import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email || !form.password) {
      return setError('Name, email, and password are required.');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email, phone: form.phone, password: form.password, role: 'CUSTOMER' });
      navigate('/customer-dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-honey-50 via-cream-50 to-forest-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛍️</div>
          <h1 className="font-display font-black text-2xl text-charcoal-900">Create Customer Account</h1>
          <p className="text-charcoal-500 text-sm mt-1">Browse & purchase verified honey from real beekeepers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-charcoal-700 block mb-1">Full Name <span className="text-red-500">*</span></label>
              <input className="input-field" placeholder="Your full name" type="text" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-charcoal-700 block mb-1">Email Address <span className="text-red-500">*</span></label>
              <input className="input-field" placeholder="email@example.com" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-charcoal-700 block mb-1">Phone Number</label>
              <input className="input-field" placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="text-sm font-semibold text-charcoal-700 block mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input className="input-field pr-11" placeholder="Min. 8 characters" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-charcoal-700 block mb-1">Confirm Password <span className="text-red-500">*</span></label>
              <input className="input-field" placeholder="Re-enter password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create Customer Account <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-honey-700 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-charcoal-400">
            Registering as a seller, expert, or collector?{' '}
            <Link to="/login" className="text-honey-600 font-medium">Choose your role</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
