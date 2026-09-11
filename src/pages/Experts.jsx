import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Star, Award, Globe, ChevronRight, Search, RefreshCw, AlertCircle, X } from 'lucide-react';
import { experts as expertsApi } from '../services/api';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['All', 'Experienced Beekeeper', 'Agricultural Officer', 'Bee Health Professional', 'Trainer', 'Food Quality Expert'];

export default function Experts() {
  const { t } = useApp();
  const tr = t?.experts || {};

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selected, setSelected] = useState(null);

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await expertsApi.list();
      setExperts(res.experts || []);
    } catch (err) {
      setError(err.message || (tr.loadError || 'Unable to load experts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [tr.loadError]);

  useEffect(() => { loadExperts(); }, [loadExperts]);

  const filtered = experts.filter(e => {
    const matchSearch = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      e.district?.toLowerCase().includes(search.toLowerCase()) ||
      e.state?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || e.category === selectedCat || e.expert_type === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-5xl mb-4">🏅</div>
          <h1 className="section-title mb-4">{tr.title || 'Expert Directory'}</h1>
          <p className="section-subtitle mx-auto mb-6">
            {tr.subtitle || 'Connect with verified beekeeping experts, agricultural officers, and food quality specialists.'}
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder={tr.searchPlaceholder || 'Search by name, specialization, or location...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-11 pr-10 py-4 text-base shadow-card"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCat === cat ? 'bg-honey-500 text-white shadow-honey' : 'bg-white text-charcoal-600 border border-cream-200 hover:border-honey-300'
              }`}
            >
              {cat === 'All' ? (tr.allCategories || 'All') : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-cream-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="skeleton w-14 h-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-charcoal-600 mb-4">{error}</p>
            <button onClick={loadExperts} className="btn-primary flex items-center gap-2 mx-auto">
              <RefreshCw size={15} /> {t?.common?.tryAgain || 'Try Again'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏅</div>
            <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">
              {tr.noExperts || 'No experts found.'}
            </h3>
            <p className="text-charcoal-400 text-sm">
              {experts.length === 0
                ? 'No verified experts are registered yet.'
                : (tr.noExpertsHint || 'Try adjusting your search.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(expert => (
              <div
                key={expert.id}
                className="bg-white rounded-2xl shadow-card border border-cream-200 p-5 hover:shadow-honey hover:-translate-y-0.5 transition-all cursor-pointer group"
                onClick={() => setSelected(selected?.id === expert.id ? null : expert)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-honey-100 to-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {expert.avatar_url ? (
                      <img src={expert.avatar_url} alt={expert.name} className="w-14 h-14 rounded-2xl object-cover" onError={e => { e.target.style.display='none'; }} />
                    ) : '👨‍🔬'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-charcoal-800 truncate">{expert.name}</p>
                    <p className="text-xs text-charcoal-500 truncate">{expert.category || expert.expert_type || 'Expert'}</p>
                    {expert.is_verified && (
                      <span className="text-xs text-forest-600 flex items-center gap-1 mt-0.5">
                        <Award size={11} className="text-forest-500" /> Verified Expert
                      </span>
                    )}
                  </div>
                </div>

                {expert.specialization && (
                  <p className="text-xs text-charcoal-600 mb-3 line-clamp-2">{expert.specialization}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-charcoal-500">
                  {(expert.district || expert.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-forest-400" />
                      {[expert.district, expert.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {expert.experience_years != null && (
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-honey-400" />
                      {expert.experience_years} {tr.experience || 'yrs exp'}
                    </span>
                  )}
                  {expert.languages && (
                    <span className="flex items-center gap-1">
                      <Globe size={11} />
                      {Array.isArray(expert.languages) ? expert.languages.join(', ') : expert.languages}
                    </span>
                  )}
                </div>

                {/* Expanded info */}
                {selected?.id === expert.id && (
                  <div className="mt-4 pt-4 border-t border-cream-200 animate-slide-up">
                    {expert.qualification && (
                      <p className="text-xs text-charcoal-600 mb-2">
                        <span className="font-semibold">Qualification: </span>{expert.qualification}
                      </p>
                    )}
                    {expert.bio && (
                      <p className="text-xs text-charcoal-600 mb-3">{expert.bio}</p>
                    )}
                    {expert.contact_email && (
                      <a
                        href={`mailto:${expert.contact_email}`}
                        className="text-xs text-honey-700 font-medium hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {tr.contact || 'Contact Expert'} →
                      </a>
                    )}
                  </div>
                )}

                <button className="mt-4 w-full text-xs text-honey-600 font-medium flex items-center justify-center gap-1 group-hover:text-honey-700">
                  {selected?.id === expert.id ? 'Show less' : (tr.viewProfile || 'View Profile')} <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
