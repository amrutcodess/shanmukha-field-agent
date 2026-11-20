import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit2,
  Check,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';

export const FarmerProfileScreen: React.FC = () => {
  const {
    activeFarmer,
    updateFarmerQA,
    setCurrentScreen,
    faProfile,
    showToast,
    t,
  } = useShanpoorna();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    farmerName: activeFarmer.qa.farmerName,
    mobileNumber: activeFarmer.qa.mobileNumber,
    village: activeFarmer.qa.village,
    mandal: activeFarmer.qa.mandal,
    district: activeFarmer.qa.district,
    totalLandholding: activeFarmer.qa.totalLandholding,
    currentCropSown: activeFarmer.qa.currentCropSown,
    cropVariety: activeFarmer.qa.cropVariety,
    acreageUnderCrop: activeFarmer.qa.acreageUnderCrop,
    dateOfSowing: activeFarmer.qa.dateOfSowing,
    irrigationSource: activeFarmer.qa.irrigationSource,
    soilType: activeFarmer.qa.soilType,
    dealerAssociated: activeFarmer.qa.dealerAssociated,
    previousSeasonCropYield: activeFarmer.qa.previousSeasonCropYield,
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmerQA(activeFarmer.id, editForm);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-24 text-stone-800">
      {/* 1. Header (Navy / Dark Green as in Mockup) */}
      <header className="bg-gradient-to-r from-[#172E4C] via-[#1A385C] to-[#1E436E] text-white px-4 pt-5 pb-5 rounded-b-[24px] shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('MY_FARMERS')}
              className="p-1 -ml-1 text-white hover:text-emerald-300 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-white tracking-tight">
              {t.farmerProfile}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-emerald-200 border border-white/20 font-semibold">
              Rabi 2026
            </span>
            <button
              onClick={() => showToast('Demo only: Profile options', 'info')}
              className="p-1 text-white/70 hover:text-white"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-white/70 pl-7">
          FA: {faProfile.name} · {faProfile.id} · 19 Nov 2026
        </p>
      </header>

      <div className="p-4 space-y-4 -mt-2">
        {/* Top Profile Summary Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-sm text-[#0B7A3B] shrink-0">
              {getInitials(activeFarmer.qa.farmerName)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h2 className="text-base font-bold text-stone-900 truncate">
                  {activeFarmer.qa.farmerName}
                </h2>
                <StatusChip status={activeFarmer.status} />
              </div>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                {activeFarmer.qa.currentCropSown} · {activeFarmer.qa.acreageUnderCrop} ·{' '}
                {activeFarmer.qa.cropStage}
              </p>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                Farmer ID: {activeFarmer.farmerIdCode}
              </p>
            </div>
          </div>

          {/* Quick contact row */}
          <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-xl">
              <Phone className="w-3.5 h-3.5 text-[#0B7A3B]" />
              <div className="truncate">
                <span className="text-[9px] text-stone-400 block leading-tight">Mobile</span>
                <span className="font-semibold text-[11px]">
                  {activeFarmer.qa.mobileNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-[#E8731A]" />
              <div className="truncate">
                <span className="text-[9px] text-stone-400 block leading-tight">Village</span>
                <span className="font-semibold text-[11px] truncate block">
                  {activeFarmer.qa.village}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Farmer Details Card (Q-A Questionnaire) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
                BASIC DETAILS
              </span>
              <h3 className="text-sm font-bold text-stone-900">{t.farmerDetails}</h3>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-[#0B7A3B] hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-emerald-50"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : t.edit}</span>
            </button>
          </div>

          {/* Non-editing view */}
          {!isEditing ? (
            <div className="space-y-3">
              {/* Q1 - Q6 always visible */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    Q1 · Farmer name
                  </span>
                  <span className="font-bold text-stone-900">
                    {activeFarmer.qa.farmerName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    Q2 · Mobile number
                  </span>
                  <span className="font-bold text-stone-900">
                    {activeFarmer.qa.mobileNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    Q3 · Village / Mandal / District
                  </span>
                  <span className="font-bold text-stone-900">
                    {activeFarmer.qa.village}, {activeFarmer.qa.mandal},{' '}
                    {activeFarmer.qa.district}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    Q4 · Total landholding
                  </span>
                  <span className="font-bold text-stone-900">
                    {activeFarmer.qa.totalLandholding}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    Q5 · Current crop sown
                  </span>
                  <span className="font-bold text-stone-900">
                    {activeFarmer.qa.currentCropSown}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    Q6 · Crop variety / hybrid
                  </span>
                  <span className="font-bold text-stone-900">
                    {activeFarmer.qa.cropVariety}
                  </span>
                </div>
              </div>

              {/* Expandable Section Q7–Q14 */}
              {isExpanded && (
                <div className="pt-3 border-t border-stone-100 space-y-3.5 animate-in fade-in">
                  {/* Current Crop details */}
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase block mb-2">
                      CURRENT CROP
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      <div>
                        <span className="text-[10px] text-stone-400 block">
                          Q7 · Acreage under crop
                        </span>
                        <span className="font-bold text-stone-900">
                          {activeFarmer.qa.acreageUnderCrop}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">
                          Q8 · Date of sowing
                        </span>
                        <span className="font-bold text-stone-900">
                          {activeFarmer.qa.dateOfSowing}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <span className="text-[10px] text-stone-400 block font-semibold mb-1">
                        Q9 · Current crop stage
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Sowing', 'Vegetative', 'Flowering', 'Boll formation', 'Harvest'].map(
                          (st) => {
                            const isCurrent = activeFarmer.qa.cropStage === st;
                            return (
                              <span
                                key={st}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  isCurrent
                                    ? 'bg-[#E8731A] text-white border-[#E8731A] shadow-xs'
                                    : 'bg-white text-stone-500 border-stone-200'
                                }`}
                              >
                                {st}
                              </span>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Field, Inputs & History */}
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase block mb-2">
                      FIELD, INPUTS & HISTORY
                    </span>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Q10 · Irrigation source
                        </span>
                        <span className="font-bold text-stone-900">
                          {activeFarmer.qa.irrigationSource}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Q11 · Soil type · Soil test done
                        </span>
                        <span className="font-bold text-stone-900">
                          {activeFarmer.qa.soilType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Q13 · Dealer associated
                        </span>
                        <span className="font-bold text-[#0B7A3B]">
                          {activeFarmer.qa.dealerAssociated}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-semibold">
                          Q14 · Previous season crop · Yield
                        </span>
                        <span className="font-bold text-stone-900">
                          {activeFarmer.qa.previousSeasonCropYield}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Q12 Current Pest/Disease Alert Box */}
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-amber-900">
                        Q12 · Current pest / disease: {activeFarmer.qa.currentPestDisease.pest}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 pl-6">
                      Severity: <span className="font-bold text-amber-800">{activeFarmer.qa.currentPestDisease.severity}</span> · {activeFarmer.qa.currentPestDisease.details}
                    </p>
                  </div>
                </div>
              )}

              {/* See More Details Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-[#0B7A3B] font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>{isExpanded ? t.showLess : t.seeMoreDetails}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            /* Editing form view */
            <form onSubmit={handleSaveEdit} className="space-y-3 animate-in fade-in">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">
                  Farmer Name
                </label>
                <input
                  type="text"
                  value={editForm.farmerName}
                  onChange={(e) => setEditForm({ ...editForm, farmerName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Village</label>
                  <input
                    type="text"
                    value={editForm.village}
                    onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">
                    Landholding
                  </label>
                  <input
                    type="text"
                    value={editForm.totalLandholding}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalLandholding: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Crop</label>
                  <input
                    type="text"
                    value={editForm.currentCropSown}
                    onChange={(e) =>
                      setEditForm({ ...editForm, currentCropSown: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">
                    Variety / Hybrid
                  </label>
                  <input
                    type="text"
                    value={editForm.cropVariety}
                    onChange={(e) => setEditForm({ ...editForm, cropVariety: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2 px-4 rounded-xl bg-[#172E4C] text-white text-xs font-bold shadow-md hover:bg-[#1E436E] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveAndSync}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2nd Half: Farmer Activities */}
        <div className="space-y-2.5 pt-1">
          <div>
            <h3 className="text-sm font-bold text-stone-900">{t.farmerActivities}</h3>
            <p className="text-[11px] text-stone-500">{t.farmerActivitiesSub}</p>
          </div>

          {/* Activity 1: Log Field Visit */}
          <div
            onClick={() => setCurrentScreen('LOG_FIELD_VISIT')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-emerald-400 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B7A3B] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors">
                  {t.logFieldVisit}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{t.logFieldVisitDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#0B7A3B] group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Activity 2: Previous Visits */}
          <div
            onClick={() => setCurrentScreen('PREVIOUS_VISITS')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-amber-400 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8731A] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#E8731A] transition-colors">
                  {t.previousVisits}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{t.previousVisitsDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E8731A] group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Activity 3: Farm Reports */}
          <div
            onClick={() => setCurrentScreen('FARM_REPORTS')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-amber-400 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E8731A] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#E8731A] transition-colors">
                  {t.farmReports}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{t.farmReportsDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E8731A] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
