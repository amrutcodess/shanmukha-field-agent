import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineVisitDraft } from '../types';

interface FieldAgentDB extends DBSchema {
  draft_visits: {
    key: number;
    value: OfflineVisitDraft;
    indexes: { 'by-client-uuid': string };
  };
}

const DB_NAME = 'shanmukha_field_agent_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FieldAgentDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FieldAgentDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('draft_visits')) {
          const store = db.createObjectStore('draft_visits', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-client-uuid', 'client_uuid', { unique: true });
        }
      },
    });
  }
  return dbPromise;
};

export const saveOfflineDraft = async (draft: Omit<OfflineVisitDraft, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDB();
  const entry: OfflineVisitDraft = {
    ...draft,
    created_at: Date.now(),
    sync_attempts: 0,
  };
  const id = await db.add('draft_visits', entry);
  return id as number;
};

export const getOfflineDrafts = async (): Promise<OfflineVisitDraft[]> => {
  const db = await getDB();
  return db.getAll('draft_visits');
};

export const deleteOfflineDraft = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.delete('draft_visits', id);
};

export const updateDraftError = async (id: number, error_message: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('draft_visits', 'readwrite');
  const draft = await tx.store.get(id);
  if (draft) {
    draft.sync_attempts = (draft.sync_attempts || 0) + 1;
    draft.error_message = error_message;
    await tx.store.put(draft);
  }
  await tx.done;
};
