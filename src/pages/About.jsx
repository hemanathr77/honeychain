import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const TEAM = [
  { name: 'SIH Team HoneyChain', role: 'Full-Stack Development & Design', emoji: '💻' },
  { name: 'Mentor / Faculty', role: 'Project Guidance', emoji: '🎓' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-honey-600 to-amber-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🍯</div>
          <h1 className="font-display font-black text-4xl md:text-5xl mb-4">About HoneyChain</h1>
          <p className="text-honey-100 text-lg max-w-2xl mx-auto">
            A Smart India Hackathon prototype building trust in the Indian honey ecosystem through verified farmers, traceable batches, and laboratory-backed quality assurance.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Mission */}
        <div>
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-4">The Problem We're Solving</h2>
          <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 space-y-4 text-charcoal-600 leading-relaxed">
            <p>India is one of the world's largest honey producers — yet consumers have no reliable way to verify whether what they're buying is real, unadulterated honey from a genuine beekeeper. Fake and adulterated honey, unknown sellers, and destroyed bee colonies represent a crisis in food trust and ecological sustainability.</p>
            <p>HoneyChain addresses this with a multi-stakeholder digital ecosystem: verified farmer identities, batch-level QR traceability, community bee rescue networks, farmer mentorship programs, and most importantly — direct integration with accredited food testing laboratories for honest quality verification.</p>
            <p className="font-semibold text-charcoal-700">We don't claim QR codes prove honey purity. We connect each batch to an actual laboratory test.</p>
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-4">How HoneyChain Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { emoji: '👨‍🌾', title: 'Farmer Verification', desc: 'Field officers physically verify farmers, farms, and colony counts before granting the verified badge.' },
              { emoji: '🍯', title: 'Batch Creation', desc: 'Every harvest creates a unique batch ID. Batch metadata includes harvest date, quantity, and farmer identity.' },
              { emoji: '🧪', title: 'Laboratory Testing', desc: 'Physical honey samples are collected and sent to accredited labs. Reports are digitally linked to the batch — not reusable across batches.' },
              { emoji: '🔗', title: 'QR Traceability', desc: 'Every jar has a QR code. Scanning it shows the full supply chain from hive inspection to packaging.' },
              { emoji: '🐝', title: 'Bee Rescue', desc: 'Community members report bee colonies found in buildings or trees. Verified collectors safely relocate them — and the honey enters traceability.' },
              { emoji: '🌱', title: 'Mentorship', desc: 'Experienced beekeepers mentor new farmers through a structured program with regular check-ins and field visits.' },
            ].map(item => (
              <div key={item.title} className="card p-5">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-charcoal-800 mb-2">{item.title}</h3>
                <p className="text-sm text-charcoal-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-4">Technology Stack</h2>
          <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Frontend', value: 'React.js + Vite + JSX' },
                { label: 'Styling', value: 'Tailwind CSS (Custom Theme)' },
                { label: 'Routing', value: 'React Router v6' },
                { label: 'Charts', value: 'Recharts' },
                { label: 'Icons', value: 'Lucide React' },
                { label: 'State', value: 'React Context API' },
                { label: 'QR Codes', value: 'qrcode.react' },
                { label: 'Backend', value: 'Node.js + Express.js' },
                { label: 'Database', value: 'PostgreSQL' },
                { label: 'Architecture', value: 'REST API + React SPA' },
              ].map(t => (
                <div key={t.label} className="bg-cream-50 rounded-xl p-3">
                  <p className="text-xs text-charcoal-400 mb-1">{t.label}</p>
                  <p className="text-sm font-semibold text-charcoal-800">{t.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-4">Explore HoneyChain</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/marketplace" className="btn-primary flex items-center gap-2">🍯 Marketplace <ArrowRight size={16} /></Link>
            <Link to="/traceability" className="btn-secondary flex items-center gap-2">🔗 Traceability</Link>
            <Link to="/impact" className="btn-secondary flex items-center gap-2">📊 Impact</Link>
            <Link to="/trust-safety" className="btn-secondary flex items-center gap-2">🛡️ Trust &amp; Safety</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
