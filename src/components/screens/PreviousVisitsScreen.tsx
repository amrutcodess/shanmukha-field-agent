import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import { FieldVisit } from '../../mockData';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  X,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sparkles,
} from 'lucide-react';

export const PreviousVisitsScreen: React.FC = () => {
  const {
    visits,
    activeFarmer,
    setCurrentScreen,
    updateVisitHOStatus,
    selectedVisitDetail,
    setSelectedVisitDetail,
    showToast,
    t,
  } = useShanpoorna();

  // Filter visits for current active farmer (or show all if matches)
  const farmerVisits = visits.filter(
    (v) => v.farmerId === activeFarmer.id || v.farmerName === activeFarmer.qa.farmerName
  );

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-24 text-stone-800">
      {/* Top Header */}
      <header className="bg-white px-4 pt-4 pb-3 border-b border-stone-200 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('FARMER_PROFILE')}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 text-[#0B7A3B] transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">
              {t.previousVisits}
            </h1>
            <p className="text-[11px] text-stone-500">
              {activeFarmer.qa.farmerName} · {farmerVisits.length} recorded visits
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('LOG_FIELD_VISIT')}
          className="text-xs font-bold text-white px-3 py-1.5 rounded-xl bg-[#0B7A3B] shadow-xs hover:bg-[#096330] transition"
        >
          + New Visit
        </button>
      </header>

      <div className="p-4 space-y-3">
        {farmerVisits.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
            <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-600">No previous visits</p>
            <p className="text-xs text-stone-400 mt-1">
              Tap '+ New Visit' to record the first inspection.
            </p>
          </div>
        ) : (
          farmerVisits.map((visit) => (
            <div
              key={visit.id}
              onClick={() => setSelectedVisitDetail(visit)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-emerald-300 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B7A3B] font-mono">
                  {visit.id}
                </span>
                <StatusChip status={visit.status} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors">
                    {visit.cropName} · {visit.cropStage}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">{visit.dateTime}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block font-medium">Severity</span>
                  <span
                    className={`text-xs font-bold ${
                      visit.severity === 'High'
                        ? 'text-rose-600'
                        : visit.severity === 'Medium'
                        ? 'text-[#E8731A]'
                        : 'text-emerald-700'
                    }`}
                  >
                    {visit.severity}
                  </span>
                </div>
              </div>

              {/* Pests list chips */}
              <div className="flex flex-wrap gap-1">
                {visit.pestsSeen.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Bottom footer */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-500">
                  {visit.photos.length} photos · {visit.recommendation.productName.split('(')[0]}
                </span>
                <div className="flex items-center text-[#E8731A] font-bold text-[11px] group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full Visit Detail Modal */}
      {selectedVisitDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400">
                  {selectedVisitDetail.id}
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  {selectedVisitDetail.cropName} Field Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedVisitDetail(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-stone-400 block font-semibold">
                    APPROVAL STATUS
                  </span>
                  <span className="text-xs font-bold text-stone-800">
                    {selectedVisitDetail.recommendation.hoExpertAdvice?.status ||
                      selectedVisitDetail.status}
                  </span>
                </div>
                <StatusChip status={selectedVisitDetail.status} />
              </div>

              {/* Inspection Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Date & Time:</span>
                  <span className="font-semibold">{selectedVisitDetail.dateTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">GPS Location:</span>
                  <span className="font-mono font-semibold text-emerald-800">
                    {selectedVisitDetail.gps}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Plot / Area:</span>
                  <span className="font-semibold">{selectedVisitDetail.plotArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Crop Stage:</span>
                  <span className="font-semibold">{selectedVisitDetail.cropStage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pests Observed:</span>
                  <span className="font-semibold">
                    {selectedVisitDetail.pestsSeen.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Area Affected:</span>
                  <span className="font-semibold">{selectedVisitDetail.areaAffected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Damage Observed:</span>
                  <span className="font-semibold text-amber-800">
                    {selectedVisitDetail.damageObserved}
                  </span>
                </div>
              </div>

              {/* Stamped Photos */}
              {selectedVisitDetail.photos.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-stone-700 block mb-2">
                    Geo-Stamped Field Photos ({selectedVisitDetail.photos.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedVisitDetail.photos.map((p) => (
                      <div
                        key={p.id}
                        className="aspect-square rounded-xl overflow-hidden border border-stone-200 relative group"
                      >
                        <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-1 text-[8px] text-white font-mono leading-tight">
                          <span className="truncate">{p.caption}</span>
                          <span>{p.lat}°N</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field Observations */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <span className="font-bold text-stone-700 block mb-1">Field Observations:</span>
                <p className="text-stone-600 leading-relaxed">
                  {selectedVisitDetail.fieldObservations}
                </p>
              </div>

              {/* Recommendation Prescription */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <Sparkles className="w-4 h-4 text-[#0B7A3B]" />
                  <span>Prescribed Treatment</span>
                </div>
                <div className="space-y-1 text-emerald-950">
                  <p>
                    <strong>Product:</strong> {selectedVisitDetail.recommendation.productName}
                  </p>
                  <p>
                    <strong>Dosage:</strong> {selectedVisitDetail.recommendation.dosePerAcre} ·{' '}
                    {selectedVisitDetail.recommendation.method}
                  </p>
                  <p>
                    <strong>Apply by:</strong> {selectedVisitDetail.recommendation.applyBy}
                  </p>
                  {selectedVisitDetail.recommendation.additionalProducts.length > 0 && (
                    <div>
                      <strong>Add-on Products:</strong>
                      <ul className="list-disc list-inside mt-0.5 text-emerald-900">
                        {selectedVisitDetail.recommendation.additionalProducts.map((ap, i) => (
                          <li key={i}>{ap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* HO Agronomist Advice Status / Remarks */}
              {selectedVisitDetail.recommendation.hoExpertAdvice && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">HO Expert Advice</span>
                    <StatusChip
                      status={selectedVisitDetail.recommendation.hoExpertAdvice.status}
                    />
                  </div>
                  <p className="text-stone-700 text-[11px]">
                    <strong>Question:</strong>{' '}
                    {selectedVisitDetail.recommendation.hoExpertAdvice.issue}
                  </p>
                  {selectedVisitDetail.recommendation.hoExpertAdvice.hoRemarks && (
                    <div className="p-2 rounded-xl bg-white/80 border border-amber-200 text-amber-950 font-medium">
                      <strong>Agronomist Remarks:</strong>{' '}
                      {selectedVisitDetail.recommendation.hoExpertAdvice.hoRemarks}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center gap-2">
              {selectedVisitDetail.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => {
                    updateVisitHOStatus(selectedVisitDetail.id, 'APPROVED');
                    setSelectedVisitDetail(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#0B7A3B] text-white font-bold text-xs shadow-md hover:bg-[#096330] flex items-center justify-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simulate HO Approval</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedVisitDetail(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
