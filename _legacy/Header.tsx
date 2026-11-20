import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { setLanguage } from '../i18n/i18n';
import { Globe, LogOut, RefreshCw, WifiOff, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { profile, logout } = useAuth();
  const { pendingCount, isSyncing, triggerSync } = useOfflineQueue();

  const currentLang = i18n.language || 'en';

  const toggleLang = () => {
    const nextLang = currentLang === 'en' ? 'te' : 'en';
    setLanguage(nextLang);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1B5E20] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-white text-[#1B5E20] flex items-center justify-center font-bold text-xl shadow-xs">
            SA
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">
              {t('app.title')}
            </h1>
            <p className="text-xs text-[#66BB6A] font-medium">
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Offline Pending Sync Badge */}
          {pendingCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1.5 rounded-full font-semibold min-h-[44px] transition"
              title={t('app.offline_banner')}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t('app.pending_uploads')}:</span>
              <span className="bg-white text-amber-900 rounded-full px-1.5 py-0.5 text-xs font-bold">
                {pendingCount}
              </span>
            </button>
          )}

          {/* Language Toggle Button */}
          <button
            onClick={toggleLang}
            className="flex items-center space-x-1 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-semibold px-3 py-2 rounded-lg border border-[#66BB6A] min-h-[48px] min-w-[48px] justify-center transition"
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 mr-0.5" />
            <span>{currentLang === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {/* User & Logout */}
          {profile && (
            <div className="flex items-center space-x-1">
              <span className="hidden md:inline-block text-xs bg-[#2E7D32] px-2.5 py-1.5 rounded-lg border border-[#66BB6A]">
                <User className="w-3.5 h-3.5 inline mr-1" />
                {profile.full_name} ({profile.username})
              </span>
              <button
                onClick={logout}
                className="p-2 bg-red-700/80 hover:bg-red-700 text-white rounded-lg border border-red-500 min-h-[48px] min-w-[48px] flex items-center justify-center transition"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
