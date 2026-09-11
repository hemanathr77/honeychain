import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, ShoppingCart, Link2, Calendar, Package } from 'lucide-react';
import { VerifiedBadge, LabTestedBadge, TraceableBadge } from './Badges';
import { useCart } from '../../context/CartContext';

const HONEY_COLORS = {
  'Multi-Floral': 'from-amber-100 to-yellow-50',
  'Single-Floral': 'from-yellow-100 to-cream-50',
  'Forest Honey': 'from-amber-200 to-orange-50',
  'default': 'from-honey-50 to-cream-50',
};

const HONEY_EMOJI = {
  'Multi-Floral': '🌸',
  'Single-Floral': '🌻',
  'Forest Honey': '🌲',
  'Eucalyptus': '🌿',
  'default': '🍯',
};

export default function HoneyProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // Real API gives us seller info directly in the product object
  const gradientClass = HONEY_COLORS[product.honey_type] || HONEY_COLORS.default;
  const emoji = HONEY_EMOJI[product.honey_type] || '🍯';

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, 500);
  };

  const handleTrace = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.batch_id) {
      navigate(`/traceability/${product.batch_id}`);
    }
  };

  return (
    <div className="card overflow-hidden group cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
      {/* Image / Visual */}
      <div className={`h-40 bg-gradient-to-br ${gradientClass} flex items-center justify-center relative`}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
        ) : (
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
        )}
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.seller_verified && <VerifiedBadge />}
          {product.lab_report_id && <LabTestedBadge status="COMPLIANT" />}
        </div>
        {product.batch_id && (
          <div className="absolute top-3 right-3">
            <TraceableBadge />
          </div>
        )}
        {product.available_quantity < 15 && product.available_quantity > 0 && (
          <div className="absolute bottom-3 right-3 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full border border-red-200">
            Low Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-xs text-honey-600 font-semibold uppercase tracking-wide mb-1">{product.honey_type || 'Natural Honey'}</p>
          <h3 className="font-display font-bold text-charcoal-800 text-base leading-tight group-hover:text-honey-700 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Farmer */}
        {product.seller_name && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-forest-50 rounded-lg border border-forest-100">
            <div className="w-7 h-7 bg-forest-200 rounded-full flex items-center justify-center text-sm font-bold text-forest-800">
              {product.seller_name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-charcoal-800 truncate">{product.seller_name}</p>
              {(product.district || product.state) && (
                <div className="flex items-center gap-1">
                  <MapPin size={9} className="text-charcoal-400" />
                  <span className="text-xs text-charcoal-400 truncate">{[product.district, product.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-charcoal-500">
          <div className="flex items-center gap-1">
            <Calendar size={10} />
            <span>{product.harvest_date ? new Date(product.harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package size={10} />
            <span>{product.available_quantity || 0} kg left</span>
          </div>
        </div>

        {/* Rating - if we have it in the payload, otherwise hide for now */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} className={s <= Math.round(product.rating) ? 'text-honey-500 fill-honey-500' : 'text-cream-300'} />
              ))}
            </div>
            <span className="text-xs text-charcoal-500 font-medium">{product.rating}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-display font-bold text-charcoal-800">₹{product.price_per_kg}</span>
            <span className="text-xs text-charcoal-400 ml-1">/ kg</span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-forest-100 text-forest-700 rounded-full font-medium">🌿 Natural</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleQuickAdd}
            disabled={!product.available_quantity}
            className="flex-1 flex items-center justify-center gap-1.5 bg-honey-500 hover:bg-honey-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 hover:shadow-honey disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={13} />
            {product.available_quantity ? 'Add to Cart' : 'Out of Stock'}
          </button>
          {product.batch_id && (
            <button
              onClick={handleTrace}
              className="flex items-center justify-center gap-1 px-3 py-2.5 bg-cream-100 hover:bg-purple-100 text-charcoal-600 hover:text-purple-700 rounded-xl text-xs font-medium transition-all border border-cream-200 hover:border-purple-200"
              title="Trace this batch"
            >
              <Link2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
