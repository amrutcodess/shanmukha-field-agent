import { 
  Farmer, 
  ConsentRecord, 
  Report, 
  AlertNotification, 
  ActivityLog, 
  VendorInfo,
  FieldVisitRequest,
  VendorId
} from '../types';
import { DATA_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const VENDORS: Record<VendorId, VendorInfo> = {
  fyllo: {
    id: 'fyllo',
    name: 'Fyllo',
    nameTe: 'ఫైల్లో (Fyllo)',
    category: 'Sensors & Weather',
    categoryTe: 'సెన్సార్లు & వాతావరణం',
    tagline: 'IoT Soil & Climate Advisory',
    taglineTe: 'నేల తేమ & వాతావరణ సలహా',
    desc: 'Real-time soil moisture and micro-climate data from farm IoT sensors.',
    descTe: 'మీ పొలంలో అమర్చిన సెన్సార్ల ద్వారా నేల తేమ, ఉష్ణోగ్రత మరియు వర్ష సూచన వివరాలు తెలుసుకోండి.',
    icon: 'Radio',
    gradient: 'from-emerald-500/15 via-teal-500/10 to-emerald-600/5',
    color: '#0D9488',
    bgLight: '#F0FDFA'
  },
  kshema: {
    id: 'kshema',
    name: 'Kshema',
    nameTe: 'క్షేమ (Kshema)',
    category: 'Crop Insurance',
    categoryTe: 'పంట బీమా రక్షణ',
    tagline: 'Digital Crop Protection',
    taglineTe: 'నమ్మకమైన పంట బీమా',
    desc: 'Simple, fast crop insurance protection against drought, pest damage, and unseasonal rainfall.',
    descTe: 'అకాల వర్షాలు, పురుగు చీడపీడల నుండి మీ పంటకు పూర్తి రక్షణ మరియు సులభమైన బీమా క్లెయిమ్స్.',
    icon: 'ShieldCheck',
    gradient: 'from-blue-500/15 via-indigo-500/10 to-blue-600/5',
    color: '#2563EB',
    bgLight: '#EFF6FF'
  },
  samunnati: {
    id: 'samunnati',
    name: 'Samunnati',
    nameTe: 'సమున్నతి (Samunnati)',
    category: 'Finance & Commerce',
    categoryTe: 'రుణాలు & పంట అమ్మకం',
    tagline: 'Agri Loans & Market Access',
    taglineTe: 'సులువుగా పంట రుణాలు & విక్రయం',
    desc: 'Low-interest working capital loans for inputs and direct market selling at fair prices.',
    descTe: 'విత్తనాలు, ఎరువుల కోసం సరసమైన వడ్డీకి రుణాలు మరియు మీ పంటకు సరైన గిట్టుబాటు ధర.',
    icon: 'Coins',
    gradient: 'from-amber-500/15 via-orange-500/10 to-amber-600/5',
    color: '#D97706',
    bgLight: '#FFFBEB'
  },
  biota: {
    id: 'biota',
    name: 'BioTa',
    nameTe: 'బయోటా (BioTa)',
    category: 'Soil Health',
    categoryTe: 'భూసార నివేదిక',
    tagline: 'Soil Testing & Nutrition Plan',
    taglineTe: 'భూసార పరీక్ష & ఎరువుల లెక్క',
    desc: 'Comprehensive lab testing for soil nutrients, pH, and tailored organic fertilizer advisory.',
    descTe: 'మీ పొలం నేల సారం, పోషకాల శాతం తెలుసుకుని, ఖర్చులు తగ్గించి అధిక దిగుబడి సాధించే నివేదిక.',
    icon: 'FlaskConical',
    gradient: 'from-purple-500/15 via-pink-500/10 to-purple-600/5',
    color: '#9333EA',
    bgLight: '#FAF5FF'
  }
};

export const INITIAL_FARMERS: Farmer[] = [
  {
    id: 'farmer-1',
    name: 'Ramesh Reddy',
    nameTe: 'రమేష్ రెడ్డి',
    phone: '9876543210',
    village: 'Medpalli',
    villageTe: 'మేడ్పల్లి',
    district: 'Karimnagar',
    districtTe: 'కరీంనగర్',
    mandal: 'Ramagundam',
    state: 'Telangana',
    crop: 'Paddy',
    cropTe: 'వరి',
    acres: 3,
    avatar: '👨‍🌾',
    lat: 18.7562,
    lng: 79.5165,
    accuracy: 8,
    geotagCapturedAt: '05 Nov 2026, 10:15 AM',
    irrigationType: 'Borewell',
    season: 'Kharif'
  },
  {
    id: 'farmer-2',
    name: 'Anji Reddy',
    nameTe: 'అంజి రెడ్డి',
    phone: '9848023456',
    village: 'Ibrahimpatnam',
    villageTe: 'ఇబ్రహీంపట్నం',
    district: 'Ranga Reddy',
    districtTe: 'రంగారెడ్డి',
    mandal: 'Ibrahimpatnam',
    state: 'Telangana',
    crop: 'Cotton',
    cropTe: 'పత్తి',
    acres: 5,
    avatar: '👨‍🌾',
    lat: 17.1953,
    lng: 78.6475,
    accuracy: 12,
    geotagCapturedAt: '03 Nov 2026, 11:30 AM',
    irrigationType: 'Rain-fed',
    season: 'Kharif'
  },
  {
    id: 'farmer-3',
    name: 'Lakshmi Devi',
    nameTe: 'లక్ష్మీ దేవి',
    phone: '9440134567',
    village: 'Guntur Rural',
    villageTe: 'గుంటూరు రూరల్',
    district: 'Guntur',
    districtTe: 'గుంటూరు',
    mandal: 'Guntur',
    state: 'Andhra Pradesh',
    crop: 'Chilli',
    cropTe: 'మిరప',
    acres: 4,
    avatar: '👩‍🌾',
    lat: 16.3067,
    lng: 80.4365,
    accuracy: 10,
    geotagCapturedAt: '01 Nov 2026, 09:45 AM',
    irrigationType: 'Borewell',
    season: 'Rabi'
  },
  {
    id: 'farmer-4',
    name: 'Venkat Rao',
    nameTe: 'వెంకట్ రావు',
    phone: '9989045678',
    village: 'Khammam Rural',
    villageTe: 'ఖమ్మం రూరల్',
    district: 'Khammam',
    districtTe: 'ఖమ్మం',
    state: 'Telangana',
    crop: 'Chilli',
    cropTe: 'మిరప',
    acres: 6,
    avatar: '👨‍🌾',
    lat: 17.2473,
    lng: 80.1514,
    accuracy: 14,
    geotagCapturedAt: '28 Oct 2026, 04:20 PM',
    irrigationType: 'Canal',
    season: 'Kharif'
  },
  {
    id: 'farmer-5',
    name: 'Mallesh Goud',
    nameTe: 'మల్లేష్ గౌడ్',
    phone: '9701056789',
    village: 'Siddipet',
    villageTe: 'సిద్దిపేట',
    district: 'Siddipet',
    districtTe: 'సిద్దిపేట',
    state: 'Telangana',
    crop: 'Maize',
    cropTe: 'మొక్కజొన్న',
    acres: 2.5,
    avatar: '👨‍🌾'
  },
  {
    id: 'farmer-6',
    name: 'Sitaramulu',
    nameTe: 'సీతారాములు',
    phone: '9390167890',
    village: 'Kurnool Rural',
    villageTe: 'కర్నూలు రూరల్',
    district: 'Kurnool',
    districtTe: 'కర్నూలు',
    state: 'Andhra Pradesh',
    crop: 'Groundnut',
    cropTe: 'వేరుశనగ',
    acres: 7,
    avatar: '👨‍🌾'
  },
  {
    id: 'farmer-7',
    name: 'Padma Kumari',
    nameTe: 'పద్మ కుమారి',
    phone: '9177078901',
    village: 'Warangal Rural',
    villageTe: 'వరంగల్ రూరల్',
    district: 'Warangal',
    districtTe: 'వరంగల్',
    state: 'Telangana',
    crop: 'Paddy',
    cropTe: 'వరి',
    acres: 3.5,
    avatar: '👩‍🌾'
  },
  {
    id: 'farmer-8',
    name: 'Nageswara Rao',
    nameTe: 'నాగేశ్వర రావు',
    phone: '9490089012',
    village: 'Tenali',
    villageTe: 'తెనాలి',
    district: 'Guntur',
    districtTe: 'గుంటూరు',
    state: 'Andhra Pradesh',
    crop: 'Paddy',
    cropTe: 'వరి',
    acres: 4,
    avatar: '👨‍🌾'
  },
  {
    id: 'farmer-9',
    name: 'Ramanaiah',
    nameTe: 'రమణయ్య',
    phone: '9866090123',
    village: 'Kadapa Rural',
    villageTe: 'కడప రూరల్',
    district: 'YSR Kadapa',
    districtTe: 'వైఎస్ఆర్ కడప',
    state: 'Andhra Pradesh',
    crop: 'Banana',
    cropTe: 'అరటి',
    acres: 3,
    avatar: '👨‍🌾'
  },
  {
    id: 'farmer-10',
    name: 'Srinivasulu',
    nameTe: 'శ్రీనివాసులు',
    phone: '9959001234',
    village: 'Nalgonda Rural',
    villageTe: 'నల్గొండ రూరల్',
    district: 'Nalgonda',
    districtTe: 'నల్గొండ',
    state: 'Telangana',
    crop: 'Cotton',
    cropTe: 'పత్తి',
    acres: 5,
    avatar: '👨‍🌾'
  },
  {
    id: 'farmer-11',
    name: 'Kanakamma',
    nameTe: 'కనకమ్మ',
    phone: '9441011223',
    village: 'Mahabubnagar Rural',
    villageTe: 'మహబూబ్ నగర్',
    district: 'Mahabubnagar',
    districtTe: 'మహబూబ్ నగర్',
    state: 'Telangana',
    crop: 'Red Gram',
    cropTe: 'కంది',
    acres: 4,
    avatar: '👩‍🌾'
  },
  {
    id: 'farmer-12',
    name: 'Chandrasekhar',
    nameTe: 'చంద్రశేఖర్',
    phone: '9676022334',
    village: 'Anantapur Rural',
    villageTe: 'అనంతపురం రూరల్',
    district: 'Anantapur',
    districtTe: 'అనంతపురం',
    state: 'Andhra Pradesh',
    crop: 'Groundnut',
    cropTe: 'వేరుశనగ',
    acres: 8,
    avatar: '👨‍🌾'
  }
];

export const INITIAL_CONSENTS: ConsentRecord[] = [
  {
    id: 'c-fyllo-1',
    farmerId: 'farmer-1',
    farmerName: 'Ramesh Reddy',
    farmerPhone: '9876543210',
    farmerVillage: 'Medpalli',
    vendorId: 'fyllo',
    vendorName: 'Fyllo',
    status: 'active',
    consentedAt: '05 Nov 2026, 10:15 AM'
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-fyllo-1',
    farmerId: 'farmer-1',
    vendorId: 'fyllo',
    vendorName: 'Fyllo',
    title: 'Fyllo నేల & వాతావరణ సలహా రిపోర్టు',
    titleTe: 'Fyllo నేల & వాతావరణ సలహా రిపోర్టు',
    date: '06 Nov 2026, 09:30 AM',
    summary: 'మేడ్పల్లి పొలంలో ఏర్పాటు చేసిన ఐఓటీ సెన్సార్ల ప్రకారం నేలలో తేమ తగినంతగా ఉంది. రాబోయే 48 గంటల్లో వర్ష సూచన ఉన్నందున నీటి తడి ఇవ్వడం నిలిపివేయండి.',
    summaryTe: 'మేడ్పల్లి పొలంలో ఏర్పాటు చేసిన ఐఓటీ సెన్సార్ల ప్రకారం నేలలో తేమ తగినంతగా ఉంది. రాబోయే 48 గంటల్లో వర్ష సూచన ఉన్నందున నీటి తడి ఇవ్వడం నిలిపివేయండి.',
    keyValues: [
      { label: 'నేల తేమ (Soil Moisture)', value: '68%', status: 'good', progressPercent: 68 },
      { label: 'ఆకు తేమ (Leaf Wetness)', value: '42%', status: 'good', progressPercent: 42 },
      { label: '48 గంటల వర్ష సూచన (Rain Forecast)', value: '35 mm', status: 'warning', progressPercent: 65 },
      { label: 'వాతావరణ ఉష్ణోగ్రత (Air Temp)', value: '31°C', status: 'good', progressPercent: 55 }
    ],
    advice: 'గ్రామంలో రాబోయే 48 గంటల్లో ఒక మోస్తరు వర్షం (35 మి.మీ) పడే అవకాశం ఉంది. ప్రస్తుతానికి యూరియా లేదా ఇతర ఎరువుల పిచికారీ నిలిపివేయండి. వరి మడులలో నీరు నిల్వ ఉండకుండా మురుగు కాలువలను శుభ్రం చేసుకోండి.',
    adviceTe: 'గ్రామంలో రాబోయే 48 గంటల్లో ఒక మోస్తరు వర్షం (35 మి.మీ) పడే అవకాశం ఉంది. ప్రస్తుతానికి యూరియా లేదా ఇతర ఎరువుల పిచికారీ నిలిపివేయండి. వరి మడులలో నీరు నిల్వ ఉండకుండా మురుగు కాలువలను శుభ్రం చేసుకోండి.',
    isNew: false
  },
  {
    id: 'rep-biota-1',
    farmerId: 'farmer-1',
    vendorId: 'biota',
    vendorName: 'BioTa',
    title: 'BioTa భూసార పరీక్ష & పోషకాల నివేదిక',
    titleTe: 'BioTa భూసార పరీక్ష & పోషకాల నివేదిక',
    date: '04 Nov 2026, 04:15 PM',
    summary: 'ల్యాబ్ పరీక్ష ఫలితాల ప్రకారం మీ నేల ఉదజని సూచిక (pH) సాధారణంగా ఉంది. అయితే నత్రజని మరియు సేంద్రీయ కర్బనం మోతాదులను కొద్దిగా పెంచాలి.',
    summaryTe: 'ల్యాబ్ పరీక్ష ఫలితాల ప్రకారం మీ నేల ఉదజని సూచిక (pH) సాధారణంగా ఉంది. అయితే నత్రజని మరియు సేంద్రీయ కర్బనం మోతాదులను కొద్దిగా పెంచాలి.',
    keyValues: [
      { label: 'నేల pH (Soil pH)', value: '6.8', status: 'good', progressPercent: 68 },
      { label: 'సేంద్రీయ కర్బనం (Organic Carbon)', value: '0.52%', status: 'warning', progressPercent: 52 },
      { label: 'లభ్య నత్రజని (Nitrogen N)', value: '210 kg/ha', status: 'warning', progressPercent: 45 },
      { label: 'లభ్య భాస్వరం (Phosphorus P)', value: '24 kg/ha', status: 'good', progressPercent: 70 },
      { label: 'లభ్య పొటాష్ (Potash K)', value: '290 kg/ha', status: 'good', progressPercent: 82 }
    ],
    advice: 'మీ నేలలో సేంద్రీయ కర్బనం పెరగడానికి ఎకరాకు 2 టన్నుల పశువుల ఎరువు లేదా 2 బస్తాల వర్మీ కంపోస్ట్ వేయండి. యూరియాను ఒకేసారి వేయకుండా 2-3 దఫాలుగా వేస్తే పంట ఏపుగా ఎదుగుతుంది.',
    adviceTe: 'మీ నేలలో సేంద్రీయ కర్బనం పెరగడానికి ఎకరాకు 2 టన్నుల పశువుల ఎరువు లేదా 2 బస్తాల వర్మీ కంపోస్ట్ వేయండి. యూరియాను ఒకేసారి వేయకుండా 2-3 దఫాలుగా వేస్తే పంట ఏపుగా ఎదుగుతుంది.',
    isNew: false
  }
];

export const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alt-1',
    farmerId: 'farmer-1',
    title: 'వర్ష హెచ్చరిక (Weather Advisory)',
    titleTe: 'వర్ష హెచ్చరిక (Weather Advisory)',
    message: 'మేడ్పల్లి పరిసరాల్లో రాబోయే 48 గంటల్లో మోస్తరు నుండి భారీ వర్షం పడవచ్చు. ఎరువులు చల్లడం వాయిదా వేయండి.',
    messageTe: 'మేడ్పల్లి పరిసరాల్లో రాబోయే 48 గంటల్లో మోస్తరు నుండి భారీ వర్షం పడవచ్చు. ఎరువులు చల్లడం వాయిదా వేయండి.',
    vendorId: 'fyllo',
    vendorName: 'Fyllo',
    type: 'weather',
    date: '07 Nov 2026, 08:00 AM',
    isRead: false
  },
  {
    id: 'alt-2',
    farmerId: 'farmer-1',
    title: 'పంట బీమా గడువు సమాచారం',
    titleTe: 'పంట బీమా గడువు సమాచారం',
    message: 'ఖరీఫ్ వరి పంటకు క్షేమ పంట బీమా నమోదు గడువు నవంబర్ 15తో ముగుస్తుంది. సురక్షితంగా నమోదు చేసుకోండి.',
    messageTe: 'ఖరీఫ్ వరి పంటకు క్షేమ పంట బీమా నమోదు గడువు నవంబర్ 15తో ముగుస్తుంది. సురక్షితంగా నమోదు చేసుకోండి.',
    vendorId: 'kshema',
    vendorName: 'Kshema',
    type: 'insurance',
    date: '06 Nov 2026, 02:30 PM',
    isRead: false
  },
  {
    id: 'alt-3',
    farmerId: 'farmer-1',
    title: 'రైతు బంధు / కిసాన్ నిధుల జమ నోటీసు',
    titleTe: 'రైతు బంధు / కిసాన్ నిధుల జమ నోటీసు',
    message: 'ప్రభుత్వ వ్యవసాయ పెట్టుబడి సహాయం ఖాతాలో జమయినట్లు సమాచారం. మీ బ్యాంక్ ఖాతా పరిశీలించుకోగలరు.',
    messageTe: 'ప్రభుత్వ వ్యవసాయ పెట్టుబడి సహాయం ఖాతాలో జమయినట్లు సమాచారం. మీ బ్యాంక్ ఖాతా పరిశీలించుకోగలరు.',
    type: 'admin',
    date: '05 Nov 2026, 11:20 AM',
    isRead: true
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '05 Nov 2026, 10:15 AM',
    farmerName: 'Ramesh Reddy',
    vendorName: 'Fyllo',
    action: 'Consent given',
    status: 'Active',
    details: 'Shared: Name, Phone, Medpalli, Paddy'
  },
  {
    id: 'log-2',
    timestamp: '06 Nov 2026, 09:30 AM',
    farmerName: 'Ramesh Reddy',
    vendorName: 'Fyllo',
    action: 'Report published',
    status: 'Completed',
    details: 'Soil & Weather report issued with 4 KPIs'
  },
  {
    id: 'log-3',
    timestamp: '04 Nov 2026, 04:15 PM',
    farmerName: 'Ramesh Reddy',
    vendorName: 'BioTa',
    action: 'Report published',
    status: 'Completed',
    details: 'Soil Health Analysis report delivered'
  }
];

// Storage Keys
const STORAGE_KEYS = {
  FARMERS: 'shanmukha_farmers',
  CONSENTS: 'shanmukha_consents',
  REPORTS: 'shanmukha_reports',
  ALERTS: 'shanmukha_alerts',
  ACTIVITY_LOGS: 'shanmukha_activity_logs',
  HELP_REQUESTS: 'shanmukha_help_requests',
  APP_LANG: 'shanmukha_app_lang'
};

// Optional Supabase Client initialization
let supabaseClient: SupabaseClient | null = null;
if (DATA_MODE === 'supabase' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
  }
}

export function notifyDataChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('shanmukha_data_updated'));
  }
}

export const storageService = {
  initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.FARMERS)) {
      localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(INITIAL_FARMERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONSENTS)) {
      localStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(INITIAL_CONSENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HELP_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.HELP_REQUESTS, JSON.stringify([]));
    }
  },

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(INITIAL_FARMERS));
    localStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(INITIAL_CONSENTS));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    localStorage.setItem(STORAGE_KEYS.HELP_REQUESTS, JSON.stringify([]));
    notifyDataChange();
  },

  // Farmers
  getFarmers(): Farmer[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FARMERS) || '[]');
    } catch {
      return INITIAL_FARMERS;
    }
  },

  getFarmerById(id: string): Farmer | undefined {
    return this.getFarmers().find(f => f.id === id);
  },

  getFarmerByPhone(phone: string): Farmer | undefined {
    const clean = phone.replace(/\D/g, '');
    return this.getFarmers().find(f => f.phone.replace(/\D/g, '') === clean);
  },

  addFarmer(newFarmerData: Omit<Farmer, 'id'> & { id?: string }): Farmer {
    const farmers = this.getFarmers();
    const newFarmer: Farmer = {
      ...newFarmerData,
      id: newFarmerData.id || 'farmer-' + Date.now()
    };
    farmers.unshift(newFarmer);
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));

    this.addActivityLog({
      farmerName: newFarmer.name,
      vendorName: 'Onboarding',
      action: 'Request sent',
      status: 'Completed',
      details: `New farmer registered from ${newFarmer.village} (${newFarmer.crop})`
    });

    if (supabaseClient) {
      supabaseClient.from('farmers').insert({
        id: newFarmer.id,
        name: newFarmer.name,
        name_te: newFarmer.nameTe,
        phone: newFarmer.phone,
        village: newFarmer.village,
        village_te: newFarmer.villageTe,
        district: newFarmer.district,
        district_te: newFarmer.districtTe,
        mandal: newFarmer.mandal,
        state: newFarmer.state,
        crop: newFarmer.crop,
        crop_te: newFarmer.cropTe,
        acres: newFarmer.acres,
        irrigation_type: newFarmer.irrigationType,
        season: newFarmer.season,
        lat: newFarmer.lat,
        lng: newFarmer.lng,
        accuracy: newFarmer.accuracy,
        geotag_captured_at: newFarmer.geotagCapturedAt,
        avatar: newFarmer.avatar
      }).then();
    }

    notifyDataChange();
    return newFarmer;
  },

  updateFarmer(farmer: Farmer): Farmer {
    const farmers = this.getFarmers();
    const idx = farmers.findIndex(f => f.id === farmer.id);
    if (idx >= 0) {
      farmers[idx] = farmer;
      localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
      notifyDataChange();
    }
    return farmer;
  },

  // Consents
  getConsents(): ConsentRecord[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSENTS) || '[]');
    } catch {
      return INITIAL_CONSENTS;
    }
  },

  getFarmerConsents(farmerId: string): ConsentRecord[] {
    return this.getConsents().filter(c => c.farmerId === farmerId);
  },

  hasConsent(farmerId: string, vendorId: VendorId): boolean {
    const list = this.getFarmerConsents(farmerId);
    return list.some(c => c.vendorId === vendorId && c.status === 'active');
  },

  saveConsent(farmer: Farmer, vendorId: VendorId): ConsentRecord {
    const consents = this.getConsents();
    const vendor = VENDORS[vendorId];
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const existingIdx = consents.findIndex(c => c.farmerId === farmer.id && c.vendorId === vendorId);
    const newRecord: ConsentRecord = {
      id: 'c-' + vendorId + '-' + Date.now(),
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      farmerVillage: farmer.village,
      vendorId: vendorId,
      vendorName: vendor.name,
      status: 'active',
      consentedAt: timeStr
    };

    if (existingIdx >= 0) {
      consents[existingIdx] = newRecord;
    } else {
      consents.unshift(newRecord);
    }

    localStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(consents));

    this.addActivityLog({
      farmerName: farmer.name,
      vendorName: vendor.name,
      action: 'Consent given',
      status: 'Active',
      details: `Consent given to ${vendor.name} (${farmer.crop}, ${farmer.acres} acres)`
    });

    if (supabaseClient) {
      supabaseClient.from('consents').upsert({
        id: newRecord.id,
        farmer_id: newRecord.farmerId,
        farmer_name: newRecord.farmerName,
        farmer_phone: newRecord.farmerPhone,
        farmer_village: newRecord.farmerVillage,
        vendor_id: newRecord.vendorId,
        vendor_name: newRecord.vendorName,
        status: newRecord.status,
        consented_at: newRecord.consentedAt
      }).then();
    }

    notifyDataChange();
    return newRecord;
  },

  withdrawConsent(farmerId: string, vendorId: VendorId) {
    const consents = this.getConsents();
    const vendor = VENDORS[vendorId];
    const farmer = this.getFarmerById(farmerId);
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const updated = consents.map(c => {
      if (c.farmerId === farmerId && c.vendorId === vendorId) {
        return {
          ...c,
          status: 'withdrawn' as const,
          withdrawnAt: timeStr
        };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(updated));

    if (farmer) {
      this.addActivityLog({
        farmerName: farmer.name,
        vendorName: vendor.name,
        action: 'Consent withdrawn',
        status: 'Completed',
        details: `Farmer withdrew consent for ${vendor.name}`
      });
    }

    if (supabaseClient) {
      supabaseClient.from('consents')
        .update({ status: 'withdrawn', withdrawn_at: timeStr })
        .match({ farmer_id: farmerId, vendor_id: vendorId })
        .then();
    }

    notifyDataChange();
  },

  // Reports
  getReports(): Report[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
    } catch {
      return INITIAL_REPORTS;
    }
  },

  getFarmerReports(farmerId: string): Report[] {
    return this.getReports().filter(r => r.farmerId === farmerId);
  },

  markReportAsRead(reportId: string) {
    const reports = this.getReports();
    const updated = reports.map(r => r.id === reportId ? { ...r, isNew: false } : r);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));

    if (supabaseClient) {
      supabaseClient.from('reports').update({ is_new: false }).eq('id', reportId).then();
    }

    notifyDataChange();
  },

  publishReport(reportData: Omit<Report, 'id' | 'date'> & { date?: string }): Report {
    const reports = this.getReports();
    const now = new Date();
    const timeStr = reportData.date || (
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );

    const newReport: Report = {
      ...reportData,
      id: 'rep-' + Date.now(),
      date: timeStr,
      isNew: true
    };

    reports.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    const farmer = this.getFarmerById(reportData.farmerId);

    // Automatically trigger notification for the farmer
    this.sendAlert({
      farmerId: reportData.farmerId,
      title: `కొత్త నివేదిక: ${reportData.title}`,
      titleTe: `కొత్త నివేదిక: ${reportData.titleTe || reportData.title}`,
      message: `${reportData.vendorName} నుండి మీ పొలానికి కొత్త నివేదిక వచ్చింది. క్లిక్ చేసి చదవండి.`,
      messageTe: `${reportData.vendorName} నుండి మీ పొలానికి కొత్త నివేదిక వచ్చింది. క్లిక్ చేసి చదవండి.`,
      vendorId: reportData.vendorId,
      vendorName: reportData.vendorName,
      type: reportData.vendorId === 'fyllo' ? 'weather' : reportData.vendorId === 'biota' ? 'soil' : reportData.vendorId === 'kshema' ? 'insurance' : 'loan'
    });

    this.addActivityLog({
      farmerName: farmer?.name || 'Farmer',
      vendorName: reportData.vendorName,
      action: 'Report published',
      status: 'Completed',
      details: `${reportData.title} delivered to farmer app`
    });

    if (supabaseClient) {
      supabaseClient.from('reports').insert({
        id: newReport.id,
        farmer_id: newReport.farmerId,
        vendor_id: newReport.vendorId,
        vendor_name: newReport.vendorName,
        title: newReport.title,
        title_te: newReport.titleTe,
        date: newReport.date,
        summary: newReport.summary,
        summary_te: newReport.summaryTe,
        key_values: newReport.keyValues,
        advice: newReport.advice,
        advice_te: newReport.adviceTe,
        is_new: newReport.isNew,
        pdf_url: newReport.pdfUrl
      }).then();
    }

    notifyDataChange();
    return newReport;
  },

  // Alerts
  getAlerts(): AlertNotification[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
    } catch {
      return INITIAL_ALERTS;
    }
  },

  getFarmerAlerts(farmerId: string): AlertNotification[] {
    return this.getAlerts().filter(a => a.farmerId === farmerId || a.farmerId === 'all');
  },

  markAlertAsRead(alertId: string) {
    const alerts = this.getAlerts();
    const updated = alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));

    if (supabaseClient) {
      supabaseClient.from('alerts').update({ is_read: true }).eq('id', alertId).then();
    }

    notifyDataChange();
  },

  sendAlert(alertData: Omit<AlertNotification, 'id' | 'date' | 'isRead'> & { date?: string }): AlertNotification {
    const alerts = this.getAlerts();
    const now = new Date();
    const timeStr = alertData.date || (
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );

    const newAlert: AlertNotification = {
      ...alertData,
      id: 'alt-' + Date.now(),
      date: timeStr,
      isRead: false
    };

    alerts.unshift(newAlert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));

    const farmerName = alertData.farmerId === 'all' 
      ? 'All Farmers' 
      : (this.getFarmerById(alertData.farmerId)?.name || 'Farmer');

    this.addActivityLog({
      farmerName: farmerName,
      vendorName: alertData.vendorName || 'Shanmukha Admin',
      action: 'Notification sent',
      status: 'Delivered',
      details: alertData.title
    });

    if (supabaseClient) {
      supabaseClient.from('alerts').insert({
        id: newAlert.id,
        farmer_id: newAlert.farmerId,
        title: newAlert.title,
        title_te: newAlert.titleTe,
        message: newAlert.message,
        message_te: newAlert.messageTe,
        vendor_id: newAlert.vendorId,
        vendor_name: newAlert.vendorName,
        type: newAlert.type,
        date: newAlert.date,
        is_read: newAlert.isRead
      }).then();
    }

    notifyDataChange();
    return newAlert;
  },

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || '[]');
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  },

  addActivityLog(entry: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp?: string }) {
    const logs = this.getActivityLogs();
    const now = new Date();
    const timeStr = entry.timestamp || (
      now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );

    const newLog: ActivityLog = {
      ...entry,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: timeStr
    };

    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));

    if (supabaseClient) {
      supabaseClient.from('activity_logs').insert({
        id: newLog.id,
        timestamp: newLog.timestamp,
        farmer_name: newLog.farmerName,
        vendor_name: newLog.vendorName,
        action: newLog.action,
        status: newLog.status,
        details: newLog.details
      }).then();
    }
  },

  // Help Requests
  getHelpRequests(): FieldVisitRequest[] {
    this.initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.HELP_REQUESTS) || '[]');
    } catch {
      return [];
    }
  },

  addHelpRequest(req: Omit<FieldVisitRequest, 'id' | 'createdAt' | 'status'>): FieldVisitRequest {
    const list = this.getHelpRequests();
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newReq: FieldVisitRequest = {
      ...req,
      id: 'req-' + Date.now(),
      createdAt: timeStr,
      status: 'pending'
    };

    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.HELP_REQUESTS, JSON.stringify(list));

    this.addActivityLog({
      farmerName: req.farmerName,
      vendorName: 'Field Support',
      action: 'Request sent',
      status: 'Pending',
      details: `Field visit requested for ${req.village} (${req.crop})`
    });

    if (supabaseClient) {
      supabaseClient.from('help_requests').insert({
        id: newReq.id,
        farmer_id: newReq.farmerId,
        farmer_name: newReq.farmerName,
        phone: newReq.phone,
        village: newReq.village,
        crop: newReq.crop,
        message: newReq.message,
        status: newReq.status,
        created_at: newReq.createdAt
      }).then();
    }

    notifyDataChange();
    return newReq;
  },

  // Realtime subscription setup
  setupSupabaseSubscriptions(onDataChanged: () => void) {
    if (!supabaseClient) return () => {};

    const channel = supabaseClient
      .channel('shanmukha-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => onDataChanged())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => onDataChanged())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consents' }, () => onDataChanged())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farmers' }, () => onDataChanged())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => onDataChanged())
      .subscribe();

    return () => {
      supabaseClient?.removeChannel(channel);
    };
  }
};
