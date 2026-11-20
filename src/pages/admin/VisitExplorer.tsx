import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminVisit } from '../../types/admin';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  Search,
  Filter,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Camera,
  FileText,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const VisitExplorer: React.FC = () => {
  const { filteredVisits, updateVisitFlagStatus } = useAdmin();

  // Filters
  const [cropFilter, setCropFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [flagsOnly, setFlagsOnly] = useState(false);

  // Selected visit detail drawer
  const [selectedVisit, setSelectedVisit] = useState<AdminVisit | null>(null);

  // Filter logic
  const visitsToDisplay = filteredVisits.filter((v) => {
    if (cropFilter !== 'ALL' && v.crop !== cropFilter) return false;
    if (stageFilter !== 'ALL' && v.cropStage !== stageFilter) return false;
    if (typeFilter !== 'ALL' && v.visitType !== typeFilter) return false;
    if (flagsOnly && !v.hasFlags) return false;
    return true;
  });

  const crops = ['ALL', 'Cotton', 'Chilli', 'Paddy', 'Maize', 'Redgram'];
  const stages = ['ALL', 'Sowing', 'Vegetative', 'Flowering', 'Boll formation', 'Harvest'];

  // Export data format
  const exportData = visitsToDisplay.map((v) => ({
    Visit_ID: v.id,
    Date_Time: v.startTime,
    Field_Assistant: v.faName,
    Farmer_Name: v.farmerName,
    District: v.district,
    Village: v.village,
    Crop: v.crop,
    Crop_Stage: v.cropStage,
    Duration_Mins: v.durationMinutes,
    Distance_Km: v.distanceKm,
    Visit_Type: v.visitType,
    VAS_Service: v.valueAddedService,
    Sales_INR: v.totalSaleAmount,
    Flags_Count: v.flags.length,
    Anomaly_Descriptions: v.flags.map((f) => f.description).join('; '),
  }));

  const handleReviewFlag = (flagId: string, status: 'RESOLVED_VALID' | 'FALSE_POSITIVE' | 'ESCALATED') => {
    if (!selectedVisit) return;
    updateVisitFlagStatus(selectedVisit.id, flagId, status);
    alert(`Flag status updated to ${status}`);
    // update local state
    setSelectedVisit((prev) =>
      prev
        ? {
            ...prev,
            flags: prev.flags.map((f) => (f.id === flagId ? { ...f, reviewStatus: status, isReviewed: true } : f)),
          }
        : null
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Visit Explorer & Verification</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B7A3B]">
              {visitsToDisplay.length} Records
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit geo-stamped farm inspections, photos, diagnostic prescriptions and flagged anomalies
          </p>
        </div>

        <PrintExportButtons data={exportData} filename="visit-explorer-records" />
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Crop Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Crop:</span>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Crop Stage Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Visit Type */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="WITH_PRESCRIPTION">With Prescription</option>
              <option value="OBSERVATION_ONLY">Observation Only</option>
            </select>
          </div>

          {/* Flags Only Toggle */}
          <button
            onClick={() => setFlagsOnly(!flagsOnly)}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 border ${
              flagsOnly
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Show Flagged Anomalies Only</span>
          </button>
        </div>

        <div className="text-stone-400 font-medium">
          Showing {visitsToDisplay.length} visits
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Visit ID & Date</th>
                <th className="py-3 px-3">Field Assistant</th>
                <th className="py-3 px-3">Farmer & Location</th>
                <th className="py-3 px-3">Crop & Stage</th>
                <th className="py-3 px-3">Duration & Km</th>
                <th className="py-3 px-3">Service & Sales</th>
                <th className="py-3 px-3">Flags</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {visitsToDisplay.map((visit) => (
                <tr
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className="hover:bg-emerald-50/40 cursor-pointer transition"
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900 font-mono">{visit.id}</div>
                    <div className="text-[10px] text-stone-400">{visit.startTime}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900">{visit.faName}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{visit.faId}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-800">{visit.farmerName}</div>
                    <div className="text-[10px] text-stone-500">{visit.village}, {visit.district}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-900">{visit.crop}</div>
                    <div className="text-[10px] text-[#0B7A3B]">{visit.cropStage} (DAS {visit.daysAfterSowing})</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-stone-800">{visit.durationMinutes}m</div>
                    <div className="text-[10px] text-stone-400 font-mono">{visit.distanceKm} km</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-stone-800">{visit.valueAddedService}</div>
                    {visit.totalSaleAmount > 0 && (
                      <div className="text-[10px] font-bold text-emerald-700">₹{visit.totalSaleAmount}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {visit.flags.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{visit.flags.length} Flag{visit.flags.length > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-medium">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-xs font-bold text-[#0B7A3B] hover:underline">
                      Inspect →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER MODAL */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-start justify-between bg-stone-50">
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400">
                  {selectedVisit.id}
                </span>
                <h2 className="text-base font-bold text-stone-900">
                  {selectedVisit.farmerName} · {selectedVisit.crop} Farm Visit
                </h2>
                <p className="text-xs text-stone-500">
                  Conducted by {selectedVisit.faName} ({selectedVisit.faId}) on {selectedVisit.startTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1 rounded-full hover:bg-stone-200 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Flag Alerts if any */}
              {selectedVisit.flags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Detected Quality / Vigilance Flags ({selectedVisit.flags.length})</span>
                  </h3>
                  {selectedVisit.flags.map((flg) => (
                    <div key={flg.id} className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold font-mono text-rose-800">{flg.type}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900">
                          {flg.severity}
                        </span>
                      </div>
                      <p className="text-stone-700 leading-snug">{flg.description}</p>
                      
                      <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                        <span className="text-[10px] text-stone-400">Status: {flg.reviewStatus}</span>
                        <div className="ml-auto flex gap-1.5">
                          <button
                            onClick={() => handleReviewFlag(flg.id, 'FALSE_POSITIVE')}
                            className="px-2 py-1 rounded bg-white border border-stone-300 text-[10px] font-bold text-stone-700 hover:bg-stone-50"
                          >
                            False Positive
                          </button>
                          <button
                            onClick={() => handleReviewFlag(flg.id, 'RESOLVED_VALID')}
                            className="px-2 py-1 rounded bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleReviewFlag(flg.id, 'ESCALATED')}
                            className="px-2 py-1 rounded bg-rose-600 text-[10px] font-bold text-white hover:bg-rose-700"
                          >
                            Escalate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Geo-Stamped Images */}
              <div>
                <h3 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#0B7A3B]" />
                  <span>Geo-Stamped Photo Evidence</span>
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Field Photo */}
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative group aspect-video">
                    <img
                      src={selectedVisit.photos.fieldPhoto}
                      alt="Field inspection"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-1.5 text-[8px] text-white font-mono">
                      <span>Field Canopy</span>
                      <span>GPS: 17.7124°N, 77.9628°E</span>
                    </div>
                  </div>

                  {/* Prescription Photo */}
                  {selectedVisit.photos.prescriptionPhoto && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative group aspect-video">
                      <img
                        src={selectedVisit.photos.prescriptionPhoto}
                        alt="Prescription slip"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-1.5 text-[8px] text-white font-mono">
                        <span>Advisory Prescription</span>
                        <span>Digitally Signed</span>
                      </div>
                    </div>
                  )}

                  {/* Receipt Photo */}
                  {selectedVisit.photos.receiptPhoto && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative group aspect-video">
                      <img
                        src={selectedVisit.photos.receiptPhoto}
                        alt="Product receipt"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-1.5 text-[8px] text-white font-mono">
                        <span>Sale Receipt (₹{selectedVisit.totalSaleAmount})</span>
                        <span>Verified</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis & Prescription */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block uppercase">Field Diagnosis</span>
                  <p className="font-semibold text-stone-800 mt-0.5">{selectedVisit.diagnosis}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block uppercase">Prescribed Treatment</span>
                  <p className="text-emerald-900 font-medium mt-0.5">{selectedVisit.prescriptionText}</p>
                </div>
              </div>

              {/* Products Sold Breakdown */}
              {selectedVisit.productsSold.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#0B7A3B]" />
                    <span>Inputs Purchased During Visit</span>
                  </h3>
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-500 text-[10px]">
                        <tr>
                          <th className="p-2">Product</th>
                          <th className="p-2">Pack</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {selectedVisit.productsSold.map((p, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-stone-800">{p.productName}</td>
                            <td className="p-2 text-stone-600">{p.packSize}</td>
                            <td className="p-2 text-stone-700">{p.quantity}</td>
                            <td className="p-2 text-right font-bold text-emerald-800">₹{p.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Video Link if any */}
              {selectedVisit.videoUrl && (
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                  <div className="text-sky-900 font-semibold">Field Scouting Video Attached</div>
                  <a
                    href={selectedVisit.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 flex items-center gap-1 text-[11px]"
                  >
                    <span>Watch Video</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
