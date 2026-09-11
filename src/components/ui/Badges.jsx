import React from 'react';
import { CheckCircle, FlaskConical, Link2, AlertCircle, Clock } from 'lucide-react';

export function VerifiedBadge({ size = 'sm' }) {
  const cls = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  return (
    <span className={`badge-verified ${cls}`}>
      <CheckCircle size={size === 'lg' ? 14 : 11} />
      Verified Farmer
    </span>
  );
}

export function LabTestedBadge({ status = 'compliant', size = 'sm' }) {
  const cls = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  if (status === 'compliant') {
    return (
      <span className={`badge-lab ${cls}`}>
        <FlaskConical size={size === 'lg' ? 14 : 11} />
        Lab Tested
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className={`badge-pending ${cls}`}>
        <Clock size={size === 'lg' ? 14 : 11} />
        Lab Pending
      </span>
    );
  }
  return null;
}

export function TraceableBadge({ size = 'sm' }) {
  const cls = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';
  return (
    <span className={`badge-traceable ${cls}`}>
      <Link2 size={size === 'lg' ? 14 : 11} />
      Traceable
    </span>
  );
}


export function StatusBadge({ status }) {
  const map = {
    verified: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Verified' },
    pending: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '⏳ Pending' },
    under_review: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: '🔍 Under Review' },
    field_verification: { cls: 'bg-purple-100 text-purple-700 border-purple-200', label: '🏡 Field Visit' },
    rejected: { cls: 'bg-red-100 text-red-700 border-red-200', label: '✕ Rejected' },
    suspended: { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: '⚠ Suspended' },
    compliant: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Compliant' },
    available: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Available' },
    lab_pending: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '⏳ Lab Pending' },
    delivered: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Delivered' },
    shipped: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: '🚚 Shipped' },
    processing: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '⚙ Processing' },
    confirmed: { cls: 'bg-honey-100 text-honey-700 border-honey-200', label: '✓ Confirmed' },
    reported: { cls: 'bg-orange-100 text-orange-700 border-orange-200', label: '🚨 Reported' },
    collector_assigned: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: '👤 Assigned' },
    scheduled: { cls: 'bg-purple-100 text-purple-700 border-purple-200', label: '📅 Scheduled' },
    collected: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Collected' },
    completed: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Completed' },
    active: { cls: 'bg-forest-100 text-forest-700 border-forest-200', label: '✓ Active' },
    requested: { cls: 'bg-honey-100 text-honey-700 border-honey-200', label: '📤 Requested' },
    accepted: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: '✓ Accepted' },
  };
  const config = map[status] || { cls: 'bg-cream-100 text-charcoal-600 border-cream-200', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${config.cls}`}>
      {config.label}
    </span>
  );
}
