import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Package, Leaf, Globe, Award } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const growthData = [
  { month: 'Jan', farmers: 88, colonies: 1800, batches: 240, customers: 320 },
  { month: 'Feb', farmers: 145, colonies: 2900, batches: 390, customers: 540 },
  { month: 'Mar', farmers: 230, colonies: 4200, batches: 680, customers: 880 },
  { month: 'Apr', farmers: 340, colonies: 6100, batches: 1020, customers: 1280 },
  { month: 'May', farmers: 480, colonies: 8200, batches: 1580, customers: 2100 },
  { month: 'Jun', farmers: 600, colonies: 9800, batches: 2100, customers: 3400 },
  { month: 'Jul', farmers: 690, colonies: 11000, batches: 2680, customers: 5200 },
  { month: 'Aug', farmers: 780, colonies: 11900, batches: 3100, customers: 8400 },
  { month: 'Sep', farmers: 847, colonies: 12450, batches: 3280, customers: 11600 },
];

const rescueData = [
  { month: 'Apr', rescued: 12 }, { month: 'May', rescued: 25 },
  { month: 'Jun', rescued: 41 }, { month: 'Jul', rescued: 58 },
  { month: 'Aug', rescued: 72 }, { month: 'Sep', rescued: 214 },
];

const geoData = [
  { name: 'Tamil Nadu', value: 76 }, { name: 'Kerala', value: 10 },
  { name: 'Karnataka', value: 8 }, { name: 'Others', value: 6 },
];
const geoColors = ['#f59e0b', '#16a34a', '#7c3aed', '#78350f'];

const STATE_ACHIEVEMENTS = [
  { emoji: '🎯', title: 'Zero Unverified Product', desc: 'All products on the marketplace come from identity-verified farmers.' },
  { emoji: '🧪', title: 'Lab-First Trust Model', desc: '1,890 honey batches have linked laboratory reports — quality is tested, not assumed.' },
  { emoji: '🐝', title: 'Bee Rescue Network', desc: "214 bee colonies rescued and redirected into HoneyChain's traceable supply chain." },
  { emoji: '🌱', title: 'Mentorship System', desc: '412 active farmer-to-farmer mentorships — growing the next generation of verified beekeepers.' },
  { emoji: '👩‍🌾', title: 'Women Farmers', desc: '38% of verified farmers on HoneyChain are women, driving rural economic empowerment.' },
  { emoji: '🌍', title: 'Environmental Impact', desc: '12,450 colonies supported = millions of pollinator visits per day = stronger local agriculture.' },
];

function AnimatedCounter({ target, suffix = '', prefix = '', inView }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const duration = 2000;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, inView]);
  return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function Impact() {
  const statsRef = useRef();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-forest-800 to-charcoal-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          <h1 className="font-display font-black text-4xl md:text-5xl mt-4 mb-4">
            HoneyChain <span className="text-honey-400">Impact Dashboard</span>
          </h1>
          <p className="text-charcoal-300 text-lg max-w-2xl mx-auto mb-4">
            Measuring what matters — farmer livelihoods, food safety, bee conservation, and community growth.
          </p>
        </div>
      </div>

      {/* Animated counters */}
      <div ref={statsRef} className="bg-honey-600 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[
              { label: 'Verified Farmers', target: 847, suffix: '+' },
              { label: 'Bee Colonies Supported', target: 12450, suffix: '+' },
              { label: 'Batches Traced', target: 3280, suffix: '+' },
              { label: 'Lab Reports Generated', target: 1890, suffix: '+' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-display font-black text-white">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} inView={inView} />
                </div>
                <p className="text-honey-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Growth chart */}
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
          <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">Platform Growth</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5e4b3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="customers" stroke="#f59e0b" fill="#fef3c7" name="Customers" />
              <Area type="monotone" dataKey="farmers" stroke="#16a34a" fill="#dcfce7" name="Verified Farmers" />
              <Area type="monotone" dataKey="batches" stroke="#7c3aed" fill="#ede9fe" name="Traced Batches" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rescue + Geography */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
            <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🐝</span> Bee Colonies Rescued
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rescueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5e4b3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="rescued" fill="#f97316" radius={[4, 4, 0, 0]} name="Colonies Rescued" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
            <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
              <Globe size={18} className="text-charcoal-500" /> Geographic Reach
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={geoData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                  {geoData.map((_, i) => <Cell key={i} fill={geoColors[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {geoData.map((g, i) => (
                <div key={g.name} className="flex items-center gap-1.5 text-xs text-charcoal-600">
                  <div className="w-3 h-3 rounded-full" style={{ background: geoColors[i] }} />
                  {g.name} ({g.value}%)
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key achievements */}
        <div>
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-6">Platform Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STATE_ACHIEVEMENTS.map(ach => (
              <div key={ach.title} className="card p-5">
                <div className="text-3xl mb-3">{ach.emoji}</div>
                <h3 className="font-semibold text-charcoal-800 mb-2">{ach.title}</h3>
                <p className="text-sm text-charcoal-500 leading-relaxed">{ach.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SDG alignment */}
        <div className="bg-gradient-to-br from-forest-50 to-blue-50 rounded-2xl border border-forest-200 p-6">
          <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5 flex items-center gap-2">
            <Leaf className="text-forest-600" /> SDG Alignment
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { sdg: 'SDG 1', title: 'No Poverty', desc: 'Direct income for 847+ rural farmer families', color: 'bg-red-100 border-red-200 text-red-700' },
              { sdg: 'SDG 2', title: 'Zero Hunger', desc: 'Improved pollination = better crop yields', color: 'bg-yellow-100 border-yellow-200 text-yellow-700' },
              { sdg: 'SDG 8', title: 'Decent Work', desc: 'Sustainable livelihoods in beekeeping', color: 'bg-orange-100 border-orange-200 text-orange-700' },
              { sdg: 'SDG 15', title: 'Life on Land', desc: 'Bee colony conservation supports biodiversity', color: 'bg-forest-100 border-forest-200 text-forest-700' },
            ].map(sdg => (
              <div key={sdg.sdg} className={`rounded-xl border p-4 ${sdg.color}`}>
                <p className="font-bold text-sm mb-1">{sdg.sdg}</p>
                <p className="font-semibold text-sm mb-2">{sdg.title}</p>
                <p className="text-xs opacity-80 leading-relaxed">{sdg.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <Link to="/marketplace" className="btn-primary text-sm">🍯 Find Verified Honey</Link>
            <Link to="/bee-rescue" className="btn-secondary text-sm">🐝 Report Bee Colony</Link>
            <Link to="/start-beekeeping" className="btn-secondary text-sm">🌱 Become a Beekeeper</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
