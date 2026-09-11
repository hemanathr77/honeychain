import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const TRUST_PILLARS = [
  {
    emoji: '🧪', title: 'Laboratory Testing as the Standard',
    content: `HoneyChain does NOT claim that a QR code, blockchain record, or traceability log proves honey purity. We maintain a clear, unambiguous principle: laboratory testing by an accredited food testing laboratory is the sole mechanism for honey quality verification.

Every lab report on HoneyChain:
• Belongs to a specific sample from a specific batch
• Cannot be reused to verify a different batch
• Is clearly marked as DEMO DATA in prototype mode
• Shows which accredited lab tested it

We reject misleading claims that "blockchain proves quality."`,
  },
  {
    emoji: '👨‍🌾', title: 'Two Distinct Trust Levels',
    content: `We distinguish clearly between two different types of verification:

SELLER VERIFIED — The farmer's identity has been reviewed and their farm has been physically visited by a HoneyChain field officer. This does NOT verify honey quality.

BATCH LABORATORY TESTED — A physical honey sample from that specific batch was tested at an accredited lab. This is honey quality verification.

Both badges are always shown separately. We never conflate them.`,
  },
  {
    emoji: '🛡️', title: 'Fraud Prevention',
    content: `HoneyChain's fraud prevention system includes:

• Duplicate image detection for product listings
• Location verification for farmer registrations  
• Admin review before any fraud-based account action
• Anti-fraud notice on every traceability page: "Report X belongs specifically to Batch Y — it cannot verify a different batch"
• Community flagging system with human review`,
  },
  {
    emoji: '🔒', title: 'Data Privacy',
    content: `Farmer document privacy:
• Government IDs are encrypted and only accessible to HoneyChain verification officers
• Documents are not shown to customers
• GPS coordinates of farms are only shared with assigned collectors for bee rescue

Customer privacy:
• Orders and addresses are not shared with third parties
• Reviews are only accepted from verified purchasers`,
  },
];

const WHAT_WE_DONT_CLAIM = [
  'That a QR code proves honey purity',
  'That blockchain itself is a substitute for laboratory testing',
  'That seller verification is equivalent to honey quality verification',
  'That one lab report can cover multiple batches',
  'That AI-generated agricultural advice replaces expert knowledge',
  'That community reviews are more reliable than laboratory tests',
];

export default function TrustSafety() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield size={36} className="text-forest-600" />
            
          </div>
          <h1 className="section-title mb-4">Trust & Safety</h1>
          <p className="section-subtitle mx-auto">
            HoneyChain's commitment to honest, transparent, evidence-based trust — not misleading marketing claims.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Important disclaimer box */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-base mb-2">Our Non-Negotiable Anti-Fraud Principle</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                A laboratory report belongs to a specific honey sample from a specific batch. Under no circumstances does HoneyChain allow one laboratory report to automatically verify the quality of a different batch. Traceability, QR codes, and blockchain records improve transparency — but laboratory testing is the sole mechanism for honey quality verification.
              </p>
            </div>
          </div>
        </div>

        {/* What we don't claim */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg text-red-800 mb-4 flex items-center gap-2">
            ❌ What HoneyChain Does NOT Claim
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {WHAT_WE_DONT_CLAIM.map((claim, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="font-bold mt-0.5 flex-shrink-0">✗</span>
                {claim}
              </div>
            ))}
          </div>
        </div>

        {/* What we DO */}
        <div className="bg-forest-50 border border-forest-200 rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg text-forest-800 mb-4 flex items-center gap-2">
            ✅ What HoneyChain DOES Guarantee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Every seller has gone through an identity + farm verification process',
              'Lab reports are cryptographically linked to the specific batch they tested',
              'Seller Verified and Lab Tested are shown as separate badges',
              'Every batch has its own QR code — not a shared or reused code',
              'Bee rescue honey enters the same lab testing pipeline as farm honey',
              'Verified Purchase reviews come only from real completed orders',
              'Community answers are only from verified farmers and accredited experts',
              'Fraud flags are reviewed by a human admin before any account action',
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-forest-800">
                <CheckCircle size={14} className="text-forest-600 mt-0.5 flex-shrink-0" />
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* Detailed pillars */}
        <div className="space-y-5">
          <h2 className="font-display font-bold text-2xl text-charcoal-800">Trust Pillars</h2>
          {TRUST_PILLARS.map((pillar, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{pillar.emoji}</div>
                <div>
                  <h3 className="font-display font-bold text-lg text-charcoal-800 mb-3">{pillar.title}</h3>
                  <div className="text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">
                    {pillar.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reporting */}
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
          <h2 className="font-display font-bold text-xl text-charcoal-800 mb-4">Report a Concern</h2>
          <p className="text-sm text-charcoal-600 mb-4">
            If you encounter a suspicious listing, an unverified seller misrepresenting themselves, or a product you believe is fraudulent, please report it immediately.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/marketplace" className="btn-secondary text-sm">View All Listings</Link>
            <Link to="/traceability" className="btn-secondary text-sm">Verify a Batch</Link>
            <Link to="/lab-verification" className="btn-secondary text-sm">Check Lab Report</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
