import { getOfflineDrafts, deleteOfflineDraft, updateDraftError } from './db';
import { getOrCreateLocationRPC } from './location';
import { uploadPurchasePhoto } from './image';
import { supabase } from './supabase';
import { OfflineVisitDraft } from '../types';

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}

export const syncOfflineVisits = async (): Promise<SyncResult> => {
  const drafts = await getOfflineDrafts();
  const result: SyncResult = {
    total: drafts.length,
    synced: 0,
    failed: 0,
    errors: [],
  };

  if (drafts.length === 0) return result;

  for (const draft of drafts) {
    if (!draft.id) continue;
    try {
      // 1. Resolve Location IDs
      const { village_id } = await getOrCreateLocationRPC(
        draft.region,
        draft.district,
        draft.village
      );

      // 2. Upload photo if present and purchased
      let imagePath: string | null = null;
      if (draft.purchased && draft.photo_blob) {
        imagePath = await uploadPurchasePhoto(
          draft.agent_id,
          draft.client_uuid,
          draft.photo_blob
        );
      }

      // 3. Status determination
      const status = draft.purchased ? 'final' : 'pending';
      const finalized_at = draft.purchased ? new Date().toISOString() : null;

      // 4. Insert or Upsert Visit via client_uuid
      const { error: insertError } = await supabase.from('visits').upsert(
        {
          client_uuid: draft.client_uuid,
          agent_id: draft.agent_id,
          village_id,
          visited_at: draft.visited_at,
          duration_minutes: draft.duration_minutes,
          farmer_name: draft.farmer_name,
          farmer_phone: draft.farmer_phone || null,
          crop_id: draft.crop_id || null,
          crop_other: draft.crop_other || null,
          diagnosis: draft.diagnosis,
          prescription: draft.prescription,
          product_id: draft.product_id || null,
          product_other: draft.product_other || null,
          purchased: draft.purchased,
          purchase_amount: draft.purchase_amount || null,
          purchase_image_path: imagePath,
          status,
          finalized_at,
          latitude: draft.latitude || null,
          longitude: draft.longitude || null,
        },
        { onConflict: 'client_uuid' }
      );

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 5. Remove successfully synced draft
      await deleteOfflineDraft(draft.id);
      result.synced += 1;
    } catch (err: any) {
      result.failed += 1;
      const msg = err.message || 'Unknown sync error';
      result.errors.push(msg);
      await updateDraftError(draft.id, msg);
    }
  }

  return result;
};
