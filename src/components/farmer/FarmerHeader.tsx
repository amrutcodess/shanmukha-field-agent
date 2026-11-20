import React from 'react';
import { Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface FarmerHeaderProps {
  onOpenProfile: () => void;
  showProfileButton?: boolean;
}

export const FarmerHeader: React.FC<FarmerHeaderProps> = ({ 
  onOpenProfile, 
  showProfileButton = true 
}) => {
  const { activeFarmer } = useAuth();
  const { language, setLanguage } = useData();

  const isTe = language === 'te';

  return (
    <header className="bg-gradient-to-r from-[#14532D] via-[#1E6B37] to-[#2E7D32] text-white px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30">
      {/* Shanmukha Brand Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-xs border border-white/20">
          <Sprout className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="truncate">
          <h1 className="text-base sm:text-lg font-black leading-tight tracking-tight text-white truncate">
            {language === 'te' ? 'షణ్ముఖ' : 'Shanmukha'}
          </h1>
          <p className="text-[10px] text-emerald-200/90 font-bold uppercase tracking-wider leading-none">
            {language === 'te' ? 'రైతు సేవ' : 'Farmer App'}
          </p>
        </div>
      </div>

      {/* Right controls: Language Toggle & Profile Button (Guaranteed to fit in 1 row at 360px) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Compact pill language toggle */}
        <div 
          className="inline-flex items-center bg-black/20 p-0.5 rounded-full border border-white/20"
          role="group"
          aria-label="Language selection"
        >
          <button
            type="button"
            onClick={() => setLanguage('te')}
            className={`px-2 py-1 rounded-full font-bold text-xs transition-all ${
              isTe
                ? 'bg-white text-[#14532D] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            తెలుగు
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-full font-bold text-xs transition-all ${
              !isTe
                ? 'bg-white text-[#14532D] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        {/* Profile Avatar Button */}
        {showProfileButton && activeFarmer && (
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-base active:scale-95 transition-all shadow-xs shrink-0"
            title={activeFarmer.name}
            aria-label="Profile"
          >
            <span>{activeFarmer.avatar || '👨‍🌾'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
