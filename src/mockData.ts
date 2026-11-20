// Mock data for Shanpoorna Field Assistant App
// Shanmukha Agritec Limited

export interface Dealer {
  id: string;
  name: string;
  phone: string;
  location: string;
  isAssigned: boolean;
}

export interface Product {
  id: string;
  name: string;
  activeSalt: string;
  packSize: string;
  recommendedDose: string;
  category: 'Insecticide' | 'Nutrient' | 'Bio-Pesticide' | 'Fungicide' | 'IPM / Trap';
  targetPest: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  amount: number;
  utrId: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: 'Membership Fee' | 'Soil Test Kit' | 'Input Purchase' | 'Service Fee';
  proofImage: string;
}

export interface VisitPhoto {
  id: string;
  url: string;
  caption: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface VisitRecommendation {
  problemAddressed: string;
  productName: string;
  dosePerAcre: string;
  totalQuantity: string;
  method: string;
  applyBy: string;
  additionalProducts: string[];
  notes?: string;
  hoExpertAdvice?: {
    needed: boolean;
    issue: string;
    sendTo: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending reply' | 'APPROVED' | 'REJECTED';
    hoRemarks?: string;
  };
}

export interface FieldVisit {
  id: string;
  farmerId: string;
  farmerName: string;
  dateTime: string;
  gps: string;
  cropName: string;
  plotArea: string;
  cropStage: 'Sowing' | 'Vegetative' | 'Flowering' | 'Boll formation' | 'Harvest';
  pestsSeen: string[];
  severity: 'Low' | 'Medium' | 'High';
  areaAffected: string;
  damageObserved: string;
  photos: VisitPhoto[];
  fieldObservations: string;
  recommendation: VisitRecommendation;
  status: 'PENDING HO APPROVAL' | 'APPROVED';
}

export interface FarmerQA {
  // Basic Details Q1-Q6
  farmerName: string; // Q1
  mobileNumber: string; // Q2
  village: string; // Q3
  mandal: string;
  district: string;
  totalLandholding: string; // Q4 (e.g. "5.0 acres")
  currentCropSown: string; // Q5 (e.g. "Cotton")
  cropVariety: string; // Q6 (e.g. "RCH 659 BG-II")
  
  // Extended Details Q7-Q14
  acreageUnderCrop: string; // Q7 (e.g. "3.5 acres")
  dateOfSowing: string; // Q8 (e.g. "18 Jun 2026")
  cropStage: 'Sowing' | 'Vegetative' | 'Flowering' | 'Boll formation' | 'Harvest'; // Q9
  irrigationSource: string; // Q10 (e.g. "Borewell")
  soilType: string; // Q11 (e.g. "Black soil · Yes (KVK, 2025)")
  dealerAssociated: string; // Q13 (e.g. "Sri Sai Agro Agencies, Vatpally")
  previousSeasonCropYield: string; // Q14 (e.g. "Kharif 2025 Cotton · 9 q/acre")
  currentPestDisease: {
    pest: string;
    severity: 'Low' | 'Medium' | 'High';
    details: string;
  }; // Q12
  
  // Farm Location
  gpsCoords?: {
    lat: number;
    lng: number;
    capturedAt: string;
  };
}

export interface Farmer {
  id: string;
  farmerIdCode: string; // e.g. "SAGL-TG-26-000214"
  status: 'MEMBER' | 'PAYMENT PENDING' | 'NEW';
  qa: FarmerQA;
  soilTestReport?: {
    sampleId: string;
    collectedDate: string;
    ph: number;
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    organicCarbon: string;
    summary: string;
  };
}

export interface ResourceItem {
  id: string;
  title: string;
  category: 'Crop' | 'Product';
  type: 'video' | 'presentation' | 'pdf';
  tag: string;
  sizeOrDuration: string;
  linkUrl: string;
}

// Master Dealers
export const INITIAL_DEALERS: Dealer[] = [
  {
    id: 'D01',
    name: 'Sri Sai Agro Agencies',
    phone: '+91 90000 00003',
    location: 'Vatpally, Sangareddy (Demo)',
    isAssigned: true,
  },
  {
    id: 'D02',
    name: 'Kisan Seva Kendra',
    phone: '+91 90000 00005',
    location: 'Medchal, Telangana (Demo)',
    isAssigned: true,
  },
  {
    id: 'D03',
    name: 'Balaji Fertilizers & Seeds',
    phone: '+91 90000 00006',
    location: 'Narsapur, Medak (Demo)',
    isAssigned: true,
  },
  {
    id: 'D04',
    name: 'Annapurna Rythu Seva',
    phone: '+91 90000 00007',
    location: 'Chevella, Ranga Reddy (Demo)',
    isAssigned: false,
  },
  {
    id: 'D05',
    name: 'Venkateshwara Agri Clinic',
    phone: '+91 90000 00008',
    location: 'Jogipet, Sangareddy (Demo)',
    isAssigned: false,
  },
  {
    id: 'D06',
    name: 'Laxmi Narasimha Krishi Kendra',
    phone: '+91 90000 00009',
    location: 'Siddipet, Telangana (Demo)',
    isAssigned: false,
  },
];

// Master Products
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-01',
    name: 'Shan-Emamectin 5% SG',
    activeSalt: 'Emamectin benzoate 5% SG',
    packSize: '100 g / 250 g / 500 g',
    recommendedDose: '80 g / acre',
    category: 'Insecticide',
    targetPest: 'Pink bollworm, Bollworm, DBM',
  },
  {
    id: 'PRD-02',
    name: 'Shan-Super Lure Pheromone Trap',
    activeSalt: 'Gossyplure pheromone blend',
    packSize: '5 traps / acre pack',
    recommendedDose: '5 traps / acre',
    category: 'IPM / Trap',
    targetPest: 'Pink bollworm adult monitoring & mating disruption',
  },
  {
    id: 'PRD-03',
    name: 'Shan-MagSul Foliar Micronutrient',
    activeSalt: 'Magnesium sulphate 1% water soluble',
    packSize: '1 kg / 5 kg bag',
    recommendedDose: '1.0 kg / 100 L water (foliar spray)',
    category: 'Nutrient',
    targetPest: 'Leaf reddening, Magnesium deficiency',
  },
  {
    id: 'PRD-04',
    name: 'Shan-Neem Gold 10,000 PPM',
    activeSalt: 'Azadirachtin 1% EC (10,000 ppm)',
    packSize: '500 ml / 1 L bottle',
    recommendedDose: '400 ml / acre',
    category: 'Bio-Pesticide',
    targetPest: 'Whitefly, Jassids, Aphids, early borer instars',
  },
  {
    id: 'PRD-05',
    name: 'Shan-Streptocure Antibiotic',
    activeSalt: 'Streptomycin sulphate 90% + Tetracycline 10%',
    packSize: '6 g sachet',
    recommendedDose: '6 g / 50 L water',
    category: 'Fungicide',
    targetPest: 'Bacterial leaf blight, Black arm, Angular leaf spot',
  },
];

// Initial Farmers
export const INITIAL_FARMERS: Farmer[] = [
  {
    id: 'F001',
    farmerIdCode: 'SAGL-TG-26-000214',
    status: 'MEMBER',
    qa: {
      farmerName: 'Ramesh Goud',
      mobileNumber: '+91 98765 43210',
      village: 'Vatpally',
      mandal: 'Vatpally',
      district: 'Sangareddy',
      totalLandholding: '5.0 acres',
      currentCropSown: 'Cotton',
      cropVariety: 'RCH 659 BG-II',
      acreageUnderCrop: '3.5 acres',
      dateOfSowing: '18 Jun 2026',
      cropStage: 'Boll formation',
      irrigationSource: 'Borewell',
      soilType: 'Black soil · Yes (KVK, 2025)',
      dealerAssociated: 'Sri Sai Agro Agencies, Vatpally',
      previousSeasonCropYield: 'Kharif 2025 Cotton · 9 q/acre',
      currentPestDisease: {
        pest: 'Pink bollworm',
        severity: 'Medium',
        details: '1 crop photo attached · Larvae in green bolls',
      },
      gpsCoords: {
        lat: 17.7124,
        lng: 77.9628,
        capturedAt: '18 Nov 2026, 10:42 AM',
      },
    },
    soilTestReport: {
      sampleId: 'STR-2026-081',
      collectedDate: '22 Jun 2026',
      ph: 7.4,
      nitrogen: '190 kg/ha (Low)',
      phosphorus: '22 kg/ha (Medium)',
      potassium: '315 kg/ha (High)',
      organicCarbon: '0.45% (Medium)',
      summary: 'Alkaline black soil, requires nitrogen booster and zinc sulphate foliar.',
    },
  },
  {
    id: 'F002',
    farmerIdCode: 'SAGL-TG-26-000215',
    status: 'PAYMENT PENDING',
    qa: {
      farmerName: 'Lakshmi Prasad',
      mobileNumber: '+91 97000 00042',
      village: 'Chevella',
      mandal: 'Chevella',
      district: 'Ranga Reddy',
      totalLandholding: '4.0 acres',
      currentCropSown: 'Cotton',
      cropVariety: 'Mallika Bt II',
      acreageUnderCrop: '3.0 acres',
      dateOfSowing: '24 Jun 2026',
      cropStage: 'Boll formation',
      irrigationSource: 'Rain-fed',
      soilType: 'Red sandy loam',
      dealerAssociated: 'Annapurna Rythu Seva, Chevella',
      previousSeasonCropYield: 'Kharif 2025 Maize · 22 q/acre',
      currentPestDisease: {
        pest: 'Whitefly',
        severity: 'Medium',
        details: 'Yellowing of upper canopy',
      },
      gpsCoords: {
        lat: 17.3086,
        lng: 78.1348,
        capturedAt: '15 Nov 2026, 11:15 AM',
      },
    },
  },
  {
    id: 'F003',
    farmerIdCode: 'SAGL-TG-26-000216',
    status: 'NEW',
    qa: {
      farmerName: 'Suresh Mallaiah',
      mobileNumber: '+91 96000 00058',
      village: 'Gorrekkal',
      mandal: 'Tekmal',
      district: 'Medak',
      totalLandholding: '2.5 acres',
      currentCropSown: 'Paddy',
      cropVariety: 'BPT 5204 (Samba Mahsuri)',
      acreageUnderCrop: '2.5 acres',
      dateOfSowing: '10 Jul 2026',
      cropStage: 'Flowering',
      irrigationSource: 'Canal',
      soilType: 'Clay loam',
      dealerAssociated: 'Balaji Fertilizers & Seeds, Narsapur',
      previousSeasonCropYield: 'Rabi 2025 Groundnut · 14 q/acre',
      currentPestDisease: {
        pest: 'None',
        severity: 'Low',
        details: 'Crop healthy',
      },
      gpsCoords: {
        lat: 17.9241,
        lng: 78.2194,
        capturedAt: '17 Nov 2026, 09:30 AM',
      },
    },
  },
  {
    id: 'F004',
    farmerIdCode: 'SAGL-TG-26-000217',
    status: 'MEMBER',
    qa: {
      farmerName: 'Venkat Rao',
      mobileNumber: '+91 99000 00013',
      village: 'Palvatla',
      mandal: 'Jogipet',
      district: 'Sangareddy',
      totalLandholding: '6.0 acres',
      currentCropSown: 'Cotton',
      cropVariety: 'RCH 659 BG-II',
      acreageUnderCrop: '4.5 acres',
      dateOfSowing: '20 Jun 2026',
      cropStage: 'Harvest',
      irrigationSource: 'Borewell',
      soilType: 'Black cotton soil',
      dealerAssociated: 'Sri Sai Agro Agencies, Vatpally',
      previousSeasonCropYield: 'Kharif 2025 Cotton · 10 q/acre',
      currentPestDisease: {
        pest: 'Jassids',
        severity: 'Low',
        details: 'Mild leaf curling',
      },
      gpsCoords: {
        lat: 17.7512,
        lng: 78.0123,
        capturedAt: '12 Nov 2026, 03:20 PM',
      },
    },
  },
  {
    id: 'F005',
    farmerIdCode: 'SAGL-TG-26-000218',
    status: 'MEMBER',
    qa: {
      farmerName: 'Narasimha Rao',
      mobileNumber: '+91 95000 00074',
      village: 'Medak Rural',
      mandal: 'Medak',
      district: 'Medak',
      totalLandholding: '3.5 acres',
      currentCropSown: 'Chilli',
      cropVariety: 'Teja S-17',
      acreageUnderCrop: '2.0 acres',
      dateOfSowing: '05 Aug 2026',
      cropStage: 'Flowering',
      irrigationSource: 'Drip / Borewell',
      soilType: 'Red loamy soil',
      dealerAssociated: 'Balaji Fertilizers & Seeds, Narsapur',
      previousSeasonCropYield: 'Kharif 2025 Maize · 26 q/acre',
      currentPestDisease: {
        pest: 'Leaf reddening',
        severity: 'Low',
        details: 'Magnesium deficiency noticed',
      },
      gpsCoords: {
        lat: 18.0463,
        lng: 78.2619,
        capturedAt: '14 Nov 2026, 04:45 PM',
      },
    },
  },
  {
    id: 'F006',
    farmerIdCode: 'SAGL-TG-26-000219',
    status: 'PAYMENT PENDING',
    qa: {
      farmerName: 'Padma Kumari',
      mobileNumber: '+91 94000 00036',
      village: 'Narsapur',
      mandal: 'Narsapur',
      district: 'Medak',
      totalLandholding: '3.0 acres',
      currentCropSown: 'Cotton',
      cropVariety: 'Ajeet 155',
      acreageUnderCrop: '2.5 acres',
      dateOfSowing: '22 Jun 2026',
      cropStage: 'Boll formation',
      irrigationSource: 'Borewell',
      soilType: 'Medium black soil',
      dealerAssociated: 'Balaji Fertilizers & Seeds, Narsapur',
      previousSeasonCropYield: 'Kharif 2025 Paddy · 24 q/acre',
      currentPestDisease: {
        pest: 'Pink bollworm',
        severity: 'Medium',
        details: 'Initial rosette flower symptoms',
      },
      gpsCoords: {
        lat: 17.7428,
        lng: 78.2831,
        capturedAt: '16 Nov 2026, 01:10 PM',
      },
    },
  },
];

// Initial Invoices for Approval
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-101',
    invoiceNo: 'SAGL-INV-2026-089',
    farmerId: 'F002',
    farmerName: 'Lakshmi Prasad',
    farmerMobile: '+91 97000 00042',
    amount: 500,
    utrId: 'UTR-9823471012',
    date: '19 Nov 2026, 11:20 AM',
    status: 'PENDING',
    type: 'Membership Fee',
    proofImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'INV-102',
    invoiceNo: 'SAGL-INV-2026-088',
    farmerId: 'F006',
    farmerName: 'Padma Kumari',
    farmerMobile: '+91 94000 00036',
    amount: 500,
    utrId: 'UTR-7734892104',
    date: '18 Nov 2026, 04:15 PM',
    status: 'PENDING',
    type: 'Membership Fee',
    proofImage: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'INV-103',
    invoiceNo: 'SAGL-INV-2026-082',
    farmerId: 'F001',
    farmerName: 'Ramesh Goud',
    farmerMobile: '+91 98765 43210',
    amount: 850,
    utrId: 'UTR-6623910482',
    date: '15 Nov 2026, 02:30 PM',
    status: 'APPROVED',
    type: 'Soil Test Kit',
    proofImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'INV-104',
    invoiceNo: 'SAGL-INV-2026-079',
    farmerId: 'F004',
    farmerName: 'Venkat Rao',
    farmerMobile: '+91 99000 00013',
    amount: 500,
    utrId: 'UTR-5519283740',
    date: '12 Nov 2026, 09:45 AM',
    status: 'APPROVED',
    type: 'Membership Fee',
    proofImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
  },
];

// Initial Field Visits for Ramesh Goud
export const INITIAL_VISITS: FieldVisit[] = [
  {
    id: 'SV-2026-11-0381',
    farmerId: 'F001',
    farmerName: 'Ramesh Goud',
    dateTime: '18 Nov 2026, 10:42 AM',
    gps: '17.71°N, 77.96°E',
    cropName: 'Cotton',
    plotArea: 'Plot 2 · 3.5 ac',
    cropStage: 'Boll formation',
    pestsSeen: ['Pink bollworm', 'Leaf reddening'],
    severity: 'Medium',
    areaAffected: '1.0 acre',
    damageObserved: '8–10% bolls',
    photos: [
      {
        id: 'P1',
        url: 'https://images.unsplash.com/photo-1599818816933-289b4b9b9a69?w=400&auto=format&fit=crop&q=80',
        caption: 'Boll larva entry hole',
        lat: 17.7124,
        lng: 77.9628,
        timestamp: '18 Nov 2026, 10:44 AM',
      },
      {
        id: 'P2',
        url: 'https://images.unsplash.com/photo-1594488556858-a53ec296f8be?w=400&auto=format&fit=crop&q=80',
        caption: 'Leaf reddening symptoms',
        lat: 17.7124,
        lng: 77.9628,
        timestamp: '18 Nov 2026, 10:46 AM',
      },
      {
        id: 'P3',
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80',
        caption: 'Field overview Plot 2',
        lat: 17.7124,
        lng: 77.9628,
        timestamp: '18 Nov 2026, 10:47 AM',
      },
    ],
    fieldObservations: 'Larvae seen inside green bolls; lower leaves turning red on 2 rows near borewell.',
    recommendation: {
      problemAddressed: 'Pink bollworm',
      productName: 'Emamectin benzoate 5% SG (Shan-Emamectin)',
      dosePerAcre: '80 g',
      totalQuantity: '80 g × 1 ac',
      method: 'Foliar spray',
      applyBy: '20 Nov 2026',
      additionalProducts: [
        'Pink bollworm pheromone lure · 5 traps/acre',
        'Magnesium sulphate 1% · foliar spray',
      ],
      notes: 'Ensure thorough coverage of middle and top branches.',
      hoExpertAdvice: {
        needed: true,
        issue: 'Leaf reddening spreading on 2 rows – nutrient or disease? Photos attached.',
        sendTo: 'Agronomist',
        priority: 'Medium',
        status: 'APPROVED',
        hoRemarks: 'Agronomist confirmed physiological magnesium deficiency due to heavy boll load. Recommended Shan-MagSul foliar spray at 10g/L.',
      },
    },
    status: 'APPROVED',
  },
  {
    id: 'SV-2026-10-0244',
    farmerId: 'F001',
    farmerName: 'Ramesh Goud',
    dateTime: '28 Oct 2026, 11:15 AM',
    gps: '17.71°N, 77.96°E',
    cropName: 'Cotton',
    plotArea: 'Plot 1 · 3.5 ac',
    cropStage: 'Flowering',
    pestsSeen: ['Whitefly'],
    severity: 'Low',
    areaAffected: '0.5 acre',
    damageObserved: 'Minor nymph sucking on underside',
    photos: [
      {
        id: 'P4',
        url: 'https://images.unsplash.com/photo-1594488556858-a53ec296f8be?w=400&auto=format&fit=crop&q=80',
        caption: 'Flower bud & whitefly nymphs',
        lat: 17.7123,
        lng: 77.9627,
        timestamp: '28 Oct 2026, 11:20 AM',
      },
    ],
    fieldObservations: 'Early squaring and flowering good. Minor whitefly activity near border rows.',
    recommendation: {
      problemAddressed: 'Whitefly',
      productName: 'Shan-Neem Gold 10,000 PPM',
      dosePerAcre: '400 ml',
      totalQuantity: '1.4 L (3.5 ac)',
      method: 'Foliar spray',
      applyBy: '30 Oct 2026',
      additionalProducts: ['Yellow sticky traps · 8 / acre'],
      notes: 'Spray during early morning hours.',
    },
    status: 'APPROVED',
  },
];

// Farm Reports for Ramesh Goud
export interface FarmReportDoc {
  id: string;
  title: string;
  category: 'Service invoices' | 'Invoices uploaded';
  date: string;
  amount?: string;
  status: 'Verified' | 'Paid' | 'Processing';
  pdfUrl: string;
  docCode: string;
}

export const INITIAL_FARM_REPORTS: FarmReportDoc[] = [
  {
    id: 'REP-01',
    title: 'Soil Health & Complete Analysis Card',
    category: 'Service invoices',
    date: '15 Nov 2026',
    amount: '₹850',
    status: 'Paid',
    pdfUrl: '#',
    docCode: 'SHC-2026-9921',
  },
  {
    id: 'REP-02',
    title: 'Shanpoorna Annual Membership Certificate',
    category: 'Service invoices',
    date: '18 Jun 2026',
    amount: '₹500',
    status: 'Paid',
    pdfUrl: '#',
    docCode: 'SMC-2026-0214',
  },
  {
    id: 'REP-03',
    title: 'Input Purchase Bill - Sri Sai Agro Agencies',
    category: 'Invoices uploaded',
    date: '10 Nov 2026',
    amount: '₹2,450',
    status: 'Verified',
    pdfUrl: '#',
    docCode: 'INV-SSA-8812',
  },
  {
    id: 'REP-04',
    title: 'Bt Cotton Seed Certificate & Invoice',
    category: 'Invoices uploaded',
    date: '18 Jun 2026',
    amount: '₹1,880',
    status: 'Verified',
    pdfUrl: '#',
    docCode: 'INV-RCH-3019',
  },
];

// Resources Tab Mock Data
export const INITIAL_RESOURCES: ResourceItem[] = [
  // Crop Resources - Videos
  {
    id: 'RES-01',
    title: 'Bt Cotton Bollworm Identification & Threshold',
    category: 'Crop',
    type: 'video',
    tag: 'Cotton · Pest Management',
    sizeOrDuration: '8m 45s',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'RES-02',
    title: 'Leaf Reddening in Cotton: Causes and Foliar Remedy',
    category: 'Crop',
    type: 'video',
    tag: 'Cotton · Micronutrients',
    sizeOrDuration: '6m 20s',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'RES-03',
    title: 'Drip Irrigation & Fertigation Schedule for Cotton',
    category: 'Crop',
    type: 'video',
    tag: 'Water Management',
    sizeOrDuration: '11m 15s',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'RES-04',
    title: 'Chilli Thrips & Mite Management Guide',
    category: 'Crop',
    type: 'video',
    tag: 'Chilli · Integrated Pest Mgmt',
    sizeOrDuration: '9m 10s',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  // Crop Resources - Presentations
  {
    id: 'RES-05',
    title: 'Rabi Season Comprehensive Crop Advisory (PPT)',
    category: 'Crop',
    type: 'presentation',
    tag: 'Rabi 2026-27 · Advisory',
    sizeOrDuration: '24 Slides · 4.2 MB',
    linkUrl: '#',
  },
  {
    id: 'RES-06',
    title: 'Soil Health Card Interpretation Protocol',
    category: 'Crop',
    type: 'presentation',
    tag: 'Soil Analysis Guide',
    sizeOrDuration: '18 Slides · 3.1 MB',
    linkUrl: '#',
  },
  // Crop Resources - Print materials
  {
    id: 'RES-07',
    title: 'Cotton Spraying Calendar & Dosage Chart (Telugu / Eng)',
    category: 'Crop',
    type: 'pdf',
    tag: 'Printable Poster · PDF',
    sizeOrDuration: '2 Pages · 1.8 MB',
    linkUrl: '#',
  },
  {
    id: 'RES-08',
    title: 'Farmer Field Scouting Pocket Guide',
    category: 'Crop',
    type: 'pdf',
    tag: 'Field Assistant Manual',
    sizeOrDuration: '8 Pages · 2.5 MB',
    linkUrl: '#',
  },
  // Product Resources - Videos
  {
    id: 'RES-09',
    title: 'Shan-Emamectin 5% SG Mode of Action Demo',
    category: 'Product',
    type: 'video',
    tag: 'Product Training · Video',
    sizeOrDuration: '5m 50s',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'RES-10',
    title: 'Shan-Super Lure Pheromone Trap Installation Step-by-Step',
    category: 'Product',
    type: 'video',
    tag: 'Trap Demo',
    sizeOrDuration: '4m 30s',
    linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  // Product Resources - Presentations
  {
    id: 'RES-11',
    title: 'Shanmukha Agritec Product Portfolio 2026-27',
    category: 'Product',
    type: 'presentation',
    tag: 'Sales & Advisory Slides',
    sizeOrDuration: '42 Slides · 8.4 MB',
    linkUrl: '#',
  },
  // Product Resources - Print materials
  {
    id: 'RES-12',
    title: 'Product Dosage and Compatibility Guide (Foldable)',
    category: 'Product',
    type: 'pdf',
    tag: 'Dealer & FA Leaflet',
    sizeOrDuration: '4 Pages · 2.1 MB',
    linkUrl: '#',
  },
];

// Notifications
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'approval' | 'visit' | 'alert';
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'N1',
    title: 'Recommendation Approved by HO',
    message: 'HO Agronomist Dr. Rao approved recommendation for Ramesh Goud (Cotton).',
    time: '15 mins ago',
    isRead: false,
    type: 'approval',
  },
  {
    id: 'N2',
    title: 'New Farmer Payment Submitted',
    message: 'Lakshmi Prasad submitted ₹500 membership fee via UPI. Verify invoice.',
    time: '2 hours ago',
    isRead: false,
    type: 'visit',
  },
  {
    id: 'N3',
    title: 'Weather Warning: Medak District',
    message: 'Light localized showers expected in Sangareddy/Medak over next 48 hrs.',
    time: '5 hours ago',
    isRead: true,
    type: 'alert',
  },
];
