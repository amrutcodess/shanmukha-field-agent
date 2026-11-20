import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { VisitFull, Profile, Region, District, Village } from '../../types';
import { fetchAllRegions, fetchDistrictsByRegion, fetchVillagesByDistrict } from '../../lib/location';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDateEn, formatTimeEn } from '../../lib/export';
import { Filter, RefreshCw, MapPin, ChevronRight, X } from 'lucide-react';

export const Visits: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [visits, setVisits] = useState<VisitFull[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchFiltersData = async () => {
    try {
      const [agRes, regRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'agent').order('full_name'),
        fetchAllRegions(),
      ]);
      if (agRes.data) setAgents(agRes.data as Profile[]);
      if (regRes) setRegions(regRes);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  useEffect(() => {
    fetchFiltersData();
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

  const fetchVisits = useCallback(async () => {
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

      let list = (data as VisitFull[]) || [];

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter(
          (v) =>
            v.farmer_name?.toLowerCase().includes(q) ||
            v.farmer_phone?.includes(q) ||
            v.village_name?.toLowerCase().includes(q)
        );
      }

      setVisits(list);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedAgent,
    selectedRegion,
    selectedDistrict,
    selectedVillage,
    selectedStatus,
    startDate,
    endDate,
    searchQuery,
  ]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const clearFilters = () => {
    setSelectedAgent('');
    setSelectedRegion('');
    setSelectedDistrict('');
    setSelectedVillage('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">{t('nav.visits')}</h1>
          <p className="text-xs text-gray-500">Showing {visits.length} records</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 min-h-[44px] shadow-xs hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('admin.filters')}</span>
          </button>

          <button
            onClick={fetchVisits}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#2E7D32]' : ''}`} />
          </button>
        </div>
      </div>

      {showMobileFilters && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-sm text-gray-900">{t('admin.filters')}</h3>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block font-bold text-gray-700 mb-1">Search Farmer / Phone</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.search_placeholder')}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white"
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
                className="w-full p-2.5 border rounded-xl bg-white"
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
                className="w-full p-2.5 border rounded-xl bg-white"
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
                className="w-full p-2.5 border rounded-xl bg-white disabled:opacity-50"
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
                className="w-full p-2.5 border rounded-xl bg-white disabled:opacity-50"
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
                className="w-full p-2.5 border rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">{t('admin.to_date')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border text-gray-700 rounded-xl font-bold text-xs"
            >
              {t('admin.clear_filters')}
            </button>
            <button
              onClick={() => {
                fetchVisits();
                setShowMobileFilters(false);
              }}
              className="px-5 py-2 bg-[#2E7D32] text-white rounded-xl font-bold text-xs shadow-xs"
            >
              {t('admin.apply_filters')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner message="Fetching field visits..." />
      ) : visits.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
          <p className="text-gray-500 font-medium text-sm">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/admin/visits/${v.id}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-green-300 transition cursor-pointer flex items-center justify-between"
            >
              <div className="space-y-1.5 flex-1 pr-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">
                    {formatDateEn(v.visited_at)} ({formatTimeEn(v.visited_at)})
                  </span>
                  <StatusBadge status={v.status} />
                </div>

                <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-2">
                  <span>{v.farmer_name}</span>
                </h3>

                <p className="text-xs text-gray-600 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#2E7D32] shrink-0" />
                  <span>
                    {v.village_name}, {v.district_name}
                  </span>
                  <span className="ml-3 font-semibold text-gray-500">
                    Agent: {v.agent_name || v.agent_username}
                  </span>
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
