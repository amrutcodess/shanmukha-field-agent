import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

export const compressPhoto = async (file: File | Blob): Promise<Blob> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };
  try {
    const compressed = await imageCompression(file as File, options);
    return compressed;
  } catch (error) {
    console.error('Photo compression failed, returning original:', error);
    return file;
  }
};

export const uploadPurchasePhoto = async (
  userId: string,
  clientUuid: string,
  photoBlob: Blob
): Promise<string> => {
  const fileName = `${userId}/${clientUuid}_${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from('purchase-photos')
    .upload(fileName, photoBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  return data.path;
};

export const uploadPrescriptionPhoto = async (
  userId: string,
  clientUuid: string,
  photoBlob: Blob
): Promise<string> => {
  const fileName = `${userId}/${clientUuid}_${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from('purchase-photos')
    .upload(`prescriptions/${fileName}`, photoBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Prescription photo upload failed: ${error.message}`);
  }

  return data.path;
};

export const getSignedPhotoUrl = async (path: string): Promise<string | null> => {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage
      .from('purchase-photos')
      .createSignedUrl(path, 3600); // 1 hour expiration

    if (error || !data) {
      console.error('Failed to get signed URL:', error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Signed URL exception:', err);
    return null;
  }
};
