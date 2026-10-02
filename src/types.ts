// TypeScript definitions for Shanmukha Agritech Field Agent Tracking

export type UserRole = 'admin' | 'agent';
export type AppLanguage = 'en' | 'te';
export type VisitStatus = 'pending' | 'final' | 'closed';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  username: string;
  phone?: string | null;
  is_active: boolean;
  preferred_language: AppLanguage;
  created_at?: string;
  updated_at?: string;
}

export interface Region {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: string;
  region_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Village {
  id: string;
  district_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Crop {
  id: string;
  name_en: string;
  name_te: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name_en: string;
  name_te: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Visit {
  id: string;
  client_uuid: string;
  agent_id: string;
  village_id: string;
  visited_at: string;
  duration_minutes: number;
  farmer_name: string;
  farmer_phone?: string | null;
  crop_id?: string | null;
  crop_other?: string | null;
  diagnosis: string;
  prescription: string;
  product_id?: string | null;
  product_other?: string | null;
  purchased: boolean;
  purchase_amount?: number | null;
  purchase_image_path?: string | null;
  status: VisitStatus;
  finalized_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  diagnosis_en?: string | null;
  prescription_en?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VisitFull extends Visit {
  agent_name?: string;
  agent_username?: string;
  agent_phone?: string;
  village_name?: string;
  district_id?: string;
  district_name?: string;
  region_id?: string;
  region_name?: string;
  crop_name_en?: string;
  crop_name_te?: string;
  product_name_en?: string;
  product_name_te?: string;
}

export interface VisitAudit {
  id: string;
  visit_id: string;
  changed_by?: string;
  action: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
}

export interface OfflineVisitDraft {
  id?: number; // IndexedDB autoincrement primary key
  client_uuid: string;
  agent_id: string;
  visited_at: string;
  duration_minutes: number;
  farmer_name: string;
  farmer_phone?: string;
  region: string;
  district: string;
  village: string;
  crop_id?: string;
  crop_other?: string;
  diagnosis: string;
  prescription: string;
  product_id?: string;
  product_other?: string;
  purchased: boolean;
  purchase_amount?: number;
  photo_blob?: Blob | null; // Stored offline image
  latitude?: number;
  longitude?: number;
  created_at: number; // timestamp
  sync_attempts?: number;
  error_message?: string;
}
