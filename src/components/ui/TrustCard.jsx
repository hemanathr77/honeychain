import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Minus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function TrustCard({ batch, labReport }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const levels = [
    {
      key: 'seller',
      emoji: '👨‍🌾',
      label: 'Seller Verified',
      sub: 'Identity + Farm verification',
      status: batch ? 'verified' : 'not_available',
      evidence: 'Farmer identity documents reviewed and farm physically verified by HoneyChain field officer.',
    },
    {
      key: 'farm',
      emoji: '🏡',
      label: 'Farm Verified',
      sub: 'Location + Colony count',
      status: batch ? 'verified' : 'not_available',
      evidence: 'Farm GPS location recorded. Colony count verified on-site.',
    },
    {
      key: 'batch',
      emoji: '🍯',
      label: 'Batch Created',
      sub: `Batch ID + Harvest + Quantity`,
      status: batch ? 'verified' : 'not_available',
      value: batch?.id,
      evidence: `Batch ${batch?.id} created with harvest of ${batch?.harvestQuantity} kg on ${batch?.harvestDate}.`,
    },
    {
      key: 'lab',
      emoji: '🧪',
      label: 'Laboratory Report',
      sub: labReport ? `Report: ${labReport.id}` : 'No report yet',
      status: labReport ? (labReport.overallStatus === 'COMPLIANT' ? 'compliant' : 'pending') : 'pending',
      evidence: labReport
        ? `Sample ${labReport.sampleId} tested at ${labReport.labName}. Overall status: ${labReport.overallStatus}. DEMO DATA.`
        : 'No laboratory report has been uploaded for this batch yet.',
    },
    {
      key: 'trace',
      emoji: '🔗',
      label: 'Traceable',
      sub: 'End-to-end supply chain',
      status: batch ? 'verified' : 'not_available',
      evidence: 'Full traceability chain recorded from hive to packaging.',
    },
    {
      key: 'purchase',
      emoji: '⭐',
      label: 'Verified Reviews',
      sub: 'Real customer purchases',
      status: 'verified',
      evidence: 'Reviews are only accepted from customers with completed verified orders.',
    },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified': case 'compliant':
        return { icon: <CheckCircle size={14} className="text-forest-600" />, cls: 'border-forest-200 bg-forest-50', dot: 'bg-forest-500', label: '✓ Verified' };
      case 'pending':
        return { icon: <AlertCircle size={14} className="text-yellow-500" />, cls: 'border-yellow-200 bg-yellow-50', dot: 'bg-yellow-500', label: '⚠ Pending' };
      case 'not_available':
        return { icon: <Minus size={14} className="text-charcoal-400" />, cls: 'border-cream-200 bg-cream-50', dot: 'bg-charcoal-300', label: '— N/A' };
      default:
        return { icon: <Minus size={14} />, cls: 'border-cream-200 bg-cream-50', dot: 'bg-charcoal-300', label: '—' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-card overflow-hidden">
      <div className="p-5 border-b border-cream-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍯</span>
            <div>
              <h3 className="font-display font-bold text-charcoal-800">Honey Trust Profile</h3>
              <p className="text-xs text-charcoal-400">HoneyChain 5-Level Trust Model</p>
            </div>
          </div>
          
        </div>
      </div>

      <div className="p-5 space-y-3">
        {levels.map((level, i) => {
          const cfg = getStatusConfig(level.status);
          return (
            <div key={level.key} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.cls} transition-all`}>
              <div className="text-xl flex-shrink-0">{level.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-charcoal-800">{level.label}</p>
                  <span className="text-xs font-medium text-charcoal-500">{cfg.label}</span>
                </div>
                <p className="text-xs text-charcoal-400 mt-0.5">{level.sub}</p>
                {level.value && <p className="text-xs font-mono text-honey-700 mt-1">{level.value}</p>}
              </div>
              <button
                onClick={() => { setExpanded(expanded === level.key ? null : level.key); }}
                className="flex-shrink-0 text-honey-600 hover:text-honey-700 text-xs font-medium"
              >
                {expanded === level.key ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
            </div>
          );
        })}
        {levels.map(level => (
          expanded === level.key && (
            <div key={`ev-${level.key}`} className="bg-honey-50 border border-honey-200 rounded-xl p-3 text-xs text-charcoal-700 leading-relaxed animate-slide-up">
              <p className="font-semibold text-honey-700 mb-1">📋 Evidence</p>
              {level.evidence}
            </div>
          )
        ))}
      </div>

      <div className="px-5 pb-5">
        <p className="text-xs text-charcoal-400 leading-relaxed border-t border-cream-100 pt-4">
          ⚠️ Traceability and seller verification improve transparency but do not replace laboratory testing or applicable food-safety requirements.
        </p>
      </div>
    </div>
  );
}
