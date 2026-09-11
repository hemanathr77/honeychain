import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Globe, ShoppingCart, Menu, X, ChevronDown,
  User, LogOut, Settings, LayoutDashboard, Leaf, Shield,
  FlaskConical, Award, MessageSquare, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';



export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { language, setLanguage, t } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef();
  const profileRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: t?.nav?.home || 'Home', path: '/' },
    { label: t?.nav?.marketplace || 'Marketplace', path: '/marketplace' },
    { label: t?.nav?.traceability || 'Traceability', path: '/traceability' },
    { label: t?.nav?.beeRescue || 'Bee Rescue', path: '/bee-rescue' },
    { label: t?.nav?.learn || 'Learn & Mentorship', path: '/learn', hasDropdown: true, children: [
      { label: 'Community Q&A', path: '/learn', icon: <MessageSquare size={15}/> },
      { label: 'Expert Directory', path: '/experts', icon: <Award size={15}/> },
      { label: 'Mentorship', path: '/mentorship', icon: <HelpCircle size={15}/> },
    ]},
    { label: t?.nav?.forFarmers || 'For Farmers', path: '/farmer-dashboard', hasDropdown: true, children: [
      { label: 'Farmer Dashboard', path: '/farmer-dashboard', icon: <LayoutDashboard size={15}/> },
      { label: 'Get Verified', path: '/farmer-verification', icon: <Shield size={15}/> },
      { label: 'Start Beekeeping', path: '/start-beekeeping', icon: <Leaf size={15}/> },
      { label: 'Lab Verification', path: '/lab-verification', icon: <FlaskConical size={15}/> },
    ]},
    { label: 'About', path: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const NOTIFICATIONS_DATA = []; // Replace with actual API data later
  const unreadCount = NOTIFICATIONS_DATA.filter(n => !n.read).length;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-cream-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 bg-honey-gradient rounded-xl flex items-center justify-center text-xl shadow-honey">
                🍯
              </div>
              <div>
                <span className="font-display font-bold text-xl text-charcoal-800">Honey</span>
                <span className="font-display font-bold text-xl text-honey-600">Chain</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <div key={link.path} className="relative group">
                  <Link
                    to={link.hasDropdown ? '#' : link.path}
                    onClick={e => link.hasDropdown && e.preventDefault()}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? 'text-honey-700 bg-honey-50'
                        : 'text-charcoal-600 hover:text-honey-700 hover:bg-honey-50'
                    }`}
                  >
                    {link.label}
                    {link.hasDropdown && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200"/>}
                  </Link>
                  {link.hasDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-card-hover border border-cream-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {link.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal-600 hover:text-honey-700 hover:bg-honey-50 transition-colors"
                        >
                          <span className="text-honey-500">{child.icon}</span>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-charcoal-500 hover:text-honey-600 hover:bg-honey-50 transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Language */}
              <div className="relative" ref={langOpen ? null : null}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="p-2 rounded-lg text-charcoal-500 hover:text-honey-600 hover:bg-honey-50 transition-colors text-xs font-bold uppercase"
                  aria-label="Language"
                >
                  {language === 'en' ? 'EN' : language === 'ta' ? 'தமி' : 'हि'}
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-card-hover border border-cream-200 py-1 w-32 z-50">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'ta', label: 'தமிழ்' },
                      { code: 'hi', label: 'हिंदी' },
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === lang.code ? 'text-honey-700 bg-honey-50 font-semibold' : 'text-charcoal-600 hover:bg-honey-50'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-lg text-charcoal-500 hover:text-honey-600 hover:bg-honey-50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-card-hover border border-cream-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-cream-200 flex items-center justify-between">
                      <span className="font-semibold text-charcoal-800 text-sm">Notifications</span>
                      <span className="text-xs text-honey-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {NOTIFICATIONS_DATA.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-cream-100 last:border-0 ${!n.read ? 'bg-honey-50' : ''}`}>
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-honey-500' : 'bg-cream-300'}`} />
                            <div>
                              <p className="text-xs font-semibold text-charcoal-800">{n.title}</p>
                              <p className="text-xs text-charcoal-500 mt-0.5">{n.message}</p>
                              <p className="text-xs text-charcoal-400 mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-lg text-charcoal-500 hover:text-honey-600 hover:bg-honey-50 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-honey-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-honey-50 hover:bg-honey-100 border border-honey-200 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-honey-gradient flex items-center justify-center text-white text-xs font-bold">
                        {user.name[0]}
                      </div>
                      <span className="text-xs font-semibold text-charcoal-700 hidden sm:block">{user.name.split(' ')[0]}</span>
                      <ChevronDown size={12} className="text-charcoal-400" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-card-hover border border-cream-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-cream-100">
                          <p className="text-xs font-bold text-charcoal-800">{user.name}</p>
                          <p className="text-xs text-charcoal-400 capitalize">{user.role}</p>
                        </div>
                        {user.role === 'farmer' && (
                          <Link to="/farmer-dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal-600 hover:bg-honey-50" onClick={() => setProfileOpen(false)}>
                            <LayoutDashboard size={14} /> Dashboard
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal-600 hover:bg-honey-50" onClick={() => setProfileOpen(false)}>
                            <Settings size={14} /> Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-2 bg-honey-gradient text-white rounded-xl text-sm font-semibold shadow-honey hover:shadow-glow-honey transition-all hover:-translate-y-0.5"
                  >
                    <User size={14} />
                    <span className="hidden sm:block">{t?.nav?.findHoney || 'Find Real Honey'}</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-charcoal-500 hover:bg-cream-100 transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search bar expanded */}
          {searchOpen && (
            <div className="pb-4 animate-slide-up">
              <form onSubmit={handleSearch} className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search honey, farmer, batch ID, location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-field pl-9 pr-4"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-sm">
                  Search
                </button>
              </form>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['Natural honey Erode', 'HC-TN-ERD-2026-00125', 'Bee mentor Coimbatore', 'Lab tested honey'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setSearchQuery(q); }}
                    className="text-xs px-3 py-1 bg-cream-100 hover:bg-honey-100 text-charcoal-600 hover:text-honey-700 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-cream-200 bg-white animate-slide-up">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path) ? 'text-honey-700 bg-honey-50' : 'text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.hasDropdown && link.children.map(child => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 ml-4 px-3 py-1.5 text-xs text-charcoal-500 hover:text-honey-700 transition-colors"
                    >
                      {child.icon} {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-2 border-t border-cream-200 flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center text-sm py-2">
                  Login / Sign Up
                </Link>

              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
