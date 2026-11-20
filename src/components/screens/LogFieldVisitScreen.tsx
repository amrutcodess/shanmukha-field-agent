import React, { useState, useRef } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import { INITIAL_PRODUCTS, Product, VisitPhoto } from '../../mockData';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Scan,
  Check,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Upload,
  Zap,
} from 'lucide-react';

export const LogFieldVisitScreen: React.FC = () => {
  const {
    activeFarmer,
    faProfile,
    addVisit,
    updateVisitHOStatus,
    setCurrentScreen,
    showToast,
    t,
  } = useShanpoorna();

  // Wizard state: 1: Field Visit (PDF 2 Interface 1), 2: Compression Animation, 3: Barcode Scanner, 4: Recommendation (PDF 2 Interface 2)
  const [visitStep, setVisitStep] = useState<1 | 2 | 3 | 4>(1);

  // Field Visit Form State
  const [dateTime] = useState('19 Nov 2026, 02:40 PM');
  const [gps] = useState('17.71°N, 77.96°E');
  const [cropName, setCropName] = useState(activeFarmer.qa.currentCropSown || 'Cotton');
  const [plotArea, setPlotArea] = useState('Plot 2 · 3.5 ac');
  const [cropStage, setCropStage] = useState<
    'Sowing' | 'Vegetative' | 'Flowering' | 'Boll formation' | 'Harvest'
  >('Boll formation');

  // Pests multi-select
  const pestOptions = [
    'Pink bollworm',
    'Whitefly',
    'Jassids',
    'Leaf reddening',
    'Wilt',
    'None',
  ];
  const [selectedPests, setSelectedPests] = useState<string[]>([
    'Pink bollworm',
    'Leaf reddening',
  ]);

  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [areaAffected, setAreaAffected] = useState('1.0 acre');
  const [damageObserved, setDamageObserved] = useState('8–10% bolls');
  const [fieldObservations, setFieldObservations] = useState(
    'Larvae seen inside green bolls; lower leaves turning red on 2 rows near borewell.'
  );

  // Photos captured
  const [photos, setPhotos] = useState<VisitPhoto[]>([
    {
      id: 'PH1',
      url: 'https://images.unsplash.com/photo-1599818816933-289b4b9b9a69?w=400&auto=format&fit=crop&q=80',
      caption: 'Boll larva entry hole',
      lat: 17.7124,
      lng: 77.9628,
      timestamp: '19 Nov 2026, 02:42 PM',
    },
    {
      id: 'PH2',
      url: 'https://images.unsplash.com/photo-1594488556858-a53ec296f8be?w=400&auto=format&fit=crop&q=80',
      caption: 'Leaf reddening symptoms',
      lat: 17.7124,
      lng: 77.9628,
      timestamp: '19 Nov 2026, 02:43 PM',
    },
    {
      id: 'PH3',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80',
      caption: 'Plot 2 crop overview',
      lat: 17.7124,
      lng: 77.9628,
      timestamp: '19 Nov 2026, 02:45 PM',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compression progress state
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Scanned Product State
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Recommendation Step 2 State
  const [problemAddressed, setProblemAddressed] = useState('Pink bollworm');
  const [recommendedProduct, setRecommendedProduct] = useState('Emamectin benzoate 5% SG');
  const [dosePerAcre, setDosePerAcre] = useState('80 g');
  const [totalQuantity, setTotalQuantity] = useState('80 g × 1 ac');
  const [method, setMethod] = useState('Foliar spray');
  const [applyBy, setApplyBy] = useState('2026-11-22');

  const [additionalProducts, setAdditionalProducts] = useState<string[]>([
    'Pink bollworm pheromone lure · 5 traps/acre',
    'Magnesium sulphate 1% · foliar spray',
  ]);

  // Request HO Expert Advice State
  const [needExpertAdvice, setNeedExpertAdvice] = useState(true);
  const [issueForExpert, setIssueForExpert] = useState(
    'Leaf reddening spreading on 2 rows – nutrient or disease? Photos attached.'
  );
  const [sendTo, setSendTo] = useState('Agronomist');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [hoRequestStatus, setHoRequestStatus] = useState<'Pending reply' | 'APPROVED'>(
    'Pending reply'
  );
  const [createdVisitId, setCreatedVisitId] = useState('SV-2026-11-0381');

  // Toggle Pest chip
  const togglePest = (pest: string) => {
    if (pest === 'None') {
      setSelectedPests(['None']);
      return;
    }
    const filtered = selectedPests.filter((p) => p !== 'None');
    if (filtered.includes(pest)) {
      setSelectedPests(filtered.filter((p) => p !== pest));
    } else {
      setSelectedPests([...filtered, pest]);
    }
  };

  // Photo Upload Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newPhotoUrl = URL.createObjectURL(file);
      const newPhoto: VisitPhoto = {
        id: 'P-' + Date.now(),
        url: newPhotoUrl,
        caption: 'Field photo #' + (photos.length + 1),
        lat: 17.7124,
        lng: 77.9628,
        timestamp: '19 Nov 2026, 02:46 PM',
      };
      setPhotos([...photos, newPhoto]);
      showToast('Photo geo-tagged: 17.7124°N, 77.9628°E', 'success');
    }
  };

  // Step 1: Save Visit & Launch Compression
  const handleSaveVisit = () => {
    setVisitStep(2); // compression modal
    setCompressionProgress(10);

    const interval = setInterval(() => {
      setCompressionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setVisitStep(3); // go to product scanner
            showToast('Photos compressed: 6.4 MB → 1.2 MB (81% saved)', 'success');
          }, 400);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  // Step 3: Barcode Scan Simulation
  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const selected = INITIAL_PRODUCTS[0]; // Shan-Emamectin 5% SG
      setScannedProduct(selected);
      setRecommendedProduct(selected.activeSalt);
      setIsScanning(false);
      showToast(`Scanned: ${selected.name}`, 'success');
    }, 900);
  };

  // Step 4: Final Submit to HO
  const handleFinalSubmit = () => {
    const newVisit = addVisit({
      farmerId: activeFarmer.id,
      farmerName: activeFarmer.qa.farmerName,
      dateTime,
      gps,
      cropName,
      plotArea,
      cropStage,
      pestsSeen: selectedPests,
      severity,
      areaAffected,
      damageObserved,
      photos,
      fieldObservations,
      recommendation: {
        problemAddressed,
        productName: recommendedProduct,
        dosePerAcre,
        totalQuantity,
        method,
        applyBy,
        additionalProducts,
        notes: fieldObservations,
        hoExpertAdvice: needExpertAdvice
          ? {
              needed: true,
              issue: issueForExpert,
              sendTo,
              priority,
              status: hoRequestStatus,
              hoRemarks:
                hoRequestStatus === 'APPROVED'
                  ? 'Agronomist confirmed physiological magnesium deficiency. Recommended Shan-MagSul.'
                  : undefined,
            }
          : undefined,
      },
      status: hoRequestStatus === 'APPROVED' ? 'APPROVED' : 'PENDING HO APPROVAL',
    });

    setCreatedVisitId(newVisit.id);
    showToast('Visit & Recommendation submitted to Head Office!', 'success');
    setCurrentScreen('PREVIOUS_VISITS');
  };

  // Presentation demo button to instantly approve
  const handleSimulateHOApproval = () => {
    setHoRequestStatus('APPROVED');
    showToast('⚡ HO Agronomist has APPROVED the prescription!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-28 text-stone-800">
      {/* 1. INTERFACE 1: NEW FIELD VISIT */}
      {visitStep === 1 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header */}
          <header className="bg-gradient-to-r from-[#172E4C] via-[#1A385C] to-[#1E436E] text-white px-4 pt-5 pb-5 rounded-b-[24px] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('FARMER_PROFILE')}
                  className="p-1 -ml-1 text-white hover:text-emerald-300 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-white tracking-tight">
                  {t.newFieldVisit}
                </h1>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 border border-white/20 font-semibold">
                {t.step1Of2}
              </span>
            </div>
            <p className="text-[10px] text-white/70 pl-7">
              FA: {faProfile.name} · {faProfile.id}
            </p>
          </header>

          <div className="px-4 space-y-4 -mt-2">
            {/* Farmer Card */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-[#0B7A3B] shrink-0">
                RG
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {activeFarmer.qa.farmerName}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {activeFarmer.qa.village}, {activeFarmer.qa.district} ·{' '}
                  {activeFarmer.qa.mobileNumber}
                </p>
              </div>
            </div>

            {/* Visit Details Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-[#0B7A3B] uppercase tracking-wider">
                  {t.visitDetails}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">{dateTime}</span>
              </div>

              {/* GPS Captured Pill */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                <MapPin className="w-4 h-4 text-[#0B7A3B] shrink-0" />
                <span className="font-semibold text-emerald-900">
                  GPS captured · {gps}
                </span>
                <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    {t.cropName}
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  >
                    <option value="Cotton">Cotton</option>
                    <option value="Chilli">Chilli</option>
                    <option value="Paddy">Paddy</option>
                    <option value="Maize">Maize</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    {t.plotAreaVisited}
                  </label>
                  <input
                    type="text"
                    value={plotArea}
                    onChange={(e) => setPlotArea(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1.5">
                  {t.cropStage}
                </label>
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                  {['Vegetative', 'Flowering', 'Boll formation', 'Harvest'].map((stage) => {
                    const isSelected = cropStage === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setCropStage(stage as any)}
                        className={`py-1.5 px-3 rounded-full text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-[#172E4C] text-white border-[#172E4C] shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {stage}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pest / Disease Seen Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3.5">
              <div>
                <span className="text-xs font-bold text-[#0B7A3B] uppercase tracking-wider block mb-2">
                  {t.pestDiseaseSeen}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pestOptions.map((pest) => {
                    const isSelected = selectedPests.includes(pest);
                    return (
                      <button
                        key={pest}
                        type="button"
                        onClick={() => togglePest(pest)}
                        className={`py-1.5 px-3 rounded-full text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-[#172E4C] text-white border-[#172E4C] shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {pest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity Chips */}
              <div>
                <span className="text-[11px] font-bold text-stone-600 block mb-1.5">
                  {t.severity}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as const).map((sev) => {
                    const isSelected = severity === sev;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? sev === 'Low'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : sev === 'Medium'
                              ? 'bg-[#E8731A] text-white border-[#E8731A]'
                              : 'bg-rose-600 text-white border-rose-600'
                            : 'bg-stone-50 text-stone-600 border-stone-200'
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    {t.areaAffected}
                  </label>
                  <input
                    type="text"
                    value={areaAffected}
                    onChange={(e) => setAreaAffected(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    {t.damageObserved}
                  </label>
                  <input
                    type="text"
                    value={damageObserved}
                    onChange={(e) => setDamageObserved(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
              </div>

              {/* Photos Captured (with Geolocation & Timestamp Watermark) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-600">
                    {t.photosCaptured} ({photos.length})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    GPS Stamp Active
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative group"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                      {/* Watermark overlay */}
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-1 text-[8px] text-white font-mono leading-none">
                        <span className="truncate">{photo.lat}°N</span>
                        <span className="truncate">{photo.timestamp.split(',')[1]}</span>
                      </div>
                    </div>
                  ))}

                  {/* Add Photo Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-[#0B7A3B] bg-stone-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center text-stone-500 hover:text-[#0B7A3B] transition"
                  >
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold">+ Add</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </div>

              {/* Field observations textarea */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {t.fieldObservations}
                </label>
                <textarea
                  rows={2}
                  value={fieldObservations}
                  onChange={(e) => setFieldObservations(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCurrentScreen('FARMER_PROFILE')}
                className="flex-1 py-3 px-3 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveVisit}
                className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#172E4C] to-[#1E436E] text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>{t.saveVisit}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CLIENT-SIDE IMAGE COMPRESSION ANIMATION MODAL */}
      {visitStep === 2 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0B7A3B] mx-auto flex items-center justify-center animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900">
                Client-Side Image Compression
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Optimizing high-resolution crop photos for instant offline sync
              </p>
            </div>

            {/* Compression Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0B7A3B] h-full transition-all duration-200"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-stone-500">
                <span>Compressing canvas...</span>
                <span className="font-bold text-[#0B7A3B]">{compressionProgress}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
              3 photos compressed: 6.4 MB → 1.2 MB (81% saved)
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT SCANNER VIEW */}
      {visitStep === 3 && (
        <div className="min-h-screen bg-stone-900 text-white flex flex-col justify-between p-4 animate-in fade-in">
          {/* Scanner Header */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setVisitStep(1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase text-emerald-400">
              Shanmukha Smart Barcode Scanner
            </span>
            <div className="w-9" />
          </div>

          {/* Camera Viewfinder */}
          <div className="my-auto relative max-w-[320px] mx-auto w-full aspect-square border-2 border-dashed border-emerald-400/80 rounded-3xl p-4 flex flex-col items-center justify-center overflow-hidden">
            {/* Animated Laser Scanning Line */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-bounce" />

            <div className="text-center space-y-2 pointer-events-none z-10">
              <Scan className="w-16 h-16 text-emerald-400/70 mx-auto" />
              <p className="text-xs text-emerald-200 font-medium">
                Align product barcode / QR inside the box
              </p>
            </div>
          </div>

          {/* Scanned Card or Action */}
          <div className="space-y-3 pb-4">
            {scannedProduct ? (
              <div className="bg-white rounded-2xl p-4 text-stone-900 space-y-3 shadow-xl animate-in slide-in-from-bottom-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
                      Product Verified
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-1">
                      {scannedProduct.name}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-stone-500">
                    {scannedProduct.category}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                  <div>
                    <span className="text-stone-400">Active Salt:</span>{' '}
                    <strong className="text-stone-800">{scannedProduct.activeSalt}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400">Recommended Dose:</span>{' '}
                    <strong className="text-[#0B7A3B]">{scannedProduct.recommendedDose}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400">Pack Sizes:</span>{' '}
                    <span className="text-stone-700">{scannedProduct.packSize}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVisitStep(4)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B7A3B] to-[#096330] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
                >
                  Continue to Prescription & Recommendation →
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <Scan className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Reading barcode...' : 'Scan Product (Demo Scan)'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. INTERFACE 2: RECOMMENDATION (STEP 2 OF 2) */}
      {visitStep === 4 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header */}
          <header className="bg-gradient-to-r from-[#172E4C] via-[#1A385C] to-[#1E436E] text-white px-4 pt-5 pb-5 rounded-b-[24px] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisitStep(1)}
                  className="p-1 -ml-1 text-white hover:text-emerald-300 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-white tracking-tight">
                  {t.recommendationTitle}
                </h1>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 border border-white/20 font-semibold">
                {t.step2Of2}
              </span>
            </div>
            <p className="text-[10px] text-white/70 pl-7 font-mono">
              Visit ID: {createdVisitId}
            </p>
          </header>

          <div className="px-4 space-y-4 -mt-2">
            {/* Visit Summary Snapshot Card */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-900">
                  {activeFarmer.qa.farmerName} · {cropName}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Visit saved</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-100">
                <div>
                  <span className="text-stone-400 block">Stage</span>
                  <span className="font-semibold text-stone-800">{cropStage}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Pest / disease</span>
                  <span className="font-semibold text-stone-800">
                    {selectedPests.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Severity</span>
                  <span className="font-semibold text-amber-700">
                    {severity} · {areaAffected}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Photos</span>
                  <span className="font-semibold text-stone-800">{photos.length} attached</span>
                </div>
              </div>
            </div>

            {/* 1. Recommendation Done */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#172E4C] text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-stone-900">{t.recommendationDone}</h3>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Problem addressed
                </label>
                <input
                  type="text"
                  value={problemAddressed}
                  onChange={(e) => setProblemAddressed(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Product / technical
                </label>
                <input
                  type="text"
                  value={recommendedProduct}
                  onChange={(e) => setRecommendedProduct(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0B7A3B] focus:ring-2 focus:ring-[#0B7A3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Dose per acre
                  </label>
                  <input
                    type="text"
                    value={dosePerAcre}
                    onChange={(e) => setDosePerAcre(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Total quantity
                  </label>
                  <input
                    type="text"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  >
                    <option value="Foliar spray">Foliar spray</option>
                    <option value="Soil drenching">Soil drenching</option>
                    <option value="Seed treatment">Seed treatment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Apply by
                  </label>
                  <input
                    type="date"
                    value={applyBy}
                    onChange={(e) => setApplyBy(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Additional Recommendation */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#172E4C] text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-stone-900">Additional Recommendation</h3>
              </div>

              <p className="text-[11px] text-stone-500">Other company products</p>

              <div className="space-y-2">
                {additionalProducts.map((prod, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800"
                  >
                    <span>{prod}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAdditionalProducts(additionalProducts.filter((_, i) => i !== index))
                      }
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdditionalProducts([
                    ...additionalProducts,
                    'Shan-Neem Gold 10,000 PPM · 400 ml/ac',
                  ]);
                  showToast('Product added to prescription', 'info');
                }}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-stone-300 hover:border-[#0B7A3B] text-[#0B7A3B] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add product</span>
              </button>
            </div>

            {/* 3. Request for Recommendation (Head Office Expert Advice) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#172E4C] text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-xs font-bold text-stone-900">
                    {t.requestExpertAdvice}
                  </h3>
                </div>

                {/* Toggle switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needExpertAdvice}
                    onChange={(e) => setNeedExpertAdvice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B7A3B]" />
                </label>
              </div>

              {needExpertAdvice && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Issue for expert
                    </label>
                    <textarea
                      rows={2}
                      value={issueForExpert}
                      onChange={(e) => setIssueForExpert(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Send to
                      </label>
                      <select
                        value={sendTo}
                        onChange={(e) => setSendTo(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                      >
                        <option value="Agronomist">Agronomist</option>
                        <option value="Entomologist">Entomologist</option>
                        <option value="Pathologist">Pathologist</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                    <span className="text-stone-600">Request status</span>
                    <StatusChip
                      status={
                        hoRequestStatus === 'APPROVED'
                          ? 'APPROVED'
                          : 'PENDING HO APPROVAL'
                      }
                    />
                  </div>

                  {/* Presentation Demo simulation button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSimulateHOApproval}
                      className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>⚡ Simulate HO Agronomist Approval (Demo Trigger)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  showToast('Draft saved locally', 'info');
                  setCurrentScreen('FARMER_PROFILE');
                }}
                className="flex-1 py-3 px-3 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#172E4C] to-[#1E436E] text-white text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-1.5"
              >
                <span>Submit to HO for approval</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
