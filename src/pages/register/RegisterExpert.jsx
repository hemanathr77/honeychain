import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterExpert() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    qualification: '', specialization: '', experience_years: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email || !form.password) return setError('Name, email, and password are required.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!form.qualification.trim() || !form.specialization.trim()) return setError('Qualification and specialization are required.');

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(), email: form.email, phone: form.phone, password: form.password, role: 'EXPERT',
        qualification: form.qualification.trim(), specialization: form.specialization.trim(),
        experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
      });
      navigate('/expert-dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-honey-50 via-cream-50 to-forest-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏅</div>
          <h1 className="font-display font-black text-2xl text-charcoal-900">Register as an Expert</h1>
          <p className="text-charcoal-500 text-sm mt-1">Share your knowledge. Mentor beekeepers. Build trust.</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="text-xs text-amber-700">⏳ Admin verification required before you can answer questions</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-cream-200 pb-4">
              <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-3">Account Details</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input className="input-field" placeholder="Dr. / Prof. / Your name" type="text" value={form.name} onChange={set('name')} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-charcoal-700 block mb-1">Email <span className="text-red-500">*</span></label>
                    <input className="input-field" placeholder="email@example.com" type="email" value={form.email} onChange={set('email')} required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-charcoal-700 block mb-1">Phone</label>
                    <input className="input-field" placeholder="+91 98765 43210" type="tel" value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-charcoal-700 block mb-1">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input className="input-field pr-11" placeholder="Min. 8 chars" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} required />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-charcoal-700 block mb-1">Confirm Password <span className="text-red-500">*</span></label>
                    <input className="input-field" placeholder="Re-enter" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-3">Professional Details</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">Qualification <span className="text-red-500">*</span></label>
                  <input className="input-field" placeholder="e.g. M.Sc. Agriculture, Ph.D. Apiculture" type="text" value={form.qualification} onChange={set('qualification')} required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">Specialization <span className="text-red-500">*</span></label>
                  <input className="input-field" placeholder="e.g. Apiculture, Bee Disease Management" type="text" value={form.specialization} onChange={set('specialization')} required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">Years of Experience</label>
                  <input className="input-field" placeholder="e.g. 12" type="number" min="0" max="60" value={form.experience_years} onChange={set('experience_years')} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Register as Expert <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-honey-700 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
