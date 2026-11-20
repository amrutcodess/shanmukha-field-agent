import React from 'react';
import { useTranslation } from 'react-i18next';
import { VisitStatus } from '../types';

interface StatusBadgeProps {
  status: VisitStatus;
  purchased?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  if (status === 'final') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2E7D32] text-white shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5"></span>
        {t('visit.status_final')}
      </span>
    );
  }

  if (status === 'closed') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span>
        {t('visit.status_closed')}
      </span>
    );
  }

  // Pending
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border-2 border-amber-600 bg-amber-50 text-amber-900">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 animate-pulse"></span>
      {t('visit.status_pending')}
    </span>
  );
};
