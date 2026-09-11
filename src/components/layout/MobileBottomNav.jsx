import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, QrCode, Siren, User, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function MobileBottomNav() {
  const { cartCount } = useCart();

  const tabs = [
    { label: 'Home', path: '/', icon: <Home size={20} /> },
    { label: 'Market', path: '/marketplace', icon: <ShoppingBag size={20} /> },
    { label: 'Trace', path: '/traceability', icon: <QrCode size={20} /> },
    { label: 'Rescue', path: '/bee-rescue', icon: <Siren size={20} /> },
    { label: 'Profile', path: '/login', icon: <User size={20} /> },
  ];

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <NavLink
          to="/bee-rescue"
          className="flex items-center gap-2 bg-honey-gradient text-white px-4 py-3 rounded-2xl shadow-honey font-semibold text-sm"
        >
          <Plus size={16} /> Report
        </NavLink>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-cream-200 md:hidden">
        <div className="flex items-center justify-around py-2">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                  isActive ? 'text-honey-600' : 'text-charcoal-400'
                }`
              }
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
}
