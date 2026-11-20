// Shanmukha Agritec Head Office Admin Dashboard Types

export type District =
  | 'Medak'
  | 'Sangareddy'
  | 'Siddipet'
  | 'Vikarabad'
  | 'Nizamabad'
  | 'Kamareddy';

export type FAStatus = 'ON_VISIT' | 'ACTIVE' | 'IDLE' | 'OFFLINE' | 'LOCATION_OFF';

export interface LatLng {
  lat: number;
  lng: number;
  timestamp?: string;
  speedKmH?: number;
}

export interface FieldAssistant {
  id: string; // e.g. SAGL-FA-0142
  name: string;
  phone: string;
  email: string;
  district: District;
  mandal: string;
  joinDate: string;
  status: FAStatus;
  appVersion: string;
  batteryLevel: number; // 0-100%
  lastSyncTime: string;
  currentLat: number;
  currentLng: number;
  deviceModel: string;
  assignedFarmersCount: number;
  isActive: boolean;
  monitoringMonths: number;
  qualityScore: number; // 0-100
}

export type RegistrationStatus = 'VERIFIED' | 'PENDING' | 'INACTIVE';

export interface AdminFarmer {
  id: string; // SAGL-TG-26-000XXX
  name: string;
  phone: string;
  village: string;
  mandal: string;
  district: District;
  crop: 'Cotton' | 'Chilli' | 'Paddy' | 'Maize' | 'Redgram';
  cropVariety: string;
  acreage: number;
  assignedFaId: string;
  assignedFaName: string;
  registrationStatus: RegistrationStatus;
  registeredTimestamp?: string;
  lastVisitDate?: string;
  isOverdue: boolean; // >14 days since last visit
  daysSinceLastVisit: number;
  sowingDate: string;
  soilType: string;
}

export type VisitType = 'OBSERVATION_ONLY' | 'WITH_PRESCRIPTION';

export type VASService =
  | 'Soil testing'
  | 'Drone spraying'
  | 'Sticky traps'
  | 'Pheromone traps'
  | 'Haqdarshak'
  | 'Weather advisory'
  | 'None';

export type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FlagType =
  | 'SHORT_VISIT' // < 10 mins
  | 'GPS_JUMP' // speed > 60 km/h or impossible hop
  | 'STATIONARY_FA' // 0 movement on field
  | 'MISSING_GEOSTAMP' // photo lacking GPS EXIF
  | 'DUPLICATE_VISIT' // duplicate visit within 24h
  | 'UNVERIFIED_VISIT' // farmer profile registration pending
  | 'LOCATION_OFF_GAP'; // GPS turned off during work hours

export interface VisitAnomalyFlag {
  id: string;
  type: FlagType;
  severity: FlagSeverity;
  description: string;
  detectedAt: string;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewStatus: 'PENDING' | 'RESOLVED_VALID' | 'FALSE_POSITIVE' | 'ESCALATED';
}

export interface VisitProductSold {
  productId: string;
  productName: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface AdminVisit {
  id: string; // SV-2026-XX-XXXX
  faId: string;
  faName: string;
  farmerId: string;
  farmerName: string;
  district: District;
  village: string;
  crop: string;
  cropStage: 'Sowing' | 'Vegetative' | 'Flowering' | 'Boll formation' | 'Harvest';
  daysAfterSowing: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  distanceKm: number;
  gpsAccuracyMeters: number;
  routeCoordinates: LatLng[];
  visitType: VisitType;
  diagnosis: string;
  prescriptionText: string;
  valueAddedService: VASService;
  productsSold: VisitProductSold[];
  totalSaleAmount: number;
  photos: {
    fieldPhoto: string;
    prescriptionPhoto?: string;
    receiptPhoto?: string;
  };
  videoUrl?: string;
  flags: VisitAnomalyFlag[];
  hasFlags: boolean;
  createdAt: string;
}

export interface YieldRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  district: District;
  crop: string;
  baselineYieldQpa: number; // quintals per acre
  postAdvisoryYieldQpa: number;
  upliftPercent: number;
  usedShanmukhaProducts: boolean;
  season: 'Kharif 2026' | 'Rabi 2026-27';
}

export interface LoyaltyLedgerEntry {
  id: string;
  date: string;
  entityType: 'FA' | 'FARMER';
  entityId: string;
  entityName: string;
  district: District;
  activity: string;
  pointsEarned: number;
  pointsRedeemed: number;
  balancePoints: number;
  payoutStatus: 'PENDING' | 'APPROVED' | 'PAID';
  amountRupees: number;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  targetDistrict: District | 'ALL';
  targetGroup: 'ALL_FAS' | 'ACTIVE_ONLY' | 'NEW_ONBOARDED';
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  scheduledTime: string;
  sentAt?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  deliveredCount: number;
  readCount: number;
  totalRecipients: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export interface FlagThresholds {
  minVisitDurationMinutes: number;
  maxSpeedKmH: number;
  overdueDays: number;
  maxLocationOffMinutes: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'REGIONAL_MANAGER' | 'AGRONOMY_HEAD' | 'VIGILANCE_OFFICER';
  avatar: string;
}
