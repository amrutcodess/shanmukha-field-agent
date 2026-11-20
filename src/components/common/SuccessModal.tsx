import React from 'react';
import { useData } from '../../context/DataContext';
import { Check } from 'lucide-react';

export const SuccessModal: React.FC = () => {
  const { actionSuccess, dismissSuccess } = useData();

  if (!actionSuccess.show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={dismissSuccess}
    >
      <div 
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full text-center border-4 border-[#2E7D32]/20 transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-[#2E7D32] rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 text-white animate-bounce">
          <Check className="w-12 h-12 stroke-[3.5]" />
        </div>
        <h3 className="text-2xl font-black text-stone-900 mb-1">
          {actionSuccess.title}
        </h3>
        {actionSuccess.message && (
          <p className="text-lg text-stone-600 mt-2 font-medium">
            {actionSuccess.message}
          </p>
        )}
      </div>
    </div>
  );
};
