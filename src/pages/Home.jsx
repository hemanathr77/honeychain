import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, QrCode, ChevronRight, RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { products as productsApi, admin as adminApi } from '../services/api';
import HoneyProductCard from '../components/ui/HoneyProductCard';

// Animated counter hook
function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);
  return count;
}

function StatCounter({ value, label, suffix, emoji, inView }) {
  const count = useCountUp(value, 1800, inView);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-display font-black text-honey-600">
        {count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-sm text-charcoal-500 mt-1">{label}</div>
    </div>
  );
}

const PROBLEMS = [
  { problem: 'Fake/adulterated honey', solution: 'Batch-level laboratory testing with report access', icon: '🧪' },
  { problem: 'Unknown sellers', solution: 'Verified farmer identity + farm verification', icon: '👨‍🌾' },
  { problem: 'No supply chain visibility', solution: 'QR traceability from hive to customer', icon: '🔗' },
  { problem: 'Farmers struggle to reach buyers', solution: 'Direct verified-farmer marketplace', icon: '🏪' },
  { problem: 'Bee colonies get destroyed', solution: 'Community bee rescue network', icon: '🐝' },
  { problem: 'New farmers lack guidance', solution: 'Farmer-to-farmer mentorship program', icon: '🌱' },
];

const TRUST_LEVELS = [
  { emoji: '👨‍🌾', level: 'Level 1', title: 'Seller Verified', desc: 'Identity + Farm verification', color: 'border-forest-300 bg-forest-50' },
  { emoji: '🍯', level: 'Level 2', title: 'Batch Verified', desc: 'Batch ID + Harvest + Quantity', color: 'border-honey-300 bg-honey-50' },
  { emoji: '🧪', level: 'Level 3', title: 'Lab Tested', desc: 'Physical sample tested by accredited lab', color: 'border-blue-300 bg-blue-50' },
  { emoji: '🔗', level: 'Level 4', title: 'Traceable', desc: 'Farm → Harvest → Lab → Packaging → Customer', color: 'border-purple-300 bg-purple-50' },
  { emoji: '⭐', level: 'Level 5', title: 'Verified Purchase', desc: 'Real transaction + customer review', color: 'border-yellow-300 bg-yellow-50' },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [activeProblem, setActiveProblem] = useState(0);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsInView(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    productsApi.list({ limit: 4, verified: 'true' })
      .then(res => setFeaturedProducts(res.products || []))
      .catch(() => setFeaturedProducts([]))
      .finally(() => setProductsLoading(false));

    adminApi.dashboard()
      .then(res => setStats(res.stats))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-honey-50 to-forest-50 pt-12 pb-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-honey-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-forest-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-card border border-cream-200 mb-6">
                <span className="text-sm">🇮🇳</span>
                <span className="text-xs font-semibold text-charcoal-600">Smart India Hackathon Prototype</span>
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse-slow" />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-charcoal-900 leading-tight mb-6">
                <span className="text-honey-600">{t?.hero?.headline?.split('.')[0] || 'Real Honey'}.</span>
                <br />
                Real Farmers.
                <br />
                <span className="text-forest-700">Real Traceability.</span>
              </h1>

              <p className="text-lg text-charcoal-500 leading-relaxed mb-8 max-w-lg">
                {t?.hero?.subheading || 'Discover verified honey from real beekeepers, verify every batch, and support the farmers who keep our ecosystems alive.'}
              </p>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { icon: '✓', label: t?.trust?.verifiedFarmers || 'Verified Farmers', color: 'bg-forest-100 text-forest-700 border-forest-200' },
                  { icon: '🧪', label: t?.trust?.labTested || 'Lab-Tested Batches', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { icon: '🔗', label: t?.trust?.batchTrace || 'Batch Traceability', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  { icon: '🔒', label: t?.trust?.secure || 'Secure Transactions', color: 'bg-honey-100 text-honey-700 border-honey-200' },
                ].map(pill => (
                  <span key={pill.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${pill.color}`}>
                    <span className="text-xs">{pill.icon}</span>
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/marketplace" className="btn-primary flex items-center gap-2 text-base">
                  {t?.hero?.cta1 || 'Find Real Honey'}
                  <ArrowRight size={18} />
                </Link>
                <Link to="/start-beekeeping" className="btn-secondary flex items-center gap-2 text-base">
                  {t?.hero?.cta2 || 'Become a Beekeeper'}
                </Link>
              </div>

              <button
                onClick={() => navigate('/traceability')}
                className="mt-4 flex items-center gap-2 text-honey-700 hover:text-honey-800 font-medium text-sm transition-colors"
              >
                <QrCode size={16} />
                {t?.hero?.scanBatch || 'Scan Honey Batch'}
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Right visual */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Central honey jar */}
                <div className="flex justify-center mb-6">
                  <div className="w-40 h-40 bg-honey-gradient rounded-3xl flex items-center justify-center text-8xl shadow-glow-honey animate-bounce-gentle">
                    🍯
                  </div>
                </div>

                {/* Journey flow */}
                <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-5">
                  <p className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-4 text-center">The HoneyChain Journey</p>
                  <div className="flex items-center justify-between">
                    {[
                      { emoji: '🐝', label: 'Hive' },
                      { emoji: '👨‍🌾', label: 'Farmer' },
                      { emoji: '🧪', label: 'Lab' },
                      { emoji: '📦', label: 'Batch' },
                      { emoji: '🏠', label: 'Customer' },
                    ].map((step, i) => (
                      <React.Fragment key={step.label}>
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-honey-50 border-2 border-honey-200 rounded-xl flex items-center justify-center text-xl">
                            {step.emoji}
                          </div>
                          <span className="text-xs text-charcoal-400 mt-1 font-medium">{step.label}</span>
                        </div>
                        {i < 4 && <div className="flex-1 h-0.5 bg-honey-200 mx-1" />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Traceability example — no hardcoded batch */}
                  <div className="mt-4 p-3 bg-honey-50 border border-honey-200 rounded-xl cursor-pointer hover:border-honey-400 transition-colors"
                    onClick={() => navigate('/traceability')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-mono font-bold text-honey-700">Enter any batch ID</p>
                      <span className="badge-verified text-xs">✓ Real Data</span>
                    </div>
                    <p className="text-xs text-charcoal-600">Scan a product's QR code or enter the batch ID to trace it</p>
                    <p className="text-center text-xs text-honey-600 font-medium mt-2">Trace a batch →</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={statsRef} className="bg-honey-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-honey-200 text-xs font-semibold uppercase tracking-widest mb-6">Platform Metrics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={stats ? parseInt(stats.sellers || 0) : 0} label="Verified Sellers" suffix="" inView={statsInView} />
            <StatCounter value={stats ? parseInt(stats.total_products || 0) : 0} label="Honey Products" suffix="" inView={statsInView} />
            <StatCounter value={stats ? parseInt(stats.total_batches || 0) : 0} label="Batches Traced" suffix="" inView={statsInView} />
            <StatCounter value={stats ? parseInt(stats.customers || 0) : 0} label="Customers" suffix="" inView={statsInView} />
          </div>
        </div>
      </section>

      {/* ===== PROBLEM / SOLUTION ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-red-700 text-sm font-medium mb-4">
              ⚠️ The Problem with Honey Today
            </div>
            <h2 className="section-title mb-4">HoneyChain Solves Real Problems</h2>
            <p className="section-subtitle mx-auto">
              From fake honey to destroyed bee colonies — HoneyChain creates a trusted ecosystem for every stakeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROBLEMS.map((item, i) => (
              <div
                key={i}
                className="group card p-6 cursor-pointer"
                onClick={() => setActiveProblem(activeProblem === i ? -1 : i)}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className={`transition-all duration-300 ${activeProblem === i ? 'hidden' : 'block'}`}>
                  <p className="text-sm font-semibold text-red-600 mb-2">❌ Problem</p>
                  <p className="text-charcoal-700 font-medium">{item.problem}</p>
                  <p className="text-xs text-honey-600 mt-3 font-medium">Click to see solution →</p>
                </div>
                <div className={`transition-all duration-300 animate-fade-in ${activeProblem === i ? 'block' : 'hidden'}`}>
                  <p className="text-sm font-semibold text-forest-600 mb-2">✓ HoneyChain Solution</p>
                  <p className="text-charcoal-700 font-medium">{item.solution}</p>
                  <p className="text-xs text-charcoal-400 mt-3">Click to flip back ←</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST MODEL ===== */}
      <section className="py-20 bg-gradient-to-br from-honey-50 to-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-4">How HoneyChain Builds Trust</h2>
            <p className="section-subtitle mx-auto">
              We don't ask consumers to blindly trust a seller. We build trust through verified identity, batch-level laboratory testing, and end-to-end traceability.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-4 justify-center">
            {TRUST_LEVELS.map((level, i) => (
              <React.Fragment key={level.title}>
                <div className={`flex-1 border-2 rounded-2xl p-5 ${level.color} text-center`}>
                  <div className="text-3xl mb-2">{level.emoji}</div>
                  <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wide mb-1">{level.level}</p>
                  <p className="font-display font-bold text-charcoal-800 mb-2">{level.title}</p>
                  <p className="text-xs text-charcoal-500 leading-relaxed">{level.desc}</p>
                </div>
                {i < TRUST_LEVELS.length - 1 && (
                  <div className="hidden md:flex items-center text-charcoal-300 text-2xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-2xl p-5 border border-cream-200 shadow-card max-w-2xl mx-auto text-center">
            <p className="text-sm text-charcoal-500 italic">
              ⚠️ Important: Traceability and seller verification improve transparency but <strong>do not replace laboratory testing</strong> or applicable food-safety requirements. HoneyChain does not claim that traceability alone proves honey purity.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Verified Honey</h2>
              <p className="text-charcoal-500 mt-2">From verified farmers — real products listed on HoneyChain</p>
            </div>
            <Link to="/marketplace" className="btn-secondary flex items-center gap-2 text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-cream-50 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 bg-cream-50 rounded-2xl">
              <div className="text-4xl mb-3">🍯</div>
              <p className="text-charcoal-500 mb-4">No products listed yet.</p>
              <Link to="/marketplace" className="btn-primary text-sm">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <HoneyProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== THREE JOURNEYS ===== */}
      <section className="py-20 bg-gradient-to-br from-charcoal-900 to-charcoal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Three Ways HoneyChain Creates Impact
            </h2>
            <p className="text-charcoal-300 max-w-2xl mx-auto">
              HoneyChain is not just a honey marketplace — it is a complete ecosystem for trust, rescue, and growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: '🏆',
                title: 'Customer Trust',
                path: '/marketplace',
                btnLabel: 'Find Real Honey',
                color: 'border-honey-500',
                steps: ['Find verified farmer', 'View harvest & batch', 'Check lab report', 'Trace supply chain'],
              },
              {
                emoji: '🐝',
                title: 'Bee Rescue',
                path: '/bee-rescue',
                btnLabel: 'Report a Bee Colony',
                color: 'border-orange-500',
                steps: ['Report bee colony', 'GPS + photo captured', 'Verified beekeeper assigned', 'Honey enters traceability'],
              },
              {
                emoji: '🌱',
                title: 'Farmer Growth',
                path: '/start-beekeeping',
                btnLabel: 'Start Beekeeping',
                color: 'border-forest-500',
                steps: ['New farmer registers', 'Finds local mentor', 'Starts first hive', 'Sells verified honey'],
              },
            ].map(journey => (
              <div key={journey.title} className={`border ${journey.color} rounded-2xl p-6 bg-charcoal-800/50`}>
                <div className="text-4xl mb-4">{journey.emoji}</div>
                <h3 className="font-display font-bold text-xl text-white mb-4">{journey.title}</h3>
                <div className="space-y-2 mb-6">
                  {journey.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-charcoal-300">
                      <div className="w-5 h-5 rounded-full bg-charcoal-700 flex items-center justify-center text-xs text-honey-400 font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
                <Link to={journey.path} className="btn-primary flex items-center justify-center gap-2 w-full text-sm">
                  {journey.btnLabel} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 bg-honey-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
            From Hive to Home — With Trust at Every Step.
          </h2>
          <p className="text-honey-100 text-lg mb-10 max-w-2xl mx-auto">
            Join HoneyChain — where every jar of honey comes with a verified farmer, a traceable batch, and a laboratory report.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/marketplace" className="bg-white text-honey-700 hover:bg-cream-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 flex items-center gap-2">
              🍯 Find Verified Honey
            </Link>
            <Link to="/start-beekeeping" className="bg-honey-700 hover:bg-honey-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 flex items-center gap-2">
              🌱 Become a Beekeeper
            </Link>
            <Link to="/bee-rescue" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 flex items-center gap-2">
              🐝 Rescue a Bee Colony
            </Link>
            <Link to="/mentorship" className="bg-forest-700 hover:bg-forest-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 flex items-center gap-2">
              📚 Find a Mentor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
