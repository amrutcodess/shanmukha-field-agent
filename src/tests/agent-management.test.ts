import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAdminManageAgents, createAgent, setAgentActive, resetAgentPassword } from '../lib/admin-agents';
import { supabase } from '../lib/supabase';

describe('Admin Manage Agents Client Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an error if there is no authenticated admin session', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    await expect(createAgent({ username: 'test', full_name: 'Test' })).rejects.toThrow(
      'Unauthenticated admin session'
    );
  });

  it('calls admin-manage-agents endpoint with token and payload on create', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          access_token: 'valid-admin-jwt-token',
        },
      },
      error: null,
    } as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, user_id: 'new-agent-uuid' }),
    });
    globalThis.fetch = mockFetch;

    const result = await createAgent({
      username: 'harish_agent',
      full_name: 'Harish Kumar',
      password: 'SecurePassword123!',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/admin-manage-agents'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-admin-jwt-token',
        },
        body: JSON.stringify({
          action: 'create',
          payload: {
            username: 'harish_agent',
            full_name: 'Harish Kumar',
            password: 'SecurePassword123!',
          },
        }),
      })
    );
    expect(result).toEqual({ success: true, user_id: 'new-agent-uuid' });
  });

  it('handles set_active action and error responses from Edge Function', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'valid-token' } },
      error: null,
    } as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Cannot deactivate admin accounts' }),
    });
    globalThis.fetch = mockFetch;

    await expect(setAgentActive({ user_id: 'admin-1', is_active: false })).rejects.toThrow(
      'Cannot deactivate admin accounts'
    );
  });

  it('handles reset_password action successfully', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'valid-token' } },
      error: null,
    } as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    globalThis.fetch = mockFetch;

    const result = await resetAgentPassword({ user_id: 'agent-123', password: 'NewPassword123!' });
    expect(result).toEqual({ success: true });
  });
});
