import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Star, ShoppingCart, Link2, Calendar, Package, Award,
  ChevronRight, Shield, CheckCircle, FlaskConical, ArrowLeft,
  AlertCircle, RefreshCw, User
} from 'lucide-react';
import { products as productsApi, reviews as reviewsApi } from '../services/api';
import { VerifiedBadge, LabTestedBadge, TraceableBadge, StatusBadge } from '../components/ui/Badges';
import LabReportModal from '../components/modals/LabReportModal';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useApp();
  const tr = t?.product || {};

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSize, setSelectedSize] = useState(500);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [labModalOpen, setLabModalOpen] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productRes, reviewsRes] = await Promise.all([
        productsApi.get(id),
        reviewsApi.forProduct(id).catch(() => ({ reviews: [] })),
      ]);
      setProduct(productRes.product || productRes);
      setReviews(reviewsRes.reviews || []);
    } catch (err) {
      if (err.status === 404) {
        setError(tr.notFound || 'Product not found.');
      } else {
        setError(err.message || (tr.loadError || 'Unable to load product details.'));
      }
    } finally {
      setLoading(false);
    }
  }, [id, tr.notFound, tr.loadError]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  const priceForSize = (size) => {
    if (!product?.price_per_kg) return 0;
    return Math.round((product.price_per_kg * size) / 1000);
  };

  const handleAddToCart = () => {
    if (product) addToCart(product, qty, selectedSize);
  };

  const handleBuyNow = () => {
    if (product) { addToCart(product, qty, selectedSize); navigate('/checkout'); }
  };

  const TABS = ['overview', 'traceability', 'reviews'];

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-honey-500 mx-auto mb-3" />
          <p className="text-charcoal-500">{t?.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-charcoal-800 mb-2">
            {error || (tr.notFound || 'Product not found.')}
          </h2>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/marketplace')} className="btn-secondary">
              {tr.backToMarketplace || 'Back to Marketplace'}
            </button>
            {error && !error.includes('not found') && (
              <button onClick={loadProduct} className="btn-primary">
                {t?.common?.tryAgain || 'Try Again'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1 text-sm text-charcoal-500 hover:text-honey-700 transition-colors">
          <ArrowLeft size={16} /> {tr.backToMarketplace || 'Back to Marketplace'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Product info + tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product header card */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              {/* Product visual */}
              <div className="h-56 bg-gradient-to-br from-honey-100 to-amber-50 flex items-center justify-center relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="text-8xl select-none">🍯</div>
                )}
                {/* Status badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.seller_verified && <VerifiedBadge />}
                  {product.batch_id && <TraceableBadge />}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-display font-bold text-charcoal-900">{product.name}</h1>
                    <p className="text-sm text-charcoal-500 mt-1">
                      {product.honey_type && `${product.honey_type} • `}
                      {product.seller_name && (
                        <span className="text-forest-600 font-medium">{product.seller_name}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-display font-black text-honey-600">
                      ₹{product.price_per_kg}
                    </p>
                    <p className="text-xs text-charcoal-400">{tr.perKg || '/kg'}</p>
                  </div>
                </div>

                {/* Star rating */}
                {avgRating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={16} className={s <= Math.round(parseFloat(avgRating)) ? 'text-honey-500 fill-honey-500' : 'text-cream-300'} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-charcoal-700">{avgRating}</span>
                    <span className="text-xs text-charcoal-400">({reviews.length} reviews)</span>
                  </div>
                )}

                {/* Key info row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {product.harvest_date && (
                    <div className="flex items-center gap-2 text-xs text-charcoal-600 bg-cream-50 rounded-lg px-3 py-2">
                      <Calendar size={13} className="text-honey-500" />
                      <span>{new Date(product.harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  {(product.district || product.state) && (
                    <div className="flex items-center gap-2 text-xs text-charcoal-600 bg-cream-50 rounded-lg px-3 py-2">
                      <MapPin size={13} className="text-forest-500" />
                      <span>{[product.district, product.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {product.available_quantity != null && (
                    <div className="flex items-center gap-2 text-xs text-charcoal-600 bg-cream-50 rounded-lg px-3 py-2">
                      <Package size={13} className="text-charcoal-400" />
                      <span>{product.available_quantity} kg available</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-charcoal-600 leading-relaxed mb-4">{product.description}</p>
                )}

                {/* Batch/Lab info */}
                {product.batch_id && (
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    <span className="text-xs font-mono text-honey-700 bg-honey-50 px-3 py-1 rounded-full border border-honey-200">
                      {tr.batchId || 'Batch'}: {product.batch_id}
                    </span>
                    {product.lab_report_id && (
                      <button
                        onClick={() => setLabModalOpen(true)}
                        className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700 font-medium"
                      >
                        <FlaskConical size={12} /> {tr.viewLabReport || 'View Lab Report'}
                      </button>
                    )}
                    <Link
                      to={`/traceability/${product.batch_id}`}
                      className="text-xs text-forest-600 flex items-center gap-1 hover:text-forest-700 font-medium"
                    >
                      <Link2 size={12} /> {tr.traceability || 'Trace This Batch'}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-200">
              <div className="flex border-b border-cream-200">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                      activeTab === tab ? 'border-honey-500 text-honey-700' : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-charcoal-800">
                      {tr.description || 'About This Honey'}
                    </h3>
                    {product.description ? (
                      <p className="text-sm text-charcoal-600 leading-relaxed">{product.description}</p>
                    ) : (
                      <p className="text-sm text-charcoal-400 italic">No description available.</p>
                    )}

                    {/* Seller info */}
                    {product.seller_name && (
                      <div className="bg-cream-50 rounded-xl p-4 mt-4">
                        <h4 className="text-xs font-bold text-charcoal-500 uppercase tracking-wide mb-2">
                          {tr.seller || 'Seller'}
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center">
                            <User size={18} className="text-forest-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal-800">{product.seller_name}</p>
                            {product.seller_verified && (
                              <span className="text-xs text-forest-600 flex items-center gap-1">
                                <CheckCircle size={11} /> Verified Seller
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Traceability Tab */}
                {activeTab === 'traceability' && (
                  <div className="space-y-4">
                    {product.batch_id ? (
                      <>
                        <p className="text-sm text-charcoal-600">
                          This honey has full supply-chain traceability from hive to delivery.
                        </p>
                        <Link
                          to={`/traceability/${product.batch_id}`}
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <Link2 size={16} /> View Full Traceability
                          <ChevronRight size={16} />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-charcoal-400 italic">No traceability data linked to this product yet.</p>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-charcoal-800">
                      {tr.reviews || 'Customer Reviews'}
                      {reviews.length > 0 && <span className="ml-2 text-sm text-charcoal-400 font-normal">({reviews.length})</span>}
                    </h3>
                    {reviews.length === 0 ? (
                      <p className="text-sm text-charcoal-400 italic">{tr.noReviews || 'No reviews yet. Be the first to review!'}</p>
                    ) : (
                      reviews.map(review => (
                        <div key={review.id} className="border-b border-cream-200 pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={13} className={s <= review.rating ? 'text-honey-500 fill-honey-500' : 'text-cream-300'} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-charcoal-600">{review.customer_name || 'Verified Buyer'}</span>
                            <span className="text-xs text-charcoal-400 ml-auto">
                              {new Date(review.created_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          {review.review_text && (
                            <p className="text-sm text-charcoal-600">{review.review_text}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Buy panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 sticky top-24">
              <h3 className="font-display font-bold text-charcoal-800 mb-4">
                {tr.selectSize || 'Select Size'}
              </h3>

              {/* Size options */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[250, 500, 1000].map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selectedSize === size ? 'border-honey-500 bg-honey-50 text-honey-700' : 'border-cream-200 text-charcoal-600 hover:border-honey-300'
                    }`}
                  >
                    <div>{size}g</div>
                    <div className="text-xs font-normal">₹{priceForSize(size)}</div>
                  </button>
                ))}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-medium text-charcoal-600">{tr.quantity || 'Qty'}:</span>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 border border-cream-200 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-cream-50"
                >−</button>
                <span className="text-lg font-bold text-charcoal-800 w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-8 h-8 border border-cream-200 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-cream-50"
                >+</button>
              </div>

              <div className="bg-honey-50 rounded-xl p-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal-600">{t?.common?.total || 'Total'}</span>
                  <span className="text-xl font-display font-black text-honey-700">
                    ₹{priceForSize(selectedSize) * qty}
                  </span>
                </div>
              </div>

              {product.available_quantity > 0 ? (
                <div className="space-y-2">
                  <button onClick={handleAddToCart} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <ShoppingCart size={16} /> {tr.addToCart || 'Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow} className="btn-primary w-full">
                    {tr.buyNow || 'Buy Now'}
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-red-600 font-medium text-sm">{tr.outOfStock || 'Out of Stock'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {labModalOpen && (
        <LabReportModal
          labReportId={product.lab_report_id}
          onClose={() => setLabModalOpen(false)}
        />
      )}
    </div>
  );
}
