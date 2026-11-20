// Seed data generator for Shanmukha Agritec Head Office Admin Dashboard
import {
  District,
  FieldAssistant,
  AdminFarmer,
  AdminVisit,
  YieldRecord,
  LoyaltyLedgerEntry,
  Broadcast,
  AuditLog,
  FlagThresholds,
  AdminUser,
  VisitAnomalyFlag,
  LatLng,
  VisitProductSold,
  VASService,
  VisitType,
} from '../types/admin';

export const DISTRICT_COORDS: Record<District, { lat: number; lng: number }> = {
  Medak: { lat: 18.0463, lng: 78.2619 },
  Sangareddy: { lat: 17.6200, lng: 78.0800 },
  Siddipet: { lat: 18.1018, lng: 78.8520 },
  Vikarabad: { lat: 17.3366, lng: 77.9048 },
  Nizamabad: { lat: 18.6725, lng: 78.0941 },
  Kamareddy: { lat: 18.3228, lng: 78.3411 },
};

export const DISTRICT_MANDALS: Record<District, string[]> = {
  Medak: ['Medak Rural', 'Haveli Ghanpur', 'Tekmal', 'Narsapur', 'Kulcharam'],
  Sangareddy: ['Vatpally', 'Jogipet', 'Kandi', 'Sadasivpet', 'Patancheru'],
  Siddipet: ['Siddipet Urban', 'Dubbak', 'Gajwel', 'Mulugu', 'Chinnakodur'],
  Vikarabad: ['Chevella', 'Pargi', 'Tandur', 'Mominpet', 'Nawabpet'],
  Nizamabad: ['Bodhan', 'Armoor', 'Dharapally', 'Kotgiri', 'Varni'],
  Kamareddy: ['Banswada', 'Yellareddy', 'Bhiknoor', 'Domakonda', 'Madnoor'],
};

export const DEFAULT_THRESHOLDS: FlagThresholds = {
  minVisitDurationMinutes: 10,
  maxSpeedKmH: 60,
  overdueDays: 14,
  maxLocationOffMinutes: 30,
};

export const DEFAULT_ADMIN: AdminUser = {
  id: 'ADM-001',
  name: 'Dr. V. Ramana Rao',
  email: 'admin@shanmukha.com',
  role: 'SUPER_ADMIN',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
};

// Seed FA data (~25 Field Assistants)
export const SEED_FAS: FieldAssistant[] = [
  {
    id: 'SAGL-FA-0142',
    name: 'K. Srinivas',
    phone: '+91 90000 00004',
    email: 'k.srinivas@shanmukha.com',
    district: 'Medak',
    mandal: 'Tekmal',
    joinDate: '2025-04-10',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 78,
    lastSyncTime: '3 mins ago',
    currentLat: 18.0482,
    currentLng: 78.2645,
    deviceModel: 'Samsung Galaxy M14 5G',
    assignedFarmersCount: 32,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 94,
  },
  {
    id: 'SAGL-FA-0143',
    name: 'Ravi Kumar',
    phone: '+91 90000 00011',
    email: 'ravi.k@shanmukha.com',
    district: 'Medak',
    mandal: 'Haveli Ghanpur',
    joinDate: '2025-05-15',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 65,
    lastSyncTime: '8 mins ago',
    currentLat: 18.0612,
    currentLng: 78.2711,
    deviceModel: 'Redmi 12 5G',
    assignedFarmersCount: 28,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 91,
  },
  {
    id: 'SAGL-FA-0144',
    name: 'B. Mallesh',
    phone: '+91 90000 00012',
    email: 'b.mallesh@shanmukha.com',
    district: 'Medak',
    mandal: 'Narsapur',
    joinDate: '2025-06-01',
    status: 'IDLE',
    appVersion: 'v2.4.1',
    batteryLevel: 42,
    lastSyncTime: '25 mins ago',
    currentLat: 17.7428,
    currentLng: 78.2831,
    deviceModel: 'Realme Narzo 60',
    assignedFarmersCount: 25,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 82,
  },
  {
    id: 'SAGL-FA-0145',
    name: 'P. Suresh',
    phone: '+91 90000 00013',
    email: 'p.suresh@shanmukha.com',
    district: 'Sangareddy',
    mandal: 'Vatpally',
    joinDate: '2025-03-20',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 92,
    lastSyncTime: '1 min ago',
    currentLat: 17.7124,
    currentLng: 77.9628,
    deviceModel: 'Samsung Galaxy M34',
    assignedFarmersCount: 35,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 96,
  },
  {
    id: 'SAGL-FA-0146',
    name: 'D. Ramesh',
    phone: '+91 90000 00014',
    email: 'd.ramesh@shanmukha.com',
    district: 'Sangareddy',
    mandal: 'Jogipet',
    joinDate: '2025-04-18',
    status: 'LOCATION_OFF',
    appVersion: 'v2.3.9',
    batteryLevel: 28,
    lastSyncTime: '2 hours ago',
    currentLat: 17.7512,
    currentLng: 78.0123,
    deviceModel: 'Vivo Y20',
    assignedFarmersCount: 29,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 68,
  },
  {
    id: 'SAGL-FA-0147',
    name: 'G. Swamy',
    phone: '+91 90000 00015',
    email: 'g.swamy@shanmukha.com',
    district: 'Sangareddy',
    mandal: 'Kandi',
    joinDate: '2025-05-10',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 85,
    lastSyncTime: '4 mins ago',
    currentLat: 17.5812,
    currentLng: 78.1124,
    deviceModel: 'Redmi Note 12',
    assignedFarmersCount: 30,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 89,
  },
  {
    id: 'SAGL-FA-0148',
    name: 'N. Buchappa',
    phone: '+91 90000 00016',
    email: 'n.buchappa@shanmukha.com',
    district: 'Sangareddy',
    mandal: 'Sadasivpet',
    joinDate: '2025-07-01',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 73,
    lastSyncTime: '12 mins ago',
    currentLat: 17.6192,
    currentLng: 77.9541,
    deviceModel: 'Poco M6 Pro',
    assignedFarmersCount: 22,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 88,
  },
  {
    id: 'SAGL-FA-0149',
    name: 'K. Venkatesh',
    phone: '+91 90000 00017',
    email: 'k.venkatesh@shanmukha.com',
    district: 'Siddipet',
    mandal: 'Siddipet Urban',
    joinDate: '2025-02-14',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 68,
    lastSyncTime: '5 mins ago',
    currentLat: 18.1042,
    currentLng: 78.8561,
    deviceModel: 'Samsung Galaxy A14',
    assignedFarmersCount: 38,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 95,
  },
  {
    id: 'SAGL-FA-0150',
    name: 'S. Naresh',
    phone: '+91 90000 00018',
    email: 's.naresh@shanmukha.com',
    district: 'Siddipet',
    mandal: 'Dubbak',
    joinDate: '2025-03-01',
    status: 'IDLE',
    appVersion: 'v2.4.1',
    batteryLevel: 55,
    lastSyncTime: '35 mins ago',
    currentLat: 18.2612,
    currentLng: 78.6142,
    deviceModel: 'Realme 11x',
    assignedFarmersCount: 27,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 79,
  },
  {
    id: 'SAGL-FA-0151',
    name: 'V. Anjaiah',
    phone: '+91 90000 00019',
    email: 'v.anjaiah@shanmukha.com',
    district: 'Siddipet',
    mandal: 'Gajwel',
    joinDate: '2025-06-12',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 81,
    lastSyncTime: '10 mins ago',
    currentLat: 17.8524,
    currentLng: 78.6819,
    deviceModel: 'Samsung Galaxy F14',
    assignedFarmersCount: 31,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 92,
  },
  {
    id: 'SAGL-FA-0152',
    name: 'M. Yadagiri',
    phone: '+91 90000 00020',
    email: 'm.yadagiri@shanmukha.com',
    district: 'Siddipet',
    mandal: 'Mulugu',
    joinDate: '2025-08-01',
    status: 'OFFLINE',
    appVersion: 'v2.3.8',
    batteryLevel: 15,
    lastSyncTime: '1 day ago',
    currentLat: 18.0125,
    currentLng: 78.7412,
    deviceModel: 'Vivo Y16',
    assignedFarmersCount: 18,
    isActive: false,
    monitoringMonths: 3,
    qualityScore: 54,
  },
  {
    id: 'SAGL-FA-0153',
    name: 'T. Laxman',
    phone: '+91 90000 00021',
    email: 't.laxman@shanmukha.com',
    district: 'Vikarabad',
    mandal: 'Chevella',
    joinDate: '2025-04-05',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 79,
    lastSyncTime: '2 mins ago',
    currentLat: 17.3092,
    currentLng: 78.1352,
    deviceModel: 'Redmi Note 11',
    assignedFarmersCount: 33,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 90,
  },
  {
    id: 'SAGL-FA-0154',
    name: 'B. Raju',
    phone: '+91 90000 00022',
    email: 'b.raju@shanmukha.com',
    district: 'Vikarabad',
    mandal: 'Pargi',
    joinDate: '2025-05-18',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 62,
    lastSyncTime: '14 mins ago',
    currentLat: 17.1812,
    currentLng: 77.8912,
    deviceModel: 'Samsung Galaxy M13',
    assignedFarmersCount: 26,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 86,
  },
  {
    id: 'SAGL-FA-0155',
    name: 'K. Krishna',
    phone: '+91 90000 00023',
    email: 'k.krishna@shanmukha.com',
    district: 'Vikarabad',
    mandal: 'Tandur',
    joinDate: '2025-06-25',
    status: 'IDLE',
    appVersion: 'v2.4.1',
    batteryLevel: 48,
    lastSyncTime: '40 mins ago',
    currentLat: 17.2581,
    currentLng: 77.5812,
    deviceModel: 'Realme C55',
    assignedFarmersCount: 24,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 81,
  },
  {
    id: 'SAGL-FA-0156',
    name: 'P. Santosh',
    phone: '+91 90000 00024',
    email: 'p.santosh@shanmukha.com',
    district: 'Vikarabad',
    mandal: 'Mominpet',
    joinDate: '2025-07-15',
    status: 'LOCATION_OFF',
    appVersion: 'v2.4.0',
    batteryLevel: 32,
    lastSyncTime: '3 hours ago',
    currentLat: 17.4124,
    currentLng: 77.9214,
    deviceModel: 'Vivo T2x',
    assignedFarmersCount: 21,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 71,
  },
  {
    id: 'SAGL-FA-0157',
    name: 'C. Satyam',
    phone: '+91 90000 00025',
    email: 'c.satyam@shanmukha.com',
    district: 'Nizamabad',
    mandal: 'Bodhan',
    joinDate: '2025-03-11',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 88,
    lastSyncTime: '2 mins ago',
    currentLat: 18.6641,
    currentLng: 77.8924,
    deviceModel: 'Samsung Galaxy M34',
    assignedFarmersCount: 36,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 93,
  },
  {
    id: 'SAGL-FA-0158',
    name: 'E. Mohan',
    phone: '+91 90000 00026',
    email: 'e.mohan@shanmukha.com',
    district: 'Nizamabad',
    mandal: 'Armoor',
    joinDate: '2025-04-22',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 71,
    lastSyncTime: '9 mins ago',
    currentLat: 18.7912,
    currentLng: 78.2914,
    deviceModel: 'Redmi 13C',
    assignedFarmersCount: 29,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 87,
  },
  {
    id: 'SAGL-FA-0159',
    name: 'D. Prabhakar',
    phone: '+91 90000 00027',
    email: 'd.prabhakar@shanmukha.com',
    district: 'Nizamabad',
    mandal: 'Dharapally',
    joinDate: '2025-05-30',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 94,
    lastSyncTime: '6 mins ago',
    currentLat: 18.5214,
    currentLng: 78.3125,
    deviceModel: 'Poco X5 5G',
    assignedFarmersCount: 34,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 92,
  },
  {
    id: 'SAGL-FA-0160',
    name: 'A. Ramulu',
    phone: '+91 90000 00028',
    email: 'a.ramulu@shanmukha.com',
    district: 'Nizamabad',
    mandal: 'Varni',
    joinDate: '2025-07-08',
    status: 'OFFLINE',
    appVersion: 'v2.3.9',
    batteryLevel: 19,
    lastSyncTime: '5 hours ago',
    currentLat: 18.5812,
    currentLng: 77.9124,
    deviceModel: 'Realme Narzo 50',
    assignedFarmersCount: 23,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 66,
  },
  {
    id: 'SAGL-FA-0161',
    name: 'J. Shankar',
    phone: '+91 90000 00029',
    email: 'j.shankar@shanmukha.com',
    district: 'Kamareddy',
    mandal: 'Banswada',
    joinDate: '2025-02-28',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 82,
    lastSyncTime: '3 mins ago',
    currentLat: 18.3842,
    currentLng: 77.8812,
    deviceModel: 'Samsung Galaxy M14',
    assignedFarmersCount: 37,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 97,
  },
  {
    id: 'SAGL-FA-0162',
    name: 'M. Ashok',
    phone: '+91 90000 00030',
    email: 'm.ashok@shanmukha.com',
    district: 'Kamareddy',
    mandal: 'Yellareddy',
    joinDate: '2025-04-12',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 67,
    lastSyncTime: '15 mins ago',
    currentLat: 18.1924,
    currentLng: 78.0142,
    deviceModel: 'Vivo T2 5G',
    assignedFarmersCount: 27,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 89,
  },
  {
    id: 'SAGL-FA-0163',
    name: 'N. Sai',
    phone: '+91 90000 00031',
    email: 'n.sai@shanmukha.com',
    district: 'Kamareddy',
    mandal: 'Bhiknoor',
    joinDate: '2025-05-20',
    status: 'IDLE',
    appVersion: 'v2.4.1',
    batteryLevel: 51,
    lastSyncTime: '50 mins ago',
    currentLat: 18.2412,
    currentLng: 78.3912,
    deviceModel: 'Realme 10 Pro',
    assignedFarmersCount: 25,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 78,
  },
  {
    id: 'SAGL-FA-0164',
    name: 'G. Prasad',
    phone: '+91 90000 00032',
    email: 'g.prasad@shanmukha.com',
    district: 'Kamareddy',
    mandal: 'Domakonda',
    joinDate: '2025-06-18',
    status: 'ON_VISIT',
    appVersion: 'v2.4.1',
    batteryLevel: 90,
    lastSyncTime: '4 mins ago',
    currentLat: 18.2912,
    currentLng: 78.4312,
    deviceModel: 'Samsung Galaxy A23',
    assignedFarmersCount: 30,
    isActive: true,
    monitoringMonths: 12,
    qualityScore: 91,
  },
  {
    id: 'SAGL-FA-0165',
    name: 'V. Mahesh',
    phone: '+91 90000 00033',
    email: 'v.mahesh@shanmukha.com',
    district: 'Medak',
    mandal: 'Kulcharam',
    joinDate: '2025-07-22',
    status: 'OFFLINE',
    appVersion: 'v2.3.9',
    batteryLevel: 10,
    lastSyncTime: '2 days ago',
    currentLat: 17.9214,
    currentLng: 78.1812,
    deviceModel: 'Redmi 9 Power',
    assignedFarmersCount: 20,
    isActive: false,
    monitoringMonths: 3,
    qualityScore: 61,
  },
  {
    id: 'SAGL-FA-0166',
    name: 'B. Srinivas',
    phone: '+91 90000 00034',
    email: 'b.srinivas@shanmukha.com',
    district: 'Sangareddy',
    mandal: 'Patancheru',
    joinDate: '2025-08-10',
    status: 'ACTIVE',
    appVersion: 'v2.4.1',
    batteryLevel: 76,
    lastSyncTime: '11 mins ago',
    currentLat: 17.5214,
    currentLng: 78.2612,
    deviceModel: 'Motorola G54 5G',
    assignedFarmersCount: 24,
    isActive: true,
    monitoringMonths: 6,
    qualityScore: 85,
  },
];

// Product master catalogue
export const ADMIN_PRODUCTS = [
  {
    id: 'PRD-01',
    name: 'Shan-Emamectin 5% SG',
    packSizes: ['100 g', '250 g', '500 g'],
    prices: { '100 g': 380, '250 g': 850, '500 g': 1600 },
    category: 'Insecticide',
  },
  {
    id: 'PRD-02',
    name: 'Shan-Super Lure Pheromone Trap',
    packSizes: ['5 traps pack', '10 traps pack'],
    prices: { '5 traps pack': 450, '10 traps pack': 850 },
    category: 'IPM / Trap',
  },
  {
    id: 'PRD-03',
    name: 'Shan-MagSul Foliar Micronutrient',
    packSizes: ['1 kg bag', '5 kg bag'],
    prices: { '1 kg bag': 180, '5 kg bag': 800 },
    category: 'Nutrient',
  },
  {
    id: 'PRD-04',
    name: 'Shan-Neem Gold 10,000 PPM',
    packSizes: ['500 ml', '1 Litre'],
    prices: { '500 ml': 420, '1 Litre': 780 },
    category: 'Bio-Pesticide',
  },
  {
    id: 'PRD-05',
    name: 'Shan-Streptocure Antibiotic',
    packSizes: ['6 g sachet', '50 g pack'],
    prices: { '6 g sachet': 65, '50 g pack': 480 },
    category: 'Bactericide',
  },
  {
    id: 'PRD-06',
    name: 'Shan-Carbendazim 50% WP',
    packSizes: ['250 g', '500 g'],
    prices: { '250 g': 240, '500 g': 450 },
    category: 'Fungicide',
  },
];

// Seed generator for ~500 farmers
export function generateSeedFarmers(fas: FieldAssistant[]): AdminFarmer[] {
  const teluguFirstNames = [
    'Ramesh', 'Lakshmi', 'Venkat', 'Suresh', 'Narasimha', 'Padma', 'Buchappa', 'Balareddy',
    'Mallikarjun', 'Shiva', 'Anjaiah', 'Yadagiri', 'Devender', 'Srinivas', 'Laxman', 'Poornima',
    'Kavitha', 'Chandraiah', 'Balaiah', 'Rajaiah', 'Bheemaiah', 'Sayanna', 'Ramulu', 'Gopal',
    'Nageshwar', 'Ravinder', 'Hanumanthu', 'Sanjeeva', 'Shankar', 'Mahesh', 'Prasad', 'Satyam',
    'Bikshapathi', 'Somanna', 'Sailu', 'Mallesham', 'Balamani', 'Renuka', 'Nagamani', 'Thirupathi',
  ];

  const teluguLastNames = [
    'Goud', 'Reddy', 'Rao', 'Kumar', 'Mallaiah', 'Kumari', 'Yadav', 'Patel', 'Chary', 'Sharma',
    'Naidu', 'Mudhiraj', 'Kuruma', 'Munnuru', 'Boya', 'Madiga', 'Mala', 'Golla', 'Padmashali',
  ];

  const crops: ('Cotton' | 'Chilli' | 'Paddy' | 'Maize' | 'Redgram')[] = [
    'Cotton', 'Cotton', 'Cotton', 'Cotton', 'Chilli', 'Paddy', 'Maize', 'Redgram'
  ];

  const varieties: Record<string, string[]> = {
    Cotton: ['RCH 659 BG-II', 'Mallika Bt II', 'Ajeet 155', 'Bhakti Bt', 'Kaveri Jadoo'],
    Chilli: ['Teja S-17', 'Armoor Special', 'Byadgi 5531', 'Syngenta 2043'],
    Paddy: ['BPT 5204 (Samba Mahsuri)', 'MTU 1010', 'Telangana Sona (RNR 15048)', 'KNM 118'],
    Maize: ['Pioneer 3396', 'NK 6240', 'DKC 9108', 'Kaveri 50'],
    Redgram: ['PRG 176', 'Asha (ICPL 87119)', 'WRG 65', 'Maruti'],
  };

  const soils = ['Black cotton soil', 'Medium black soil', 'Red sandy loam', 'Clay loam', 'Alluvial soil'];

  const farmers: AdminFarmer[] = [];
  let codeNum = 200;

  fas.forEach((fa) => {
    const count = fa.assignedFarmersCount || 20;
    const mandals = DISTRICT_MANDALS[fa.district];

    for (let i = 0; i < count; i++) {
      codeNum++;
      const fn = teluguFirstNames[(codeNum * 7) % teluguFirstNames.length];
      const ln = teluguLastNames[(codeNum * 3) % teluguLastNames.length];
      const fullName = `${fn} ${ln}`;
      const crop = crops[(codeNum * 5) % crops.length];
      const cropVarList = varieties[crop];
      const cropVariety = cropVarList[codeNum % cropVarList.length];
      const mandal = mandals[i % mandals.length];
      const village = `${mandal} Village ${((i % 4) + 1)}`;
      const acreage = parseFloat((1.5 + ((codeNum % 8) * 0.9)).toFixed(1));
      
      // Farmer onboarding status
      const isVerified = (codeNum % 10) !== 7 && (codeNum % 10) !== 9; // ~80%
      const isPending = (codeNum % 10) === 7; // ~10%
      const regStatus: 'VERIFIED' | 'PENDING' | 'INACTIVE' = isVerified
        ? 'VERIFIED'
        : isPending
        ? 'PENDING'
        : 'INACTIVE';

      // Last visit: some recent, some overdue (>14 days)
      const daysAgo = (codeNum % 35);
      const isOverdue = daysAgo > 14;

      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const lastVisitDate = d.toISOString().split('T')[0];

      farmers.push({
        id: `SAGL-TG-26-000${codeNum}`,
        name: fullName,
        phone: `+91 98${Math.floor(10000000 + ((codeNum * 4731) % 89999999))}`,
        village,
        mandal,
        district: fa.district,
        crop,
        cropVariety,
        acreage,
        assignedFaId: fa.id,
        assignedFaName: fa.name,
        registrationStatus: regStatus,
        registeredTimestamp: regStatus === 'VERIFIED' ? '2026-06-18 10:14:00' : undefined,
        lastVisitDate,
        isOverdue,
        daysSinceLastVisit: daysAgo,
        sowingDate: '2026-06-20',
        soilType: soils[codeNum % soils.length],
      });
    }
  });

  return farmers;
}

// Generate realistic visit route points around a center
function generateRealisticRoute(centerLat: number, centerLng: number, hasGpsJump: boolean, isStationary: boolean): LatLng[] {
  if (isStationary) {
    return [
      { lat: centerLat, lng: centerLng, speedKmH: 0 },
      { lat: centerLat, lng: centerLng, speedKmH: 0 },
      { lat: centerLat, lng: centerLng, speedKmH: 0 },
    ];
  }

  const waypoints: LatLng[] = [];
  const count = 6 + Math.floor(Math.random() * 5);
  let curLat = centerLat;
  let curLng = centerLng;

  for (let i = 0; i < count; i++) {
    // Normal walking step ~ 0.0003 to 0.0008 deg
    const dLat = (Math.random() - 0.5) * 0.001;
    const dLng = (Math.random() - 0.5) * 0.001;

    let speed = 2.5 + Math.random() * 2.0; // km/h walking

    if (hasGpsJump && i === Math.floor(count / 2)) {
      // Teleportation / speed jump anomaly
      curLat += 0.045; // ~5 km jump
      curLng += 0.045;
      speed = 78.4; // 78 km/h jump anomaly
    } else {
      curLat += dLat;
      curLng += dLng;
    }

    waypoints.push({
      lat: parseFloat(curLat.toFixed(6)),
      lng: parseFloat(curLng.toFixed(6)),
      speedKmH: parseFloat(speed.toFixed(1)),
    });
  }

  return waypoints;
}

// Seed Visits (~750 visits across past 90 days)
export function generateSeedVisits(fas: FieldAssistant[], farmers: AdminFarmer[]): AdminVisit[] {
  const visits: AdminVisit[] = [];
  const vasList: VASService[] = [
    'Soil testing',
    'Drone spraying',
    'Sticky traps',
    'Pheromone traps',
    'Weather advisory',
    'Haqdarshak',
    'None',
    'None',
  ];

  const stages: ('Sowing' | 'Vegetative' | 'Flowering' | 'Boll formation' | 'Harvest')[] = [
    'Vegetative', 'Flowering', 'Boll formation', 'Boll formation', 'Harvest'
  ];

  const diagnoses = [
    'Early instar larvae of Pink bollworm seen inside squares and young bolls.',
    'Whitefly nymph sucking damage with minor sooty mold onset.',
    'Magnesium deficiency causing leaf reddening on lower branch canopy.',
    'Jassids hopper burn symptoms on leaf margins.',
    'Crop healthy and vegetative flush optimal; preventive bio-spray advised.',
    'Bacterial leaf blight angular spots near leaf veins.',
  ];

  let visitNum = 1000;

  // Generate visits for each farmer
  farmers.forEach((farmer, idx) => {
    // 1 to 3 visits per farmer over 90 days
    const visitsCount = 1 + (idx % 3);

    for (let v = 0; v < visitsCount; v++) {
      visitNum++;
      const daysAgo = (idx * 3 + v * 28) % 90;
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - daysAgo);
      visitDate.setHours(9 + (idx % 7), 15 + (idx % 40), 0);

      const endTime = new Date(visitDate);
      
      // Anomaly: 5% short visits (<10 mins)
      const isShortVisit = visitNum % 23 === 0;
      // Anomaly: 3% GPS jumps
      const hasGpsJump = visitNum % 31 === 0;
      // Anomaly: 2% stationary FA
      const isStationary = visitNum % 47 === 0;
      // Anomaly: 3% missing geostamp
      const missingGeostamp = visitNum % 37 === 0;

      const durationMinutes = isShortVisit
        ? 4 + (visitNum % 5) // 4-8 mins
        : 18 + (visitNum % 30); // 18-47 mins
      
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      const distCoord = DISTRICT_COORDS[farmer.district];
      const baseLat = distCoord.lat + ((idx % 30) - 15) * 0.008;
      const baseLng = distCoord.lng + ((idx % 30) - 15) * 0.008;

      const routeCoords = generateRealisticRoute(baseLat, baseLng, hasGpsJump, isStationary);
      const distanceKm = isStationary ? 0.05 : parseFloat((0.6 + (durationMinutes * 0.04)).toFixed(2));

      const cropStage = stages[visitNum % stages.length];
      const vas = vasList[visitNum % vasList.length];
      const visitType: VisitType = (visitNum % 5 === 0) ? 'OBSERVATION_ONLY' : 'WITH_PRESCRIPTION';

      // Products sold
      const productsSold: VisitProductSold[] = [];
      let totalSaleAmount = 0;

      if (visitType === 'WITH_PRESCRIPTION' && visitNum % 3 !== 0) {
        const p1 = ADMIN_PRODUCTS[visitNum % ADMIN_PRODUCTS.length];
        const packSize = p1.packSizes[0];
        const unitPrice = (p1.prices as any)[packSize] || 380;
        const qty = 1 + (visitNum % 3);
        const amount = unitPrice * qty;
        productsSold.push({
          productId: p1.id,
          productName: p1.name,
          packSize,
          quantity: qty,
          unitPrice,
          totalAmount: amount,
        });
        totalSaleAmount += amount;
      }

      // Flags detection
      const flags: VisitAnomalyFlag[] = [];
      if (isShortVisit) {
        flags.push({
          id: `FLG-${visitNum}-1`,
          type: 'SHORT_VISIT',
          severity: 'HIGH',
          description: `Visit completed in only ${durationMinutes} minutes (Threshold: 10 mins).`,
          detectedAt: visitDate.toISOString(),
          isReviewed: false,
          reviewStatus: 'PENDING',
        });
      }
      if (hasGpsJump) {
        flags.push({
          id: `FLG-${visitNum}-2`,
          type: 'GPS_JUMP',
          severity: 'CRITICAL',
          description: `Impossible GPS speed detected (78.4 km/h jump across field quadrants).`,
          detectedAt: visitDate.toISOString(),
          isReviewed: false,
          reviewStatus: 'PENDING',
        });
      }
      if (isStationary) {
        flags.push({
          id: `FLG-${visitNum}-3`,
          type: 'STATIONARY_FA',
          severity: 'MEDIUM',
          description: 'Zero spatial displacement during 25-minute field inspection.',
          detectedAt: visitDate.toISOString(),
          isReviewed: false,
          reviewStatus: 'PENDING',
        });
      }
      if (missingGeostamp) {
        flags.push({
          id: `FLG-${visitNum}-4`,
          type: 'MISSING_GEOSTAMP',
          severity: 'MEDIUM',
          description: 'Photo metadata stripped or GPS coordinates absent from upload.',
          detectedAt: visitDate.toISOString(),
          isReviewed: false,
          reviewStatus: 'PENDING',
        });
      }
      if (farmer.registrationStatus === 'INACTIVE' || farmer.registrationStatus === 'PENDING') {
        flags.push({
          id: `FLG-${visitNum}-5`,
          type: 'UNVERIFIED_VISIT',
          severity: 'HIGH',
          description: 'Farm visit logged for pending farmer profile registration.',
          detectedAt: visitDate.toISOString(),
          isReviewed: false,
          reviewStatus: 'PENDING',
        });
      }

      visits.push({
        id: `SV-2026-${String(visitDate.getMonth() + 1).padStart(2, '0')}-${String(visitNum).padStart(4, '0')}`,
        faId: farmer.assignedFaId,
        faName: farmer.assignedFaName,
        farmerId: farmer.id,
        farmerName: farmer.name,
        district: farmer.district,
        village: farmer.village,
        crop: farmer.crop,
        cropStage,
        daysAfterSowing: 45 + (visitNum % 60),
        startTime: visitDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        endTime: endTime.toLocaleString('en-IN', { timeStyle: 'short' }),
        durationMinutes,
        distanceKm,
        gpsAccuracyMeters: 4 + (visitNum % 8),
        routeCoordinates: routeCoords,
        visitType,
        diagnosis: diagnoses[visitNum % diagnoses.length],
        prescriptionText:
          visitType === 'WITH_PRESCRIPTION'
            ? 'Apply foliar spray of Shan-Emamectin 5% SG at 80g/acre. Add Shan-MagSul 1% for lower leaf reddening.'
            : 'No chemical intervention required. Advised clean weeding and monitoring.',
        valueAddedService: vas,
        productsSold,
        totalSaleAmount,
        photos: {
          fieldPhoto: 'https://images.unsplash.com/photo-1599818816933-289b4b9b9a69?w=600&auto=format&fit=crop&q=80',
          prescriptionPhoto: visitType === 'WITH_PRESCRIPTION' ? 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80' : undefined,
          receiptPhoto: totalSaleAmount > 0 ? 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80' : undefined,
        },
        videoUrl: (visitNum % 10 === 0) ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
        flags,
        hasFlags: flags.length > 0,
        createdAt: visitDate.toISOString(),
      });
    }
  });

  return visits;
}

// Seed Yield Records (~100 farmers)
export function generateSeedYields(farmers: AdminFarmer[]): YieldRecord[] {
  const records: YieldRecord[] = [];
  const sampleFarmers = farmers.slice(0, 100);

  sampleFarmers.forEach((farmer, idx) => {
    const isCotton = farmer.crop === 'Cotton';
    const isPaddy = farmer.crop === 'Paddy';
    const isChilli = farmer.crop === 'Chilli';

    const base = isCotton ? 7.5 : isPaddy ? 22.0 : isChilli ? 12.0 : 18.0;
    const baselineYieldQpa = parseFloat((base + ((idx % 7) * 0.4)).toFixed(1));
    const uplift = idx % 5 === 0 ? 0.08 : 0.22 + ((idx % 6) * 0.03); // +8% to +37%
    const postAdvisoryYieldQpa = parseFloat((baselineYieldQpa * (1 + uplift)).toFixed(1));
    const upliftPercent = parseFloat((((postAdvisoryYieldQpa - baselineYieldQpa) / baselineYieldQpa) * 100).toFixed(1));

    records.push({
      id: `YLD-2026-${String(idx + 1).padStart(3, '0')}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      district: farmer.district,
      crop: farmer.crop,
      baselineYieldQpa,
      postAdvisoryYieldQpa,
      upliftPercent,
      usedShanmukhaProducts: idx % 6 !== 0,
      season: 'Kharif 2026',
    });
  });

  return records;
}

// Seed Loyalty Points Ledger
export function generateSeedLoyalty(fas: FieldAssistant[], farmers: AdminFarmer[]): LoyaltyLedgerEntry[] {
  const entries: LoyaltyLedgerEntry[] = [];
  let num = 1;

  fas.forEach((fa, idx) => {
    entries.push({
      id: `LOY-FA-${num++}`,
      date: '2026-11-18',
      entityType: 'FA',
      entityId: fa.id,
      entityName: fa.name,
      district: fa.district,
      activity: 'Weekly 100% Visit Target Achieved',
      pointsEarned: 500,
      pointsRedeemed: 0,
      balancePoints: 2450 + (idx * 200),
      payoutStatus: 'APPROVED',
      amountRupees: 500,
    });
    entries.push({
      id: `LOY-FA-${num++}`,
      date: '2026-11-12',
      entityType: 'FA',
      entityId: fa.id,
      entityName: fa.name,
      district: fa.district,
      activity: 'Soil Sample Collection Milestone (10 samples)',
      pointsEarned: 300,
      pointsRedeemed: 200,
      balancePoints: 1950 + (idx * 200),
      payoutStatus: 'PAID',
      amountRupees: 300,
    });
  });

  farmers.slice(0, 30).forEach((farmer, idx) => {
    entries.push({
      id: `LOY-FRM-${num++}`,
      date: '2026-11-15',
      entityType: 'FARMER',
      entityId: farmer.id,
      entityName: farmer.name,
      district: farmer.district,
      activity: 'Membership Renewal + Digital Soil Test adoption',
      pointsEarned: 250,
      pointsRedeemed: 0,
      balancePoints: 450 + (idx * 50),
      payoutStatus: 'PENDING',
      amountRupees: 250,
    });
  });

  return entries;
}

// Seed Broadcasts
export const SEED_BROADCASTS: Broadcast[] = [
  {
    id: 'BC-01',
    title: 'Urgent: Pink Bollworm Alert in Medak & Sangareddy',
    message: 'High moth catches reported in Sangareddy lures. Inspect green bolls for entry holes and prioritize Shan-Emamectin 5% SG advisory.',
    targetDistrict: 'ALL',
    targetGroup: 'ALL_FAS',
    priority: 'CRITICAL',
    scheduledTime: '2026-11-18 08:00',
    sentAt: '2026-11-18 08:00',
    status: 'SENT',
    deliveredCount: 25,
    readCount: 23,
    totalRecipients: 25,
  },
  {
    id: 'BC-02',
    title: 'Farmer Profile & Crop Verification Standards',
    message: 'Ensure all farmer details including sown crop, variety, and GPS farm boundaries are fully verified during field visits.',
    targetDistrict: 'ALL',
    targetGroup: 'ALL_FAS',
    priority: 'URGENT',
    scheduledTime: '2026-11-15 09:30',
    sentAt: '2026-11-15 09:30',
    status: 'SENT',
    deliveredCount: 25,
    readCount: 25,
    totalRecipients: 25,
  },
  {
    id: 'BC-03',
    title: 'New Drone Spraying Pilot Launched in Siddipet',
    message: 'Subsidized drone spraying service available for cotton farmers with >3 acres. Log VAS request directly under visit flow.',
    targetDistrict: 'Siddipet',
    targetGroup: 'ACTIVE_ONLY',
    priority: 'NORMAL',
    scheduledTime: '2026-11-12 11:00',
    sentAt: '2026-11-12 11:00',
    status: 'SENT',
    deliveredCount: 5,
    readCount: 4,
    totalRecipients: 5,
  },
];

// Seed Audit Logs
export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-101',
    timestamp: '2026-11-19 14:15:20',
    adminName: 'Dr. V. Ramana Rao',
    action: 'BULK_REASSIGN_FARMERS',
    module: 'Farmers',
    details: 'Reassigned 12 farmers from FA-0152 (M. Yadagiri) to FA-0151 (V. Anjaiah) due to extended leave.',
    ipAddress: '192.168.1.42',
  },
  {
    id: 'AUD-102',
    timestamp: '2026-11-19 11:30:10',
    adminName: 'Dr. V. Ramana Rao',
    action: 'APPROVE_INVOICE',
    module: 'Invoices',
    details: 'Approved membership payment invoice SAGL-INV-2026-089 for farmer Lakshmi Prasad (₹500).',
    ipAddress: '192.168.1.42',
  },
  {
    id: 'AUD-103',
    timestamp: '2026-11-18 16:45:00',
    adminName: 'Dr. V. Ramana Rao',
    action: 'FLAG_REVIEW',
    module: 'Data Quality & Fraud',
    details: 'Marked anomaly FLG-1044-1 (Short Visit 6m) as FALSE_POSITIVE with remark: "Farmer was in emergency medical transit".',
    ipAddress: '192.168.1.42',
  },
  {
    id: 'AUD-104',
    timestamp: '2026-11-18 08:00:15',
    adminName: 'Dr. V. Ramana Rao',
    action: 'SEND_BROADCAST',
    module: 'Broadcasts',
    details: 'Dispatched Critical broadcast BC-01 to all 25 FAs regarding Pink Bollworm threshold alert.',
    ipAddress: '192.168.1.42',
  },
  {
    id: 'AUD-105',
    timestamp: '2026-11-17 10:20:30',
    adminName: 'Dr. V. Ramana Rao',
    action: 'SETTINGS_UPDATE',
    module: 'Settings',
    details: 'Updated flag threshold: minVisitDurationMinutes changed from 8 to 10 minutes.',
    ipAddress: '192.168.1.42',
  },
];
