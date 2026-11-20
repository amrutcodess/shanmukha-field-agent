import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className="w-10 h-10 text-[#2E7D32] animate-spin" />
      {message && <p className="text-sm font-medium text-gray-600">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-[#E8F5E9]/50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
