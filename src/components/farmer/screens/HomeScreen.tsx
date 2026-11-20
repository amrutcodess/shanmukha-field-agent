import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  ShieldCheck, 
  Coins, 
  FlaskConical, 
  MapPin, 
  Wheat, 
  Layers,
  Sparkles,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { VendorId } from '../../../types';
import { VENDORS } from '../../../services/storageService';

interface HomeScreenProps {
  onSelectVendor: (vendorId: VendorId) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectVendor }) => {
  const { activeFarmer } = useAuth();
  const { language, reports, alerts } = useData();
  const t = getTranslation(language);

  if (!activeFarmer) return null;

  // Filter farmer reports & alerts
  const farmerReports = reports.filter(r => r.farmerId === activeFarmer.id);
  const farmerAlerts = alerts.filter(a => a.farmerId === activeFarmer.id || a.farmerId === 'all');

  // Helper to check if vendor has something new
  const vendorHasNew = (vendorId: VendorId) => {
    const hasNewRep = farmerReports.some(r => r.vendorId === vendorId && r.isNew);
    const hasNewAlert = farmerAlerts.some(a => a.vendorId === vendorId && !a.isRead);
    return hasNewRep || hasNewAlert;
  };

  const getTileDetails = (vendorId: VendorId) => {
    const vendor = VENDORS[vendorId];
    switch (vendorId) {
      case 'fyllo':
        return {
          name: language === 'te' ? t.fylloName : vendor.name,
          desc: language === 'te' ? t.fylloShortDesc : vendor.desc,
          icon: Radio,
          gradient: 'from-teal-600/10 via-emerald-600/15 to-emerald-700/20 hover:from-teal-600/15 hover:to-emerald-700/25',
          iconBg: 'bg-teal-700 text-white',
          border: 'border-teal-900/10'
        };
      case 'kshema':
        return {
          name: language === 'te' ? t.kshemaName : vendor.name,
          desc: language === 'te' ? t.kshemaShortDesc : vendor.desc,
          icon: ShieldCheck,
          gradient: 'from-blue-600/10 via-indigo-600/15 to-blue-700/20 hover:from-blue-600/15 hover:to-blue-700/25',
          iconBg: 'bg-blue-700 text-white',
          border: 'border-blue-900/10'
        };
      case 'samunnati':
        return {
          name: language === 'te' ? t.samunnatiName : vendor.name,
          desc: language === 'te' ? t.samunnatiShortDesc : vendor.desc,
          icon: Coins,
          gradient: 'from-amber-600/10 via-orange-600/15 to-amber-700/20 hover:from-amber-600/15 hover:to-amber-700/25',
          iconBg: 'bg-amber-700 text-white',
          border: 'border-amber-900/10'
        };
      case 'biota':
      default:
        return {
          name: language === 'te' ? t.biotaName : vendor.name,
          desc: language === 'te' ? t.biotaShortDesc : vendor.desc,
          icon: FlaskConical,
          gradient: 'from-purple-600/10 via-pink-600/15 to-purple-700/20 hover:from-purple-600/15 hover:to-purple-700/25',
          iconBg: 'bg-purple-700 text-white',
          border: 'border-purple-900/10'
        };
    }
  };

  const vendorList: VendorId[] = ['fyllo', 'kshema', 'samunnati', 'biota'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.35, ease: 'easeOut' as const } 
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Farmer Greeting Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-semibold text-stone-500">
              {t.greeting}
            </p>
            <h2 className="text-2xl font-black text-stone-900 leading-tight">
              {language === 'te' ? (activeFarmer.nameTe || activeFarmer.name) : activeFarmer.name} {t.garu}
            </h2>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/60 border border-emerald-900/10 flex items-center justify-center text-3xl shadow-xs">
            {activeFarmer.avatar || '👨‍🌾'}
          </div>
        </div>

        {/* Farm Details Card */}
        <div className="mt-4 pt-4 border-t border-stone-200/60 grid grid-cols-3 gap-2 text-center bg-white/70 rounded-2xl p-3 border border-white/80 shadow-2xs">
          <div>
            <div className="flex items-center justify-center text-[#2E7D32] mb-1">
              <Wheat className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-[11px] text-stone-400 font-bold uppercase">{t.cropLabel}</p>
            <p className="text-base font-black text-stone-900 leading-tight mt-0.5 truncate">
              {language === 'te' ? (activeFarmer.cropTe || activeFarmer.crop) : activeFarmer.crop}
            </p>
          </div>

          <div className="border-x border-stone-200/60">
            <div className="flex items-center justify-center text-[#2E7D32] mb-1">
              <MapPin className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-[11px] text-stone-400 font-bold uppercase">{t.villageLabel}</p>
            <p className="text-base font-black text-stone-900 leading-tight mt-0.5 truncate">
              {language === 'te' ? (activeFarmer.villageTe || activeFarmer.village) : activeFarmer.village}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center text-[#2E7D32] mb-1">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-[11px] text-stone-400 font-bold uppercase">{t.acresLabel}</p>
            <p className="text-base font-black text-stone-900 leading-tight mt-0.5">
              {activeFarmer.acres} {t.acresUnit}
            </p>
          </div>
        </div>

        {/* Geotag Indicator Pill */}
        {activeFarmer.lat && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-[#14532D] font-bold bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/50">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{t.geotagCapturedBadge}</span>
            </span>
            <span className="text-stone-400 font-normal">
              {activeFarmer.lat.toFixed(4)}, {activeFarmer.lng?.toFixed(4)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Services Header */}
      <div className="px-1 pt-1">
        <h3 className="text-xl font-black text-stone-900 leading-tight">
          {t.servicesTitle}
        </h3>
        <p className="text-xs text-stone-500 font-medium">
          {t.servicesSubtitle}
        </p>
      </div>

      {/* 4 Big Service Tiles in 2x2 Grid with Soft Two-Color Gradients and Stagger */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 pb-2"
      >
        {vendorList.map((vendorId) => {
          const tile = getTileDetails(vendorId);
          const Icon = tile.icon;
          const hasNew = vendorHasNew(vendorId);

          return (
            <motion.button
              key={vendorId}
              type="button"
              variants={itemVariants}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectVendor(vendorId)}
              className={`relative flex flex-col justify-between p-4 rounded-3xl border bg-gradient-to-br ${tile.gradient} ${tile.border} text-left transition-all shadow-xs min-h-[160px] glass-card`}
            >
              {/* Soft pill saying "New" only when there is something new */}
              {hasNew && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#F57C00] text-white shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>{t.newBadge}</span>
                </span>
              )}

              {/* Large line icon in a frosted circle */}
              <div className={`w-13 h-13 rounded-2xl ${tile.iconBg} shadow-sm flex items-center justify-center mb-3 border border-white/40`}>
                <Icon className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* Title & 1-line plain description */}
              <div>
                <h4 className="text-lg font-black text-stone-900 leading-snug">
                  {tile.name}
                </h4>
                <p className="text-xs text-stone-600 font-medium mt-1 leading-snug line-clamp-2">
                  {tile.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
