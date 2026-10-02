import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { VisitFull, Profile } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDateEn } from '../../lib/export';
import {
  Users,
  ClipboardList,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const [visits, setVisits] = useState<VisitFull[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: agentsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('full_name');
      setAgents((agentsData as Profile[]) || []);

      let query = supabase
        .from('visits_full')
        .select('*')
        .is('deleted_at', null)
        .order('visited_at', { ascending: false });

      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        query = query.gte('visited_at', `${todayStr}T00:00:00.000Z`);
      } else if (dateFilter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        query = query.gte('visited_at', startOfWeek.toISOString());
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('visited_at', startOfMonth.toISOString());
      } else if (dateFilter === 'custom' && customStart && customEnd) {
        query = query
          .gte('visited_at', `${customStart}T00:00:00.000Z`)
          .lte('visited_at', `${customEnd}T23:59:59.999Z`);
      }

      const { data: visitsData, error } = await query;
      if (error) throw error;
      setVisits((visitsData as VisitFull[]) || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAgents = agents.length;
  const totalVisits = visits.length;
  const purchasedVisits = visits.filter((v) => v.status === 'final').length;
  const notPurchasedVisits = visits.filter((v) => v.status !== 'final').length;
  const conversionRate = totalVisits > 0 ? ((purchasedVisits / totalVisits) * 100).toFixed(1) : '0';

  const agentStatsMap = new Map<string, { total: number; purchased: number }>();
  visits.forEach((v) => {
    const key = v.agent_id;
    const current = agentStatsMap.get(key) || { total: 0, purchased: 0 };
    current.total += 1;
    if (v.status === 'final') current.purchased += 1;
    agentStatsMap.set(key, current);
  });

  const recentVisits = visits.slice(0, 10);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">
            {t('admin.dashboard_title')}
          </h1>
          <p className="text-xs text-gray-600">Real-time field performance tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: t('admin.date_today') },
            { id: 'week', label: t('admin.date_week') },
            { id: 'month', label: t('admin.date_month') },
            { id: 'all', label: t('admin.date_all') },
            { id: 'custom', label: t('admin.date_custom') },
          ].map((df) => (
            <button
              key={df.id}
              onClick={() => setDateFilter(df.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition min-h-[44px] ${
                dateFilter === df.id
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">{t('admin.from_date')}</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="p-2 border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">{t('admin.to_date')}</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="p-2 border rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner message="Calculating dashboard statistics..." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold">{t('admin.total_agents')}</span>
                <Users className="w-5 h-5 text-[#2E7D32]" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{totalAgents}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold">{t('admin.total_visits')}</span>
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{totalVisits}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-green-200 bg-green-50/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#1B5E20] mb-2">
                <span className="text-xs font-bold">{t('admin.purchased_visits')}</span>
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
              </div>
              <div className="text-2xl font-extrabold text-[#1B5E20]">{purchasedVisits}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold">{t('admin.pending_closed')}</span>
                <XCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{notPurchasedVisits}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold">{t('admin.conversion_rate')}</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">{conversionRate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-[#2E7D32]" />
                  <span>{t('admin.visits_per_agent')}</span>
                </h3>
              </div>

              {agents.length === 0 ? (
                <p className="text-xs text-gray-500">{t('common.no_data')}</p>
              ) : (
                <div className="divide-y divide-gray-100 space-y-1">
                  {agents.map((ag) => {
                    const stats = agentStatsMap.get(ag.id) || { total: 0, purchased: 0 };
                    const rate = stats.total > 0 ? ((stats.purchased / stats.total) * 100).toFixed(0) : '0';
                    return (
                      <div
                        key={ag.id}
                        onClick={() => navigate(`/admin/agents/${ag.id}`)}
                        className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-xl transition cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-sm text-gray-900 block">{ag.full_name}</span>
                          <span className="text-xs text-gray-500">@{ag.username}</span>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-extrabold text-gray-900">
                            {stats.purchased} / {stats.total} visits
                          </div>
                          <div className="text-xs text-[#2E7D32] font-semibold">{rate}% converted</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-2">
                  <ClipboardList className="w-5 h-5 text-[#2E7D32]" />
                  <span>{t('admin.recent_visits')}</span>
                </h3>
                <button
                  onClick={() => navigate('/admin/visits')}
                  className="text-xs font-bold text-[#2E7D32] hover:underline"
                >
                  View all
                </button>
              </div>

              {recentVisits.length === 0 ? (
                <p className="text-xs text-gray-500">{t('common.no_data')}</p>
              ) : (
                <div className="divide-y divide-gray-100 space-y-1">
                  {recentVisits.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate(`/admin/visits/${v.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-xl transition cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-gray-900">{v.farmer_name}</span>
                          <StatusBadge status={v.status} />
                        </div>
                        <p className="text-xs text-gray-500">
                          {v.village_name} • By {v.agent_name || v.agent_username}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 font-medium">
                          {formatDateEn(v.visited_at)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
