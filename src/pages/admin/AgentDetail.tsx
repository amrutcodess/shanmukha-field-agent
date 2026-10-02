import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Profile, VisitFull } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDateEn } from '../../lib/export';
import { ArrowLeft, Phone, MapPin, ChevronRight } from 'lucide-react';

export const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [agent, setAgent] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<VisitFull[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [agentRes, visitsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('visits_full').select('*').eq('agent_id', id).is('deleted_at', null).order('visited_at', { ascending: false }),
      ]);

      if (agentRes.data) setAgent(agentRes.data as Profile);
      if (visitsRes.data) setVisits((visitsRes.data as VisitFull[]) || []);
    } catch (err) {
      console.error('Error fetching agent detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingSpinner message="Loading agent profile & visits..." />;
  }

  if (!agent) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Agent profile not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-[#2E7D32] text-white rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  const totalVisits = visits.length;
  const purchasedVisits = visits.filter((v) => v.status === 'final').length;
  const conversionRate = totalVisits > 0 ? ((purchasedVisits / totalVisits) * 100).toFixed(1) : '0';

  const filteredVisits = visits.filter((v) => {
    if (activeTab === 'pending' && v.status !== 'pending') return false;
    if (activeTab === 'purchased' && v.status !== 'final') return false;
    if (activeTab === 'closed' && v.status !== 'closed') return false;
    return true;
  });

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
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">{agent.full_name}</h1>
          <p className="text-xs text-gray-500">ID: @{agent.username}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-xs font-bold text-gray-500 block">Agent Status</span>
          <span
            className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              agent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {agent.is_active ? t('admin.active') : t('admin.inactive')}
          </span>
          {agent.phone && (
            <p className="text-xs text-gray-600 mt-2 flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1" />
              {agent.phone}
            </p>
          )}
        </div>

        <div className="sm:border-l border-gray-100 sm:pl-4">
          <span className="text-xs font-bold text-gray-500 block">Visits Summary</span>
          <div className="text-xl font-extrabold text-gray-900 mt-1">{totalVisits} Total</div>
          <div className="text-xs text-[#2E7D32] font-semibold">{purchasedVisits} Purchased</div>
        </div>

        <div className="sm:border-l border-gray-100 sm:pl-4">
          <span className="text-xs font-bold text-gray-500 block">Conversion Rate</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{conversionRate}%</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Visits History</h3>
          <div className="flex space-x-1">
            {['all', 'pending', 'purchased', 'closed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  activeTab === tab
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredVisits.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center border text-gray-500 text-sm">
            {t('common.no_data')}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVisits.map((v) => (
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
                    {v.village_name}, {v.district_name}
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
