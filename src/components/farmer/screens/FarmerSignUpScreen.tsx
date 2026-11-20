import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Phone, 
  KeyRound, 
  User, 
  MapPin, 
  Navigation, 
  Wheat, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Minus, 
  Camera, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getTranslation } from '../../../i18n/translations';
import { Language, IrrigationType, SeasonType, Farmer } from '../../../types';
import { FarmMap } from '../../common/FarmMap';

interface FarmerSignUpScreenProps {
  initialPhone?: string;
  onCancel: () => void;
  onComplete: (farmer: Farmer) => void;
}

export const FarmerSignUpScreen: React.FC<FarmerSignUpScreenProps> = ({
  initialPhone = '',
  onCancel,
  onComplete
}) => {
  const { language, setLanguage, registerNewFarmer, triggerSuccess } = useData();
  const { setLoggedInFarmer } = useAuth();
  const t = getTranslation(language);

  // Steps: 0: Language, 1: Mobile & OTP, 2: Name & Photo, 3: Geotag Location, 4: Farm Details, 5: Review, 6: Celebration
  const [step, setStep] = useState<number>(0);

  // Form State
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [phone, setPhone] = useState(initialPhone || '');
  const [otp, setOtp] = useState('1234');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👨‍🌾');

  // Geotag State
  const [lat, setLat] = useState<number>(18.4386);
  const [lng, setLng] = useState<number>(79.1288);
  const [accuracy, setAccuracy] = useState<number>(10);
  const [hasLocation, setHasLocation] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');
  const [villageName, setVillageName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('Karimnagar');
  const [mandalName, setMandalName] = useState<string>('Medpalli');
  const [stateName, setStateName] = useState<string>('Telangana');

  // Farm Details State
  const [crop, setCrop] = useState<string>('Paddy');
  const [acres, setAcres] = useState<number>(3);
  const [irrigation, setIrrigation] = useState<IrrigationType>('Borewell');
  const [season, setSeason] = useState<SeasonType>('Kharif');

  // Validation Error
  const [errorMsg, setErrorMsg] = useState<string>('');

  const totalSteps = 6;
  const progressPercent = Math.min(100, Math.round(((step + 1) / totalSteps) * 100));

  // Geolocation Handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t.locationDeniedMsg);
      return;
    }

    setIsDetectingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const detectedLat = parseFloat(pos.coords.latitude.toFixed(6));
        const detectedLng = parseFloat(pos.coords.longitude.toFixed(6));
        const detectedAcc = Math.round(pos.coords.accuracy);

        setLat(detectedLat);
        setLng(detectedLng);
        setAccuracy(detectedAcc);
        setHasLocation(true);
        setIsDetectingLocation(false);

        // Reverse geocoding attempt (OpenStreetMap Nominatim) with graceful fallback
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${detectedLat}&lon=${detectedLng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedVillage = addr.village || addr.suburb || addr.town || addr.county || 'Medpalli';
            const detectedDistrict = addr.state_district || addr.county || 'Karimnagar';
            const detectedState = addr.state || 'Telangana';

            setVillageName(detectedVillage);
            setDistrictName(detectedDistrict);
            setStateName(detectedState);
          } else {
            setVillageName('Medpalli');
          }
        } catch {
          setVillageName('Medpalli');
        }
      },
      () => {
        setIsDetectingLocation(false);
        setLocationError(t.locationDeniedMsg);
        setHasLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleNext = () => {
    setErrorMsg('');

    // Step 0: Language
    if (step === 0) {
      setLanguage(selectedLang);
      setStep(1);
      return;
    }

    // Step 1: Mobile & OTP
    if (step === 1) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg(t.invalidMobile);
        return;
      }
      if (otp !== '1234') {
        setErrorMsg(t.invalidOtp);
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Name
    if (step === 2) {
      if (!name.trim()) {
        setErrorMsg(language === 'te' ? 'దయచేసి మీ పేరు రాయండి' : 'Please enter your name');
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Location
    if (step === 3) {
      if (!villageName.trim()) {
        setVillageName('Medpalli');
      }
      setStep(4);
      return;
    }

    // Step 4: Farm Details
    if (step === 4) {
      setStep(5);
      return;
    }

    // Step 5: Review & Create Account
    if (step === 5) {
      const now = new Date();
      const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const newFarmer = registerNewFarmer({
        name: name.trim(),
        nameTe: name.trim(),
        phone: phone.replace(/\D/g, ''),
        village: villageName || 'Medpalli',
        villageTe: villageName || 'మేడ్పల్లి',
        district: districtName || 'Karimnagar',
        districtTe: districtName || 'కరీంనగర్',
        mandal: mandalName || 'Medpalli',
        state: stateName || 'Telangana',
        crop: crop,
        cropTe: crop === 'Paddy' ? 'వరి' : crop === 'Cotton' ? 'పత్తి' : crop === 'Chilli' ? 'మిరప' : crop === 'Maize' ? 'మొక్కజొన్న' : 'ఇతర పంట',
        acres: acres,
        avatar: avatar,
        lat: hasLocation ? lat : undefined,
        lng: hasLocation ? lng : undefined,
        accuracy: hasLocation ? accuracy : undefined,
        geotagCapturedAt: hasLocation ? timeStr : undefined,
        irrigationType: irrigation,
        season: season
      });

      setLoggedInFarmer(newFarmer);
      setStep(6); // Celebration step

      // Trigger Confetti Burst
      try {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2E7D32', '#4CAF50', '#F9A825', '#14532D']
          });
        }
      } catch {}

      triggerSuccess(t.done, t.accountCreatedSuccess);
      return;
    }

    // Step 6: Go to Home
    if (step === 6) {
      const created = registerNewFarmer({
        name: name.trim(),
        nameTe: name.trim(),
        phone: phone.replace(/\D/g, ''),
        village: villageName || 'Medpalli',
        villageTe: villageName || 'మేడ్పల్లి',
        district: districtName || 'Karimnagar',
        districtTe: districtName || 'కరీంనగర్',
        state: stateName || 'Telangana',
        crop: crop,
        cropTe: crop === 'Paddy' ? 'వరి' : crop,
        acres: acres
      });
      onComplete(created);
    }
  };

  const crops = [
    { id: 'Paddy', label: t.paddy, icon: '🌾' },
    { id: 'Cotton', label: t.cotton, icon: '🌱' },
    { id: 'Chilli', label: t.chilli, icon: '🌶️' },
    { id: 'Maize', label: t.maize, icon: '🌽' },
    { id: 'Groundnut', label: t.groundnut, icon: '🥜' },
    { id: 'Banana', label: t.banana, icon: '🍌' }
  ];

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 relative z-10 max-w-[480px] mx-auto">
      {/* Top Header & Progress Bar */}
      <div>
        <div className="flex items-center justify-between pb-3">
          {step > 0 && step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="w-10 h-10 rounded-full bg-white/80 border border-emerald-900/10 flex items-center justify-center text-stone-700 active:scale-95 transition-all shadow-xs"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-bold text-stone-500 hover:text-stone-800 transition-colors"
            >
              {t.cancel}
            </button>
          )}

          <span className="text-xs font-bold text-stone-400 tabular-nums">
            {step < 6 ? `${step + 1} / ${totalSteps}` : '✓'}
          </span>
        </div>

        {/* Thin progress bar */}
        {step < 6 && (
          <div className="w-full h-1.5 bg-stone-200/80 rounded-full overflow-hidden mb-5">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>

      {/* Main Slide Card */}
      <div className="my-auto py-2">
        <AnimatePresence mode="wait">
          {/* STEP 0: LANGUAGE SELECTION */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h2 className="text-2xl font-black text-stone-900">
                  {t.onboardingStepLanguage}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t.onboardingStepLanguageSub}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLang('te')}
                  className={`p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between shadow-xs ${
                    selectedLang === 'te'
                      ? 'border-[#2E7D32] bg-emerald-50/70 shadow-md ring-2 ring-[#2E7D32]/10'
                      : 'border-stone-200/80 bg-white/90 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <p className="text-2xl font-black text-stone-900">తెలుగు</p>
                    <p className="text-sm text-stone-500 font-medium">రైతులకు సులభమైన గ్రామీణ భాష</p>
                  </div>
                  {selectedLang === 'te' && (
                    <CheckCircle2 className="w-7 h-7 text-[#2E7D32] fill-emerald-100" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLang('en')}
                  className={`p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between shadow-xs ${
                    selectedLang === 'en'
                      ? 'border-[#2E7D32] bg-emerald-50/70 shadow-md ring-2 ring-[#2E7D32]/10'
                      : 'border-stone-200/80 bg-white/90 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <p className="text-2xl font-black text-stone-900">English</p>
                    <p className="text-sm text-stone-500 font-medium">Simple and clear English interface</p>
                  </div>
                  {selectedLang === 'en' && (
                    <CheckCircle2 className="w-7 h-7 text-[#2E7D32] fill-emerald-100" />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: MOBILE NUMBER & OTP */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h2 className="text-2xl font-black text-stone-900">
                  {t.onboardingStepPhone}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t.onboardingStepPhoneSub}
                </p>
              </div>

              <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">
                    {t.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-xl font-bold text-stone-900 focus:outline-none focus:border-[#2E7D32] tracking-wider"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-bold text-stone-600">
                      {t.enterOtpTitle}
                    </label>
                    <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                      {t.otpHint}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-2xl font-black text-center tracking-[0.5em] text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: FARMER NAME & AVATAR */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h2 className="text-2xl font-black text-stone-900">
                  {t.onboardingStepProfile}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t.onboardingStepProfileSub}
                </p>
              </div>

              <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">
                    {t.farmerNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-xl font-bold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                    {t.photoOptional}
                  </label>
                  <div className="flex items-center gap-3">
                    {['👨‍🌾', '👩‍🌾', '🌾', '🚜'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                          avatar === emoji
                            ? 'bg-emerald-100 border-2 border-[#2E7D32] shadow-sm'
                            : 'bg-white border border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: FARM LOCATION & GEOTAG */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#2E7D32] flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h2 className="text-2xl font-black text-stone-900">
                  {t.onboardingStepLocation}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t.onboardingStepLocationSub}
                </p>
              </div>

              {/* Big Use My Location Button */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-3.5 px-5 rounded-2xl font-bold text-lg shadow-md flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[56px]"
              >
                <Navigation className={`w-5 h-5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>{isDetectingLocation ? t.detectingLocation : t.useMyLocation}</span>
              </button>

              {/* Map Preview Card */}
              {hasLocation && (
                <div className="glass-card rounded-3xl p-4 border border-emerald-900/10 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                    <span className="flex items-center gap-1.5 text-[#2E7D32]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.locationDetected}</span>
                    </span>
                    <span className="bg-emerald-100 text-[#14532D] px-2 py-0.5 rounded-full">
                      {accuracy}m {t.meters}
                    </span>
                  </div>

                  <FarmMap
                    lat={lat}
                    lng={lng}
                    accuracy={accuracy}
                    draggable={true}
                    onPositionChange={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                    heightClass="h-44"
                  />

                  <p className="text-[11px] text-stone-500 font-medium text-center">
                    {t.dragPinHint} • ({lat}, {lng})
                  </p>
                </div>
              )}

              {locationError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Village / Mandal / District Form */}
              <div className="glass-card rounded-3xl p-4 border border-emerald-900/10 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                      {t.villageNameLabel}
                    </label>
                    <input
                      type="text"
                      value={villageName}
                      onChange={(e) => setVillageName(e.target.value)}
                      placeholder="Medpalli"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                      {t.mandalLabel}
                    </label>
                    <input
                      type="text"
                      value={mandalName}
                      onChange={(e) => setMandalName(e.target.value)}
                      placeholder="Ramagundam"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                      {t.districtLabel}
                    </label>
                    <input
                      type="text"
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      placeholder="Karimnagar"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                      {t.stateLabel}
                    </label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="Telangana"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: FARM DETAILS (Crop, Acres, Irrigation, Season) */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#2E7D32] flex items-center justify-center mx-auto mb-2">
                  <Wheat className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h2 className="text-2xl font-black text-stone-900">
                  {t.onboardingStepFarm}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t.onboardingStepFarmSub}
                </p>
              </div>

              {/* Crop Picker Cards */}
              <div className="glass-card rounded-3xl p-4 border border-emerald-900/10 space-y-2">
                <label className="block text-xs font-bold text-stone-500 uppercase">
                  {t.cropSelectionLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {crops.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCrop(c.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        crop === c.id
                          ? 'border-[#2E7D32] bg-emerald-50 text-[#14532D] font-black shadow-xs ring-1 ring-[#2E7D32]/20'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{c.icon}</span>
                      <span className="text-xs leading-tight block">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Acres Stepper */}
              <div className="glass-card rounded-3xl p-4 border border-emerald-900/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase">{t.acresStepperLabel}</p>
                  <p className="text-2xl font-black text-stone-900 mt-0.5">{acres} {t.acresUnit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAcres(Math.max(0.5, acres - 0.5))}
                    className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 active:scale-95 shadow-xs"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcres(acres + 0.5)}
                    className="w-12 h-12 rounded-2xl bg-[#2E7D32] text-white flex items-center justify-center active:scale-95 shadow-sm"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Irrigation & Season */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="glass-card rounded-3xl p-3.5 border border-emerald-900/10">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1.5">
                    {t.irrigationLabel}
                  </label>
                  <select
                    value={irrigation}
                    onChange={(e) => setIrrigation(e.target.value as IrrigationType)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800"
                  >
                    <option value="Borewell">{t.borewell}</option>
                    <option value="Canal">{t.canal}</option>
                    <option value="Rain-fed">{t.rainfed}</option>
                  </select>
                </div>

                <div className="glass-card rounded-3xl p-3.5 border border-emerald-900/10">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1.5">
                    {t.seasonLabel}
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as SeasonType)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800"
                  >
                    <option value="Kharif">{t.kharif}</option>
                    <option value="Rabi">{t.rabi}</option>
                    <option value="Summer">{t.summer}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVIEW SCREEN */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-center mb-3">
                <h2 className="text-2xl font-black text-stone-900">
                  {t.onboardingStepReview}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t.onboardingStepReviewSub}
                </p>
              </div>

              <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 space-y-3.5 text-sm">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                  <span className="text-3xl">{avatar}</span>
                  <div>
                    <p className="text-lg font-black text-stone-900">{name}</p>
                    <p className="text-xs text-stone-500 font-semibold">{phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 font-bold uppercase">{t.villageLabel}</span>
                    <p className="text-stone-900 font-bold text-sm">{villageName || 'Medpalli'}</p>
                  </div>
                  <div>
                    <span className="text-stone-400 font-bold uppercase">{t.cropLabel}</span>
                    <p className="text-stone-900 font-bold text-sm">{crop} ({acres} {t.acresUnit})</p>
                  </div>
                  <div>
                    <span className="text-stone-400 font-bold uppercase">{t.irrigationLabel}</span>
                    <p className="text-stone-900 font-bold text-sm">{irrigation}</p>
                  </div>
                  <div>
                    <span className="text-stone-400 font-bold uppercase">{t.seasonLabel}</span>
                    <p className="text-stone-900 font-bold text-sm">{season}</p>
                  </div>
                </div>

                {hasLocation && (
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-[#2E7D32] font-bold">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{t.geotagCapturedBadge}</span>
                    </span>
                    <span className="text-stone-400">{lat}, {lng}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 6: CELEBRATION SCREEN */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-[#14532D] to-[#4CAF50] rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-900/20">
                <Sparkles className="w-12 h-12 stroke-[2.2]" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-stone-900">
                  {t.accountCreatedSuccess}
                </h2>
                <p className="text-base text-stone-600 font-medium mt-1">
                  {t.welcomeToShanmukha}
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm font-bold text-[#14532D]">
                {name} • {villageName || 'Medpalli'} ({crop})
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && (
          <p className="text-sm font-bold text-red-600 mt-3 text-center">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Bottom Action Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-4 px-6 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-2 active:scale-97 transition-all min-h-[60px]"
        >
          {step === 5 ? (
            <>
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              <span>{t.createMyAccount}</span>
            </>
          ) : step === 6 ? (
            <>
              <span>{t.goToHome}</span>
              <ArrowRight className="w-6 h-6 stroke-[2.5]" />
            </>
          ) : (
            <>
              <span>{t.continue}</span>
              <ArrowRight className="w-6 h-6 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
