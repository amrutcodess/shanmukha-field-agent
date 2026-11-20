import React from 'react';
import { 
  Radio, 
  ShieldCheck, 
  Coins, 
  FlaskConical, 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { VendorId } from '../../../types';
import { VENDORS } from '../../../services/storageService';

interface ServiceDetailScreenProps {
  vendorId: VendorId;
  onBack: () => void;
  onStartService: () => void;
  onViewReport?: (reportId: string) => void;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({
  vendorId,
  onBack,
  onStartService,
  onViewReport
}) => {
  const { activeFarmer } = useAuth();
  const { language, hasConsent, reports } = useData();
  const t = getTranslation(language);
  const vendor = VENDORS[vendorId];
  const isConsented = activeFarmer ? hasConsent(activeFarmer.id, vendorId) : false;

  const existingReport = activeFarmer 
    ? reports.find(r => r.farmerId === activeFarmer.id && r.vendorId === vendorId)
    : undefined;

  const getVendorIcon = () => {
    switch (vendorId) {
      case 'fyllo': return Radio;
      case 'kshema': return ShieldCheck;
      case 'samunnati': return Coins;
      case 'biota':
      default:
        return FlaskConical;
    }
  };

  const getServiceLines = () => {
    switch (vendorId) {
      case 'fyllo':
        return {
          name: language === 'te' ? t.fylloName : vendor.name,
          line1: language === 'te' ? t.fylloLine1 : vendor.desc,
          line2: language === 'te' ? t.fylloLine2 : 'Real-time irrigation advisory directly to your phone.'
        };
      case 'kshema':
        return {
          name: language === 'te' ? t.kshemaName : vendor.name,
          line1: language === 'te' ? t.kshemaLine1 : vendor.desc,
          line2: language === 'te' ? t.kshemaLine2 : 'Fast insurance enrollment and direct claim settlements.'
        };
      case 'samunnati':
        return {
          name: language === 'te' ? t.samunnatiName : vendor.name,
          line1: language === 'te' ? t.samunnatiLine1 : vendor.desc,
          line2: language === 'te' ? t.samunnatiLine2 : 'Direct mandi sale assistance and fair harvest pricing.'
        };
      case 'biota':
      default:
        return {
          name: language === 'te' ? t.biotaName : vendor.name,
          line1: language === 'te' ? t.biotaLine1 : vendor.desc,
          line2: language === 'te' ? t.biotaLine2 : 'Specific organic fertilizer dosages for maximum yield.'
        };
    }
  };

  const Icon = getVendorIcon();
  const details = getServiceLines();

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-5 max-w-[480px] mx-auto pb-24">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-stone-700 bg-white/90 border border-stone-200 px-3.5 py-2 rounded-2xl font-bold text-sm active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          <span>{t.back}</span>
        </button>

        {isConsented && (
          <span className="flex items-center gap-1.5 bg-emerald-100 text-[#14532D] px-3 py-1 rounded-full text-xs font-bold border border-emerald-200/60">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t.consentActive}</span>
          </span>
        )}
      </div>

      {/* Main Service Card */}
      <div className="my-auto py-2">
        <div className="glass-card rounded-3xl p-6 border border-emerald-900/10 shadow-sm text-center space-y-4">
          {/* Big Vendor Icon */}
          <div 
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-md border-2 border-white/60"
            style={{ backgroundColor: vendor.color }}
          >
            <Icon className="w-11 h-11 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-stone-900 leading-tight">
              {details.name}
            </h2>
            <div className="inline-block bg-emerald-50 text-[#14532D] px-3 py-1 rounded-full text-xs font-bold mt-1.5 border border-emerald-200/50">
              {language === 'te' ? vendor.categoryTe : vendor.category}
            </div>
          </div>

          {/* 2 Clear Lines Explaining the Service */}
          <div className="bg-white/80 rounded-2xl p-4 border border-stone-200/70 text-left space-y-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#14532D] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <p className="text-sm font-bold text-stone-800 leading-snug">
                {details.line1}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#14532D] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <p className="text-sm font-bold text-stone-800 leading-snug">
                {details.line2}
              </p>
            </div>
          </div>

          {/* If already has report, show quick link */}
          {existingReport && onViewReport && (
            <button
              type="button"
              onClick={() => onViewReport(existingReport.id)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 rounded-2xl text-[#14532D] font-bold text-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{t.viewReport} ({existingReport.date.split(',')[0]})</span>
            </button>
          )}
        </div>
      </div>

      {/* One Big Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStartService}
          className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-4 px-6 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[60px]"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>{t.start}</span>
        </button>
      </div>
    </div>
  );
};
