import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards a route by authentication and optional role.
 *
 * Usage:
 *   <ProtectedRoute>...</ProtectedRoute>
 *   <ProtectedRoute role="SELLER">...</ProtectedRoute>
 *   <ProtectedRoute role={['SELLER','ADMIN']}>...</ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // While restoring session, show a loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🍯</div>
          <p className="text-charcoal-500 text-sm">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user?.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-xl font-display font-bold text-charcoal-800 mb-2">Access Denied</h2>
            <p className="text-charcoal-500 text-sm mb-6">
              This page requires a <strong>{Array.isArray(role) ? role.join(' or ') : role}</strong> account.
              You are logged in as <strong>{user?.role}</strong>.
            </p>
            <a href="/" className="btn-primary inline-block">Go to Home</a>
          </div>
        </div>
      );
    }
  }

  return children;
}
