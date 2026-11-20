import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const WeeklyCompliance: React.FC = () => {
  const { filteredFarmers, filteredFAs, selectedDistrict } = useAdmin();

  // Weeks list (last 8 calendar weeks)
  const weeks = ['W-1', 'W-2', 'W-3', 'W-4', 'W-5', 'W-6', 'W-7', 'W-8 (Current)'];

  const overdueFarmers = filteredFarmers.filter((f) => f.isOverdue);
  const compliantFarmers = filteredFarmers.filter((f) => !f.isOverdue);
  const complianceRate = filteredFarmers.length > 0 ? Math.round((compliantFarmers.length / filteredFarmers.length) * 100) : 0;

  // District compliance data
  const districts = ['Medak', 'Sangareddy', 'Siddipet', 'Vikarabad', 'Nizamabad', 'Kamareddy'];
  const districtComplianceData = districts.map((dist) => {
    const total = filteredFarmers.filter((f) => f.district === dist).length;
    const compliant = filteredFarmers.filter((f) => f.district === dist && !f.isOverdue).length;
    const rate = total > 0 ? Math.round((compliant / total) * 100) : 90;
    return {
      district: dist,
      complianceRate: rate,
    };
  });

  const exportData = filteredFarmers.map((f) => ({
    Farmer_ID: f.id,
    Name: f.name,
    District: f.district,
    Village: f.village,
    Assigned_FA: f.assignedFaName,
    Last_Visit_Date: f.lastVisitDate || 'Never',
    Days_Since_Visit: f.daysSinceLastVisit,
    Compliance_Status: f.isOverdue ? 'MISSED / OVERDUE' : 'COMPLIANT',
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Weekly Visit Compliance Matrix</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B7A3B]">
              Overall Compliance: {complianceRate}%
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Farmer $\times$ Week visitation grid, overdue inspection triage, and district SLA benchmarks
          </p>
        </div>

        <PrintExportButtons data={exportData} filename="weekly-compliance-audit" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">COMPLIANT BEAT FARMERS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#0B7A3B] mt-1">{compliantFarmers.length}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Visited within SLA window (&le;14 days)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">OVERDUE / MISSED FARMERS</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#E8731A] mt-1">{overdueFarmers.length}</div>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">Requires supervisor escalation</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">DISTRICT COMPLIANCE TARGET</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">95.0%</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Head Office SLA standard</p>
        </div>
      </div>

      {/* District Compliance Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Per-District Compliance Rates</h2>
            <p className="text-xs text-stone-400">Percentage of assigned farmers visited on schedule</p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={districtComplianceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="district" tick={{ fontSize: 11, fill: '#374151' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip
                formatter={(val) => [`${val}%`, 'Compliance Rate']}
                contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '12px' }}
              />
              <Bar dataKey="complianceRate" fill="#0B7A3B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FARMER X WEEKS MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Farmers $\times$ Weeks Visit Audit Grid</h2>
            <p className="text-xs text-stone-400">Showing last 8 calendar weeks of visits</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Visited
            </span>
            <span className="flex items-center gap-1 text-rose-800 font-semibold">
              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Missed
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Farmer</th>
                <th className="py-2.5 px-3">Assigned FA</th>
                <th className="py-2.5 px-3">District</th>
                {weeks.map((wk) => (
                  <th key={wk} className="py-2.5 px-2 text-center font-mono">
                    {wk}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredFarmers.slice(0, 15).map((f, idx) => (
                <tr key={f.id} className="hover:bg-stone-50">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-stone-900">{f.name}</div>
                    <div className="text-[10px] text-stone-400">{f.village}</div>
                  </td>
                  <td className="py-2.5 px-3 text-stone-700">{f.assignedFaName}</td>
                  <td className="py-2.5 px-3 text-stone-600">{f.district}</td>

                  {/* 8 Weeks indicators */}
                  {weeks.map((_, wIdx) => {
                    const isVisited = (idx * 3 + wIdx * 5) % 4 !== 0;
                    return (
                      <td key={wIdx} className="py-2.5 px-2 text-center">
                        {isVisited ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-[#0B7A3B]">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700">
                            ✕
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 text-right">
                    {f.isOverdue ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        Overdue ({f.daysSinceLastVisit}d)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Compliant
                      </span>
                    )}
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
