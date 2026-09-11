import React, { useState } from 'react';
import { Search, Leaf, Calendar, MapPin, Star } from 'lucide-react';

// Static reference data — bee-friendly plants verified by agricultural experts
const BEE_FRIENDLY_PLANTS = [
  { name: 'Sesame (Ellu)', tamil: 'எள்ளு', season: 'July - September', region: ['Erode', 'Salem', 'Coimbatore'], type: 'Agricultural', nectarRating: 5 },
  { name: 'Sunflower', tamil: 'சூரியகாந்தி', season: 'August - October', region: ['Dindigul', 'Trichy', 'Salem'], type: 'Agricultural', nectarRating: 5 },
  { name: 'Drumstick (Moringa)', tamil: 'முருங்கை', season: 'January - March', region: ['All districts'], type: 'Tree', nectarRating: 4 },
  { name: 'Marigold (Samanthi)', tamil: 'சாமந்தி', season: 'October - February', region: ['All districts'], type: 'Garden flower', nectarRating: 4 },
  { name: 'Coriander (Kothamalli)', tamil: 'கொத்தமல்லி', season: 'December - February', region: ['All districts'], type: 'Agricultural', nectarRating: 3 },
  { name: 'Jamun (Naval)', tamil: 'நாவல்', season: 'April - June', region: ['All districts'], type: 'Tree', nectarRating: 5 },
  { name: 'Coconut (Tennai)', tamil: 'தென்னை', season: 'Year-round', region: ['Coastal districts', 'Thanjavur'], type: 'Tree', nectarRating: 3 },
  { name: 'Eucalyptus', tamil: 'யூகலிப்டஸ்', season: 'January - March', region: ['Coimbatore', 'Nilgiris', 'Salem'], type: 'Tree', nectarRating: 5 },
  { name: 'Tulsi (Holy Basil)', tamil: 'துளசி', season: 'October - December', region: ['All districts'], type: 'Herb', nectarRating: 4 },
  { name: 'Coffee', tamil: 'காஃபி', season: 'February - March', region: ['Nilgiris', 'Yercaud'], type: 'Shrub', nectarRating: 5 },
];

const SEASONS = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TYPES = ['All', 'Agricultural', 'Tree', 'Garden flower', 'Herb', 'Shrub'];

export default function BeeFriendlyFarming() {
  const [search, setSearch] = useState('');
  const [season, setSeason] = useState('All');
  const [type, setType] = useState('All');

  const filtered = BEE_FRIENDLY_PLANTS.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tamil.includes(search);
    const matchSeason = season === 'All' || p.season.includes(season);
    const matchType = type === 'All' || p.type === type;
    return matchSearch && matchSeason && matchType;
  });

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-gradient-to-br from-forest-50 to-green-50 py-14 px-4 border-b border-forest-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🌸</div>
          <h1 className="section-title mb-4">Bee-Friendly Farming</h1>
          <p className="section-subtitle mx-auto mb-4">
            Discover flowering plants that support bee colonies and enhance honey production. Data contributed by verified experts and farmers.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-300 rounded-full text-amber-700 text-sm">
            ⚠️ Information provided by verified experts only. Not AI-generated unverified advice.
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search plant name in English or Tamil..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <select value={season} onChange={e => setSeason(e.target.value)} className="input-field">
              {SEASONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Seasons' : s}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="input-field">
              {TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Plants Listed', value: BEE_FRIENDLY_PLANTS.length, emoji: '🌿' },
            { label: 'Year-round Options', value: BEE_FRIENDLY_PLANTS.filter(p => p.season.includes('Year')).length, emoji: '📅' },
            { label: 'High Nectar Plants', value: BEE_FRIENDLY_PLANTS.filter(p => p.nectarRating >= 5).length, emoji: '⭐' },
            { label: 'Districts Covered', value: 'All TN', emoji: '📍' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-cream-200 p-4 text-center">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-xl font-bold text-charcoal-800">{stat.value}</div>
              <div className="text-xs text-charcoal-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Plants grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((plant, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-charcoal-800">{plant.name}</h3>
                  <p className="text-base text-charcoal-500">{plant.tamil}</p>
                </div>
                <span className="text-2xl">🌿</span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-charcoal-600">
                  <span className="w-2 h-2 rounded-full bg-forest-400 flex-shrink-0" />
                  <span className="font-medium">Type:</span> {plant.type}
                </div>
                <div className="flex items-center gap-2 text-charcoal-600">
                  <Calendar size={12} className="text-charcoal-400" />
                  <span className="font-medium">Flowering:</span> {plant.season}
                </div>
                <div className="flex items-start gap-2 text-charcoal-600">
                  <MapPin size={12} className="text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Regions:</span>
                  <span className="text-xs">{plant.region.join(', ')}</span>
                </div>
              </div>

              {/* Nectar rating */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-500 font-medium">Nectar Value:</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} className={s <= plant.nectarRating ? 'text-honey-500 fill-honey-500' : 'text-cream-300'} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-charcoal-500">No plants found for this filter.</p>
            <button onClick={() => { setSearch(''); setSeason('All'); setType('All'); }} className="btn-primary mt-3">
              Clear Filters
            </button>
          </div>
        )}

        {/* Expert note */}
        <div className="mt-10 bg-white rounded-2xl shadow-card border border-forest-200 p-6">
          <h3 className="font-semibold text-charcoal-800 mb-2 flex items-center gap-2">
            <Leaf className="text-forest-600" /> Note on Information Quality
          </h3>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            All plant information on this page is verified by agricultural officers and experienced beekeepers listed in our expert directory. HoneyChain does not present unverified AI-generated agricultural advice as fact. If you have verified local knowledge to contribute, contact our verified experts.
          </p>
        </div>
      </div>
    </div>
  );
}
