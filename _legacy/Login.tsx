import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { setLanguage } from '../i18n/i18n';
import type { UserRole } from '../types';
import { Eye, EyeOff, Globe, Lock, User, ShieldCheck, Sprout } from 'lucide-react';

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('agent');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentLang = i18n.language || 'en';

  const toggleLang = () => {
    const nextLang = currentLang === 'en' ? 'te' : 'en';
    setLanguage(nextLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await login(username, password, role);

    if (result.success) {
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/agent/my-visits');
      }
    } else {
      const msg = result.error || 'auth.err_generic';
      // If error starts with auth., translate it; otherwise show raw string
      if (msg.startsWith('auth.')) {
        setErrorMessage(t(msg, { role: role === 'admin' ? t('auth.admin_login') : t('auth.agent_login') }));
      } else {
        setErrorMessage(msg);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#E8F5E9] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLang}
          className="flex items-center space-x-1.5 bg-white border border-green-200 text-[#1B5E20] font-semibold text-xs px-3 py-2 rounded-xl shadow-xs min-h-[44px] hover:bg-green-50 transition"
        >
          <Globe className="w-4 h-4 text-[#2E7D32]" />
          <span>{currentLang === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#2E7D32] rounded-2xl flex items-center justify-center text-white shadow-md">
            <Sprout className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-[#1B5E20]">
          {t('app.title')}
        </h2>
        <p className="mt-1 text-center text-sm font-semibold text-gray-600">
          {t('app.subtitle')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-5 sm:px-8 shadow-sm border border-green-100 rounded-2xl">
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('agent');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-sm font-bold transition min-h-[48px] ${
                role === 'agent'
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('auth.agent_login')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-sm font-bold transition min-h-[48px] ${
                role === 'admin'
                  ? 'bg-[#1B5E20] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('auth.admin_login')}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-start space-x-2 animate-in fade-in">
              <span className="shrink-0 font-bold">⚠️</span>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('auth.username_label')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    role === 'agent'
                      ? t('auth.username_placeholder_agent')
                      : t('auth.username_placeholder_admin')
                  }
                  className="block w-full pl-11 pr-3 py-3.5 border border-gray-300 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('auth.password_label')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  className="block w-full pl-11 pr-11 py-3.5 border border-gray-300 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 min-h-[48px] min-w-[48px] justify-center"
                  title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#2E7D32] min-h-[52px] transition disabled:opacity-50"
              >
                {isSubmitting ? t('auth.signing_in') : t('auth.sign_in')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
