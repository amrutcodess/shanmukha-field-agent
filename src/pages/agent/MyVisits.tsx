import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { VisitFull } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDateEn, formatTimeEn } from '../../lib/export';
import { Search, MapPin, User, Calendar, RefreshCw, ChevronRight } from 'lucide-react';

export const MyVisits: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [visits, setVisits] = useState<VisitFull[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchVisits = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('visits_full')
        .select('*')
        .eq('agent_id', profile.id)
        .is('deleted_at', null)
        .order('visited_at', { ascending: false });

      if (error) throw error;
      setVisits((data as VisitFull[]) || []);
    } catch (err) {
      console.error('Error fetching agent visits:', err);
    } fontally: {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const filteredVisits = visits.filter((v) => {
    if (activeTab === 'pending' && v.status !== 'pending') return false;
    if (activeTab === 'purchased' && v.status !== 'final') return false;
    if (activeTab === 'closed' && v.status !== 'closed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchFarmer = v.farmer_name?.toLowerCase().includes(q);
      const matchVillage = v.village_name?.toLowerCase().includes(q);
      const matchPhone = v.farmer_phone?.includes(q);
      return matchFarmer || matchVillage || matchPhone;
    }

    return true;
  });

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#1B5E20]">{t('nav.my_visits')}</h2>
          <p className="text-xs text-gray-500 font-medium">Total: {visits.length} records</p>
        </div>
        <button
          onClick={fetchVisits}
          className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#2E7D32]' : ''}`} />
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.search_placeholder')}
          className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm min-h-[48px] shadow-xs"
        />
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: t('visit.status_pending') },
          { id: 'purchased', label: t('visit.status_final') },
          { id: 'closed', label: t('visit.status_closed') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] transition ${
              activeTab === tab.id
                ? 'bg-[#2E7D32] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading your visits..." />
      ) : filteredVisits.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-gray-500 font-medium text-sm">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/agent/visit/${v.id}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-green-300 transition cursor-pointer flex items-center justify-between active:bg-green-50/50"
            >
              <div className="space-y-1.5 flex-1 pr-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-[#2E7D32]" />
                    {formatDateEn(v.visited_at)} ({formatTimeEn(v.visited_at)})
                  </span>
                  <StatusBadge status={v.status} />
                </div>

                <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-1">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{v.farmer_name}</span>
                </h3>

                <p className="text-xs text-gray-600 flex items-center font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-red-500 shrink-0" />
                  <span>
                    {v.village_name}, {v.district_name}
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
