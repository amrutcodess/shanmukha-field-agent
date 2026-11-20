import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useData } from './DataContext';
import { Farmer } from '../types';

interface AuthContextType {
  // Farmer session
  isFarmerLoggedIn: boolean;
  activeFarmer: Farmer | null;
  farmerPhone: string;
  loginFarmer: (phone: string, otp: string) => { success: boolean; needsSignUp: boolean };
  logoutFarmer: () => void;
  setLoggedInFarmer: (farmer: Farmer) => void;

  // Admin session
  isAdminLoggedIn: boolean;
  adminEmail: string;
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEYS = {
  FARMER_SESSION: 'shanmukha_farmer_session',
  ADMIN_SESSION: 'shanmukha_admin_session'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { farmers } = useData();

  // Farmer session state: stored as JSON { farmerId, phone } or null
  const [farmerSession, setFarmerSession] = useState<{ farmerId: string; phone: string } | null>(() => {
    try {
      const saved = localStorage.getItem(KEYS.FARMER_SESSION);
      if (saved) return JSON.parse(saved);
      // Default to Ramesh Reddy (9876543210) for immediate seamless demo
      return { farmerId: 'farmer-1', phone: '9876543210' };
    } catch {
      return { farmerId: 'farmer-1', phone: '9876543210' };
    }
  });

  // Admin session state: stored as JSON { email } or null
  const [adminSession, setAdminSession] = useState<{ email: string } | null>(() => {
    try {
      const saved = localStorage.getItem(KEYS.ADMIN_SESSION);
      if (saved) return JSON.parse(saved);
      return { email: 'admin@shanmukha.in' };
    } catch {
      return { email: 'admin@shanmukha.in' };
    }
  });

  // Sync Farmer session to localStorage
  useEffect(() => {
    if (farmerSession) {
      localStorage.setItem(KEYS.FARMER_SESSION, JSON.stringify(farmerSession));
    } else {
      localStorage.removeItem(KEYS.FARMER_SESSION);
    }
  }, [farmerSession]);

  // Sync Admin session to localStorage
  useEffect(() => {
    if (adminSession) {
      localStorage.setItem(KEYS.ADMIN_SESSION, JSON.stringify(adminSession));
    } else {
      localStorage.removeItem(KEYS.ADMIN_SESSION);
    }
  }, [adminSession]);

  const activeFarmer: Farmer | null = farmerSession 
    ? (farmers.find(f => f.id === farmerSession.farmerId) || farmers[0] || null)
    : null;

  const loginFarmer = (phone: string, otp: string): { success: boolean; needsSignUp: boolean } => {
    if (otp !== '1234') {
      return { success: false, needsSignUp: false };
    }

    const clean = phone.replace(/\D/g, '');
    const matched = farmers.find(f => f.phone.replace(/\D/g, '') === clean);

    if (matched) {
      setFarmerSession({ farmerId: matched.id, phone });
      return { success: true, needsSignUp: false };
    } else {
      // Unregistered phone number -> route to Sign Up onboarding
      return { success: false, needsSignUp: true };
    }
  };

  const logoutFarmer = () => {
    setFarmerSession(null);
  };

  const setLoggedInFarmer = (farmer: Farmer) => {
    setFarmerSession({ farmerId: farmer.id, phone: farmer.phone });
  };

  const loginAdmin = (email: string, pass: string): boolean => {
    if (email.trim().toLowerCase() === 'admin@shanmukha.in' && pass === 'admin123') {
      setAdminSession({ email });
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdminSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isFarmerLoggedIn: !!farmerSession && !!activeFarmer,
        activeFarmer,
        farmerPhone: farmerSession?.phone || '',
        loginFarmer,
        logoutFarmer,
        setLoggedInFarmer,
        isAdminLoggedIn: !!adminSession,
        adminEmail: adminSession?.email || '',
        loginAdmin,
        logoutAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
