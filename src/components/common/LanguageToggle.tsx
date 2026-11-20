import React from 'react';
import { useData } from '../../context/DataContext';

interface LanguageToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ size = 'lg', className = '' }) => {
  const { language, setLanguage } = useData();

  const isTe = language === 'te';

  return (
    <div 
      className={`inline-flex items-center bg-white/90 p-1 rounded-full border-2 border-[#2E7D32]/30 shadow-sm ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('te')}
        className={`px-3.5 py-1.5 rounded-full font-bold transition-all text-base min-h-[44px] flex items-center justify-center ${
          isTe
            ? 'bg-[#2E7D32] text-white shadow-md'
            : 'text-stone-700 hover:text-[#2E7D32] hover:bg-green-50'
        }`}
      >
        తెలుగు
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3.5 py-1.5 rounded-full font-bold transition-all text-base min-h-[44px] flex items-center justify-center ${
          !isTe
            ? 'bg-[#2E7D32] text-white shadow-md'
            : 'text-stone-700 hover:text-[#2E7D32] hover:bg-green-50'
        }`}
      >
        English
      </button>
    </div>
  );
};
