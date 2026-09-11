import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Package, Award, Calendar, ChevronRight,
  AlertCircle, RefreshCw, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { sellers as sellersApi, products as productsApi } from '../services/api';
import { VerifiedBadge } from '../components/ui/Badges';
import HoneyProductCard from '../components/ui/HoneyProductCard';
import { useApp } from '../context/AppContext';

export default function FarmerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useApp();

  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [sellerRes, productsRes] = await Promise.all([
        sellersApi.get(id),
        productsApi.list({ seller_id: id }),
      ]);
      setSeller(sellerRes.seller);
      setSellerProducts(productsRes.products || []);
    } catch (err) {
      if (err.status === 404) {
        setError('Seller not found.');
      } else {
        setError(err.message || 'Unable to load seller profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-honey-500 mx-auto mb-3" />
          <p className="text-charcoal-500">Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-card border border-cream-200 p-8 max-w-md">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-charcoal-800 mb-2">
            {error || 'Seller not found'}
          </h2>
          <p className="text-charcoal-500 text-sm mb-6">
            This seller profile does not exist or may have been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2 text-sm">
              <ArrowLeft size={14} /> Go Back
            </button>
            <Link to="/marketplace" className="btn-primary text-sm">Browse Marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  const verificationStatus = seller.verification_status?.toLowerCase() || 'pending';
  const isVerified = verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-honey-50 to-forest-50 py-12 px-4 border-b border-cream-200">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-800 mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-honey-gradient rounded-3xl flex items-center justify-center text-4xl font-bold text-white shadow-honey flex-shrink-0">
              {seller.name?.[0] || '?'}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="font-display font-black text-3xl text-charcoal-900">{seller.name}</h1>
                {isVerified && <VerifiedBadge size="lg" />}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-charcoal-500 mb-3">
                {(seller.district || seller.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {[seller.district, seller.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {seller.experience_years != null && (
                  <span className="flex items-center gap-1">
                    <Award size={14} />
                    {seller.experience_years} years experience
                  </span>
                )}
                {seller.number_of_colonies != null && (
                  <span className="flex items-center gap-1">
                    <Package size={14} />
                    {seller.number_of_colonies} colonies
                  </span>
                )}
                {seller.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Member since {new Date(seller.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              {seller.farm_description && (
                <p className="text-charcoal-500 max-w-lg text-sm leading-relaxed">{seller.farm_description}</p>
              )}
              {/* Verification status badge */}
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isVerified
                    ? 'bg-forest-100 text-forest-700 border-forest-200'
                    : verificationStatus === 'pending'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {isVerified && <ShieldCheck size={11} />}
                  {seller.verification_status?.replace(/_/g, ' ') || 'PENDING'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/marketplace?seller_id=${seller.id}`)}
                className="btn-primary text-sm"
              >
                View Honey
              </button>
              <Link to="/mentorship" className="btn-secondary text-sm text-center">
                Request Mentorship
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Info */}
      {seller.farm_name && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5">
            <h2 className="font-display font-bold text-lg text-charcoal-800 mb-3">🌾 Farm Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {seller.farm_name && (
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">Farm</p>
                  <p className="font-semibold text-charcoal-800">{seller.farm_name}</p>
                </div>
              )}
              {seller.village && (
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">Village</p>
                  <p className="font-semibold text-charcoal-800">{seller.village}</p>
                </div>
              )}
              {seller.district && (
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">District</p>
                  <p className="font-semibold text-charcoal-800">{seller.district}</p>
                </div>
              )}
              {seller.state && (
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">State</p>
                  <p className="font-semibold text-charcoal-800">{seller.state}</p>
                </div>
              )}
              {seller.production_capacity && (
                <div>
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">Annual Capacity</p>
                  <p className="font-semibold text-charcoal-800">{seller.production_capacity} kg</p>
                </div>
              )}
              {seller.bee_species?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">Bee Species</p>
                  <p className="font-semibold text-charcoal-800">{seller.bee_species.join(', ')}</p>
                </div>
              )}
              {seller.honey_types?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">Honey Types</p>
                  <p className="font-semibold text-charcoal-800">{seller.honey_types.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">
          Available Honey Products
        </h2>
        {sellerProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-cream-200">
            <div className="text-4xl mb-3">🍯</div>
            <p className="text-charcoal-500">No products listed yet.</p>
            <Link to="/marketplace" className="btn-secondary text-sm mt-4 inline-block">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerProducts.map(product => (
              <HoneyProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
