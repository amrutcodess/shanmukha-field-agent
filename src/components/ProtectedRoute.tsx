import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Verifying session..." />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!profile.is_active) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    const fallbackPath = profile.role === 'admin' ? '/admin/dashboard' : '/agent/my-visits';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
