import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Plus, User,
  MapPin, Star, AlertCircle, RefreshCw, Send, X
} from 'lucide-react';
import { questions as questionsApi, experts as expertsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';

export default function Learn() {
  const { user } = useAuth();
  const { showToast } = useCart();
  const { t } = useApp();

  const [questions, setQuestions] = useState([]);
  const [activeExperts, setActiveExperts] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);
  const [showAskForm, setShowAskForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Answer state per question
  const [answersByQ, setAnswersByQ] = useState({});
  const [answersLoading, setAnswersLoading] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [qRes, eRes] = await Promise.all([
        questionsApi.list(),
        expertsApi.list({ verified: 'true', limit: 5 }),
      ]);
      setQuestions(qRes.questions || []);
      setActiveExperts(eRes.experts || []);
    } catch (err) {
      setError(err.message || 'Unable to load community questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadAnswers = async (questionId) => {
    if (answersByQ[questionId]) return; // already loaded
    setAnswersLoading(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await questionsApi.answers(questionId);
      setAnswersByQ(prev => ({ ...prev, [questionId]: res.answers || [] }));
    } catch {
      setAnswersByQ(prev => ({ ...prev, [questionId]: [] }));
    } finally {
      setAnswersLoading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleToggleQuestion = (qId) => {
    if (expandedQ === qId) {
      setExpandedQ(null);
    } else {
      setExpandedQ(qId);
      loadAnswers(qId);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('error', 'Please login to post a question.');
      return;
    }
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      await questionsApi.ask({ question: questionText.trim(), category: category || undefined });
      showToast('success', 'Your question has been posted! Experts will respond soon.');
      setQuestionText('');
      setCategory('');
      setShowAskForm(false);
      loadData(); // refresh question list
    } catch (err) {
      showToast('error', err.message || 'Failed to post question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="section-title mb-4">
            {t?.learn?.title || 'Learn From People Who Do It.'}
          </h1>
          <p className="section-subtitle mx-auto mb-4">
            {t?.learn?.subtitle || 'Ask questions, share knowledge, and learn from experienced beekeepers and agricultural experts — a real community, not an AI chatbot.'}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-300 rounded-full text-amber-700 text-sm font-medium">
            👥 {t?.learn?.communityNote || 'This is a community system — answers from real verified farmers and experts only'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-charcoal-800">
                {t?.learn?.communityQuestions || 'Community Questions'}
              </h2>
              <button
                onClick={() => setShowAskForm(!showAskForm)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} />
                {t?.learn?.askQuestion || 'Ask a Question'}
              </button>
            </div>

            {/* Ask question form */}
            {showAskForm && (
              <form onSubmit={handleAsk} className="bg-white rounded-2xl shadow-card border border-cream-200 p-5 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-charcoal-800">
                    {t?.learn?.askCommunity || 'Ask the Community'}
                  </h3>
                  <button type="button" onClick={() => setShowAskForm(false)} className="text-charcoal-400 hover:text-charcoal-600">
                    <X size={16} />
                  </button>
                </div>
                {!user && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    You must be logged in to post a question.
                  </div>
                )}
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input-field mb-3"
                >
                  <option value="">Select category (optional)</option>
                  {['Colony Health', 'Queen Rearing', 'Honey Harvest', 'Disease & Pests', 'Equipment', 'Bee-Friendly Plants', 'Registration & Verification', 'Marketing', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Describe your beekeeping question clearly..."
                  className="input-field resize-none mb-3"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !user}
                    className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? 'Posting...' : (t?.learn?.postQuestion || 'Post Question')}
                  </button>
                  <button type="button" onClick={() => setShowAskForm(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-cream-200 p-5">
                    <div className="skeleton h-5 w-3/4 mb-3" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p>{error}</p>
                  <button onClick={loadData} className="mt-2 text-red-600 font-semibold hover:underline flex items-center gap-1">
                    <RefreshCw size={12} /> Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && questions.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-cream-200">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-display font-bold text-lg text-charcoal-700 mb-2">
                  {t?.learn?.noQuestions || 'No questions yet.'}
                </h3>
                <p className="text-charcoal-400 text-sm mb-4">
                  {t?.learn?.noQuestionsHint || 'Be the first to ask a beekeeping question!'}
                </p>
                <button
                  onClick={() => setShowAskForm(true)}
                  className="btn-primary text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus size={14} /> Ask First Question
                </button>
              </div>
            )}

            {/* Questions list */}
            {!loading && !error && questions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
                {/* Question header */}
                <button
                  onClick={() => handleToggleQuestion(q.id)}
                  className="w-full text-left p-5 hover:bg-cream-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-honey-100 rounded-xl flex items-center justify-center text-lg font-bold text-honey-700 flex-shrink-0">
                      {(q.farmer_name || q.asker_name || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-charcoal-800 text-left leading-snug">{q.question}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-charcoal-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {q.farmer_name || q.asker_name || 'Anonymous'}
                        </span>
                        {q.category && (
                          <span className="px-2 py-0.5 bg-honey-50 text-honey-700 border border-honey-200 rounded-full">
                            {q.category}
                          </span>
                        )}
                        <span>{new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1 text-honey-600 font-medium">
                          <MessageSquare size={10} />
                          {q.answer_count ?? (answersByQ[q.id]?.length ?? 0)} answers
                        </span>
                      </div>
                    </div>
                    {expandedQ === q.id
                      ? <ChevronUp size={16} className="text-charcoal-400 flex-shrink-0" />
                      : <ChevronDown size={16} className="text-charcoal-400 flex-shrink-0" />}
                  </div>
                </button>

                {/* Answers */}
                {expandedQ === q.id && (
                  <div className="border-t border-cream-100 divide-y divide-cream-100">
                    {answersLoading[q.id] && (
                      <div className="p-4 text-center">
                        <RefreshCw size={16} className="animate-spin text-honey-500 mx-auto" />
                      </div>
                    )}
                    {!answersLoading[q.id] && (answersByQ[q.id] || []).length === 0 && (
                      <div className="p-5 text-center text-sm text-charcoal-400">
                        No answers yet. Be the first to answer!
                      </div>
                    )}
                    {!answersLoading[q.id] && (answersByQ[q.id] || []).map(a => (
                      <div key={a.id} className="p-5 bg-forest-50/30">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center text-lg font-bold text-forest-700 flex-shrink-0">
                            {(a.expert_name || 'E')[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-charcoal-800">{a.expert_name}</p>
                              {a.expert_specialization && (
                                <span className="px-2 py-0.5 bg-forest-100 text-forest-700 rounded-full text-xs font-medium border border-forest-200">
                                  {a.expert_specialization}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-400">
                              {a.expert_experience_years != null && (
                                <span>{a.expert_experience_years} yrs experience</span>
                              )}
                              <span>{new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-charcoal-700 leading-relaxed mb-3">{a.answer}</p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-xs text-charcoal-500 bg-white px-3 py-1.5 rounded-lg border border-cream-200">
                            <ThumbsUp size={12} />
                            Helpful ({a.helpful_count || 0})
                          </span>
                        </div>
                      </div>
                    ))}

                    {user && (user.role === 'EXPERT' || user.role === 'SELLER') && (
                      <div className="p-4 bg-cream-50">
                        <p className="text-xs text-charcoal-500">
                          Answer this question from your Expert Dashboard.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5">
              <h3 className="font-semibold text-charcoal-800 mb-4">Community Guidelines</h3>
              <ul className="space-y-2 text-sm text-charcoal-500">
                {[
                  'Only verified farmers and experts can answer',
                  'No unverified claims about honey purity',
                  'Be respectful and share genuine experience',
                  'Reference your location for local advice',
                  'Do not promote non-HoneyChain products',
                ].map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-honey-500 font-bold mt-0.5">✓</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Experts from DB */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5">
              <h3 className="font-semibold text-charcoal-800 mb-4">
                {t?.learn?.activeExperts || 'Active Experts'}
              </h3>
              {activeExperts.length === 0 ? (
                <p className="text-sm text-charcoal-400">No verified experts yet.</p>
              ) : (
                <div className="space-y-3">
                  {activeExperts.slice(0, 4).map(expert => (
                    <div key={expert.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-forest-100 rounded-lg flex items-center justify-center font-bold text-forest-700 text-sm flex-shrink-0">
                        {expert.name?.[0] || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-charcoal-800 truncate">{expert.name}</p>
                        <p className="text-xs text-charcoal-400 truncate">
                          {expert.specialization || expert.qualification || 'Expert'}
                        </p>
                      </div>
                      {expert.experience_years != null && (
                        <div className="flex items-center gap-1 text-xs text-charcoal-400 flex-shrink-0">
                          <Star size={10} className="text-honey-400 fill-honey-400" />
                          {expert.experience_years}yr
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
