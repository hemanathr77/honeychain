import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Clock, Globe, ChevronRight, CheckCircle,
  AlertCircle, RefreshCw, Send
} from 'lucide-react';
import { experts as expertsApi, mentorship as mentorshipApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';

export default function Mentorship() {
  const { user } = useAuth();
  const { showToast } = useCart();
  const { t } = useApp();

  const [step, setStep] = useState('find'); // find | results | requested
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestedMentor, setRequestedMentor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mentorshipMessage, setMentorshipMessage] = useState('');

  const [form, setForm] = useState({
    location: '',
    experience: '',
    beeSpecies: '',
    honeyType: '',
    language: '',
  });

  const loadMentors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await expertsApi.list({ verified: 'true' });
      setMentors(res.experts || []);
    } catch (err) {
      setError(err.message || 'Unable to load mentors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFindMentors = (e) => {
    e.preventDefault();
    setStep('results');
    loadMentors();
  };

  const handleRequestMentorship = async (mentor) => {
    if (!user) {
      showToast('error', 'Please login to request mentorship.');
      return;
    }
    setSubmitting(true);
    try {
      await mentorshipApi.request({
        mentor_id: mentor.user_id || mentor.id,
        message: mentorshipMessage || `I would like to learn from you about ${form.honeyType || 'beekeeping'}.`,
      });
      setRequestedMentor(mentor);
      setStep('requested');
      showToast('success', `Mentorship request sent to ${mentor.name}!`);
    } catch (err) {
      showToast('error', err.message || 'Failed to send mentorship request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-50 to-honey-50 py-14 px-4 border-b border-forest-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="section-title mb-4">
            {t?.mentorship?.title || 'Farmer-to-Farmer Mentorship'}
          </h1>
          <p className="section-subtitle mx-auto">
            {t?.mentorship?.subtitle || 'Learn beekeeping from experienced local farmers who know your region\'s climate, plants, and bee species. Real mentors. Real knowledge.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* STEP 1: Find Form */}
        {step === 'find' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">
                {t?.mentorship?.findTitle || 'Find Your Mentor'}
              </h2>
              <form onSubmit={handleFindMentors} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">
                    Your Location
                  </label>
                  <input
                    type="text"
                    placeholder="District, State (e.g. Erode, Tamil Nadu)"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">
                    Your Experience Level
                  </label>
                  <select
                    value={form.experience}
                    onChange={e => setForm({ ...form, experience: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="beginner">Beginner (0–1 years)</option>
                    <option value="intermediate">Intermediate (1–5 years)</option>
                    <option value="advanced">Advanced (5+ years)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">
                    Bee Species of Interest
                  </label>
                  <select
                    value={form.beeSpecies}
                    onChange={e => setForm({ ...form, beeSpecies: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Apis cerana">Apis cerana (Indian bee)</option>
                    <option value="Apis mellifera">Apis mellifera (European bee)</option>
                    <option value="Native">Native/Indigenous species</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">
                    Interested Honey Type
                  </label>
                  <select
                    value={form.honeyType}
                    onChange={e => setForm({ ...form, honeyType: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Multi-Floral">Multi-Floral</option>
                    <option value="Forest Honey">Forest Honey</option>
                    <option value="Single-Floral">Single-Floral Varieties</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={form.language}
                    onChange={e => setForm({ ...form, language: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Tamil">Tamil</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Malayalam">Malayalam</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  {t?.mentorship?.findBtn || 'Find Available Mentors'} <ChevronRight size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2: Results */}
        {step === 'results' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw size={32} className="animate-spin text-honey-500 mx-auto mb-3" />
                <p className="text-charcoal-400">Loading available mentors...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                  <button onClick={loadMentors} className="mt-2 text-red-600 font-semibold hover:underline">
                    Try Again
                  </button>
                </div>
              </div>
            ) : mentors.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-cream-200">
                <div className="text-5xl mb-4">🌱</div>
                <h3 className="font-display font-bold text-lg text-charcoal-700 mb-2">
                  {t?.mentorship?.noMentors || 'No verified mentors available yet.'}
                </h3>
                <p className="text-charcoal-400 text-sm mb-4">
                  Mentors are verified experts and sellers on HoneyChain. Check back soon.
                </p>
                <button onClick={() => setStep('find')} className="btn-secondary text-sm">
                  Back to Search
                </button>
              </div>
            ) : (
              <>
                <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 flex items-center gap-2">
                  <CheckCircle className="text-forest-600 flex-shrink-0" size={18} />
                  <p className="text-forest-800 font-medium text-sm">
                    {mentors.length} verified expert{mentors.length !== 1 ? 's' : ''} available as mentors.
                  </p>
                </div>

                {/* Message to mentor */}
                <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-4">
                  <label className="text-sm font-semibold text-charcoal-700 block mb-2">
                    Message to your mentor (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={mentorshipMessage}
                    onChange={e => setMentorshipMessage(e.target.value)}
                    placeholder="Briefly describe what you want to learn..."
                    className="input-field resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mentors.map(mentor => (
                    <div key={mentor.id} className="card p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-honey-gradient rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                          {mentor.name?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-800">{mentor.name}</p>
                          <p className="text-xs text-charcoal-400 mt-0.5">
                            {mentor.specialization || mentor.qualification || 'Expert Mentor'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-xs text-charcoal-500">
                        {mentor.experience_years != null && (
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {mentor.experience_years} years experience
                          </div>
                        )}
                        {(mentor.district || mentor.state) && (
                          <div className="flex items-center gap-1">
                            <MapPin size={10} />
                            {[mentor.district, mentor.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {mentor.languages?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Globe size={10} />
                            {Array.isArray(mentor.languages) ? mentor.languages.join(', ') : mentor.languages}
                          </div>
                        )}
                      </div>

                      {mentor.bio && (
                        <div className="bg-cream-50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-charcoal-600 line-clamp-3">{mentor.bio}</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleRequestMentorship(mentor)}
                        disabled={submitting || !user}
                        className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        {t?.mentorship?.requestBtn || 'Request Mentorship'}
                      </button>
                      {!user && (
                        <p className="text-xs text-charcoal-400 text-center mt-2">Login required</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Requested */}
        {step === 'requested' && requestedMentor && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 text-center">
              <div className="text-5xl mb-3">📤</div>
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-2">
                {t?.mentorship?.requested || 'Mentorship Requested!'}
              </h2>
              <p className="text-charcoal-500 mb-4">
                Your request has been sent to <strong>{requestedMentor.name}</strong>.
              </p>
              <p className="text-sm text-charcoal-400 mb-6">
                Check your dashboard for updates when the mentor responds.
              </p>

              {/* Status flow */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                {['Requested', 'Accepted', 'Active', 'Completed'].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                      s === 'Requested'
                        ? 'bg-honey-100 text-honey-700 border-honey-300'
                        : 'bg-cream-100 text-charcoal-400 border-cream-200'
                    }`}>{s}</div>
                    {i < 3 && <span className="text-charcoal-300">→</span>}
                  </React.Fragment>
                ))}
              </div>

              <button onClick={() => { setStep('find'); setRequestedMentor(null); }} className="btn-secondary w-full text-sm">
                Find Another Mentor
              </button>
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5">
              <h3 className="font-semibold text-charcoal-800 mb-4">Your Mentorship Journey</h3>
              {[
                { emoji: '🤝', step: 'Mentor Accepts', desc: 'Your mentor reviews and accepts your request' },
                { emoji: '📅', step: 'First Session Scheduled', desc: 'You agree on a learning schedule' },
                { emoji: '🐝', step: 'Active Learning', desc: 'Field visits, hive management, honey production' },
                { emoji: '🍯', step: 'First Harvest', desc: 'Harvest your honey under mentor guidance' },
                { emoji: '🧪', step: 'Lab Testing & Listing', desc: 'Submit for lab test and list on HoneyChain' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-honey-50 border border-honey-200 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal-800">{item.step}</p>
                    <p className="text-xs text-charcoal-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
