export type Language = 'te' | 'en';

export type VendorId = 'fyllo' | 'kshema' | 'samunnati' | 'biota';

export interface VendorInfo {
  id: VendorId;
  name: string;
  nameTe: string;
  category: string;
  categoryTe: string;
  tagline: string;
  taglineTe: string;
  desc: string;
  descTe: string;
  icon: string;
  gradient: string;
  color: string;
  bgLight: string;
}

export type IrrigationType = 'Borewell' | 'Canal' | 'Rain-fed';
export type SeasonType = 'Kharif' | 'Rabi' | 'Summer';

export interface Farmer {
  id: string;
  name: string;
  nameTe: string;
  phone: string;
  village: string;
  villageTe: string;
  district: string;
  districtTe: string;
  mandal?: string;
  state: string;
  crop: string;
  cropTe: string;
  acres: number;
  avatar?: string;
  // Geotag fields
  lat?: number;
  lng?: number;
  accuracy?: number;
  geotagCapturedAt?: string;
  // Farm onboarding specifics
  irrigationType?: IrrigationType;
  season?: SeasonType;
}

export interface ConsentRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerVillage: string;
  vendorId: VendorId;
  vendorName: string;
  status: 'active' | 'withdrawn';
  consentedAt: string;
  withdrawnAt?: string;
}

export type KeyValueStatus = 'good' | 'warning' | 'critical';

export interface ReportKeyValue {
  label: string;
  labelTe?: string;
  value: string;
  status: KeyValueStatus;
  unit?: string;
  progressPercent?: number;
}

export interface Report {
  id: string;
  farmerId: string;
  vendorId: VendorId;
  vendorName: string;
  title: string;
  titleTe: string;
  date: string;
  summary: string;
  summaryTe: string;
  keyValues: ReportKeyValue[];
  advice: string;
  adviceTe: string;
  isNew: boolean;
  pdfUrl?: string;
}

export type AlertType = 'weather' | 'insurance' | 'loan' | 'soil' | 'admin' | 'general';

export interface AlertNotification {
  id: string;
  farmerId: string; // or 'all'
  title: string;
  titleTe: string;
  message: string;
  messageTe: string;
  vendorId?: VendorId;
  vendorName?: string;
  type: AlertType;
  date: string;
  isRead: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  farmerName: string;
  vendorName: string;
  action: 'Consent given' | 'Consent withdrawn' | 'Request sent' | 'Result received' | 'Report published' | 'Notification sent';
  status: 'Completed' | 'Pending' | 'Active' | 'Delivered';
  details?: string;
}

export interface FieldVisitRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  crop: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'attended';
}
