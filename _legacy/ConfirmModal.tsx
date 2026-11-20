import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-full ${
                isDestructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-600 leading-relaxed">{message}</p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 min-h-[48px] text-sm"
          >
            {cancelText || t('admin.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-3 font-semibold rounded-xl text-white shadow-xs min-h-[48px] text-sm ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
            }`}
          >
            {isLoading ? t('common.loading') : confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
