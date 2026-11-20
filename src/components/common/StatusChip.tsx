import React from 'react';

interface StatusChipProps {
  status: 'MEMBER' | 'PAYMENT PENDING' | 'NEW' | 'PENDING HO APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'MEMBER':
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'PAYMENT PENDING':
      case 'PENDING HO APPROVAL':
      case 'Pending reply':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'NEW':
        return 'bg-stone-100 text-stone-700 border-stone-300 font-medium';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] sm:text-[11px] tracking-wide uppercase rounded-full border shadow-xs ${getStyle()} ${className}`}
    >
      {status}
    </span>
  );
};
