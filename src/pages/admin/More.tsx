import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { setLanguage } from '../../i18n/i18n';
import { Sprout, FileSpreadsheet, Globe, LogOut, ShieldCheck } from 'lucide-react';

export const More: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const currentLang = i18n.language || 'en';

  const toggleLang = () => {
    const nextLang = currentLang === 'en' ? 'te' : 'en';
    setLanguage(nextLang);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-3">
        <div className="w-12 h-12 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center font-bold">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-gray-900">{profile?.full_name}</h2>
          <p className="text-xs text-gray-500 font-semibold">System Administrator</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
        <button
          onClick={() => navigate('/admin/crops-products')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 min-h-[52px]"
        >
          <div className="flex items-center space-x-3">
            <Sprout className="w-5 h-5 text-[#2E7D32]" />
            <span className="font-bold text-sm text-gray-800">{t('nav.crops_products')}</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/export')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 min-h-[52px]"
        >
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-5 h-5 text-[#2E7D32]" />
            <span className="font-bold text-sm text-gray-800">{t('nav.export_print')}</span>
          </div>
        </button>

        <button
          onClick={toggleLang}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 min-h-[52px]"
        >
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-[#2E7D32]" />
            <span className="font-bold text-sm text-gray-800">Language / భాష</span>
          </div>
          <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
            {currentLang === 'en' ? 'English' : 'తెలుగు'}
          </span>
        </button>

        <button
          onClick={logout}
          className="w-full p-4 flex items-center space-x-3 text-red-600 hover:bg-red-50 min-h-[52px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">{t('auth.logout')}</span>
        </button>
      </div>
    </div>
  );
};
