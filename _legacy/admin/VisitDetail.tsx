import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { VisitFull, VisitAudit } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getSignedPhotoUrl } from '../../lib/image';
import { formatDateEn, formatTimeEn } from '../../lib/export';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  ExternalLink,
  History,
  RotateCcw,
  Trash2,
  Globe,
  Save,
} from 'lucide-react';

export const AdminVisitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [visit, setVisit] = useState<VisitFull | null>(null);
  const [audits, setAudits] = useState<VisitAudit[]>([]);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [diagnosisEn, setDiagnosisEn] = useState<string>('');
  const [prescriptionEn, setPrescriptionEn] = useState<string>('');
  const [isSavingEn, setIsSavingEn] = useState<boolean>(false);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const lang = i18n.language || 'en';

  const loadVisitDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [vRes, aRes] = await Promise.all([
        supabase.from('visits_full').select('*').eq('id', id).single(),
        supabase.from('visit_audit').select('*').eq('visit_id', id).order('created_at', { ascending: false }),
      ]);

      if (vRes.error || !vRes.data) throw vRes.error;
      const v = vRes.data as VisitFull;
      setVisit(v);
      setDiagnosisEn(v.diagnosis_en || '');
      setPrescriptionEn(v.prescription_en || '');

      if (aRes.data) setAudits(aRes.data as VisitAudit[]);

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

  const handleSaveTranslation = async () => {
    if (!visit) return;
    setIsSavingEn(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          diagnosis_en: diagnosisEn.trim() || null,
          prescription_en: prescriptionEn.trim() || null,
        })
        .eq('id', visit.id);

      if (error) throw error;
      alert('English translations saved successfully!');
      await loadVisitDetail();
    } catch (err: any) {
      alert('Error saving translation: ' + err.message);
    } finally {
      setIsSavingEn(false);
    }
  };

  const handleReopenVisit = async () => {
    if (!visit) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          status: 'pending',
        })
        .eq('id', visit.id);

      if (error) throw error;
      setShowReopenModal(false);
      await loadVisitDetail();
    } catch (err: any) {
      alert('Error reopening visit: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteVisit = async () => {
    if (!visit) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', visit.id);

      if (error) throw error;
      setShowDeleteModal(false);
      navigate('/admin/visits');
    } catch (err: any) {
      alert('Error deleting visit: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading visit detail..." />;
  }

  if (!visit) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Visit record not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-[#2E7D32] text-white rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const cropName = lang === 'te' ? visit.crop_name_te || visit.crop_other : visit.crop_name_en || visit.crop_other;
  const productName = lang === 'te' ? visit.product_name_te || visit.product_other : visit.product_name_en || visit.product_other;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {t('visit.visit_detail')} (#{visit.id.substring(0, 8)})
            </h1>
            <p className="text-xs text-gray-500">
              Agent: {visit.agent_name} (@{visit.agent_username})
            </p>
          </div>
        </div>

        <StatusBadge status={visit.status} />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">{visit.farmer_name}</h3>
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
          <span className="text-xs text-gray-400">
            Created: {formatDateEn(visit.created_at)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
              {formatDateEn(visit.visited_at)} ({formatTimeEn(visit.visited_at)})
            </span>
            <span className="text-gray-600 block pl-4 text-[11px]">
              Duration: {visit.duration_minutes} minutes
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

        <div className="space-y-3 pt-2 border-t">
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
          <div className="pt-3 border-t space-y-2">
            <span className="text-xs font-bold text-gray-500 block">{t('visit.take_photo')}</span>
            <a href={photoSignedUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={photoSignedUrl}
                alt="Purchase Receipt"
                className="w-full max-h-72 object-cover rounded-xl border border-gray-200"
              />
            </a>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2 border-b pb-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <span>{t('visit.english_translation')}</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.diagnosis_en')}
            </label>
            <textarea
              rows={2}
              value={diagnosisEn}
              onChange={(e) => setDiagnosisEn(e.target.value)}
              placeholder="English translation of diagnosis for print/export reports..."
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.prescription_en')}
            </label>
            <textarea
              rows={2}
              value={prescriptionEn}
              onChange={(e) => setPrescriptionEn(e.target.value)}
              placeholder="English translation of prescription..."
              className="w-full p-3 border rounded-xl text-sm"
            />
          </div>

          <button
            onClick={handleSaveTranslation}
            disabled={isSavingEn}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>{t('visit.save_translation')}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {visit.status === 'final' && (
          <button
            onClick={() => setShowReopenModal(true)}
            className="flex-1 py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-300 flex items-center justify-center space-x-2 text-sm min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('visit.reopen_visit')}</span>
          </button>
        )}

        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-300 flex items-center justify-center space-x-2 text-sm min-h-[48px]"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('visit.delete_visit')}</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2 border-b pb-2">
          <History className="w-5 h-5 text-gray-600" />
          <span>{t('visit.audit_history')}</span>
        </h3>

        {audits.length === 0 ? (
          <p className="text-xs text-gray-500 italic">{t('visit.no_audit')}</p>
        ) : (
          <div className="space-y-3 divide-y divide-gray-100">
            {audits.map((a) => (
              <div key={a.id} className="pt-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-gray-700">
                  <span className="uppercase bg-green-100 text-[#1B5E20] px-2 py-0.5 rounded-md text-[10px]">
                    {a.action}
                  </span>
                  <span className="text-gray-400">{formatDateEn(a.created_at)} ({formatTimeEn(a.created_at)})</span>
                </div>
                {a.old_values && a.new_values && (
                  <div className="bg-gray-50 p-2.5 rounded-xl space-y-1 text-[11px]">
                    {Object.keys(a.new_values).map((key) => {
                      if (['updated_at', 'created_at', 'id', 'client_uuid'].includes(key)) return null;
                      const oldVal = a.old_values?.[key];
                      const newVal = a.new_values?.[key];
                      if (oldVal === newVal) return null;
                      return (
                        <div key={key} className="flex justify-between font-mono">
                          <span className="font-semibold text-gray-600">{key}:</span>
                          <span className="text-gray-900">
                            <span className="line-through text-red-500 mr-1">{String(oldVal ?? 'none')}</span>
                            👉 <span className="text-green-700 font-bold ml-1">{String(newVal ?? 'none')}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showReopenModal}
        title={t('visit.reopen_visit')}
        message="Are you sure you want to reopen this visit? Its status will be reset to Pending."
        onConfirm={handleReopenVisit}
        onCancel={() => setShowReopenModal(false)}
        isLoading={isActionLoading}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title={t('visit.delete_visit')}
        message={t('visit.confirm_delete')}
        isDestructive
        onConfirm={handleDeleteVisit}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isActionLoading}
      />
    </div>
  );
};
