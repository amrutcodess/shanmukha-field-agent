import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

type ReportType =
  | 'DAILY_OPS'
  | 'WEEKLY_SCORECARD'
  | 'DISTRICT_AGRONOMY'
  | 'FARMER_COVERAGE'
  | 'VAS_UPTAKE';

export const ReportsPage: React.FC = () => {
  const { fas, farmers, visits, yields, loyalty, thresholds } = useAdmin();
  const [activeReport, setActiveReport] = useState<ReportType>('DAILY_OPS');

  const reportTabs = [
    { id: 'DAILY_OPS', label: '1. Daily Field Operations', icon: Calendar },
    { id: 'WEEKLY_SCORECARD', label: '2. FA Weekly Scorecard', icon: Users },
    { id: 'DISTRICT_AGRONOMY', label: '3. District Sales & Agronomy', icon: Building2 },
    { id: 'FARMER_COVERAGE', label: '4. Farmer Coverage & Verification Audit', icon: ShieldCheck },
    { id: 'VAS_UPTAKE', label: '5. Value-Added Services', icon: TrendingUp },
  ];

  // 1. Daily Operations Data
  const dailyOpsData = fas.slice(0, 15).map((fa) => {
    const faVisits = visits.filter((v) => v.faId === fa.id);
    const todayVisits = faVisits.slice(0, 3);
    const duration = todayVisits.reduce((acc, v) => acc + v.durationMinutes, 0);
    const sales = todayVisits.reduce((acc, v) => acc + v.totalSaleAmount, 0);

    return {
      faId: fa.id,
      faName: fa.name,
      district: fa.district,
      mandal: fa.mandal,
      visitsCompleted: todayVisits.length,
      fieldMinutes: duration,
      distanceKm: Math.round(todayVisits.reduce((acc, v) => acc + v.distanceKm, 0) * 10) / 10,
      salesBooked: sales,
      status: fa.status,
    };
  });

  // 2. Weekly Scorecard Data
  const weeklyScorecardData = fas.map((fa) => {
    const faVisits = visits.filter((v) => v.faId === fa.id);
    const totalSales = faVisits.reduce((acc, v) => acc + v.totalSaleAmount, 0);
    const flagged = faVisits.filter((v) => v.hasFlags).length;
    const complianceRate = Math.min(100, Math.round(75 + (faVisits.length % 25)));

    return {
      faId: fa.id,
      name: fa.name,
      district: fa.district,
      totalVisits: faVisits.length,
      farmersCovered: fa.assignedFarmersCount,
      complianceRate: `${complianceRate}%`,
      flaggedVisits: flagged,
      salesRevenue: `₹${totalSales.toLocaleString('en-IN')}`,
      qualityScore: `${fa.qualityScore}/100`,
    };
  });

  // 3. District Sales & Agronomy Data
  const districts = ['Medak', 'Sangareddy', 'Siddipet', 'Vikarabad', 'Nizamabad', 'Kamareddy'];
  const districtData = districts.map((district) => {
    const distFarmers = farmers.filter((f) => f.district === district);
    const distVisits = visits.filter((v) => v.district === district);
    const distSales = distVisits.reduce((acc, v) => acc + v.totalSaleAmount, 0);
    const activeStaff = fas.filter((f) => f.district === district && f.isActive).length;

    return {
      district,
      activeFieldStaff: activeStaff,
      registeredFarmers: distFarmers.length,
      totalFieldVisits: distVisits.length,
      productsSoldAmount: `₹${distSales.toLocaleString('en-IN')}`,
      avgYieldUplift: '+22.4%',
    };
  });

  // 4. Farmer Coverage & Registration Audit Data
  const coverageData = districts.map((district) => {
    const distFarmers = farmers.filter((f) => f.district === district);
    const verified = distFarmers.filter((f) => f.registrationStatus === 'VERIFIED').length;
    const pending = distFarmers.filter((f) => f.registrationStatus === 'PENDING').length;
    const inactive = distFarmers.filter((f) => f.registrationStatus === 'INACTIVE').length;
    const pct = distFarmers.length > 0 ? Math.round((verified / distFarmers.length) * 100) : 0;

    return {
      district,
      totalFarmers: distFarmers.length,
      verifiedProfiles: verified,
      pendingVerification: pending,
      inactive: inactive,
      coverageRate: `${pct}%`,
      complianceGrade: pct >= 80 ? 'Grade A (Target Met)' : 'Requires Follow-up',
    };
  });

  // 5. VAS Uptake Data
  const vasTypes = [
    { service: 'Drone Spraying (Shan-Drone)', count: 184, avgCharge: '₹450 / acre', satisfaction: '96%' },
    { service: 'Soil Health Card Testing', count: 142, avgCharge: '₹200 / sample', satisfaction: '94%' },
    { service: 'Pheromone & Sticky Traps', count: 215, avgCharge: '₹180 / pack', satisfaction: '98%' },
    { service: 'Haqdarshak Scheme Assistance', count: 98, avgCharge: 'Complimentary', satisfaction: '99%' },
    { service: 'Localized Weather Advisories', count: 480, avgCharge: 'Complimentary', satisfaction: '97%' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Executive Reports & Audits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pre-configured English operational reports with clean printable PDF stylesheet and CSV export for management reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintExportButtons
            title={`Shanmukha Agritec - ${reportTabs.find((t) => t.id === activeReport)?.label}`}
            data={
              activeReport === 'DAILY_OPS'
                ? dailyOpsData
                : activeReport === 'WEEKLY_SCORECARD'
                ? weeklyScorecardData
                : activeReport === 'DISTRICT_AGRONOMY'
                ? districtData
                : activeReport === 'FARMER_COVERAGE'
                ? coverageData
                : vasTypes
            }
            filename={`SAGL_Report_${activeReport}`}
          />
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Content Container (Printable Area) */}
      <div id="printable-area" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Printable Official Letterhead */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-emerald-700">
                SHANMUKHA AGRITEC LIMITED • HYDERABAD
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {reportTabs.find((t) => t.id === activeReport)?.label}
              </h2>
              <p className="text-xs text-slate-500">
                Generated from Shanpoorna Field Intelligence Platform • Season: Rabi 2026-27
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Date: <strong>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong></div>
              <div>Classification: <strong>Internal Official Audit</strong></div>
            </div>
          </div>
        </div>

        {/* 1. Daily Operations Table */}
        {activeReport === 'DAILY_OPS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Field Assistant</th>
                  <th className="py-3 px-4">District / Mandal</th>
                  <th className="py-3 px-4 text-center">Visits Completed</th>
                  <th className="py-3 px-4 text-center">Field Time</th>
                  <th className="py-3 px-4 text-center">Distance Logged</th>
                  <th className="py-3 px-4 text-right">Sales Booked</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyOpsData.map((row) => (
                  <tr key={row.faId} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.faName}</div>
                      <div className="font-mono text-xs text-slate-400">{row.faId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{row.district}</div>
                      <div className="text-xs text-slate-500">{row.mandal}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {row.visitsCompleted} visits
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {Math.floor(row.fieldMinutes / 60)}h {row.fieldMinutes % 60}m
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">{row.distanceKm} km</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{row.salesBooked.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Weekly Scorecard Table */}
        {activeReport === 'WEEKLY_SCORECARD' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">FA Name & ID</th>
                  <th className="py-3 px-4">Territory</th>
                  <th className="py-3 px-4 text-center">Total Visits</th>
                  <th className="py-3 px-4 text-center">Farmer Base</th>
                  <th className="py-3 px-4 text-center">Weekly Compliance</th>
                  <th className="py-3 px-4 text-center">Flagged Visits</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                  <th className="py-3 px-4 text-center">Quality Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weeklyScorecardData.map((row) => (
                  <tr key={row.faId} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="font-mono text-xs text-slate-400">{row.faId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{row.district}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{row.totalVisits}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{row.farmersCovered}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.complianceRate}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-semibold">{row.flaggedVisits}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{row.salesRevenue}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">{row.qualityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. District Sales & Agronomy Table */}
        {activeReport === 'DISTRICT_AGRONOMY' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-center">Active FAs</th>
                  <th className="py-3 px-4 text-center">Registered Farmers</th>
                  <th className="py-3 px-4 text-center">Logged Visits</th>
                  <th className="py-3 px-4 text-right">Input Products Sold</th>
                  <th className="py-3 px-4 text-center">Observed Yield Uplift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {districtData.map((row) => (
                  <tr key={row.district} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.district}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{row.activeFieldStaff} FAs</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{row.registeredFarmers}</td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-bold">{row.totalFieldVisits}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{row.productsSoldAmount}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{row.avgYieldUplift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Farmer Coverage & Verification Audit Table */}
        {activeReport === 'FARMER_COVERAGE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4 text-center">Total Farmers</th>
                  <th className="py-3 px-4 text-center">Verified Profiles</th>
                  <th className="py-3 px-4 text-center">Pending Verification</th>
                  <th className="py-3 px-4 text-center">Inactive</th>
                  <th className="py-3 px-4 text-center">Coverage Rate</th>
                  <th className="py-3 px-4 text-center">Audit Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coverageData.map((row) => (
                  <tr key={row.district} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.district}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{row.totalFarmers}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.verifiedProfiles}</td>
                    <td className="py-3 px-4 text-center text-amber-600 font-medium">{row.pendingVerification}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{row.inactive}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{row.coverageRate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {row.complianceGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. VAS Uptake Table */}
        {activeReport === 'VAS_UPTAKE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Value Added Service (VAS)</th>
                  <th className="py-3 px-4 text-center">Field Requests</th>
                  <th className="py-3 px-4 text-center">Average Fee</th>
                  <th className="py-3 px-4 text-center">Farmer Satisfaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vasTypes.map((row) => (
                  <tr key={row.service} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.service}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{row.count} plots</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">{row.avgCharge}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-700">{row.satisfaction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Sign-off Footer */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            System Audit Ref: <strong className="font-mono text-slate-600">SAGL-AUDIT-2026-HQ-R1</strong>
          </div>
          <div className="flex items-center gap-6">
            <span>Prepared By: Head Office Operations Desk</span>
            <span>Authorized Signatory: Head of Agronomy & Field Services</span>
          </div>
        </div>
      </div>
    </div>
  );
};
