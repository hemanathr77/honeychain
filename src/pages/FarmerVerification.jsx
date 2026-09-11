import React, { useState } from 'react';
import { CheckCircle, Upload, MapPin, Camera, Shield, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badges';
import { useCart } from '../context/CartContext';

const STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Farm Details' },
  { id: 3, label: 'Colony Info' },
  { id: 4, label: 'Documents' },
  { id: 5, label: 'Review' },
];

export default function FarmerVerification() {
  const { showToast } = useCart();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', village: '', district: '', state: 'Tamil Nadu',
    farmPhotos: [], hivePhotos: [], colonies: '', species: '',
    experience: '', honeyTypes: '', capacity: '',
    trainings: '', idDoc: null, licenseDoc: null,
    gps: '', notes: '',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    setSubmitted(true);
    showToast('success', 'Verification application submitted! Reference: HCV-2026-0142');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
          <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-2">Application Submitted!</h2>
          <p className="text-charcoal-500 mb-4">Your farmer verification application has been received.</p>
          <div className="bg-cream-50 rounded-xl p-4 mb-5 text-left">
            <p className="text-xs font-mono font-bold text-honey-700 mb-1">Reference: HCV-2026-0142</p>
            <p className="text-xs text-charcoal-500">A HoneyChain field officer will contact you within 7 working days for physical verification of your farm and colonies.</p>
          </div>
          {/* Verification workflow */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-5 text-xs">
            {['Submitted', 'Under Review', 'Field Visit', 'Verified'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`px-3 py-1.5 rounded-full font-semibold border ${i === 0 ? 'bg-honey-100 text-honey-700 border-honey-300' : 'bg-cream-100 text-charcoal-400 border-cream-200'}`}>{s}</div>
                {i < 3 && <span className="text-charcoal-300">→</span>}
              </React.Fragment>
            ))}
          </div>
          <button onClick={() => setSubmitted(false)} className="btn-secondary w-full text-sm">Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="page-header">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="text-forest-600" size={32} />
            
          </div>
          <h1 className="section-title mb-3">Become a Verified Farmer</h1>
          <p className="section-subtitle mx-auto">
            Complete the verification process to get the HoneyChain Verified Farmer badge and list your honey on the marketplace.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Progress steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center min-w-[60px]">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.id ? 'bg-forest-500 text-white' :
                  step === s.id ? 'bg-honey-500 text-white ring-4 ring-honey-100' :
                  'bg-cream-200 text-charcoal-400'
                }`}>
                  {step > s.id ? <CheckCircle size={16} /> : s.id}
                </div>
                <p className={`text-xs mt-1 font-medium text-center leading-tight ${step === s.id ? 'text-honey-700' : 'text-charcoal-400'}`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? 'bg-forest-300' : 'bg-cream-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => update('name', e.target.value)} className="input-field" placeholder="As per ID proof" required /></div>
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">Phone Number *</label>
                  <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field" placeholder="+91 XXXXX XXXXX" type="tel" /></div>
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">Village / Town *</label>
                  <input value={form.village} onChange={e => update('village', e.target.value)} className="input-field" placeholder="Village name" /></div>
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">District *</label>
                  <input value={form.district} onChange={e => update('district', e.target.value)} className="input-field" placeholder="e.g. Erode" /></div>
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">State *</label>
                  <select value={form.state} onChange={e => update('state', e.target.value)} className="input-field">
                    <option>Tamil Nadu</option><option>Kerala</option><option>Karnataka</option><option>Andhra Pradesh</option><option>Telangana</option>
                  </select></div>
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">GPS Coordinates</label>
                  <div className="flex gap-2">
                    <input value={form.gps} onChange={e => update('gps', e.target.value)} className="input-field flex-1" placeholder="lat, lng" />
                    <button type="button" onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          pos => update('gps', `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
                          () => alert('Could not get location. Please enter manually.')
                        );
                      }
                    }} className="btn-secondary px-3 text-sm flex items-center gap-1 whitespace-nowrap">
                      <MapPin size={14} /> GPS
                    </button>
                  </div></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">Farm Details</h2>
              <div>
                <label className="text-sm font-semibold text-charcoal-700 block mb-2">Farm Photos *</label>
                <div className="border-2 border-dashed border-cream-300 rounded-xl p-8 text-center hover:border-honey-400 transition-colors cursor-pointer">
                  <Camera size={28} className="text-charcoal-300 mx-auto mb-2" />
                  <p className="text-sm text-charcoal-400">Upload photos of your farm / apiary</p>
                  <p className="text-xs text-charcoal-300 mt-1">Min 3 photos required</p>
                  <button type="button" className="mt-3 btn-secondary text-xs px-4 py-2">Upload Photos</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-charcoal-700 block mb-1">Honey Types Produced *</label>
                <input value={form.honeyTypes} onChange={e => update('honeyTypes', e.target.value)} className="input-field" placeholder="e.g. Multi-Floral, Jamun, Tulsi" />
              </div>
              <div>
                <label className="text-sm font-semibold text-charcoal-700 block mb-1">Annual Production Capacity (kg) *</label>
                <input value={form.capacity} type="number" onChange={e => update('capacity', e.target.value)} className="input-field" placeholder="Approximate kg per year" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">Colony & Experience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">Number of Colonies *</label>
                  <input value={form.colonies} type="number" onChange={e => update('colonies', e.target.value)} className="input-field" placeholder="Total active hives" /></div>
                <div><label className="text-sm font-semibold text-charcoal-700 block mb-1">Years of Experience *</label>
                  <input value={form.experience} type="number" onChange={e => update('experience', e.target.value)} className="input-field" placeholder="Years" /></div>
                <div className="md:col-span-2"><label className="text-sm font-semibold text-charcoal-700 block mb-1">Bee Species *</label>
                  <input value={form.species} onChange={e => update('species', e.target.value)} className="input-field" placeholder="e.g. Apis cerana, Apis mellifera" /></div>
                <div className="md:col-span-2"><label className="text-sm font-semibold text-charcoal-700 block mb-1">Training Certificates</label>
                  <input value={form.trainings} onChange={e => update('trainings', e.target.value)} className="input-field" placeholder="e.g. NABARD Beekeeping 2021, KVIC Program 2022" /></div>
              </div>
              <div>
                <label className="text-sm font-semibold text-charcoal-700 block mb-2">Hive Photos *</label>
                <div className="border-2 border-dashed border-cream-300 rounded-xl p-6 text-center cursor-pointer hover:border-honey-400 transition-colors">
                  <Camera size={24} className="text-charcoal-300 mx-auto mb-2" />
                  <p className="text-sm text-charcoal-400">Upload photos of your hives / colonies</p>
                  <button type="button" className="mt-2 btn-secondary text-xs px-3 py-1.5">Upload</button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">Documents</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-amber-700 mb-1">Document Privacy</p>
                <p className="text-xs text-amber-600">Documents are encrypted and only accessible to HoneyChain verification officers. They are not shared with customers.</p>
              </div>
              {[
                { label: 'Government ID (Aadhaar / Voter ID / PAN) *', key: 'idDoc' },
                { label: 'Registration / Licence (if applicable)', key: 'licenseDoc' },
              ].map(doc => (
                <div key={doc.key}>
                  <label className="text-sm font-semibold text-charcoal-700 block mb-2">{doc.label}</label>
                  <div className="border-2 border-dashed border-cream-300 rounded-xl p-5 flex items-center gap-4 hover:border-honey-400 transition-colors cursor-pointer">
                    <Upload size={20} className="text-charcoal-300" />
                    <div>
                      <p className="text-sm text-charcoal-500">Click to upload</p>
                      <p className="text-xs text-charcoal-300">PDF, JPG, PNG — max 5MB</p>
                    </div>
                    <button type="button" className="ml-auto btn-secondary text-xs px-3 py-1.5">Choose File</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-charcoal-800 mb-5">Review & Submit</h2>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: form.name || '—' },
                  { label: 'Location', value: form.village ? `${form.village}, ${form.district}` : '—' },
                  { label: 'Colonies', value: form.colonies || '—' },
                  { label: 'Experience', value: form.experience ? `${form.experience} years` : '—' },
                  { label: 'Species', value: form.species || '—' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-cream-100">
                    <span className="text-sm text-charcoal-500">{item.label}</span>
                    <span className="text-sm font-semibold text-charcoal-800">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-cream-50 rounded-xl p-4 mt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 accent-honey-500" required />
                  <span className="text-sm text-charcoal-600">
                    I confirm that all information provided is accurate and I consent to a field verification visit by a HoneyChain officer. I understand that verification improves transparency for customers.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1 text-sm">← Back</button>
            )}
            {step < 5 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-success flex-1 text-sm flex items-center justify-center gap-2">
                <Shield size={16} /> Submit Verification Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
