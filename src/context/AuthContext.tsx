import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, formatAgentEmail } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { setLanguage } from '../i18n/i18n';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  login: (usernameInput: string, passwordInput: string, targetRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Initial session load
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const prof = await fetchProfile(currentSession.user.id);
          setProfile(prof);
          if (prof?.preferred_language) {
            setLanguage(prof.preferred_language);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const prof = await fetchProfile(newSession.user.id);
        setProfile(prof);
        if (prof?.preferred_language) {
          setLanguage(prof.preferred_language);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (usernameInput: string, passwordInput: string, targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const email = targetRole === 'agent' 
        ? formatAgentEmail(usernameInput) 
        : usernameInput.trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passwordInput,
      });

      if (error || !data.user) {
        setIsLoading(false);
        return { success: false, error: 'auth.err_invalid_credentials' };
      }

      // Fetch profile to verify role and active state
      const userProfile = await fetchProfile(data.user.id);

      if (!userProfile) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { success: false, error: 'auth.err_generic' };
      }

      // 1. Role match check
      if (userProfile.role !== targetRole) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { 
          success: false, 
          error: 'auth.err_invalid_role'
        };
      }

      // 2. Active account check
      if (!userProfile.is_active) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { success: false, error: 'auth.err_inactive' };
      }

      setProfile(userProfile);
      setUser(data.user);
      setSession(data.session);

      if (userProfile.preferred_language) {
        setLanguage(userProfile.preferred_language);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: 'auth.err_generic' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
