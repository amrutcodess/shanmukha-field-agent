import { useState, useEffect, useCallback } from 'react';
import { getOfflineDrafts } from '../lib/db';
import { syncOfflineVisits, SyncResult } from '../lib/sync';
import { useOnlineStatus } from './useOnlineStatus';
import { OfflineVisitDraft } from '../types';

export const useOfflineQueue = () => {
  const isOnline = useOnlineStatus();
  const [drafts, setDrafts] = useState<OfflineVisitDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshDrafts = useCallback(async () => {
    try {
      const list = await getOfflineDrafts();
      setDrafts(list);
    } catch (err) {
      console.error('Failed to load offline drafts:', err);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineVisits();
      setLastSyncResult(res);
      await refreshDrafts();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, refreshDrafts]);

  // Refresh drafts list on mount and when connection changes
  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts, isOnline]);

  // Auto-sync when transitioning online
  useEffect(() => {
    if (isOnline && drafts.length > 0 && !isSyncing) {
      triggerSync();
    }
  }, [isOnline, drafts.length, isSyncing, triggerSync]);

  return {
    pendingCount: drafts.length,
    drafts,
    isSyncing,
    lastSyncResult,
    refreshDrafts,
    triggerSync,
  };
};
