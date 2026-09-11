import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileBottomNav from './components/layout/MobileBottomNav';
import ToastContainer from './components/ui/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Traceability from './pages/Traceability';
import BeeRescue from './pages/BeeRescue';
import Experts from './pages/Experts';
import TrustSafety from './pages/TrustSafety';
import Login from './pages/Login';
import About from './pages/About';
import Learn from './pages/Learn';
import Mentorship from './pages/Mentorship';
import StartBeekeeping from './pages/StartBeekeeping';
import BeeFriendlyFarming from './pages/BeeFriendlyFarming';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Impact from './pages/Impact';
import VerifyBatch from './pages/VerifyBatch';

// Registration Pages
import RegisterCustomer from './pages/register/RegisterCustomer';
import RegisterSeller from './pages/register/RegisterSeller';
import RegisterExpert from './pages/register/RegisterExpert';
import RegisterCollector from './pages/register/RegisterCollector';

// Protected Dashboard Pages
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import SellerDashboard from './pages/dashboards/SellerDashboard';
import ExpertDashboard from './pages/dashboards/ExpertDashboard';
import CollectorDashboard from './pages/dashboards/CollectorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  const { toasts, dismissToast } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ScrollToTop />
        <Routes>
          {/* ── Public Routes ───────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="/traceability/:batchId" element={<Traceability />} />
          <Route path="/bee-rescue" element={<BeeRescue />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/start-beekeeping" element={<StartBeekeeping />} />
          <Route path="/bee-friendly-farming" element={<BeeFriendlyFarming />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/trust-safety" element={<TrustSafety />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          {/* ── Blockchain Verification (QR → this page, no wallet needed) ── */}
          <Route path="/verify-batch/:batchId" element={<VerifyBatch />} />

          {/* ── Registration Routes ─────────────────────── */}
          <Route path="/register/customer" element={<RegisterCustomer />} />
          <Route path="/register/seller" element={<RegisterSeller />} />
          <Route path="/register/expert" element={<RegisterExpert />} />
          <Route path="/register/collector" element={<RegisterCollector />} />

          {/* ── Protected Dashboard Routes ──────────────── */}
          <Route path="/customer-dashboard" element={
            <ProtectedRoute role="CUSTOMER"><CustomerDashboard /></ProtectedRoute>
          } />
          <Route path="/seller-dashboard" element={
            <ProtectedRoute role="SELLER"><SellerDashboard /></ProtectedRoute>
          } />
          <Route path="/expert-dashboard" element={
            <ProtectedRoute role="EXPERT"><ExpertDashboard /></ProtectedRoute>
          } />
          <Route path="/collector-dashboard" element={
            <ProtectedRoute role="COLLECTOR"><CollectorDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />

          {/* ── 404 Fallback ────────────────────────────── */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🍯</div>
                <h1 className="text-2xl font-display font-bold text-charcoal-800 mb-2">Page Not Found</h1>
                <p className="text-charcoal-500 mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary inline-block">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
