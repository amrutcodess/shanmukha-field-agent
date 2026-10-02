import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  UserPlus,
  KeyRound,
  UserCheck,
  UserX,
  ChevronRight,
  Phone,
} from 'lucide-react';

export const Agents: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);

  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents((data as Profile[]) || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const callAdminEdgeFunction = async (action: string, payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthenticated admin session');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/admin-manage-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Edge function error');
    }
    return result;
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsSubmitting(true);
    try {
      await callAdminEdgeFunction('create', {
        username: username.trim().toLowerCase(),
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        password,
      });

      setShowAddModal(false);
      setFullName('');
      setUsername('');
      setPhone('');
      setPassword('');
      await fetchAgents();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !newPassword) return;
    setIsSubmitting(true);
    try {
      await callAdminEdgeFunction('reset_password', {
        user_id: selectedAgent.id,
        new_password: newPassword,
      });
      setShowResetModal(false);
      setSelectedAgent(null);
      setNewPassword('');
      alert('Password reset successfully!');
    } catch (err: any) {
      alert('Password reset failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (agent: Profile) => {
    try {
      await callAdminEdgeFunction('set_active', {
        user_id: agent.id,
        is_active: !agent.is_active,
      });
      await fetchAgents();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">
            {t('nav.agents')}
          </h1>
          <p className="text-xs text-gray-600">Manage field agent profiles and login access</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-xl shadow-xs transition text-sm min-h-[48px]"
        >
          <UserPlus className="w-5 h-5" />
          <span>{t('admin.add_agent')}</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading agent accounts..." />
      ) : agents.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500 font-medium text-sm">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((ag) => (
            <div
              key={ag.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 hover:border-green-300 transition"
            >
              <div className="flex items-start justify-between">
                <div
                  onClick={() => navigate(`/admin/agents/${ag.id}`)}
                  className="cursor-pointer space-y-0.5"
                >
                  <h3 className="font-extrabold text-base text-gray-900 flex items-center space-x-2">
                    <span>{ag.full_name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        ag.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {ag.is_active ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">ID: @{ag.username}</p>
                  {ag.phone && (
                    <p className="text-xs text-gray-600 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {ag.phone}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/admin/agents/${ag.id}`)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedAgent(ag);
                    setShowResetModal(true);
                  }}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 min-h-[40px]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-gray-600" />
                  <span>{t('admin.reset_password')}</span>
                </button>

                <button
                  onClick={() => handleToggleActive(ag)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 min-h-[40px] ${
                    ag.is_active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  {ag.is_active ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>{t('admin.deactivate')}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t('admin.activate')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              {t('admin.add_agent')}
            </h3>

            {addError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl">
                {addError}
              </p>
            )}

            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('admin.agent_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('admin.username')} *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. ramesh01"
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('admin.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit phone number..."
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('admin.temp_password')} *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters..."
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl min-h-[48px]"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#2E7D32] text-white font-bold rounded-xl min-h-[48px]"
                >
                  {isSubmitting ? t('common.loading') : t('admin.create_agent_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              {t('admin.reset_password')} for {selectedAgent.full_name}
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('admin.new_password')} *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl min-h-[48px]"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#2E7D32] text-white font-bold rounded-xl min-h-[48px]"
                >
                  {isSubmitting ? t('common.loading') : t('admin.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
