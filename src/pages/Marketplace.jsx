import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { products as productsApi } from '../services/api';
import HoneyProductCard from '../components/ui/HoneyProductCard';
import { useApp } from '../context/AppContext';

const HONEY_TYPES = ['All', 'Multi-Floral', 'Single-Floral', 'Forest Honey', 'Monofloral'];

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const { t } = useApp();
  const tr = t?.marketplace || {};

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState('All');
  const [priceMax, setPriceMax] = useState(2000);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedType !== 'All') params.honey_type = selectedType;
      if (priceMax < 2000) params.price_max = priceMax;
      if (verifiedOnly) params.verified = 'true';
      if (sortBy && sortBy !== 'featured') params.sort = sortBy;

      const res = await productsApi.list(params);
      setProducts(res.products || []);
    } catch (err) {
      setError(err.message || (tr.errorLoading || 'Unable to load products. Please try again.'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, priceMax, verifiedOnly, sortBy, tr.errorLoading]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { loadProducts(); }, 400);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const activeFiltersCount = [
    selectedType !== 'All',
    priceMax < 2000,
    verifiedOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedType('All');
    setPriceMax(2000);
    setVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="section-title mb-4">
            {tr.title || 'Find Real Honey From Real Beekeepers'}
          </h1>
          <p className="section-subtitle mx-auto mb-6">
            {tr.subtitle || 'Every product shows verification status clearly.'}
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder={tr.searchPlaceholder || 'Search honey, farmer, location, or batch ID...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-11 pr-4 py-4 text-base shadow-card"
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
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Type filters */}
          <div className="flex gap-2 flex-wrap">
            {HONEY_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedType === type ? 'bg-honey-500 text-white shadow-honey' : 'bg-white text-charcoal-600 border border-cream-200 hover:border-honey-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field py-2 pr-8 text-sm w-auto"
            >
              <option value="featured">{tr.featured || 'Featured'}</option>
              <option value="price_asc">{tr.priceLow || 'Price: Low to High'}</option>
              <option value="price_desc">{tr.priceHigh || 'Price: High to Low'}</option>
              <option value="newest">{tr.newest || 'Newest Harvest'}</option>
            </select>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                filtersOpen || activeFiltersCount > 0 ? 'bg-honey-50 border-honey-300 text-honey-700' : 'bg-white border-cream-200 text-charcoal-600 hover:border-honey-300'
              }`}
            >
              <SlidersHorizontal size={16} />
              {tr.filters || 'Filters'}
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-honey-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced filters panel */}
        {filtersOpen && (
          <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-5 mb-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block">
                  {tr.priceRange || 'Price Range'}: ₹0 – ₹{priceMax}/kg
                </label>
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={50}
                  value={priceMax}
                  onChange={e => setPriceMax(parseInt(e.target.value))}
                  className="w-full accent-honey-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2 block">
                  <Filter size={12} className="inline mr-1" />
                  {t?.common?.filter || 'Quick Filters'}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={e => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 accent-honey-500 rounded"
                  />
                  <span className="text-sm text-charcoal-700">{tr.verifiedOnly || '✓ Verified Farmer Only'}</span>
                </label>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X size={14} /> {tr.clearFilters || 'Clear all filters'}
              </button>
            )}
          </div>
        )}

        {/* Results info */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-charcoal-500">
              <span className="font-semibold text-charcoal-800">{products.length}</span>{' '}
              {tr.resultsCount || 'products found'}
              {search && <span> for "<span className="text-honey-700 font-medium">{search}</span>"</span>}
            </p>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-cream-200">
                <div className="skeleton h-40 w-full" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">
              {tr.errorLoading || 'Unable to load products.'}
            </h3>
            <p className="text-charcoal-400 mb-4">{error}</p>
            <button onClick={loadProducts} className="btn-primary flex items-center gap-2 mx-auto">
              <RefreshCw size={16} /> {t?.common?.tryAgain || 'Try Again'}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍯</div>
            <h3 className="text-xl font-display font-bold text-charcoal-700 mb-2">
              {search || activeFiltersCount > 0 ? (tr.noProductsSearch || 'No products match your search.') : (tr.noProducts || 'No products available.')}
            </h3>
            <p className="text-charcoal-400 mb-4">
              {search || activeFiltersCount > 0 ? (tr.noProductsHint || 'Try adjusting your filters.') : 'Products will appear here once sellers add them.'}
            </p>
            {(search || activeFiltersCount > 0) && (
              <button onClick={() => { setSearch(''); clearFilters(); }} className="btn-primary">
                {tr.clearFilters || 'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <HoneyProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
