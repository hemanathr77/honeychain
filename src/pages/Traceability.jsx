import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode, Search, CheckCircle, MapPin, Calendar, Package,
  FlaskConical, User, ArrowLeft, ExternalLink, Link2, Clock,
  AlertCircle, RefreshCw, ShieldCheck
} from 'lucide-react';
import { batches as batchesApi } from '../services/api';
import { useApp } from '../context/AppContext';
import LabReportModal from '../components/modals/LabReportModal';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const EVENT_STYLES = {
  FARM_REGISTERED:    'bg-forest-100 border-forest-300 text-forest-700',
  HIVE_CREATED:       'bg-yellow-100 border-yellow-300 text-yellow-700',
  HARVESTED:          'bg-honey-100 border-honey-300 text-honey-700',
  SAMPLE_COLLECTED:   'bg-blue-100 border-blue-300 text-blue-700',
  LAB_SUBMITTED:      'bg-indigo-100 border-indigo-300 text-indigo-700',
  LAB_TESTED:         'bg-purple-100 border-purple-300 text-purple-700',
  PROCESSING_COMPLETED: 'bg-orange-100 border-orange-300 text-orange-700',
  PACKAGED:           'bg-green-100 border-green-300 text-green-700',
  LISTED:             'bg-teal-100 border-teal-300 text-teal-700',
  ORDERED:            'bg-blue-100 border-blue-300 text-blue-700',
  SHIPPED:            'bg-indigo-100 border-indigo-300 text-indigo-700',
  DELIVERED:          'bg-green-100 border-green-300 text-green-700',
  OTHER:              'bg-gray-100 border-gray-300 text-gray-700',
};

const EVENT_EMOJIS = {
  FARM_REGISTERED: '🌱', HIVE_CREATED: '🐝', HARVESTED: '🍯',
  SAMPLE_COLLECTED: '🧪', LAB_SUBMITTED: '📬', LAB_TESTED: '🔬',
  PROCESSING_COMPLETED: '🏭', PACKAGED: '📦', LISTED: '🏪',
  ORDERED: '🛒', SHIPPED: '🚚', DELIVERED: '✅', OTHER: '📋',
};

export default function Traceability() {
  const { batchId: urlBatchId } = useParams();
  const navigate = useNavigate();
  const { t } = useApp();
  const tr = t?.traceability || {};

  const [inputBatchId, setInputBatchId] = useState(urlBatchId || '');
  const [activeBatchId, setActiveBatchId] = useState(urlBatchId || '');
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState(null);
  const [error, setError] = useState('');
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const loadBatch = useCallback(async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError('');
    setBatchData(null);
    try {
      const res = await batchesApi.traceability(id.trim());
      setBatchData(res);
    } catch (err) {
      if (err.status === 404) {
        setError(tr.notFound || 'Batch not found. Check the batch ID on your product label.');
      } else {
        setError(err.message || (tr.loadError || 'Unable to load batch data. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, [tr.notFound, tr.loadError]);

  useEffect(() => {
    if (urlBatchId) {
      setActiveBatchId(urlBatchId);
      setInputBatchId(urlBatchId);
      loadBatch(urlBatchId);
    }
  }, [urlBatchId, loadBatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputBatchId.trim()) return;
    setActiveBatchId(inputBatchId.trim());
    navigate(`/traceability/${inputBatchId.trim()}`, { replace: true });
    loadBatch(inputBatchId.trim());
  };

  const { batch, product, seller, lab_report, events } = batchData || {};

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="section-title mb-4">{tr.title || 'Trace Your Honey'}</h1>
          <p className="section-subtitle mx-auto mb-8">
            {tr.subtitle || 'Enter a batch ID to see the complete journey of your honey from hive to home.'}
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                value={inputBatchId}
                onChange={e => setInputBatchId(e.target.value)}
                placeholder={tr.searchPlaceholder || 'Enter Batch ID (e.g. HC-TN-001)'}
                className="input-field pl-11 py-4 text-base shadow-card w-full"
              />
            </div>
            <button type="submit" className="btn-primary px-6 flex items-center gap-2" disabled={loading}>
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              {tr.searchBtn || 'Trace'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <RefreshCw size={32} className="animate-spin text-honey-500 mx-auto mb-4" />
            <p className="text-charcoal-500">{t?.common?.loading || 'Loading batch data...'}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">
              {tr.notFound || 'Batch Not Found'}
            </h3>
            <p className="text-charcoal-400 text-sm mb-4">{error}</p>
            <p className="text-xs text-charcoal-400">
              {tr.notFoundHint || 'Check the batch ID on your product label and try again.'}
            </p>
          </div>
        )}

        {/* No search yet */}
        {!loading && !error && !batchData && !activeBatchId && (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <QrCode size={48} className="text-charcoal-300 mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-charcoal-600 mb-2">
              {tr.enterManually || 'Enter a batch ID above to trace your honey'}
            </h3>
            <p className="text-charcoal-400 text-sm">
              Find the batch ID on your product label (e.g. HC-TN-2026-001)
            </p>
          </div>
        )}

        {/* Batch data */}
        {!loading && !error && batchData && batch && (
          <div className="space-y-6">
            {/* Batch summary card */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-xs text-charcoal-400 mb-1">{tr.batchInfo || 'Batch Information'}</p>
                  <h2 className="text-xl font-display font-bold text-charcoal-900 font-mono">{batch.batch_id}</h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    batch.batch_status === 'APPROVED' || batch.batch_status === 'LISTED' ? 'bg-green-100 text-green-700' :
                    batch.batch_status === 'LAB_PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {batch.batch_status?.replace(/_/g, ' ')}
                  </span>
                  {batch.laboratory_status === 'COMPLIANT' && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                      <FlaskConical size={11} /> Lab Compliant
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {batch.harvest_date && (
                  <div>
                    <p className="text-xs text-charcoal-400">{tr.farmInfo ? 'Harvest Date' : 'Harvest Date'}</p>
                    <p className="font-semibold text-charcoal-800">
                      {new Date(batch.harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {batch.quantity && (
                  <div>
                    <p className="text-xs text-charcoal-400">Quantity</p>
                    <p className="font-semibold text-charcoal-800">{batch.quantity} {batch.unit || 'kg'}</p>
                  </div>
                )}
                {seller?.name && (
                  <div>
                    <p className="text-xs text-charcoal-400">{tr.farmInfo || 'Seller'}</p>
                    <p className="font-semibold text-charcoal-800">{seller.name}</p>
                  </div>
                )}
                {product?.name && (
                  <div>
                    <p className="text-xs text-charcoal-400">Product</p>
                    <p className="font-semibold text-charcoal-800">{product.name}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-cream-200">
                {lab_report && (
                  <button
                    onClick={() => setLabModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <FlaskConical size={15} /> {tr.viewFullReport || 'View Lab Report'}
                  </button>
                )}
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-medium text-charcoal-600 hover:text-charcoal-800"
                >
                  <QrCode size={15} /> Show QR Code
                </button>
              </div>
            </div>

            {/* Supply chain events */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
              <h3 className="font-display font-bold text-charcoal-800 mb-6 flex items-center gap-2">
                <Link2 size={18} className="text-honey-500" />
                {tr.events || 'Supply Chain Events'}
              </h3>

              {(!events || events.length === 0) ? (
                <p className="text-sm text-charcoal-400 italic">{tr.noEvents || 'No traceability events recorded yet.'}</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-cream-200" />

                  <div className="space-y-4">
                    {events.map((event, i) => {
                      const style = EVENT_STYLES[event.event_type] || EVENT_STYLES.OTHER;
                      const emoji = EVENT_EMOJIS[event.event_type] || '📋';
                      return (
                        <div key={event.id || i} className="flex gap-4 relative">
                          <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 z-10 bg-white ${style}`}>
                            <span className="text-lg">{emoji}</span>
                          </div>
                          <div className="flex-1 bg-cream-50 rounded-xl p-4 min-w-0">
                            <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
                              <p className="font-semibold text-charcoal-800 text-sm">
                                {event.event_type?.replace(/_/g, ' ')}
                              </p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                event.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {event.verification_status === 'VERIFIED' ? (tr.verifiedEvent || 'Verified') : (tr.unverifiedEvent || 'Unverified')}
                              </span>
                            </div>
                            {event.event_description && (
                              <p className="text-xs text-charcoal-600 mb-1">{event.event_description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-charcoal-400">
                              {event.performed_by_name && (
                                <span className="flex items-center gap-1">
                                  <User size={11} /> {event.performed_by_name}
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} /> {event.location}
                                </span>
                              )}
                              {event.event_timestamp && (
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {new Date(event.event_timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModalOpen && activeBatchId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setQrModalOpen(false)}>
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-charcoal-800 mb-4">Batch QR Code</h3>
            <QRCode value={`${window.location.origin}/verify-batch/${activeBatchId}`} size={200} />
            <p className="text-xs text-charcoal-400 mt-4 font-mono">{activeBatchId}</p>
            <button onClick={() => setQrModalOpen(false)} className="btn-secondary mt-4 text-sm">Close</button>
          </div>
        </div>
      )}

      {labModalOpen && lab_report && (
        <LabReportModal labReportId={lab_report.id} onClose={() => setLabModalOpen(false)} />
      )}
    </div>
  );
}
