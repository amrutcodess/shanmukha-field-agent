import React from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import {
  LogOut,
  Calendar,
  Sparkles,
  MapPin,
  Phone,
  FileText,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const FarmerHomeScreen: React.FC = () => {
  const {
    farmerLoggedIn,
    visits,
    setCurrentScreen,
    setUserRole,
    setFarmerLoggedIn,
    showToast,
  } = useShanpoorna();

  const farmer = farmerLoggedIn;
  if (!farmer) {
    return (
      <div className="p-8 text-center">
        <p>No farmer logged in.</p>
        <button
          onClick={() => setCurrentScreen('LOGIN')}
          className="mt-4 px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Get farmer visits
  const farmerVisits = visits.filter(
    (v) => v.farmerId === farmer.id || v.farmerName === farmer.qa.farmerName
  );
  const latestVisit = farmerVisits[0];

  const handleLogout = () => {
    setFarmerLoggedIn(null);
    setUserRole('FIELD_ASSISTANT');
    setCurrentScreen('LOGIN');
    showToast('Logged out of Farmer Portal', 'info');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-16 text-stone-800">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-[#096330] to-[#0B7A3B] text-white px-5 pt-6 pb-6 rounded-b-[28px] shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-white">
              SHANPOORNA
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mt-1">
              Farmer Self-Service Portal
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 text-xs font-semibold px-3"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Farmer Info */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-full bg-emerald-800 text-emerald-100 border-2 border-emerald-300/40 flex items-center justify-center font-bold text-base shadow-inner">
            {farmer.qa.farmerName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">
                {farmer.qa.farmerName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/70 border border-emerald-400 text-emerald-200 text-[10px] font-bold">
                ✓ Active Member
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 truncate">
              {farmer.qa.village}, {farmer.qa.district} · {farmer.qa.mobileNumber}
            </p>
            <p className="text-[10px] text-emerald-200/80 font-mono mt-0.5">
              ID: {farmer.farmerIdCode}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 -mt-2">
        {/* Farm & Crop Snapshot */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-xs font-bold text-[#0B7A3B] uppercase tracking-wider">
              Enrolled Farm Profile
            </h3>
            <span className="text-[10px] text-stone-400 font-semibold">Rabi 2026</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-stone-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-stone-400 block">Current Crop</span>
              <span className="font-bold text-stone-900">{farmer.qa.currentCropSown}</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-stone-400 block">Variety</span>
              <span className="font-bold text-stone-900">{farmer.qa.cropVariety}</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-stone-400 block">Farm Area</span>
              <span className="font-bold text-stone-900">{farmer.qa.acreageUnderCrop}</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-stone-400 block">Current Stage</span>
              <span className="font-bold text-emerald-800">{farmer.qa.cropStage}</span>
            </div>
          </div>
        </div>

        {/* Latest Visit & Prescription */}
        {latestVisit ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0B7A3B]" />
                <h3 className="text-xs font-bold text-stone-900">
                  Latest Field Visit ({latestVisit.dateTime.split(',')[0]})
                </h3>
              </div>
              <StatusChip status={latestVisit.status} />
            </div>

            <div className="p-3 rounded-xl bg-[#F7F9F6] border border-stone-200/80 space-y-1.5 text-xs">
              <p>
                <span className="text-stone-400">Pests Observed:</span>{' '}
                <strong className="text-stone-800">
                  {latestVisit.pestsSeen.join(', ')}
                </strong>
              </p>
              <p>
                <span className="text-stone-400">Damage Level:</span>{' '}
                <strong className="text-amber-700">{latestVisit.damageObserved}</strong>
              </p>
              <p className="text-[11px] text-stone-600 italic">
                "{latestVisit.fieldObservations}"
              </p>
            </div>

            {/* Prescribed Treatment */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                <Sparkles className="w-4 h-4 text-[#0B7A3B]" />
                <span>Field Assistant's Prescribed Solution</span>
              </div>
              <p className="text-stone-900 font-semibold">
                {latestVisit.recommendation.productName}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700">
                <div>Dose: {latestVisit.recommendation.dosePerAcre}</div>
                <div>Method: {latestVisit.recommendation.method}</div>
                <div>Apply By: {latestVisit.recommendation.applyBy}</div>
                <div>Dealer: {farmer.qa.dealerAssociated.split(',')[0]}</div>
              </div>
            </div>

            {/* HO Remarks if present */}
            {latestVisit.recommendation.hoExpertAdvice?.hoRemarks && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <span className="font-bold block mb-0.5">HO Agronomist Verification:</span>
                <p className="text-[11px] leading-relaxed">
                  {latestVisit.recommendation.hoExpertAdvice.hoRemarks}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-stone-200">
            <p className="text-xs text-stone-500">No visits logged yet for this season.</p>
          </div>
        )}

        {/* Assigned Dealer Contact */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Associated Input Dealer
          </span>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-stone-900">{farmer.qa.dealerAssociated}</h4>
              <p className="text-stone-500 text-[11px]">Authorized Shanmukha Seeds & Crop Care</p>
            </div>
            <button
              onClick={() => showToast('Calling associated dealer...', 'info')}
              className="py-1.5 px-3 rounded-xl bg-emerald-50 text-[#0B7A3B] border border-emerald-200 font-bold text-xs"
            >
              Call Dealer
            </button>
          </div>
        </div>

        {/* Switch back to Field Assistant presentation view */}
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              setUserRole('FIELD_ASSISTANT');
              setCurrentScreen('HOME');
              showToast('Switched back to Field Assistant view', 'info');
            }}
            className="text-xs text-[#0B7A3B] font-bold hover:underline"
          >
            ← Switch to Field Assistant Mode (Presenter View)
          </button>
        </div>
      </div>
    </div>
  );
};
