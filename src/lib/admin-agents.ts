import { supabase } from './supabase';

export interface CreateAgentPayload {
  username: string;
  full_name: string;
  phone?: string | null;
  password?: string;
}

export interface ResetPasswordPayload {
  user_id: string;
  password?: string;
}

export interface SetActivePayload {
  user_id: string;
  is_active: boolean;
}

export const callAdminManageAgents = async (action: string, payload: any) => {
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

export const createAgent = async (payload: CreateAgentPayload) => {
  return callAdminManageAgents('create', payload);
};

export const resetAgentPassword = async (payload: ResetPasswordPayload) => {
  return callAdminManageAgents('reset_password', payload);
};

export const setAgentActive = async (payload: SetActivePayload) => {
  return callAdminManageAgents('set_active', payload);
};
