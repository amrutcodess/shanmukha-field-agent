import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { VisitFull, Profile, Region, District, Village } from '../../types';
import { fetchAllRegions, fetchDistrictsByRegion, fetchVillagesByDistrict } from '../../lib/location';
import { exportToExcel, exportToCSV } from '../../lib/export';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  FileText,
} from 'lucide-react';

export const ExportPrint: React.FC = () => {
  const { t } = useTranslation();

  const [agents, setAgents] = useState<Profile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const loadInitial = async () => {
      const [agRes, regRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'agent').order('full_name'),
        fetchAllRegions(),
      ]);
      if (agRes.data) setAgents(agRes.data as Profile[]);
      if (regRes) setRegions(regRes);
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      fetchDistrictsByRegion(selectedRegion).then(setDistricts);
    } else {
      setDistricts([]);
    }
    setSelectedDistrict('');
    setSelectedVillage('');
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchVillagesByDistrict(selectedDistrict).then(setVillages);
    } else {
      setVillages([]);
    }
    setSelectedVillage('');
  }, [selectedDistrict]);

  const fetchFilteredVisits = async (): Promise<VisitFull[]> => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('visits_full')
        .select('*')
        .is('deleted_at', null)
        .order('visited_at', { ascending: false });

      if (selectedAgent) query = query.eq('agent_id', selectedAgent);
      if (selectedRegion) query = query.eq('region_id', selectedRegion);
      if (selectedDistrict) query = query.eq('district_id', selectedDistrict);
      if (selectedVillage) query = query.eq('village_id', selectedVillage);

      if (selectedStatus === 'pending') query = query.eq('status', 'pending');
      if (selectedStatus === 'purchased') query = query.eq('status', 'final');
      if (selectedStatus === 'closed') query = query.eq('status', 'closed');

      if (startDate) query = query.gte('visited_at', `${startDate}T00:00:00.000Z`);
      if (endDate) query = query.lte('visited_at', `${endDate}T23:59:59.999Z`);

      const { data, error } = await query;
      if (error) throw error;
      return (data as VisitFull[]) || [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelExport = async () => {
    const data = await fetchFilteredVisits();
    if (data.length === 0) {
      alert('No visit records found matching the filter criteria.');
      return;
    }
    exportToExcel(data, 'Shanmukha_Field_Visits_Report');
  };

  const handleCSVExport = async () => {
    const data = await fetchFilteredVisits();
    if (data.length === 0) {
      alert('No visit records found matching the filter criteria.');
      return;
    }
    exportToCSV(data, 'Shanmukha_Field_Visits_Report');
  };

  const handlePrint = (mode: 'summary' | 'detailed') => {
    const params = new URLSearchParams();
    if (selectedAgent) params.set('agent_id', selectedAgent);
    if (selectedRegion) params.set('region_id', selectedRegion);
    if (selectedDistrict) params.set('district_id', selectedDistrict);
    if (selectedVillage) params.set('village_id', selectedVillage);
    if (selectedStatus) params.set('status', selectedStatus);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    params.set('mode', mode);

    window.open(`/admin/print-report?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">
          {t('export.title')}
        </h1>
        <p className="text-xs text-gray-600">
          Generate official English reports in Excel, CSV, or printable PDF format
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 border-b pb-2 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#2E7D32]" />
          <span>{t('export.export_scope')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Field Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px]"
            >
              <option value="">{t('admin.all_agents')}</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px]"
            >
              <option value="">{t('admin.all_status')}</option>
              <option value="pending">{t('visit.status_pending')}</option>
              <option value="purchased">{t('visit.status_final')}</option>
              <option value="closed">{t('visit.status_closed')}</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px]"
            >
              <option value="">{t('admin.all_regions')}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedRegion}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px] disabled:opacity-50"
            >
              <option value="">{t('admin.all_districts')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Village</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              disabled={!selectedDistrict}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px] disabled:opacity-50"
            >
              <option value="">{t('admin.all_villages')}</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t('admin.from_date')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">{t('admin.to_date')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white min-h-[48px]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Preparing report data..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExcelExport}
            className="p-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-md font-extrabold flex items-center justify-center space-x-3 text-base min-h-[60px] transition"
          >
            <FileSpreadsheet className="w-6 h-6" />
            <span>{t('export.export_excel')}</span>
          </button>

          <button
            onClick={handleCSVExport}
            className="p-5 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl shadow-md font-extrabold flex items-center justify-center space-x-3 text-base min-h-[60px] transition"
          >
            <Download className="w-6 h-6" />
            <span>{t('export.export_csv')}</span>
          </button>

          <button
            onClick={() => handlePrint('summary')}
            className="p-5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl shadow-md font-extrabold flex items-center justify-center space-x-3 text-base min-h-[60px] transition"
          >
            <Printer className="w-6 h-6" />
            <span>{t('export.summary_mode')}</span>
          </button>

          <button
            onClick={() => handlePrint('detailed')}
            className="p-5 bg-gray-800 hover:bg-gray-900 text-white rounded-2xl shadow-md font-extrabold flex items-center justify-center space-x-3 text-base min-h-[60px] transition"
          >
            <FileText className="w-6 h-6" />
            <span>{t('export.detailed_mode')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
