import React from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Wheat, 
  ShieldCheck, 
  Trash2, 
  LogOut, 
  ArrowLeft,
  CheckCircle,
  Globe,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { LanguageToggle } from '../../common/LanguageToggle';
import { VENDORS } from '../../../services/storageService';
import { VendorId } from '../../../types';
import { FarmMap } from '../../common/FarmMap';

interface ProfileScreenProps {
  onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose }) => {
  const { activeFarmer, logoutFarmer } = useAuth();
  const { 
    consents, 
    withdrawConsent, 
    language 
  } = useData();
  const t = getTranslation(language);

  if (!activeFarmer) return null;

  const farmerConsents = consents.filter(c => c.farmerId === activeFarmer.id);
  const activeConsents = farmerConsents.filter(c => c.status === 'active');

  const handleWithdraw = (vendorId: VendorId) => {
    withdrawConsent(activeFarmer.id, vendorId);
  };

  const handleLogout = () => {
    logoutFarmer();
    onClose();
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-stone-700 bg-white/90 border border-stone-200 px-3.5 py-2 rounded-2xl font-bold text-sm active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          <span>{t.back}</span>
        </button>

        <h2 className="text-lg font-black text-stone-900">
          {t.profileTitle}
        </h2>
      </div>

      {/* Farmer Information Card */}
      <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100/60 border border-emerald-900/10 flex items-center justify-center text-3xl shadow-xs shrink-0">
            {activeFarmer.avatar || '👨‍🌾'}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-stone-900 leading-tight truncate">
              {language === 'te' ? (activeFarmer.nameTe || activeFarmer.name) : activeFarmer.name}
            </h3>
            <p className="text-sm font-bold text-[#14532D] flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{activeFarmer.phone}</span>
            </p>
          </div>
        </div>

        {/* Farm Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-stone-100">
          <div className="p-3 bg-white/70 rounded-2xl border border-stone-200/60">
            <div className="flex items-center gap-1.5 text-stone-400 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span className="text-[11px] font-bold uppercase">{t.villageLabel}</span>
            </div>
            <p className="text-base font-black text-stone-900 truncate">
              {language === 'te' ? (activeFarmer.villageTe || activeFarmer.village) : activeFarmer.village}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold truncate">
              {activeFarmer.district}, {activeFarmer.state}
            </p>
          </div>

          <div className="p-3 bg-white/70 rounded-2xl border border-stone-200/60">
            <div className="flex items-center gap-1.5 text-stone-400 mb-0.5">
              <Wheat className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span className="text-[11px] font-bold uppercase">{t.cropLabel}</span>
            </div>
            <p className="text-base font-black text-stone-900 truncate">
              {language === 'te' ? (activeFarmer.cropTe || activeFarmer.crop) : activeFarmer.crop}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold">
              {activeFarmer.acres} {t.acresUnit}
              {activeFarmer.irrigationType && ` • ${activeFarmer.irrigationType}`}
            </p>
          </div>
        </div>
      </div>

      {/* Farm Location (Geotag) Preview Card */}
      {activeFarmer.lat && activeFarmer.lng && (
        <div className="glass-card rounded-3xl p-4 border border-emerald-900/10 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#14532D] flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-stone-900">{t.farmLocationCardTitle}</p>
                <p className="text-[10px] text-stone-400 font-medium">GPS: {activeFarmer.lat.toFixed(4)}, {activeFarmer.lng.toFixed(4)}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-emerald-100 text-[#14532D] px-2.5 py-0.5 rounded-full">
              {t.geotagCapturedBadge}
            </span>
          </div>

          <FarmMap
            lat={activeFarmer.lat}
            lng={activeFarmer.lng}
            accuracy={activeFarmer.accuracy || 10}
            readOnly={true}
            heightClass="h-36"
          />
        </div>
      )}

      {/* Language Preference Card */}
      <div className="glass-card rounded-3xl p-4 border border-emerald-900/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-stone-900">{t.switchLang}</p>
            <p className="text-xs text-stone-400">
              {language === 'te' ? 'తెలుగు' : 'English'}
            </p>
          </div>
        </div>
        <LanguageToggle size="sm" />
      </div>

      {/* Consents Given Section */}
      <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
          <h3 className="text-lg font-black text-stone-900">
            {t.givenConsentsTitle}
          </h3>
        </div>

        {activeConsents.length === 0 ? (
          <p className="text-sm font-semibold text-stone-400 py-1">
            {t.noConsents}
          </p>
        ) : (
          <div className="space-y-2">
            {activeConsents.map((consent) => {
              const vendor = VENDORS[consent.vendorId] || VENDORS.fyllo;

              return (
                <div 
                  key={consent.id}
                  className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-stone-900">
                        {vendor.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-black text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>{t.consentActive}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                      {consent.consentedAt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWithdraw(consent.vendorId)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    title={t.withdrawConsent}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.withdrawConsent}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-white hover:bg-stone-50 text-stone-700 py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[50px] border border-stone-200"
        >
          <LogOut className="w-4 h-4 text-stone-500" />
          <span>{t.logoutBtn}</span>
        </button>
      </div>
    </div>
  );
};
