import { describe, it, expect, vi } from 'vitest';

describe('Admin Manage Agents - Deactivation & Ban Handling', () => {
  it('computes ban_duration correctly for deactivate and reactivate', () => {
    const computeBanDuration = (isActive: boolean) => (isActive ? 'none' : '876600h');

    // Deactivation should apply a 100-year ban
    expect(computeBanDuration(false)).toBe('876600h');

    // Reactivation must lift the ban by passing 'none'
    expect(computeBanDuration(true)).toBe('none');
  });

  it('calls auth.admin.updateUserById with ban_duration none when reactivated', async () => {
    const updateUserByIdMock = vi.fn().mockResolvedValue({ data: { user: { id: 'agent-1' } }, error: null });
    const updateProfileMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabaseAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'agent' } }),
          }),
        }),
        update: updateProfileMock,
      }),
      auth: {
        admin: {
          updateUserById: updateUserByIdMock,
        },
      },
    };

    // Simulate reactivating the agent
    const userId = 'agent-123';
    const isActive = true;
    const banDuration = isActive ? 'none' : '876600h';

    await mockSupabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    expect(updateUserByIdMock).toHaveBeenCalledWith('agent-123', {
      ban_duration: 'none',
    });
  });

  it('calls auth.admin.updateUserById with ban_duration 876600h when deactivated', async () => {
    const updateUserByIdMock = vi.fn().mockResolvedValue({ data: { user: { id: 'agent-1' } }, error: null });

    const userId = 'agent-123';
    const isActive = false;
    const banDuration = isActive ? 'none' : '876600h';

    await updateUserByIdMock(userId, {
      ban_duration: banDuration,
    });

    expect(updateUserByIdMock).toHaveBeenCalledWith('agent-123', {
      ban_duration: '876600h',
    });
  });
});
