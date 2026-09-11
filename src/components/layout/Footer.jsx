import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-cream-200 mt-auto">
      {/* Honey drip divider */}
      <div className="bg-honey-500 h-1" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-honey-gradient rounded-xl flex items-center justify-center text-xl shadow-honey">
                🍯
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white">Honey</span>
                <span className="font-display font-bold text-xl text-honey-400">Chain</span>
              </div>
            </div>
            <p className="text-sm text-charcoal-400 leading-relaxed mb-4">
              Building trust in every drop.
            </p>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              HoneyChain connects customers, verified honey farmers, collectors, mentors, experts, and testing laboratories in a trusted digital ecosystem.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {[
                { label: 'Honey Marketplace', path: '/marketplace' },
                { label: 'Batch Traceability', path: '/traceability' },
                { label: 'Lab Verification', path: '/lab-verification' },
                { label: 'Bee Rescue', path: '/bee-rescue' },
                { label: 'Impact Dashboard', path: '/impact' },
              ].map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-charcoal-400 hover:text-honey-400 transition-colors flex items-center gap-1">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Farmers */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">For Farmers</h4>
            <ul className="space-y-2">
              {[
                { label: 'Farmer Dashboard', path: '/farmer-dashboard' },
                { label: 'Get Verified', path: '/farmer-verification' },
                { label: 'Start Beekeeping', path: '/start-beekeeping' },
                { label: 'Find Mentors', path: '/mentorship' },
                { label: 'Expert Directory', path: '/experts' },
                { label: 'Community Q&A', path: '/learn' },
                { label: 'Bee-Friendly Farming', path: '/bee-friendly-farming' },
              ].map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-charcoal-400 hover:text-honey-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {[
                { label: 'About HoneyChain', path: '/about' },
                { label: 'Trust & Safety', path: '/trust-safety' },
                { label: 'Admin Panel', path: '/admin' },
                { label: 'Privacy Policy', path: '/about' },
                { label: 'Terms of Service', path: '/about' },
              ].map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-charcoal-400 hover:text-honey-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2">
              <p className="text-xs text-charcoal-500 flex items-center gap-1">
                <Mail size={12} /> contact@honeychain.in
              </p>
              <p className="text-xs text-charcoal-500 flex items-center gap-1">
                <MapPin size={12} /> Tamil Nadu, India
              </p>
            </div>
          </div>
        </div>

        {/* Trust disclaimer */}
        <div className="mt-10 pt-8 border-t border-charcoal-800">
          <div className="bg-charcoal-800 rounded-xl p-4 mb-6">
            <p className="text-xs text-charcoal-400 leading-relaxed">
              <strong className="text-honey-400">Important Disclaimer:</strong> Traceability and seller verification improve transparency but do not replace laboratory testing or applicable food-safety requirements. A laboratory report belongs to a specific sample and batch. HoneyChain does not claim that traceability alone proves honey purity — laboratory testing by an appropriate accredited food testing laboratory is the mechanism for honey quality verification.
            </p>
          </div>

          {/* Trust levels */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {[
              { emoji: '👨‍🌾', label: 'Seller Verified', color: 'text-forest-400' },
              { emoji: '🍯', label: 'Batch Verified', color: 'text-honey-400' },
              { emoji: '🧪', label: 'Lab Tested', color: 'text-blue-400' },
              { emoji: '🔗', label: 'Traceable', color: 'text-purple-400' },
              { emoji: '⭐', label: 'Verified Purchase', color: 'text-yellow-400' },
            ].map(level => (
              <div key={level.label} className="flex items-center gap-1 text-xs bg-charcoal-800 px-3 py-1.5 rounded-full border border-charcoal-700">
                <span>{level.emoji}</span>
                <span className={level.color + ' font-medium'}>{level.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-charcoal-500">
            <p>&copy; 2026 HoneyChain. All rights reserved.</p>
            <p className="text-honey-600 font-semibold">"From Hive to Home — With Trust at Every Step."</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
