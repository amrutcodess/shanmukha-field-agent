import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { VisitFull } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getSignedPhotoUrl, compressPhoto, uploadPurchasePhoto } from '../../lib/image';
import { formatDateEn, formatTimeEn } from '../../lib/export';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Camera,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export const VisitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visit, setVisit] = useState<VisitFull | null>(null);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isUpdatingBought, setIsUpdatingBought] = useState<boolean>(false);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);

  const lang = i18n.language || 'en';

  const loadVisitDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('visits_full')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) throw error;
      const v = data as VisitFull;
      setVisit(v);

      if (v.purchase_image_path) {
        const url = await getSignedPhotoUrl(v.purchase_image_path);
        setPhotoSignedUrl(url);
      }
    } catch (err) {
      console.error('Error loading visit detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitDetail();
  }, [id]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const compressed = await compressPhoto(file);
      setPhotoBlob(compressed);
      setPhotoPreviewUrl(URL.createObjectURL(compressed));
    }
  };

  const handleMarkBoughtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit || !photoBlob) {
      setErrorMsg(t('visit.photo_required'));
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const imagePath = await uploadPurchasePhoto(visit.agent_id, visit.client_uuid, photoBlob);

      const numericAmount = purchaseAmount ? parseFloat(purchaseAmount) || null : null;

      const { error } = await supabase
        .from('visits')
        .update({
          purchased: true,
          purchase_amount: numericAmount,
          purchase_image_path: imagePath,
          status: 'final',
          finalized_at: new Date().toISOString(),
        })
        .eq('id', visit.id);

      if (error) throw error;

      setIsUpdatingBought(false);
      await loadVisitDetail();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update visit status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!visit) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          status: 'closed',
        })
        .eq('id', visit.id);

      if (error) throw error;
      setShowCloseModal(false);
      await loadVisitDetail();
    } catch (err: any) {
      alert('Error closing visit: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading visit detail..." />;
  }

  if (!visit) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <p className="text-gray-600">Visit record not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[#2E7D32] text-white rounded-xl font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const cropName = lang === 'te' ? visit.crop_name_te || visit.crop_other : visit.crop_name_en || visit.crop_other;
  const productName = lang === 'te' ? visit.product_name_te || visit.product_other : visit.product_name_en || visit.product_other;

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{t('visit.visit_detail')}</h2>
          <StatusBadge status={visit.status} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">
              {t('visit.visit_id')}: #{visit.id.substring(0, 8)}
            </span>
            <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">{visit.farmer_name}</h3>
            {visit.farmer_phone && (
              <a
                href={`tel:${visit.farmer_phone}`}
                className="text-xs text-blue-600 font-bold flex items-center mt-1"
              >
                <Phone className="w-3.5 h-3.5 mr-1" />
                {visit.farmer_phone}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#E8F5E9]/50 rounded-xl">
            <span className="font-bold text-gray-500 block mb-0.5">{t('visit.location')}</span>
            <span className="font-bold text-gray-900 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-[#2E7D32]" />
              {visit.village_name}
            </span>
            <span className="text-gray-600 block pl-4 text-[11px]">
              {visit.district_name}, {visit.region_name}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="font-bold text-gray-500 block mb-0.5">{t('visit.visit_info')}</span>
            <span className="font-bold text-gray-900 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#2E7D32]" />
              {formatDateEn(visit.visited_at)}
            </span>
            <span className="text-gray-600 block pl-4 text-[11px]">
              {formatTimeEn(visit.visited_at)} ({visit.duration_minutes} min)
            </span>
          </div>
        </div>

        {visit.latitude && visit.longitude ? (
          <a
            href={`https://maps.google.com/?q=${visit.latitude},${visit.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t('visit.view_map')}</span>
          </a>
        ) : (
          <span className="text-xs text-gray-400 italic">{t('visit.gps_not_captured')}</span>
        )}

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div>
            <span className="text-xs font-bold text-gray-500 block">{t('visit.crop')}</span>
            <span className="text-sm font-bold text-gray-900">{cropName || t('common.none')}</span>
          </div>

          <div>
            <span className="text-xs font-bold text-gray-500 block">{t('visit.diagnosis')}</span>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-xl mt-1 leading-relaxed">
              {visit.diagnosis}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-gray-500 block">{t('visit.prescription')}</span>
            <p className="text-sm text-gray-800 bg-[#E8F5E9]/50 p-3 rounded-xl mt-1 leading-relaxed">
              {visit.prescription}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-gray-500 block">{t('visit.recommended_product')}</span>
            <span className="text-sm font-bold text-[#1B5E20]">
              {productName || t('common.none')}
            </span>
          </div>
        </div>

        {photoSignedUrl && (
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <span className="text-xs font-bold text-gray-500 block">{t('visit.take_photo')}</span>
            <a href={photoSignedUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={photoSignedUrl}
                alt="Purchase Receipt"
                className="w-full max-h-64 object-cover rounded-xl border border-gray-200"
              />
            </a>
          </div>
        )}

        {visit.purchased && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-800 flex items-center justify-between">
            <span>{t('visit.yes_bought')}</span>
            {visit.purchase_amount && (
              <span className="text-sm text-[#1B5E20]">₹ {visit.purchase_amount}</span>
            )}
          </div>
        )}
      </div>

      {visit.status === 'pending' && !isUpdatingBought && (
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setIsUpdatingBought(true)}
            className="w-full py-4 px-4 bg-[#2E7D32] text-white font-extrabold rounded-xl shadow-md hover:bg-[#1B5E20] flex items-center justify-center space-x-2 min-h-[52px]"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{t('visit.mark_bought')}</span>
          </button>

          <button
            onClick={() => setShowCloseModal(true)}
            className="w-full py-3.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 flex items-center justify-center space-x-2 min-h-[48px]"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
            <span>{t('visit.mark_closed')}</span>
          </button>
        </div>
      )}

      {isUpdatingBought && (
        <form onSubmit={handleMarkBoughtSubmit} className="bg-white p-5 rounded-2xl border-2 border-[#2E7D32] space-y-4">
          <h3 className="font-bold text-base text-[#1B5E20] flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{t('visit.mark_bought')}</span>
          </h3>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{errorMsg}</p>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.purchase_amount')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="₹ 500"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.take_photo')} *
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />

            {photoPreviewUrl ? (
              <div className="relative rounded-xl overflow-hidden border p-2 bg-gray-50 text-center">
                <img
                  src={photoPreviewUrl}
                  alt="Receipt preview"
                  className="max-h-48 mx-auto object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoBlob(null);
                    setPhotoPreviewUrl(null);
                  }}
                  className="mt-2 text-xs font-bold text-red-600"
                >
                  {t('visit.retake_photo')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-[#2E7D32] bg-[#E8F5E9]/50 rounded-xl flex items-center justify-center space-x-2 text-[#1B5E20] min-h-[60px]"
              >
                <Camera className="w-6 h-6" />
                <span className="font-bold text-sm">{t('visit.take_photo')}</span>
              </button>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUpdatingBought(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl min-h-[48px]"
            >
              {t('admin.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] min-h-[48px]"
            >
              {isSaving ? t('visit.saving') : t('visit.save_update')}
            </button>
          </div>
        </form>
      )}

      <ConfirmModal
        isOpen={showCloseModal}
        title={t('visit.mark_closed')}
        message={t('visit.confirm_close')}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowCloseModal(false)}
        isLoading={isSaving}
      />
    </div>
  );
};
