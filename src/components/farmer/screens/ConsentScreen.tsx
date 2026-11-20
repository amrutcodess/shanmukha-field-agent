import React from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Wheat 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { VendorId } from '../../../types';
import { VENDORS } from '../../../services/storageService';

interface ConsentScreenProps {
  vendorId: VendorId;
  onConsentAgreed: () => void;
  onConsentDeclined: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  vendorId,
  onConsentAgreed,
  onConsentDeclined
}) => {
  const { activeFarmer } = useAuth();
  const { language, giveConsent } = useData();
  const t = getTranslation(language);
  const vendor = VENDORS[vendorId];

  if (!activeFarmer) return null;

  const handleAgree = async () => {
    await giveConsent(activeFarmer, vendorId);
    onConsentAgreed();
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-5 max-w-[480px] mx-auto pb-24">
      {/* Top Banner */}
      <div className="pt-2 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 border border-emerald-900/10 text-[#14532D] mx-auto flex items-center justify-center mb-2 shadow-2xs">
          <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 leading-tight">
          {t.consentTitle}
        </h2>
      </div>

      {/* Main Consent Card */}
      <div className="my-auto py-2">
        <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-sm space-y-4">
          <p className="text-base font-bold text-stone-800 leading-relaxed">
            {t.consentNoticePrefix}{' '}
            <span className="text-[#14532D] font-black underline decoration-emerald-300">
              {vendor.name}
            </span>{' '}
            {language === 'te' 
              ? 'తో క్రింది వివరాలను పంచుకుంటాము:' 
              : 'we will share these details:'}
          </p>

          {/* Shared Details Grid */}
          <div className="space-y-2.5 bg-white/70 rounded-2xl p-4 border border-stone-200/70 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14532D] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 font-bold uppercase">{t.farmerNameLabel}</p>
                <p className="text-sm font-black text-stone-900 truncate">
                  {language === 'te' ? (activeFarmer.nameTe || activeFarmer.name) : activeFarmer.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14532D] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 font-bold uppercase">{t.phoneLabel}</p>
                <p className="text-sm font-black text-stone-900">
                  {activeFarmer.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14532D] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 font-bold uppercase">{t.villageLabel}</p>
                <p className="text-sm font-black text-stone-900 truncate">
                  {language === 'te' ? (activeFarmer.villageTe || activeFarmer.village) : activeFarmer.village}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14532D] flex items-center justify-center shrink-0">
                <Wheat className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 font-bold uppercase">{t.cropLabel}</p>
                <p className="text-sm font-black text-stone-900 truncate">
                  {language === 'te' ? (activeFarmer.cropTe || activeFarmer.crop) : activeFarmer.crop} ({activeFarmer.acres} {t.acresUnit})
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 shrink-0 text-[#2E7D32]" />
            <span>{t.consentSafeGuarantee}</span>
          </div>
        </div>
      </div>

      {/* Two Big Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleAgree}
          className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-4 px-6 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[60px]"
        >
          <Check className="w-7 h-7 stroke-[3]" />
          <span>{t.yesAgree}</span>
        </button>

        <button
          type="button"
          onClick={onConsentDeclined}
          className="w-full bg-white hover:bg-stone-50 text-stone-700 py-3 px-6 rounded-3xl font-bold text-base flex items-center justify-center gap-2 active:scale-97 transition-all min-h-[50px] border border-stone-200"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
          <span>{t.noCancel}</span>
        </button>
      </div>
    </div>
  );
};
