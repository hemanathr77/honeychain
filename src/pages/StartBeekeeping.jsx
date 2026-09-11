import React, { useState } from 'react';
import { CheckCircle, ChevronRight, ArrowRight, Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';



const ROADMAP = [
  {
    step: 1,
    emoji: '📚',
    title: 'Learn',
    subtitle: 'Study beekeeping basics',
    color: 'bg-blue-50 border-blue-200',
    accent: 'text-blue-700',
    details: 'Start with HoneyChain\'s community resources, expert Q&A, and free learning materials. Understand colony behavior, hive types, bee species, and seasonal patterns for your region.',
    actions: [
      { label: 'Browse Community Q&A', path: '/learn' },
      { label: 'View Expert Directory', path: '/experts' },
    ],
  },
  {
    step: 2,
    emoji: '🤝',
    title: 'Find a Mentor',
    subtitle: 'Connect with local experts',
    color: 'bg-forest-50 border-forest-200',
    accent: 'text-forest-700',
    details: 'Find an experienced beekeeper in your district through HoneyChain\'s mentorship system. Mentors guide you through your first season, equipment setup, and colony management.',
    actions: [
      { label: 'Find a Mentor', path: '/mentorship' },
    ],
  },
  {
    step: 3,
    emoji: '📍',
    title: 'Select Location',
    subtitle: 'Choose the right apiary site',
    color: 'bg-yellow-50 border-yellow-200',
    accent: 'text-yellow-700',
    details: 'Your mentor helps you identify a suitable apiary location near flowering plants. Consider wind shelter, water access, sunlight, and distance from public spaces.',
    actions: [
      { label: 'Bee-Friendly Plants Guide', path: '/bee-friendly-farming' },
    ],
  },
  {
    step: 4,
    emoji: '🐝',
    title: 'Start First Hive',
    subtitle: 'Set up your colony',
    color: 'bg-honey-50 border-honey-200',
    accent: 'text-honey-700',
    details: 'With your mentor\'s guidance, set up your first hive. Begin with a nucleus colony (nuc) from a verified beekeeper. Learn basic hive inspection and safety equipment.',
    actions: [],
  },
  {
    step: 5,
    emoji: '🌿',
    title: 'Maintain Colony',
    subtitle: 'Regular inspections & care',
    color: 'bg-green-50 border-green-200',
    accent: 'text-green-700',
    details: 'Perform weekly inspections during active season. Monitor for disease, check brood patterns, manage swarming, and ensure adequate food supply. Record all observations.',
    actions: [],
  },
  {
    step: 6,
    emoji: '🍯',
    title: 'Harvest',
    subtitle: 'Your first honey harvest',
    color: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-700',
    details: 'Harvest honey when frames are at least 80% capped. Use proper extraction equipment. Record quantity, date, and observations. This data enters your HoneyChain batch.',
    actions: [],
  },
  {
    step: 7,
    emoji: '🧪',
    title: 'Lab Test',
    subtitle: 'Verify your honey quality',
    color: 'bg-purple-50 border-purple-200',
    accent: 'text-purple-700',
    details: 'Submit a honey sample to an accredited food testing laboratory. HoneyChain facilitates sample collection and lab linkage. A laboratory report is created for your batch.',
    actions: [
      { label: 'Lab Verification Portal', path: '/lab-verification' },
    ],
  },
  {
    step: 8,
    emoji: '🏪',
    title: 'Sell on HoneyChain',
    subtitle: 'List your verified honey',
    color: 'bg-red-50 border-red-200',
    accent: 'text-red-700',
    details: 'Once verified and lab-tested, list your honey on the HoneyChain marketplace. Customers can view your farmer profile, batch traceability, and lab report.',
    actions: [
      { label: 'Get Verified as Farmer', path: '/farmer-verification' },
      { label: 'View Marketplace', path: '/marketplace' },
    ],
  },
  {
    step: 9,
    emoji: '🚀',
    title: 'Grow',
    subtitle: 'Expand your apiary',
    color: 'bg-indigo-50 border-indigo-200',
    accent: 'text-indigo-700',
    details: 'Use revenue from sales to expand your apiary. Add more hives, explore new honey varieties, and eventually become a mentor yourself for the next generation of beekeepers.',
    actions: [
      { label: 'Become a Mentor', path: '/mentorship' },
    ],
  },
];

export default function StartBeekeeping() {
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();

  const active = ROADMAP.find(r => r.step === activeStep);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-50 to-honey-50 py-14 px-4 border-b border-forest-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="section-title mb-4">Start Your Beekeeping Journey</h1>
          <p className="section-subtitle mx-auto mb-4">
            HoneyChain doesn't just sell honey — we create new beekeepers. Follow our 9-step interactive roadmap from learning to your first marketplace listing.
          </p>
          
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roadmap steps */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-charcoal-700 mb-4 text-sm uppercase tracking-wider">Your Roadmap</h2>
            <div className="space-y-2">
              {ROADMAP.map((item, i) => (
                <button
                  key={item.step}
                  onClick={() => setActiveStep(item.step)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    activeStep === item.step
                      ? 'bg-honey-500 text-white shadow-honey'
                      : 'bg-white border border-cream-200 text-charcoal-700 hover:border-honey-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    activeStep === item.step ? 'bg-honey-600' : 'bg-cream-100'
                  }`}>
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${activeStep === item.step ? 'text-white' : 'text-charcoal-800'}`}>
                      Step {item.step}: {item.title}
                    </p>
                    <p className={`text-xs truncate ${activeStep === item.step ? 'text-honey-100' : 'text-charcoal-400'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                  {activeStep === item.step && <ChevronRight size={14} className="flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step detail */}
          {active && (
            <div className="lg:col-span-2 space-y-6">
              <div className={`rounded-2xl border-2 p-8 ${active.color} animate-fade-in`}>
                <div className="text-6xl mb-4">{active.emoji}</div>
                <div className="mb-2">
                  <span className={`text-xs font-bold uppercase tracking-widest ${active.accent}`}>Step {active.step} of 9</span>
                </div>
                <h2 className="font-display font-black text-3xl text-charcoal-900 mb-2">{active.title}</h2>
                <p className={`text-sm font-semibold mb-4 ${active.accent}`}>{active.subtitle}</p>
                <p className="text-charcoal-700 leading-relaxed text-base">{active.details}</p>

                {active.actions.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {active.actions.map(action => (
                      <Link
                        key={action.path}
                        to={action.path}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        {action.label} <ArrowRight size={14} />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-charcoal-100/30">
                  <button
                    onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                    disabled={activeStep === 1}
                    className="btn-secondary text-sm disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-1">
                    {ROADMAP.map(r => (
                      <div
                        key={r.step}
                        onClick={() => setActiveStep(r.step)}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                          r.step === activeStep ? 'bg-honey-500 w-6' : 'bg-charcoal-200'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveStep(Math.min(9, activeStep + 1))}
                    disabled={activeStep === 9}
                    className="btn-primary text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Impact callout */}
              <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6">
                <h3 className="font-semibold text-charcoal-800 mb-2 flex items-center gap-2">
                  <Leaf className="text-forest-600" size={18} />
                  Why Become a Beekeeper?
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { emoji: '💰', label: 'Supplemental income from honey sales' },
                    { emoji: '🌸', label: 'Improve local pollination & agriculture' },
                    { emoji: '🌍', label: 'Support bee population conservation' },
                    { emoji: '🏆', label: 'Join a community of verified farmers' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-2 text-charcoal-600">
                      <span>{item.emoji}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
