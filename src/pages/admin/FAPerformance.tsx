import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FieldAssistant, AdminFarmer, AdminVisit } from '../../types/admin';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  Award,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Eye,
  UserX,
  UserCheck,
  RefreshCw,
  X,
  Calendar,
  MapPin,
  Phone,
  ShieldAlert,
  Battery,
  ShoppingBag,
  Clock,
  Sparkles,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sprout,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const FAPerformance: React.FC = () => {
  const {
    filteredFAs,
    farmers,
    filteredFarmers,
    visits,
    updateFA,
    deactivateFA,
    replaceFA,
    bulkReassignFarmers,
    fas,
  } = useAdmin();

  // Primary Page Mode Toggle
  const [activeMainView, setActiveMainView] = useState<'LEADERBOARD' | 'FARMERS_BEAT'>('LEADERBOARD');

  // --- LEADERBOARD STATE ---
  const [sortField, setSortField] = useState<keyof FieldAssistant>('qualityScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedFA, setSelectedFA] = useState<FieldAssistant | null>(null);
  const [activeFaDrawerTab, setActiveFaDrawerTab] = useState<'OVERVIEW' | 'FARMERS' | 'VISITS' | 'HANDOVER'>('OVERVIEW');
  const [compareFAIds, setCompareFAIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [replacementName, setReplacementName] = useState('');
  const [replacementPhone, setReplacementPhone] = useState('+91 90000 000');

  // --- FARMERS MASTER & BEAT REASSIGNMENT STATE ---
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<string[]>([]);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [targetFaId, setTargetFaId] = useState<string>(fas[0]?.id || '');
  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState<AdminFarmer | null>(null);

  // Compute FA aggregated metrics
  const faMetrics = filteredFAs.map((fa) => {
    const faVisits = visits.filter((v) => v.faId === fa.id);
    const faFarmers = farmers.filter((f) => f.assignedFaId === fa.id);

    const uniqueFarmersVisited = new Set(faVisits.map((v) => v.farmerId)).size;
    const totalKm = faVisits.reduce((acc, v) => acc + v.distanceKm, 0);
    const avgDuration =
      faVisits.length > 0
        ? Math.round(faVisits.reduce((acc, v) => acc + v.durationMinutes, 0) / faVisits.length)
        : 0;

    const totalSales = faVisits.reduce((acc, v) => acc + v.totalSaleAmount, 0);
    const flagsCount = faVisits.reduce((acc, v) => acc + v.flags.length, 0);

    const nonOverdue = faFarmers.filter((f) => !f.isOverdue).length;
    const weeklyCompliance = faFarmers.length > 0 ? Math.round((nonOverdue / faFarmers.length) * 100) : 100;
    const missedVisits = faFarmers.filter((f) => f.isOverdue).length;

    const verified = faFarmers.filter((f) => f.registrationStatus === 'VERIFIED').length;
    const verificationRate = faFarmers.length > 0 ? Math.round((verified / faFarmers.length) * 100) : 0;

    return {
      ...fa,
      visitsCount: faVisits.length,
      uniqueFarmersVisited,
      totalKm: parseFloat(totalKm.toFixed(1)),
      avgDuration,
      totalSales,
      flagsCount,
      weeklyCompliance,
      missedVisits,
      verificationRate,
    };
  });

  // Sort FAs
  const sortedMetrics = [...faMetrics].sort((a: any, b: any) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: keyof FieldAssistant) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleCompare = (id: string) => {
    if (compareFAIds.includes(id)) {
      setCompareFAIds(compareFAIds.filter((item) => item !== id));
    } else {
      if (compareFAIds.length < 3) {
        setCompareFAIds([...compareFAIds, id]);
      } else {
        alert('You can compare a maximum of 3 Field Assistants simultaneously.');
      }
    }
  };

  const comparedFAs = faMetrics.filter((fa) => compareFAIds.includes(fa.id));

  // --- Farmers Master Filtering & Selection ---
  const displayedFarmers = filteredFarmers.filter((f) => {
    if (overdueOnly && !f.isOverdue) return false;
    if (selectedCrop !== 'ALL' && f.crop !== selectedCrop) return false;
    if (farmerSearch) {
      const q = farmerSearch.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.assignedFaName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectAllFarmers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFarmerIds(displayedFarmers.map((f) => f.id));
    } else {
      setSelectedFarmerIds([]);
    }
  };

  const toggleSelectFarmer = (id: string) => {
    if (selectedFarmerIds.includes(id)) {
      setSelectedFarmerIds(selectedFarmerIds.filter((item) => item !== id));
    } else {
      setSelectedFarmerIds([...selectedFarmerIds, id]);
    }
  };

  const handleExecuteReassign = () => {
    if (!targetFaId || selectedFarmerIds.length === 0) return;
    bulkReassignFarmers(selectedFarmerIds, targetFaId);
    setSelectedFarmerIds([]);
    setIsReassignModalOpen(false);
  };

  // CSV Data Exports
  const leaderboardExportData = sortedMetrics.map((fa) => ({
    FA_ID: fa.id,
    Name: fa.name,
    District: fa.district,
    Quality_Score: fa.qualityScore,
    Visits: fa.visitsCount,
    Unique_Farmers: fa.uniqueFarmersVisited,
    Compliance_Pct: `${fa.weeklyCompliance}%`,
    Missed_Visits: fa.missedVisits,
    Avg_Duration_Mins: fa.avgDuration,
    Km_Travelled: fa.totalKm,
    Verified_Farmers_Pct: `${fa.verificationRate}%`,
    Total_Sales_INR: fa.totalSales,
  }));

  const farmersExportData = displayedFarmers.map((f) => ({
    Farmer_ID: f.id,
    Name: f.name,
    Phone: f.phone,
    Village: f.village,
    Mandal: f.mandal,
    District: f.district,
    Crop: f.crop,
    Crop_Variety: f.cropVariety,
    Acreage: f.acreage,
    Assigned_FA: f.assignedFaName,
    Registration_Status: f.registrationStatus,
    Last_Visit_Date: f.lastVisitDate || 'Never',
    Is_Overdue: f.isOverdue ? 'YES' : 'NO',
  }));

  return (
    <div className="space-y-6">
      {/* Top Header & Dual Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-[#0B7A3B]" />
            <span>Field Assistant Performance & Beat Operations</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Evaluate field staff velocity, compare metrics side-by-side, and manage farmer beat assignments.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveMainView('LEADERBOARD')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMainView === 'LEADERBOARD'
                ? 'bg-white text-[#0B7A3B] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>FA Performance & Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveMainView('FARMERS_BEAT')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMainView === 'FARMERS_BEAT'
                ? 'bg-white text-[#0B7A3B] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Farmers Master & Beat Reassignment</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#0B7A3B]">
              {farmers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: FA PERFORMANCE & LEADERBOARD                        */}
      {/* ============================================================ */}
      {activeMainView === 'LEADERBOARD' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Header for Leaderboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Active Roster:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-[#0B7A3B]">
                {sortedMetrics.length} Field Assistants
              </span>
            </div>

            <div className="flex items-center gap-3">
              {compareFAIds.length > 1 && (
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0B7A3B] text-white hover:bg-[#086330] rounded-xl shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compare ({compareFAIds.length}) FAs</span>
                </button>
              )}
              <PrintExportButtons data={leaderboardExportData} filename="fa-performance-leaderboard" />
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-3 w-8">Comp.</th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        <span>Field Assistant</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('district')}>
                      <div className="flex items-center gap-1">
                        <span>District</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('qualityScore')}>
                      <div className="flex items-center gap-1">
                        <span>Quality Score</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Visits</th>
                    <th className="py-3 px-3">Unique Farmers</th>
                    <th className="py-3 px-3">Compliance</th>
                    <th className="py-3 px-3">Missed</th>
                    <th className="py-3 px-3">Avg Duration</th>
                    <th className="py-3 px-3">Km Travelled</th>
                    <th className="py-3 px-3">Verified %</th>
                    <th className="py-3 px-3">Sales (₹)</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {sortedMetrics.map((fa, i) => {
                    const isTop3 = i < 3;
                    const isSelectedForCompare = compareFAIds.includes(fa.id);

                    return (
                      <tr
                        key={fa.id}
                        className="hover:bg-emerald-50/40 transition cursor-pointer"
                        onClick={() => {
                          setSelectedFA(fa);
                          setActiveFaDrawerTab('OVERVIEW');
                        }}
                      >
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelectedForCompare}
                            onChange={() => toggleCompare(fa.id)}
                            className="rounded text-[#0B7A3B] focus:ring-[#0B7A3B] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {isTop3 && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                            <div>
                              <div className="font-bold text-stone-900">{fa.name}</div>
                              <div className="text-[10px] text-stone-400 font-mono">{fa.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-stone-700">{fa.district}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                              fa.qualityScore >= 90
                                ? 'bg-emerald-100 text-[#0B7A3B]'
                                : fa.qualityScore >= 75
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {fa.qualityScore}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-800">{fa.visitsCount}</td>
                        <td className="py-3 px-3 text-stone-700">{fa.uniqueFarmersVisited}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold ${
                              fa.weeklyCompliance >= 90
                                ? 'text-[#0B7A3B]'
                                : fa.weeklyCompliance >= 70
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {fa.weeklyCompliance}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {fa.missedVisits > 0 ? (
                            <span className="text-rose-600 font-bold">{fa.missedVisits}</span>
                          ) : (
                            <span className="text-stone-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-stone-700">{fa.avgDuration} min</td>
                        <td className="py-3 px-3 text-stone-700">{fa.totalKm} km</td>
                        <td className="py-3 px-3 font-bold text-stone-800">{fa.verificationRate}%</td>
                        <td className="py-3 px-3 font-bold text-stone-900">₹{fa.totalSales.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedFA(fa);
                              setActiveFaDrawerTab('OVERVIEW');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0B7A3B] hover:bg-emerald-50 rounded-lg transition"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: FARMERS MASTER & BEAT REASSIGNMENT                   */}
      {/* ============================================================ */}
      {activeMainView === 'FARMERS_BEAT' && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search farmer, phone, village..."
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B7A3B] bg-stone-50"
                />
              </div>

              {/* Crop Filter */}
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="text-xs border border-stone-200 rounded-xl px-3 py-1.5 bg-stone-50 font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
              >
                <option value="ALL">All Crops</option>
                <option value="Cotton">Cotton</option>
                <option value="Chilli">Chilli</option>
                <option value="Paddy">Paddy</option>
                <option value="Maize">Maize</option>
                <option value="Redgram">Redgram</option>
              </select>

              {/* Overdue Toggle */}
              <button
                onClick={() => setOverdueOnly(!overdueOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  overdueOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Overdue (&gt;14d)</span>
              </button>
            </div>

            {/* Bulk Action & Export */}
            <div className="flex items-center gap-3">
              {selectedFarmerIds.length > 0 && (
                <button
                  onClick={() => setIsReassignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#E8731A] text-white hover:bg-[#c96012] rounded-xl shadow-xs transition animate-pulse"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Reassign Beat ({selectedFarmerIds.length})</span>
                </button>
              )}
              <PrintExportButtons data={farmersExportData} filename="farmers-master-beat-roster" />
            </div>
          </div>

          {/* Farmers Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          displayedFarmers.length > 0 && selectedFarmerIds.length === displayedFarmers.length
                        }
                        onChange={handleSelectAllFarmers}
                        className="rounded text-[#0B7A3B] focus:ring-[#0B7A3B] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Farmer</th>
                    <th className="py-3 px-3">Village / Mandal</th>
                    <th className="py-3 px-3">District</th>
                    <th className="py-3 px-3">Crop / Area</th>
                    <th className="py-3 px-3">Assigned Beat FA</th>
                    <th className="py-3 px-3">Profile Status</th>
                    <th className="py-3 px-3">Last Visited</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {displayedFarmers.map((f) => {
                    const isSelected = selectedFarmerIds.includes(f.id);
                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-emerald-50/40 transition cursor-pointer"
                        onClick={() => setSelectedFarmerDetail(f)}
                      >
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectFarmer(f.id)}
                            className="rounded text-[#0B7A3B] focus:ring-[#0B7A3B] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900">{f.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{f.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-stone-800">{f.village}</div>
                          <div className="text-[10px] text-stone-400">{f.mandal}</div>
                        </td>
                        <td className="py-3 px-3 text-stone-700">{f.district}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-800">{f.crop}</div>
                          <div className="text-[10px] text-stone-500">
                            {f.cropVariety} • {f.acreage} ac
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#0B7A3B]">{f.assignedFaName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              f.registrationStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {f.registrationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div>{f.lastVisitDate || 'Never'}</div>
                          {f.isOverdue && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 mt-0.5">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedFarmerDetail(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0B7A3B] hover:bg-emerald-50 rounded-lg transition"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: BULK REASSIGN BEAT / FA                               */}
      {/* ============================================================ */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-stone-900 text-base">Reassign Farmer Beat Territory</h3>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                You have selected <strong>{selectedFarmerIds.length} farmers</strong>. Transferring them will
                update their primary assigned Field Assistant immediately without disrupting past visit history.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Assign To Field Assistant
                </label>
                <select
                  value={targetFaId}
                  onChange={(e) => setTargetFaId(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50 focus:ring-2 focus:ring-[#0B7A3B]"
                >
                  {fas
                    .filter((f) => f.isActive)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.id}) — {f.district}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReassign}
                className="px-4 py-2 bg-[#0B7A3B] hover:bg-[#086330] text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DRAWER: FA PROFILE & DETAIL                                  */}
      {/* ============================================================ */}
      {selectedFA && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0B7A3B] font-bold flex items-center justify-center text-sm">
                  {selectedFA.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-stone-900 leading-tight">{selectedFA.name}</h2>
                  <div className="text-xs text-stone-500 font-mono">
                    {selectedFA.id} • {selectedFA.district} District
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFA(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-stone-200 px-5 text-xs font-bold bg-white">
              <button
                onClick={() => setActiveFaDrawerTab('OVERVIEW')}
                className={`py-3 px-3 border-b-2 transition ${
                  activeFaDrawerTab === 'OVERVIEW'
                    ? 'border-[#0B7A3B] text-[#0B7A3B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveFaDrawerTab('FARMERS')}
                className={`py-3 px-3 border-b-2 transition ${
                  activeFaDrawerTab === 'FARMERS'
                    ? 'border-[#0B7A3B] text-[#0B7A3B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Assigned Beat ({farmers.filter((f) => f.assignedFaId === selectedFA.id).length})
              </button>
              <button
                onClick={() => setActiveFaDrawerTab('VISITS')}
                className={`py-3 px-3 border-b-2 transition ${
                  activeFaDrawerTab === 'VISITS'
                    ? 'border-[#0B7A3B] text-[#0B7A3B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Visit History ({visits.filter((v) => v.faId === selectedFA.id).length})
              </button>
              <button
                onClick={() => setActiveFaDrawerTab('HANDOVER')}
                className={`py-3 px-3 border-b-2 transition ${
                  activeFaDrawerTab === 'HANDOVER'
                    ? 'border-[#0B7A3B] text-[#0B7A3B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Handover & Deactivate
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {activeFaDrawerTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-stone-400 font-bold uppercase text-[10px]">Quality Score</div>
                      <div className="text-2xl font-black text-[#0B7A3B] mt-0.5">
                        {selectedFA.qualityScore} / 100
                      </div>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-stone-400 font-bold uppercase text-[10px]">Territory Mandal</div>
                      <div className="text-sm font-black text-stone-800 mt-1">{selectedFA.mandal}</div>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-stone-400 font-bold uppercase text-[10px]">Handset Model</div>
                      <div className="text-xs font-semibold text-stone-800 mt-1">{selectedFA.deviceModel}</div>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-stone-400 font-bold uppercase text-[10px]">App Version</div>
                      <div className="text-xs font-mono font-bold text-stone-800 mt-1">
                        {selectedFA.appVersion}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFaDrawerTab === 'FARMERS' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-stone-500">Farmers Allotted</h3>
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 font-bold text-stone-500 text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Village</th>
                          <th className="p-2.5">Crop</th>
                          <th className="p-2.5">Profile</th>
                          <th className="p-2.5">Last Visited</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {farmers
                          .filter((f) => f.assignedFaId === selectedFA.id)
                          .map((frm) => (
                            <tr key={frm.id} className="hover:bg-stone-50">
                              <td className="p-2.5 font-bold text-stone-800">{frm.name}</td>
                              <td className="p-2.5 text-stone-600">{frm.village}</td>
                              <td className="p-2.5 text-stone-700">
                                {frm.crop} ({frm.acreage} ac)
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    frm.registrationStatus === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {frm.registrationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-2.5 text-stone-500">{frm.lastVisitDate || 'Never'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeFaDrawerTab === 'VISITS' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-stone-500">Recent Visits</h3>
                  <div className="space-y-2">
                    {visits
                      .filter((v) => v.faId === selectedFA.id)
                      .slice(0, 8)
                      .map((v) => (
                        <div key={v.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-stone-900">{v.farmerName}</div>
                              <div className="text-[10px] text-stone-500">
                                {v.village} • {v.crop} ({v.cropStage})
                              </div>
                            </div>
                            <div className="text-right text-[10px] text-stone-400">
                              {new Date(v.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeFaDrawerTab === 'HANDOVER' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="font-bold text-amber-900 text-sm">Territory Handover</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Reassign all {selectedFA.assignedFarmersCount} farmers to a new Field Assistant and deactivate
                    this account.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-amber-900 mb-1">
                      Successor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B. Narendar"
                      value={replacementName}
                      onChange={(e) => setReplacementName(e.target.value)}
                      className="w-full text-xs border border-amber-300 rounded-xl p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-amber-900 mb-1">
                      Successor Phone
                    </label>
                    <input
                      type="text"
                      value={replacementPhone}
                      onChange={(e) => setReplacementPhone(e.target.value)}
                      className="w-full text-xs border border-amber-300 rounded-xl p-2 bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!replacementName) return alert('Enter successor name');
                      replaceFA(selectedFA.id, replacementName, replacementPhone);
                      setSelectedFA(null);
                      alert('Territory handover executed successfully!');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
                  >
                    Execute Handover & Reassign All Farmers
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: 2-3 FA SIDE-BY-SIDE COMPARISON                        */}
      {/* ============================================================ */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0B7A3B]" />
                <h3 className="font-black text-stone-900 text-base">Field Assistant Comparison Tool</h3>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 my-6">
              {comparedFAs.map((fa) => (
                <div key={fa.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 text-xs">
                  <div>
                    <div className="font-black text-sm text-stone-900">{fa.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {fa.id} • {fa.district}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <div className="text-stone-400 text-[10px] uppercase font-bold">Quality Score</div>
                    <div className="text-xl font-black text-[#0B7A3B]">{fa.qualityScore} / 100</div>
                  </div>
                  <div className="space-y-1 text-stone-600">
                    <div className="flex justify-between">
                      <span>Total Visits:</span>
                      <strong>{fa.visitsCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Farmers:</span>
                      <strong>{fa.uniqueFarmersVisited}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance:</span>
                      <strong>{fa.weeklyCompliance}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Km Travelled:</span>
                      <strong>{fa.totalKm} km</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales Booked:</span>
                      <strong>₹{fa.totalSales.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-200">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
