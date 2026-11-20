import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Filter,
  Search,
} from 'lucide-react';

export const DataQualityFraud: React.FC = () => {
  const { visits, updateVisitFlagStatus } = useAdmin();

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED_VALID' | 'FALSE_POSITIVE' | 'ESCALATED'>('PENDING');

  // Extract all flags flattened across visits
  const allFlags = visits.flatMap((v) =>
    v.flags.map((f) => ({
      ...f,
      visitId: v.id,
      faName: v.faName,
      faId: v.faId,
      farmerName: v.farmerName,
      district: v.district,
      village: v.village,
      visitTime: v.startTime,
    }))
  );

  const filteredFlags = allFlags.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && f.reviewStatus !== statusFilter) return false;
    return true;
  });

  const criticalCount = allFlags.filter((f) => f.severity === 'CRITICAL' && f.reviewStatus === 'PENDING').length;
  const highCount = allFlags.filter((f) => f.severity === 'HIGH' && f.reviewStatus === 'PENDING').length;
  const pendingCount = allFlags.filter((f) => f.reviewStatus === 'PENDING').length;

  const handleAction = (visitId: string, flagId: string, status: any) => {
    updateVisitFlagStatus(visitId, flagId, status);
    alert(`Flag action marked as: ${status}`);
  };

  const exportData = filteredFlags.map((f) => ({
    Flag_ID: f.id,
    Type: f.type,
    Severity: f.severity,
    Description: f.description,
    Visit_ID: f.visitId,
    Field_Assistant: f.faName,
    Farmer_Name: f.farmerName,
    District: f.district,
    Review_Status: f.reviewStatus,
    Detected_At: f.detectedAt,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Data Quality, Anomaly & Vigilance Console</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
              {pendingCount} Pending Reviews
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Automated detection algorithms flagging visit falsification, GPS jumping, ghost inspections & protocol skips
          </p>
        </div>

        <PrintExportButtons data={exportData} filename="data-quality-anomalies" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">CRITICAL FRAUD ALERTS</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{criticalCount} Flags</div>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5">GPS jumps & velocity impossible hops</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">HIGH SEVERITY</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{highCount} Flags</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Short visits (&lt;10 mins) & missing consent</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">TOTAL DETECTED ANOMALIES</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{allFlags.length} Flags</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Across last 90 calendar days</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">DATA INTEGRITY SCORE</span>
          <div className="text-2xl font-black text-[#0B7A3B] mt-1">94.8%</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Clean inspection ratio</p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Review Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="RESOLVED_VALID">Resolved Valid</option>
              <option value="FALSE_POSITIVE">False Positive</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
        </div>

        <span className="text-stone-400 font-medium">{filteredFlags.length} flags found</span>
      </div>

      {/* Flags Audit Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-semibold">
              <tr>
                <th className="p-3">Severity & Type</th>
                <th className="p-3">Detected Issue Description</th>
                <th className="p-3">Field Assistant</th>
                <th className="p-3">Farmer & Visit ID</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Review Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredFlags.map((flg) => (
                <tr key={flg.id} className="hover:bg-stone-50">
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        flg.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : flg.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {flg.severity}
                    </span>
                    <div className="font-mono text-stone-800 font-bold mt-1">{flg.type}</div>
                  </td>
                  <td className="p-3 max-w-xs text-stone-700 leading-snug">
                    {flg.description}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-stone-900">{flg.faName}</div>
                    <div className="text-[10px] text-stone-400">{flg.district} · {flg.faId}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-stone-800">{flg.farmerName}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{flg.visitId}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        flg.reviewStatus === 'RESOLVED_VALID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : flg.reviewStatus === 'FALSE_POSITIVE'
                          ? 'bg-stone-100 text-stone-600'
                          : flg.reviewStatus === 'ESCALATED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {flg.reviewStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAction(flg.visitId, flg.id, 'FALSE_POSITIVE')}
                        className="px-2 py-1 rounded bg-stone-100 text-stone-700 text-[10px] font-bold hover:bg-stone-200 transition"
                      >
                        False Positive
                      </button>
                      <button
                        onClick={() => handleAction(flg.visitId, flg.id, 'RESOLVED_VALID')}
                        className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleAction(flg.visitId, flg.id, 'ESCALATED')}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition"
                      >
                        Escalate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
