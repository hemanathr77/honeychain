import React, { useState, useCallback } from 'react';
import {
  Search, FlaskConical, CheckCircle, AlertCircle,
  Building, ShieldCheck, RefreshCw, ExternalLink
} from 'lucide-react';
import { labReports as labReportsApi } from '../services/api';
import { StatusBadge } from '../components/ui/Badges';
import LabReportModal from '../components/modals/LabReportModal';
import { useApp } from '../context/AppContext';

export default function LabVerification() {
  const { t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setActiveReport(null);
    setNotFound(false);
    setError('');

    try {
      // Try by report ID (numeric) first, then by batch string ID
      let res;
      if (/^\d+$/.test(q)) {
        // Numeric — lookup by lab report integer ID
        res = await labReportsApi.get(q);
        setActiveReport(res.report);
      } else {
        // String — lookup by batch string ID (batch_code like HC-TN-2026-000001)
        res = await labReportsApi.forBatch(q);
        setActiveReport(res.report);
      }
    } catch (err) {
      if (err.status === 404 || err.status === 403) {
        setNotFound(true);
      } else {
        setError(err.message || 'Unable to search. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <FlaskConical size={32} className="text-blue-600" />
            </div>
          </div>
          <h1 className="section-title mb-4">
            {t?.labVerification?.title || 'Laboratory Verification Portal'}
          </h1>
          <p className="section-subtitle mx-auto mb-6">
            {t?.labVerification?.subtitle || 'Verify the authenticity of any lab report using its Report ID or Batch ID.'}
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Enter Report ID or Batch ID (e.g. HC-TN-2026-000001)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-11 shadow-card font-mono"
              />
            </div>
            <button type="submit" className="btn-primary px-6" disabled={loading || !searchQuery.trim()}>
              {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Verify'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2 max-w-2xl mx-auto">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-card border border-cream-200 max-w-2xl mx-auto">
            <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-charcoal-800 mb-2">Report Not Found</h3>
            <p className="text-charcoal-500 mb-4">
              No laboratory report found for "<span className="font-mono font-semibold">{searchQuery}</span>".
            </p>
            <p className="text-sm text-charcoal-400 mb-4">
              Enter a valid Lab Report ID or Batch ID (e.g. HC-TN-2026-000001).
            </p>
            <button onClick={() => { setNotFound(false); setSearchQuery(''); }} className="btn-secondary">
              Clear Search
            </button>
          </div>
        )}

        {/* Report Found */}
        {activeReport && !notFound && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden animate-slide-up">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} />
                <span className="font-semibold">Laboratory Report — HoneyChain Verified</span>
              </div>
              <StatusBadge status={activeReport.overall_status === 'COMPLIANT' ? 'compliant' : 'pending'} />
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-charcoal-400 font-medium mb-1">Report ID</p>
                  <p className="text-lg font-mono font-bold text-charcoal-800">{activeReport.report_id}</p>
                </div>
                <div>
                  <p className="text-xs text-charcoal-400 font-medium mb-1">Batch ID</p>
                  <p className="text-lg font-mono font-bold text-honey-700">
                    {activeReport.batch_code || '—'}
                  </p>
                </div>
                {activeReport.sample_id && (
                  <div>
                    <p className="text-xs text-charcoal-400 font-medium mb-1">Sample ID</p>
                    <p className="text-base font-mono font-medium text-charcoal-700">{activeReport.sample_id}</p>
                  </div>
                )}
                {activeReport.test_date && (
                  <div>
                    <p className="text-xs text-charcoal-400 font-medium mb-1">Testing Date</p>
                    <p className="text-base font-medium text-charcoal-700">
                      {new Date(activeReport.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {activeReport.seller_name && (
                  <div>
                    <p className="text-xs text-charcoal-400 font-medium mb-1">Seller</p>
                    <p className="text-base font-medium text-charcoal-700">{activeReport.seller_name}</p>
                  </div>
                )}
                {activeReport.verification_status && (
                  <div>
                    <p className="text-xs text-charcoal-400 font-medium mb-1">Verification</p>
                    <p className="text-base font-medium text-charcoal-700">{activeReport.verification_status}</p>
                  </div>
                )}
              </div>

              {/* Lab info */}
              <div className="border-t border-b border-cream-100 py-4 mb-6">
                <div className="flex items-start gap-4">
                  <Building className="text-charcoal-400 flex-shrink-0 mt-1" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-charcoal-800">{activeReport.laboratory_name}</p>
                    {activeReport.accreditation_no && (
                      <p className="text-xs text-charcoal-500 mt-1">
                        Accreditation: {activeReport.accreditation_no}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Overall status */}
              <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 ${
                activeReport.overall_status === 'COMPLIANT'
                  ? 'bg-forest-50 border border-forest-200'
                  : activeReport.overall_status === 'NON_COMPLIANT'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {activeReport.overall_status === 'COMPLIANT'
                  ? <CheckCircle size={24} className="text-forest-600" />
                  : <AlertCircle size={24} className="text-yellow-600" />}
                <div>
                  <p className="font-bold text-charcoal-800">Overall Status: {activeReport.overall_status}</p>
                  <p className="text-xs text-charcoal-600">
                    This report is linked to a specific batch in the HoneyChain database.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <FlaskConical size={18} /> View Full Parameters
                </button>
                <button
                  onClick={() => { setActiveReport(null); setSearchQuery(''); }}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Search size={18} /> New Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Default — no search yet */}
        {!activeReport && !notFound && !error && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 md:col-span-1 h-fit">
              <h3 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" /> Trust Model
              </h3>
              <p className="text-sm text-charcoal-600 leading-relaxed mb-4">
                HoneyChain does not claim that a QR code or batch number automatically proves honey purity.
              </p>
              <p className="text-sm text-charcoal-600 leading-relaxed mb-4">
                Instead, we mandate that <strong>laboratory testing</strong> by accredited food testing laboratories
                is the sole mechanism for quality verification.
              </p>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                The platform simply ensures that the laboratory report is cryptographically linked to the specific batch you are buying.
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="text-center py-16 bg-white rounded-2xl border border-cream-200">
                <FlaskConical size={48} className="text-blue-300 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg text-charcoal-700 mb-2">
                  Enter a Batch ID or Report ID
                </h3>
                <p className="text-charcoal-400 text-sm">
                  Search above to verify a laboratory report from the HoneyChain database.
                </p>
                <p className="text-xs text-charcoal-300 mt-2">
                  Lab reports are only visible once a seller has submitted them and they are verified.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalOpen && activeReport && (
        <LabReportModal report={activeReport} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
