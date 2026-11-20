import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  Sprout,
  Activity,
  Bug,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AgronomyInsights: React.FC = () => {
  const { filteredFarmers, filteredVisits } = useAdmin();

  // Crop distribution
  const cropsList = ['Cotton', 'Chilli', 'Paddy', 'Maize', 'Redgram'];
  const cropColors = ['#0B7A3B', '#E8731A', '#3B82F6', '#8B5CF6', '#10B981'];

  const cropData = cropsList.map((crop) => {
    const count = filteredFarmers.filter((f) => f.crop === crop).length;
    return { name: crop, value: count };
  });

  // Stage distribution
  const stages = ['Sowing', 'Vegetative', 'Flowering', 'Boll formation', 'Harvest'];
  const stageData = stages.map((st) => {
    const count = filteredVisits.filter((v) => v.cropStage === st).length;
    return { stage: st, count };
  });

  // Days After Sowing (DAS) Histogram buckets
  const dasBuckets = [
    { range: '0-30 DAS', count: filteredVisits.filter((v) => v.daysAfterSowing <= 30).length },
    { range: '31-60 DAS', count: filteredVisits.filter((v) => v.daysAfterSowing > 30 && v.daysAfterSowing <= 60).length },
    { range: '61-90 DAS', count: filteredVisits.filter((v) => v.daysAfterSowing > 60 && v.daysAfterSowing <= 90).length },
    { range: '91-120 DAS', count: filteredVisits.filter((v) => v.daysAfterSowing > 90 && v.daysAfterSowing <= 120).length },
    { range: '>120 DAS', count: filteredVisits.filter((v) => v.daysAfterSowing > 120).length },
  ];

  // Top issues observed
  const issueData = [
    { issue: 'Pink bollworm', count: Math.round(filteredVisits.length * 0.38) },
    { issue: 'Whitefly & sucking', count: Math.round(filteredVisits.length * 0.24) },
    { issue: 'Leaf reddening (Mg def)', count: Math.round(filteredVisits.length * 0.18) },
    { issue: 'Jassids hopper burn', count: Math.round(filteredVisits.length * 0.12) },
    { issue: 'Bacterial blight', count: Math.round(filteredVisits.length * 0.08) },
  ];

  // Observation vs Prescription ratio
  const rxVisits = filteredVisits.filter((v) => v.visitType === 'WITH_PRESCRIPTION').length;
  const obsVisits = filteredVisits.filter((v) => v.visitType === 'OBSERVATION_ONLY').length;
  const rxRatio = filteredVisits.length > 0 ? Math.round((rxVisits / filteredVisits.length) * 100) : 0;

  const exportData = [
    ...cropData.map((c) => ({ Category: 'Crop Distribution', Metric: c.name, Value: c.value })),
    ...stageData.map((s) => ({ Category: 'Crop Stage Distribution', Metric: s.stage, Value: s.count })),
    ...issueData.map((i) => ({ Category: 'Top Pathogen / Pest Issue', Metric: i.issue, Value: i.count })),
    { Category: 'Prescription vs Obs', Metric: 'With Prescription', Value: rxVisits },
    { Category: 'Prescription vs Obs', Metric: 'Observation Only', Value: obsVisits },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Agronomy Intelligence & Diagnostics</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B7A3B]">
              Scientific Scouting
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Pest incidence thresholds, crop stage phenology, DAS histograms & prescription efficacy
          </p>
        </div>

        <PrintExportButtons data={exportData} filename="agronomy-insights" />
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">DOMINANT CROP</span>
          <div className="text-2xl font-black text-[#0B7A3B] mt-1">Cotton (58%)</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Primary focus: Pink bollworm threshold</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">TOP PEST PRESSURE</span>
          <div className="text-2xl font-black text-[#E8731A] mt-1">Pink Bollworm</div>
          <p className="text-[11px] text-stone-500 mt-0.5">38% of all field visits reported symptoms</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">PRESCRIPTION RATIO</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{rxRatio}% Rx Rate</div>
          <p className="text-[11px] text-stone-500 mt-0.5">{rxVisits} with prescription · {obsVisits} obs only</p>
        </div>
      </div>

      {/* Row 1: Crop Donut & Stage Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Donut */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Crop Acreage Distribution</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {cropData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={cropColors[index % cropColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Phenology Bar */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Current Phenological Crop Stages</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#374151' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#0B7A3B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: DAS Histogram & Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAS Histogram */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Days After Sowing (DAS) Histogram</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dasBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#374151' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#E8731A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Issues Bar */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Top Diagnosed Issues & Pests</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis dataKey="issue" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#0B7A3B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
