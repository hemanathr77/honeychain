import React, { useState, useCallback, useRef } from 'react';
import { MapPin, Camera, Send, CheckCircle, AlertCircle, RefreshCw, Clock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { rescue as rescueApi } from '../services/api';
import { useCart } from '../context/CartContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const COLONY_SIZES = [
  { value: 'small', labelKey: 'small' },
  { value: 'medium', labelKey: 'medium' },
  { value: 'large', labelKey: 'large' },
];

const STATUS_COLORS = {
  REPORTED: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  COLLECTOR_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// Detect if device likely has a rear camera (mobile/tablet)
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export default function BeeRescue() {
  const { user } = useAuth();
  const { t } = useApp();
  const { showToast } = useCart();
  const tr = t?.rescue || {};
  const trForm = tr.form || {};

  const [tab, setTab] = useState('report');

  // Form state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [colonySize, setColonySize] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // GPS state
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | capturing | captured | denied | error
  const [gpsCoords, setGpsCoords] = useState(null); // { lat, lng, accuracy }
  const [gpsError, setGpsError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // My reports tab
  const [myReports, setMyReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');

  const fileInputRef = useRef();

  // ─── GPS Capture ─────────────────────────────────────────────────────────
  const handleCaptureGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('capturing');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy });
        setGpsStatus('captured');
      },
      (err) => {
        setGpsCoords(null);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsError(trForm.gpsError || 'Location permission is required to submit this request.');
        } else {
          setGpsStatus('error');
          setGpsError('Unable to get location. Please try again or check your device settings.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [trForm.gpsError]);

  // ─── Photo Selection ──────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setSubmitError('Invalid file type. Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('File too large. Maximum size is 10MB.');
      return;
    }

    setPhotoFile(file);
    setSubmitError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ─── Form Validation & Submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!photoFile) {
      setSubmitError(trForm.photoRequired || 'Please add a photo of the colony.');
      return;
    }
    if (gpsStatus !== 'captured' || !gpsCoords) {
      setSubmitError(trForm.gpsRequired || 'Please capture your location before submitting.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please provide a description of the colony.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('description', description.trim());
      formData.append('approximate_size', colonySize);
      formData.append('location_description', `GPS: ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)} (±${Math.round(gpsCoords.accuracy)}m accuracy)`);
      formData.append('latitude', gpsCoords.lat.toString());
      formData.append('longitude', gpsCoords.lng.toString());
      formData.append('location_accuracy', gpsCoords.accuracy.toString());
      formData.append('photo_captured_at', new Date().toISOString());
      if (contactName.trim()) formData.append('reporter_name', contactName.trim());
      if (contactPhone.trim()) formData.append('reporter_phone', contactPhone.trim());

      const result = await rescueApi.submitWithPhoto(formData);
      setSubmitted(true);
      setSubmittedRequest(result.request);
      showToast?.('success', tr.success?.title || 'Rescue request submitted!');
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Load My Reports ──────────────────────────────────────────────────────
  const loadMyReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const res = await rescueApi.list();
      setMyReports(res.requests || []);
    } catch (err) {
      setReportsError(err.message || (tr.myReports?.loadError || 'Unable to load your rescue requests.'));
    } finally {
      setReportsLoading(false);
    }
  }, [tr.myReports]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === 'reports') loadMyReports();
  };

  const resetForm = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setDescription('');
    setColonySize('');
    setGpsStatus('idle');
    setGpsCoords(null);
    setGpsError('');
    setSubmitError('');
    setSubmitted(false);
    setSubmittedRequest(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mobile = isMobileDevice();

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-50 to-honey-50 py-14 px-4 border-b border-orange-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🐝</div>
          <h1 className="section-title mb-4">
            {tr.title || 'Found a Bee Colony? Save It. Don\'t Destroy It.'}
          </h1>
          <p className="section-subtitle mx-auto">
            {tr.subtitle || 'Bee colonies found in buildings, trees or public areas are valuable. Connect with a verified beekeeper to safely relocate them.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            {[
              { emoji: '🏠', label: 'In homes / buildings' },
              { emoji: '🌳', label: 'On trees' },
              { emoji: '🏫', label: 'Near schools' },
              { emoji: '🌾', label: 'On farms' },
              { emoji: '🏢', label: 'Public areas' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-orange-200 text-sm font-medium text-charcoal-700">
                {l.emoji} {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-cream-200">
          {[
            { id: 'report', label: tr.reportTab || 'Report a Colony', icon: Send },
            { id: 'reports', label: tr.myReportsTab || 'My Reports', icon: Eye },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === id
                  ? 'border-honey-500 text-honey-700'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* ── REPORT TAB ── */}
        {tab === 'report' && (
          submitted && submittedRequest ? (
            // Success state
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-display font-bold text-charcoal-800 mb-2">
                {tr.success?.title || 'Rescue Request Submitted!'}
              </h2>
              <p className="text-charcoal-500 mb-4">
                {tr.success?.message || 'Your request has been recorded. A verified collector will contact you.'}
              </p>
              <div className="bg-honey-50 border border-honey-200 rounded-xl p-4 inline-block mb-6">
                <p className="text-xs text-charcoal-500 mb-1">{tr.success?.requestId || 'Request ID'}</p>
                <p className="font-mono font-bold text-honey-700 text-lg">{submittedRequest.request_number}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Report Another Colony
                </button>
                <button
                  onClick={() => handleTabChange('reports')}
                  className="btn-primary"
                >
                  View My Reports
                </button>
              </div>
            </div>
          ) : (
            // Report form
            <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
              <h2 className="text-xl font-display font-bold text-charcoal-800 mb-6">Report a Bee Colony</h2>

              {submitError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                    {trForm.photo || 'Photo of the Colony'} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-charcoal-400 mb-3">
                    {trForm.photoHint || 'Take a photo or upload an image (JPG, PNG, WebP, max 10MB)'}
                  </p>

                  {/* Photo preview */}
                  {photoPreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={photoPreview}
                        alt={trForm.previewAlt || 'Colony photo preview'}
                        className="w-48 h-36 object-cover rounded-xl border border-cream-200"
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* File input — mobile uses camera capture, desktop uses file picker */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    {...(mobile ? { capture: 'environment' } : {})}
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="rescue-photo-input"
                  />
                  <label
                    htmlFor="rescue-photo-input"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-honey-300 bg-honey-50 text-honey-700 font-medium text-sm cursor-pointer hover:border-honey-500 hover:bg-honey-100 transition-colors"
                  >
                    <Camera size={18} />
                    {mobile
                      ? (trForm.capturePhoto || 'Capture Photo')
                      : (trForm.chooseFile || 'Choose File')}
                  </label>
                </div>

                {/* GPS Location */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                    {trForm.gpsLabel || 'Location'} <span className="text-red-500">*</span>
                  </label>

                  {gpsStatus === 'idle' && (
                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forest-50 border border-forest-200 text-forest-700 font-medium text-sm hover:bg-forest-100 transition-colors"
                    >
                      <MapPin size={18} />
                      {trForm.captureGps || 'Capture My Location'}
                    </button>
                  )}

                  {gpsStatus === 'capturing' && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                      <RefreshCw size={16} className="animate-spin" />
                      {trForm.gpsCapturing || 'Capturing location...'}
                    </div>
                  )}

                  {gpsStatus === 'captured' && gpsCoords && (
                    <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm">
                      <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                        <CheckCircle size={16} />
                        {trForm.gpsCaptured || 'Location captured'}
                      </div>
                      <p className="text-green-600 text-xs">
                        {trForm.gpsAccuracy || 'Estimated accuracy'}: ±{Math.round(gpsCoords.accuracy)}m
                      </p>
                      <p className="text-green-600 text-xs font-mono">
                        {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                      </p>
                      <button
                        type="button"
                        onClick={handleCaptureGps}
                        className="mt-2 text-xs text-green-600 underline hover:text-green-700"
                      >
                        Recapture
                      </button>
                    </div>
                  )}

                  {(gpsStatus === 'denied' || gpsStatus === 'error') && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm">
                      <div className="flex items-start gap-2 text-red-700 mb-2">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{gpsError}</span>
                      </div>
                      {gpsStatus === 'error' && (
                        <button type="button" onClick={handleCaptureGps} className="text-xs text-red-600 underline hover:text-red-700">
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                    {trForm.descriptionLabel || 'Description'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={trForm.descriptionPlaceholder || 'Describe the colony — where is it, how large, is it accessible?'}
                    rows={4}
                    className="input-field resize-none"
                    required
                  />
                </div>

                {/* Colony Size */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                    {trForm.colonySize || 'Approximate Colony Size'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {COLONY_SIZES.map(({ value, labelKey }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setColonySize(value)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          colonySize === value
                            ? 'border-honey-500 bg-honey-50 text-honey-700'
                            : 'border-cream-200 bg-white text-charcoal-600 hover:border-honey-300'
                        }`}
                      >
                        {trForm[labelKey] || (value === 'small' ? 'Small (< 1,000 bees)' : value === 'medium' ? 'Medium (1,000–5,000 bees)' : 'Large (> 5,000 bees)')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      {trForm.contactName || 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="input-field"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                      {trForm.contactPhone || 'Your Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      className="input-field"
                      placeholder="+91 XXXXXXXX"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      {trForm.submitting || 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {trForm.submitBtn || 'Submit Rescue Request'}
                    </>
                  )}
                </button>
              </form>
            </div>
          )
        )}

        {/* ── MY REPORTS TAB ── */}
        {tab === 'reports' && (
          <div>
            {reportsLoading ? (
              <div className="text-center py-12">
                <RefreshCw size={28} className="animate-spin text-honey-500 mx-auto mb-3" />
                <p className="text-charcoal-500 text-sm">Loading your reports...</p>
              </div>
            ) : reportsError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
                <p className="text-red-700 text-sm mb-4">{reportsError}</p>
                <button onClick={loadMyReports} className="btn-secondary text-sm">Try Again</button>
              </div>
            ) : myReports.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-card p-10 text-center">
                <div className="text-5xl mb-4">🐝</div>
                <h3 className="text-lg font-display font-bold text-charcoal-700 mb-2">
                  {tr.myReports?.empty || 'No rescue requests submitted yet.'}
                </h3>
                <p className="text-charcoal-400 text-sm mb-6">
                  {tr.myReports?.emptyHint || 'Use the "Report a Colony" tab to submit a new request.'}
                </p>
                <button onClick={() => setTab('report')} className="btn-primary">
                  Report a Colony
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myReports.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl shadow-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-honey-700">{req.request_number}</p>
                        <p className="text-xs text-charcoal-400 mt-0.5">
                          <Clock size={11} className="inline mr-1" />
                          {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {req.photo_url && (
                      <img
                        src={`${API_BASE}${req.photo_url}`}
                        alt="Colony"
                        className="w-full h-36 object-cover rounded-xl mb-3 border border-cream-200"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}

                    <p className="text-sm text-charcoal-700 mb-2">{req.description}</p>
                    {req.location_description && (
                      <p className="text-xs text-charcoal-400 flex items-center gap-1">
                        <MapPin size={12} />
                        {req.location_description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
