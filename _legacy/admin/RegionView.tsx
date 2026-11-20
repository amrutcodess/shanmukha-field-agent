import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { VisitFull } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDateEn, formatTimeEn } from '../../lib/export';
import { ArrowLeft, MapPin, Calendar, ChevronRight } from 'lucide-react';

export const RegionView: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [locationName, setLocationName] = useState<string>('');
  const [visits, setVisits] = useState<VisitFull[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadLocationVisits = useCallback(async () => {
    if (!type || !id) return;
    setIsLoading(true);
    try {
      // 1. Fetch location name
      let tableName = 'regions';
      if (type === 'district') tableName = 'districts';
      if (type === 'village') tableName = 'villages';

      const { data: locData } = await supabase.from(tableName).select('name').eq('id', id).single();
      if (locData) setLocationName(locData.name);

      // 2. Fetch visits filtered by level
      let query = supabase.from('visits_full').select('*').is('deleted_at', null).order('visited_at', { ascending: false });

      if (type === 'region') query = query.eq('region_id', id);
      if (type === 'district') query = query.eq('district_id', id);
      if (type === 'village') query = query.eq('village_id', id);

      const { data: vData, error } = await query;
      if (error) throw error;
      setVisits((vData as VisitFull[]) || []);
    } catch (err) {
      console.error('Error loading location visits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    loadLocationVisits();
  }, [loadLocationVisits]);

  if (isLoading) {
    return <LoadingSpinner message="Loading location performance data..." />;
  }

  const totalVisits = visits.length;
  const purchasedVisits = visits.filter((v) => v.status === 'final').length;
  const notPurchasedVisits = visits.filter((v) => v.status !== 'final').length;
  const conversionRate = totalVisits > 0 ? ((purchasedVisits / totalVisits) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase">{type} Overview</span>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">{locationName}</h1>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">Total Visits</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{totalVisits}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-green-200 bg-green-50/30 shadow-xs">
          <span className="text-xs font-bold text-[#1B5E20] block">Purchased</span>
          <span className="text-2xl font-extrabold text-[#1B5E20] mt-1 block">{purchasedVisits}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">Not Purchased</span>
          <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{notPurchasedVisits}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">Conversion</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{conversionRate}%</span>
        </div>
      </div>

      {/* VISITS LIST */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Location Visits ({visits.length})</h3>

        {visits.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center border text-gray-500 text-sm">
            {t('common.no_data')}
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate(`/admin/visits/${v.id}`)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-green-300 transition cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-gray-900">{v.farmer_name}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-gray-600 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#2E7D32]" />
                    {v.village_name}, {v.district_name} • Agent: {v.agent_name || v.agent_username}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{formatDateEn(v.visited_at)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
