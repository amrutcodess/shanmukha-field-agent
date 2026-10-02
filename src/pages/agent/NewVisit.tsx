import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { fetchAllRegions, fetchDistrictsByRegion, fetchVillagesByDistrict, getOrCreateLocationRPC } from '../../lib/location';
import { compressPhoto, uploadPurchasePhoto } from '../../lib/image';
import { saveOfflineDraft } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import type { Region, District, Village, Crop, Product } from '../../types';
import {
  Clock,
  MapPin,
  User,
  Sprout,
  ShoppingBag,
  Camera,
  CheckCircle,
  PlusCircle,
  List,
  AlertCircle,
} from 'lucide-react';

export const NewVisit: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visitedDate, setVisitedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [visitedTime, setVisitedTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<string>('');

  const [regionInput, setRegionInput] = useState<string>('');
  const [districtInput, setDistrictInput] = useState<string>('');
  const [villageInput, setVillageInput] = useState<string>('');

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [farmerName, setFarmerName] = useState<string>('');
  const [farmerPhone, setFarmerPhone] = useState<string>('');
  const [cropId, setCropId] = useState<string>('');
  const [cropOther, setCropOther] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [prescription, setPrescription] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [productOther, setProductOther] = useState<string>('');

  const [purchased, setPurchased] = useState<boolean>(false);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [cropsList, setCropsList] = useState<Crop[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lang = i18n.language || 'en';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        (err) => console.log('GPS not available:', err.message),
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [cRes, pRes, rRes] = await Promise.all([
          supabase.from('crops').select('*').eq('is_active', true),
          supabase.from('products').select('*').eq('is_active', true),
          fetchAllRegions(),
        ]);
        if (cRes.data) setCropsList(cRes.data as Crop[]);
        if (pRes.data) setProductsList(pRes.data as Product[]);
        if (rRes) setRegions(rRes);
      } catch (err) {
        console.error('Failed to load catalogs:', err);
      }
    };
    loadCatalogs();
  }, []);

  useEffect(() => {
    const matchReg = regions.find(
      (r) => r.name.toLowerCase() === regionInput.trim().toLowerCase()
    );
    if (matchReg) {
      fetchDistrictsByRegion(matchReg.id).then(setDistricts);
    } else {
      setDistricts([]);
    }
  }, [regionInput, regions]);

  useEffect(() => {
    const matchDist = districts.find(
      (d) => d.name.toLowerCase() === districtInput.trim().toLowerCase()
    );
    if (matchDist) {
      fetchVillagesByDistrict(matchDist.id).then(setVillages);
    } else {
      setVillages([]);
    }
  }, [districtInput, districts]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      try {
        const compressed = await compressPhoto(originalFile);
        setPhotoBlob(compressed);
        const url = URL.createObjectURL(compressed);
        setPhotoPreviewUrl(url);
      } catch (err) {
        console.error('Compression error:', err);
        setPhotoBlob(originalFile);
        setPhotoPreviewUrl(URL.createObjectURL(originalFile));
      }
    }
  };

  const handleClearPhoto = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (!regionInput.trim() || !districtInput.trim() || !villageInput.trim()) {
      setErrorMsg(t('visit.type_english_hint') + ' (Region, District, Village required)');
      return false;
    }
    if (!farmerName.trim()) {
      setErrorMsg(t('visit.farmer_name') + ' is required');
      return false;
    }
    if (farmerPhone.trim() && !/^[6-9]\d{9}$/.test(farmerPhone.trim())) {
      setErrorMsg(t('visit.farmer_phone') + ' must be a valid 10-digit number');
      return false;
    }
    if (!diagnosis.trim()) {
      setErrorMsg(t('visit.diagnosis') + ' is required');
      return false;
    }
    if (!prescription.trim()) {
      setErrorMsg(t('visit.prescription') + ' is required');
      return false;
    }
    if (purchased && !photoBlob) {
      setErrorMsg(t('visit.photo_required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) return;
    if (!profile) return;

    setIsSubmitting(true);

    const client_uuid = crypto.randomUUID();
    const visited_at = new Date(`${visitedDate}T${visitedTime}:00`).toISOString();
    const finalDuration = customDuration ? parseInt(customDuration, 10) || 30 : durationMinutes;
    const numericAmount = purchaseAmount ? parseFloat(purchaseAmount) || null : null;

    const draftData = {
      client_uuid,
      agent_id: profile.id,
      visited_at,
      duration_minutes: finalDuration,
      farmer_name: farmerName.trim(),
      farmer_phone: farmerPhone.trim() || undefined,
      region: regionInput.trim(),
      district: districtInput.trim(),
      village: villageInput.trim(),
      crop_id: cropId !== 'other' ? cropId : undefined,
      crop_other: cropId === 'other' ? cropOther.trim() : undefined,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim(),
      product_id: productId !== 'other' ? productId : undefined,
      product_other: productId === 'other' ? productOther.trim() : undefined,
      purchased,
      purchase_amount: numericAmount || undefined,
      photo_blob: photoBlob,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
    };

    if (!isOnline) {
      try {
        await saveOfflineDraft(draftData);
        setIsSubmitting(false);
        setIsSubmittedSuccess(true);
        return;
      } catch (err: any) {
        setErrorMsg('Failed to save offline draft: ' + err.message);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const { village_id } = await getOrCreateLocationRPC(
        regionInput,
        districtInput,
        villageInput
      );

      let purchase_image_path: string | null = null;
      if (purchased && photoBlob) {
        purchase_image_path = await uploadPurchasePhoto(profile.id, client_uuid, photoBlob);
      }

      const status = purchased ? 'final' : 'pending';
      const finalized_at = purchased ? new Date().toISOString() : null;

      const { error: visitError } = await supabase.from('visits').insert({
        client_uuid,
        agent_id: profile.id,
        village_id,
        visited_at,
        duration_minutes: finalDuration,
        farmer_name: farmerName.trim(),
        farmer_phone: farmerPhone.trim() || null,
        crop_id: cropId && cropId !== 'other' ? cropId : null,
        crop_other: cropId === 'other' ? cropOther.trim() : null,
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        product_id: productId && productId !== 'other' ? productId : null,
        product_other: productId === 'other' ? productOther.trim() : null,
        purchased,
        purchase_amount: numericAmount,
        purchase_image_path,
        status,
        finalized_at,
        latitude,
        longitude,
      });

      if (visitError) {
        console.warn('DB insert failed, saving to offline draft queue:', visitError.message);
        await saveOfflineDraft(draftData);
      }

      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.error('Online submit error:', err);
      try {
        await saveOfflineDraft(draftData);
        setIsSubmitting(false);
        setIsSubmittedSuccess(true);
      } catch (dbErr: any) {
        setErrorMsg('Error saving visit: ' + (err.message || dbErr.message));
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setFarmerName('');
    setFarmerPhone('');
    setDiagnosis('');
    setPrescription('');
    setCropId('');
    setCropOther('');
    setProductId('');
    setProductOther('');
    setPurchased(false);
    setPurchaseAmount('');
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setIsSubmittedSuccess(false);
  };

  if (isSubmittedSuccess) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center pb-24">
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('visit.visit_added_success')}</h2>
          <p className="text-sm text-gray-600">
            {!isOnline
              ? t('app.offline_banner')
              : 'Visit recorded and uploaded securely.'}
          </p>

          <div className="pt-4 space-y-3">
            <button
              onClick={resetForm}
              className="w-full py-4 px-4 bg-[#2E7D32] text-white font-bold rounded-xl shadow-xs hover:bg-[#1B5E20] flex items-center justify-center space-x-2 min-h-[52px]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{t('visit.add_another')}</span>
            </button>
            <button
              onClick={() => navigate('/agent/my-visits')}
              className="w-full py-4 px-4 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 flex items-center justify-center space-x-2 min-h-[52px]"
            >
              <List className="w-5 h-5" />
              <span>{t('visit.view_my_visits')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
      <div className="bg-[#2E7D32] text-white p-4 rounded-2xl shadow-xs">
        <h2 className="text-lg font-bold flex items-center space-x-2">
          <PlusCircle className="w-6 h-6" />
          <span>{t('nav.new_visit')}</span>
        </h2>
        <p className="text-xs text-[#E8F5E9] mt-0.5">
          Record visit details, diagnosis, and farmer purchase
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('visit.visit_info')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('visit.date')}
              </label>
              <input
                type="date"
                required
                value={visitedDate}
                onChange={(e) => setVisitedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('visit.time')}
              </label>
              <input
                type="time"
                required
                value={visitedTime}
                onChange={(e) => setVisitedTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.duration')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => {
                    setDurationMinutes(mins);
                    setCustomDuration('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
                    durationMinutes === mins && !customDuration
                      ? 'bg-[#2E7D32] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('visit.quick_minutes', { min: mins })}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              placeholder="Custom duration in minutes..."
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#2E7D32]" />
              <span>{t('visit.location')}</span>
            </h3>
            <span className="text-[11px] text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md font-semibold">
              {t('visit.type_english_hint')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.region')} *
            </label>
            <input
              type="text"
              required
              list="regions-list"
              value={regionInput}
              onChange={(e) => setRegionInput(e.target.value)}
              placeholder="e.g. Guntur Region"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
            <datalist id="regions-list">
              {regions.map((r) => (
                <option key={r.id} value={r.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.district')} *
            </label>
            <input
              type="text"
              required
              list="districts-list"
              value={districtInput}
              onChange={(e) => setDistrictInput(e.target.value)}
              placeholder="e.g. Guntur"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
            <datalist id="districts-list">
              {districts.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.village')} *
            </label>
            <input
              type="text"
              required
              list="villages-list"
              value={villageInput}
              onChange={(e) => setVillageInput(e.target.value)}
              placeholder="e.g. Tenali"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
            <datalist id="villages-list">
              {villages.map((v) => (
                <option key={v.id} value={v.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <User className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('visit.farmer_details')}</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.farmer_name')} *
            </label>
            <input
              type="text"
              required
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              placeholder="Farmer full name..."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.farmer_phone')}
            </label>
            <input
              type="tel"
              maxLength={10}
              value={farmerPhone}
              onChange={(e) => setFarmerPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number..."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <Sprout className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('visit.crop_details')}</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.crop')}
            </label>
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px] bg-white"
            >
              <option value="">-- {t('visit.select_crop')} --</option>
              {cropsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'te' ? c.name_te : c.name_en}
                </option>
              ))}
              <option value="other">{t('common.other')}</option>
            </select>

            {cropId === 'other' && (
              <input
                type="text"
                value={cropOther}
                onChange={(e) => setCropOther(e.target.value)}
                placeholder={t('visit.other_crop')}
                className="mt-2 w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.diagnosis')} *
            </label>
            <textarea
              required
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder={t('visit.diagnosis_placeholder')}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2E7D32] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.prescription')} *
            </label>
            <textarea
              required
              rows={3}
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder={t('visit.prescription_placeholder')}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2E7D32] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('visit.recommended_product')}
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px] bg-white"
            >
              <option value="">-- {t('visit.select_product')} --</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === 'te' ? p.name_te : p.name_en}
                </option>
              ))}
              <option value="other">{t('common.other')}</option>
            </select>

            {productId === 'other' && (
              <input
                type="text"
                value={productOther}
                onChange={(e) => setProductOther(e.target.value)}
                placeholder={t('visit.other_product')}
                className="mt-2 w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[48px]"
              />
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('visit.purchase_status')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPurchased(true)}
              className={`py-4 px-3 rounded-xl font-bold text-sm transition border-2 flex items-center justify-center space-x-2 min-h-[52px] ${
                purchased
                  ? 'bg-[#2E7D32] text-white border-[#2E7D32] shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>{t('visit.yes_bought')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPurchased(false);
                setPhotoBlob(null);
                setPhotoPreviewUrl(null);
              }}
              className={`py-4 px-3 rounded-xl font-bold text-sm transition border-2 flex items-center justify-center space-x-2 min-h-[52px] ${
                !purchased
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>{t('visit.no_bought')}</span>
            </button>
          </div>

          {purchased && (
            <div className="space-y-3 pt-2 border-t border-gray-100 animate-in fade-in">
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
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#2E7D32] p-2 bg-gray-50 text-center">
                    <img
                      src={photoPreviewUrl}
                      alt="Purchase Receipt"
                      className="max-h-48 mx-auto object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 min-h-[44px]"
                    >
                      {t('visit.retake_photo')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-5 border-2 border-dashed border-[#2E7D32] bg-[#E8F5E9]/50 rounded-xl flex flex-col items-center justify-center text-[#1B5E20] hover:bg-[#E8F5E9] transition min-h-[80px]"
                  >
                    <Camera className="w-8 h-8 mb-1 text-[#2E7D32]" />
                    <span className="text-sm font-bold">{t('visit.take_photo')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-16 left-0 right-0 pt-2 pb-2 bg-[#E8F5E9]/90 backdrop-blur-xs">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-[#2E7D32] text-white font-extrabold text-base rounded-xl shadow-lg hover:bg-[#1B5E20] transition min-h-[56px] disabled:opacity-50"
          >
            {isSubmitting ? t('visit.submitting') : t('visit.submit_visit')}
          </button>
        </div>
      </form>
    </div>
  );
};
