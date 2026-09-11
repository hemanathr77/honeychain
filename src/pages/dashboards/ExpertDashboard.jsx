import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, CheckCircle, Clock, AlertCircle,
  RefreshCw, ChevronRight, User, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { experts as expertsApi, questions as questionsApi } from '../../services/api';

const TABS = [
  { id: 'questions', label: 'Farmer Questions', icon: MessageCircle },
  { id: 'profile', label: 'My Profile', icon: User },
];

export default function ExpertDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('questions');
  const [stats, setStats] = useState(null);
  const [openQuestions, setOpenQuestions] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, profileRes] = await Promise.all([
        expertsApi.dashboardStats(),
        expertsApi.myProfile().catch(() => null),
      ]);
      setStats(dashRes.stats);
      setOpenQuestions(dashRes.open_questions || []);
      setMyProfile(profileRes?.profile || null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAnswer = async (questionId) => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await questionsApi.answer(questionId, { answer: answer.trim() });
      setAnswer('');
      setAnsweringId(null);
      setToast('Answer submitted successfully!');
      setTimeout(() => setToast(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const verificationStatus = myProfile?.verification_status;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Expert Dashboard</p>
            <h1 className="font-display font-black text-2xl mt-0.5">Welcome, {user?.name?.split(' ')[0]}! 🏅</h1>
            {verificationStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full mt-1">
                <CheckCircle size={10} /> Verified Expert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-400/30 text-amber-100 text-xs px-2 py-0.5 rounded-full mt-1">
                <Clock size={10} /> Pending Verification — Admin review required
              </span>
            )}
          </div>
          <button onClick={loadData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-cream-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 py-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-charcoal-500 hover:text-charcoal-700'
                }`}
              >
                <t.icon size={14} />
                {t.label}
                {t.id === 'questions' && stats?.open_questions > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">{stats.open_questions}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up">
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

        {verificationStatus !== 'VERIFIED' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Verification Pending</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your expert profile is under review by the HoneyChain admin. Once verified, you will be able to answer farmer questions and appear in the experts directory.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Open Questions', value: stats.open_questions || 0, emoji: '❓' },
              { label: 'Answers Given', value: stats.answers_given || 0, emoji: '✅' },
              { label: 'Mentorship Requests', value: stats.mentorship_requests || 0, emoji: '🤝' },
              { label: 'Active Mentorships', value: stats.active_mentorships || 0, emoji: '🌱' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-cream-200 shadow-card p-4">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className="text-2xl font-display font-black text-charcoal-800">{s.value}</p>
                <p className="text-xs text-charcoal-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* QUESTIONS TAB */}
        {tab === 'questions' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">
              Open Farmer Questions
            </h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
            ) : openQuestions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">No farmer questions yet</h3>
                <p className="text-charcoal-400 text-sm">
                  When farmers submit questions, they will appear here for you to answer.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {openQuestions.map(q => (
                  <div key={q.id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-honey-100 rounded-full flex items-center justify-center text-sm font-bold text-honey-700">
                        {q.farmer_name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-charcoal-800">{q.farmer_name}</span>
                          {q.category && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{q.category}</span>}
                        </div>
                        <p className="text-sm text-charcoal-600">{q.question}</p>
                        <p className="text-xs text-charcoal-400 mt-1">{new Date(q.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{q.answer_count} answers</span>
                    </div>

                    {answeringId === q.id ? (
                      <div className="mt-3 border-t border-cream-200 pt-3">
                        <textarea
                          className="input-field w-full"
                          rows="3"
                          placeholder="Write a helpful answer based on your expertise..."
                          value={answer}
                          onChange={e => setAnswer(e.target.value)}
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setAnsweringId(null); setAnswer(''); }} className="btn-secondary text-sm flex-1">Cancel</button>
                          <button
                            onClick={() => handleAnswer(q.id)}
                            disabled={submitting || !answer.trim()}
                            className="btn-primary text-sm flex-1 flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            <Send size={12} />
                            {submitting ? 'Submitting...' : 'Submit Answer'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAnsweringId(q.id); setAnswer(''); }}
                        disabled={verificationStatus !== 'VERIFIED'}
                        className="mt-2 text-sm text-blue-700 font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <MessageCircle size={12} /> Answer this question
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div>
            <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">My Expert Profile</h2>
            <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0]}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{user?.name}</h3>
                  <p className="text-sm text-charcoal-500">{user?.email}</p>
                  {myProfile?.specialization && <p className="text-xs text-blue-600 font-medium mt-0.5">{myProfile.specialization}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-cream-200 pt-4">
                <div><p className="text-xs text-charcoal-400">Qualification</p><p className="text-sm font-semibold">{myProfile?.qualification || '—'}</p></div>
                <div><p className="text-xs text-charcoal-400">Experience</p><p className="text-sm font-semibold">{myProfile?.experience_years ? `${myProfile.experience_years} years` : '—'}</p></div>
                <div><p className="text-xs text-charcoal-400">Organization</p><p className="text-sm font-semibold">{myProfile?.organization || '—'}</p></div>
                <div><p className="text-xs text-charcoal-400">Verification</p><p className={`text-sm font-semibold ${verificationStatus === 'VERIFIED' ? 'text-green-700' : 'text-amber-700'}`}>{verificationStatus}</p></div>
              </div>
              <button onClick={logout} className="w-full mt-6 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
