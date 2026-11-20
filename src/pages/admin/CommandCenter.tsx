import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  Users,
  Footprints,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Battery,
  MapPin,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const CommandCenter: React.FC = () => {
  const {
    fas,
    farmers,
    filteredVisits,
    filteredFAs,
    filteredFarmers,
    selectedDistrict,
    dateRange,
  } = useAdmin();

  const navigate = useNavigate();
  const [chartView, setChartView] = useState<'VISITS' | 'SALES'>('VISITS');

  // KPI Calculations
  const totalFAs = filteredFAs.length;
  const onVisitFAs = filteredFAs.filter((f) => f.status === 'ON_VISIT').length;
  const activeFAs = filteredFAs.filter((f) => f.status === 'ACTIVE').length;
  const idleFAs = filteredFAs.filter((f) => f.status === 'IDLE').length;
  const offlineFAs = filteredFAs.filter((f) => f.status === 'OFFLINE' || f.status === 'LOCATION_OFF').length;

  const totalFarmers = filteredFarmers.length;
  const verifiedFarmers = filteredFarmers.filter((f) => f.registrationStatus === 'VERIFIED').length;
  const verificationRate = totalFarmers > 0 ? Math.round((verifiedFarmers / totalFarmers) * 100) : 0;

  const totalVisits = filteredVisits.length;
  const todayVisits = filteredVisits.filter((v) => {
    const diff = (new Date().getTime() - new Date(v.createdAt).getTime()) / (1000 * 3600 * 24);
    return diff <= 1;
  }).length;

  const totalSalesRevenue = filteredVisits.reduce((acc, v) => acc + v.totalSaleAmount, 0);
  const openAlertsCount = filteredVisits.flatMap((v) => v.flags.filter((f) => f.reviewStatus === 'PENDING')).length;

  // Compliance %: % of farmers not overdue
  const nonOverdueFarmers = filteredFarmers.filter((f) => !f.isOverdue).length;
  const weeklyComplianceRate = totalFarmers > 0 ? Math.round((nonOverdueFarmers / totalFarmers) * 100) : 0;

  // 14-day trend data for chart
  const trendData = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const count = 15 + Math.floor(Math.sin(i * 0.6) * 8) + (i % 4) * 3;
    const sales = count * 650;
    return {
      date: dateStr,
      visits: count,
      sales,
    };
  });

  // District distribution data
  const districtsList = ['Medak', 'Sangareddy', 'Siddipet', 'Vikarabad', 'Nizamabad', 'Kamareddy'];
  const districtData = districtsList.map((dist) => {
    const distVisits = filteredVisits.filter((v) => v.district === dist).length;
    return {
      district: dist,
      visits: distVisits,
    };
  });

  // Top 5 & Bottom 5 FAs by qualityScore & compliance
  const sortedFAs = [...filteredFAs].sort((a, b) => b.qualityScore - a.qualityScore);
  const topFAs = sortedFAs.slice(0, 5);
  const bottomFAs = sortedFAs.slice(-5).reverse();

  // Exportable summary row for CSV
  const exportSummary = [
    {
      Metric: 'Total Field Assistants',
      Value: totalFAs,
      District: selectedDistrict,
      DateRange: dateRange,
    },
    { Metric: 'FAs On Visit', Value: onVisitFAs, District: selectedDistrict, DateRange: dateRange },
    { Metric: 'Total Seeded Farmers', Value: totalFarmers, District: selectedDistrict, DateRange: dateRange },
    { Metric: 'Farmer Verification Rate', Value: `${verificationRate}%`, District: selectedDistrict, DateRange: dateRange },
    { Metric: 'Weekly Compliance Rate', Value: `${weeklyComplianceRate}%`, District: selectedDistrict, DateRange: dateRange },
    { Metric: 'Total Visits Logged', Value: totalVisits, District: selectedDistrict, DateRange: dateRange },
    { Metric: 'Total Product Sales', Value: `₹${totalSalesRevenue.toLocaleString()}`, District: selectedDistrict, DateRange: dateRange },
    { Metric: 'Open Anomaly Alerts', Value: openAlertsCount, District: selectedDistrict, DateRange: dateRange },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Command Center Overview</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B7A3B]">
              {selectedDistrict === 'ALL' ? 'All 6 Districts' : selectedDistrict}
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time telemetry, visit compliance, sales pipeline & active vigilance anomalies
          </p>
        </div>

        <PrintExportButtons data={exportSummary} filename="command-center-summary" />
      </div>

      {/* 1. TOP KPI METRIC CARDS (ALL CLICKABLE TO DRILL DOWN) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* Card 1: Total FAs */}
        <div
          onClick={() => navigate('/admin/performance')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-[#0B7A3B] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total FAs</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalFAs}</div>
          <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
            {onVisitFAs} On Visit Now
          </div>
        </div>

        {/* Card 2: Active Telemetry */}
        <div
          onClick={() => navigate('/admin/map')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-emerald-600 transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Telemetry</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[#0B7A3B] mt-1">{onVisitFAs + activeFAs}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {idleFAs} Idle · {offlineFAs} Off
          </div>
        </div>

        {/* Card 3: Visits Today */}
        <div
          onClick={() => navigate('/admin/visits')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-[#0B7A3B] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Visits Today</span>
            <Footprints className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{todayVisits}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            +18% vs yesterday
          </div>
        </div>

        {/* Card 4: Total Visits Filtered */}
        <div
          onClick={() => navigate('/admin/visits')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-[#0B7A3B] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Period Visits</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalVisits}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Filter: {dateRange}</div>
        </div>

        {/* Card 5: Farmers Seeded */}
        <div
          onClick={() => navigate('/admin/farmers')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-[#0B7A3B] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Farmers</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalFarmers}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Across 6 districts</div>
        </div>

        {/* Card 6: Farmer Verification % */}
        <div
          onClick={() => navigate('/admin/performance')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-emerald-600 transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Farmer Profiles</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{verificationRate}%</div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {verifiedFarmers}/{totalFarmers} verified
          </div>
        </div>

        {/* Card 7: Weekly Compliance % */}
        <div
          onClick={() => navigate('/admin/performance')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-[#E8731A] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Compliance</span>
            <TrendingUp className="w-4 h-4 text-[#E8731A]" />
          </div>
          <div className="text-2xl font-black text-[#E8731A] mt-1">{weeklyComplianceRate}%</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Target: 95% on-time</div>
        </div>

        {/* Card 8: Open Anomaly Alerts */}
        <div
          onClick={() => navigate('/admin/fraud')}
          className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs hover:border-rose-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-400 group-hover:text-rose-600 transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider">Open Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{openAlertsCount}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Vigilance Action</div>
        </div>
      </div>

      {/* 2. CHARTS ROW: VISIT TREND & DISTRICT HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">14-Day Activity & Field Velocity</h2>
              <p className="text-xs text-stone-400">Daily visit volume and farm advisory distribution</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartView('VISITS')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  chartView === 'VISITS'
                    ? 'bg-[#0B7A3B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Visits
              </button>
              <button
                onClick={() => setChartView('SALES')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  chartView === 'SALES'
                    ? 'bg-[#0B7A3B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Sales (₹)
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B7A3B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0B7A3B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8731A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E8731A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#D1D5DB" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#D1D5DB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1917',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                {chartView === 'VISITS' ? (
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#0B7A3B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#E8731A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Distribution Bar Chart (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">District Visit Volume</h2>
              <p className="text-xs text-stone-400">Total visits logged per district</p>
            </div>
            <button
              onClick={() => navigate('/admin/visits')}
              className="text-xs font-semibold text-[#0B7A3B] hover:underline"
            >
              Drill down →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis dataKey="district" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1917',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="visits" fill="#0B7A3B" radius={[0, 8, 8, 0]}>
                  {districtData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.district === selectedDistrict ? '#E8731A' : '#0B7A3B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. LIVE FA TELEMETRY STATUS LIST & TOP/BOTTOM RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Telemetry Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-stone-900">Live Field Assistant Telemetry</h2>
            </div>
            <button
              onClick={() => navigate('/admin/map')}
              className="text-xs font-bold text-[#0B7A3B] hover:underline flex items-center gap-1"
            >
              <span>View All on Live Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Field Assistant</th>
                  <th className="py-2.5 px-3 font-semibold">District & Mandal</th>
                  <th className="py-2.5 px-3 font-semibold">Live Status</th>
                  <th className="py-2.5 px-3 font-semibold">Battery</th>
                  <th className="py-2.5 px-3 font-semibold">Last Sync</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredFAs.slice(0, 7).map((fa) => {
                  const isOnVisit = fa.status === 'ON_VISIT';
                  const isActive = fa.status === 'ACTIVE';
                  const isLocationOff = fa.status === 'LOCATION_OFF';

                  return (
                    <tr
                      key={fa.id}
                      onClick={() => navigate('/admin/performance')}
                      className="hover:bg-stone-50/80 cursor-pointer transition"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-900">{fa.name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{fa.id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-stone-800">{fa.district}</div>
                        <div className="text-[10px] text-stone-400">{fa.mandal}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOnVisit
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isActive
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : isLocationOff
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnVisit
                                ? 'bg-emerald-500 animate-pulse'
                                : isActive
                                ? 'bg-sky-500'
                                : isLocationOff
                                ? 'bg-rose-500'
                                : 'bg-stone-400'
                            }`}
                          />
                          <span>{fa.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <Battery
                            className={`w-3.5 h-3.5 ${
                              fa.batteryLevel < 20
                                ? 'text-rose-500'
                                : fa.batteryLevel < 50
                                ? 'text-amber-500'
                                : 'text-emerald-600'
                            }`}
                          />
                          <span className="font-mono text-stone-700">{fa.batteryLevel}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                        {fa.lastSyncTime}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[#0B7A3B] font-bold text-[11px] hover:underline">
                          Track →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 vs Bottom 5 Leaderboard (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900">FA Quality Leaderboard</h2>
            <button
              onClick={() => navigate('/admin/performance')}
              className="text-xs font-semibold text-[#0B7A3B] hover:underline"
            >
              Full Rankings →
            </button>
          </div>

          <div className="space-y-4">
            {/* Top 5 Performers */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md mb-2 flex items-center justify-between">
                <span>Top 5 Highest Performing</span>
                <span>Score</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {topFAs.map((fa, i) => (
                  <div
                    key={fa.id}
                    onClick={() => navigate('/admin/performance')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B7A3B] font-bold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-bold text-stone-900">{fa.name}</div>
                        <div className="text-[10px] text-stone-400">{fa.district}</div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700">{fa.qualityScore}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 5 Needing Support */}
            <div className="pt-2 border-t border-stone-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-1 rounded-md mb-2 flex items-center justify-between">
                <span>Attention Required (Bottom 5)</span>
                <span>Score</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {bottomFAs.map((fa, i) => (
                  <div
                    key={fa.id}
                    onClick={() => navigate('/admin/performance')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center">
                        !
                      </span>
                      <div>
                        <div className="font-bold text-stone-900">{fa.name}</div>
                        <div className="text-[10px] text-stone-400">{fa.district}</div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-600">{fa.qualityScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
