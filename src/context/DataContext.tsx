import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Farmer, 
  ConsentRecord, 
  Report, 
  AlertNotification, 
  ActivityLog, 
  FieldVisitRequest, 
  Language, 
  VendorId 
} from '../types';
import { storageService, VENDORS } from '../services/storageService';
import { DATA_MODE } from '../config';

interface DataContextType {
  farmers: Farmer[];
  consents: ConsentRecord[];
  reports: Report[];
  alerts: AlertNotification[];
  activityLogs: ActivityLog[];
  helpRequests: FieldVisitRequest[];
  language: Language;
  dataMode: 'local' | 'supabase';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;

  // Actions
  registerNewFarmer: (data: Omit<Farmer, 'id'>) => Farmer;
  giveConsent: (farmer: Farmer, vendorId: VendorId) => Promise<ConsentRecord>;
  withdrawConsent: (farmerId: string, vendorId: VendorId) => void;
  hasConsent: (farmerId: string, vendorId: VendorId) => boolean;
  publishReport: (reportData: Omit<Report, 'id' | 'date'>) => Report;
  sendNotification: (data: Omit<AlertNotification, 'id' | 'date' | 'isRead'>) => AlertNotification;
  markAlertAsRead: (id: string) => void;
  markReportAsRead: (id: string) => void;
  requestFieldVisit: (farmer: Farmer, message: string) => FieldVisitRequest;
  simulateIncomingVendorAlert: (farmerId?: string) => void;
  resetDemoData: () => void;

  // Visual Feedback Toast/Modal
  actionSuccess: { show: boolean; title: string; message: string };
  triggerSuccess: (title: string, message?: string) => void;
  dismissSuccess: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [farmers, setFarmers] = useState<Farmer[]>(() => storageService.getFarmers());
  const [consents, setConsents] = useState<ConsentRecord[]>(() => storageService.getConsents());
  const [reports, setReports] = useState<Report[]>(() => storageService.getReports());
  const [alerts, setAlerts] = useState<AlertNotification[]>(() => storageService.getAlerts());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => storageService.getActivityLogs());
  const [helpRequests, setHelpRequests] = useState<FieldVisitRequest[]>(() => storageService.getHelpRequests());
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('shanmukha_app_lang') as Language) || 'te';
  });

  const [actionSuccess, setActionSuccess] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  const refreshData = useCallback(() => {
    setFarmers(storageService.getFarmers());
    setConsents(storageService.getConsents());
    setReports(storageService.getReports());
    setAlerts(storageService.getAlerts());
    setActivityLogs(storageService.getActivityLogs());
    setHelpRequests(storageService.getHelpRequests());
  }, []);

  useEffect(() => {
    storageService.initStorage();
    refreshData();

    // Listen to custom window event & cross-tab storage event
    const handleSync = () => refreshData();
    window.addEventListener('shanmukha_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    // Setup Supabase Realtime if in supabase mode
    const cleanupRealtime = storageService.setupSupabaseSubscriptions(() => {
      refreshData();
    });

    return () => {
      window.removeEventListener('shanmukha_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      cleanupRealtime();
    };
  }, [refreshData]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('shanmukha_app_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'te' ? 'en' : 'te');
  };

  const triggerSuccess = (title: string, message: string = '') => {
    setActionSuccess({ show: true, title, message });
    setTimeout(() => {
      setActionSuccess(prev => ({ ...prev, show: false }));
    }, 2400);
  };

  const dismissSuccess = () => {
    setActionSuccess(prev => ({ ...prev, show: false }));
  };

  const registerNewFarmer = (data: Omit<Farmer, 'id'>): Farmer => {
    const farmer = storageService.addFarmer(data);
    refreshData();
    return farmer;
  };

  const hasConsent = (farmerId: string, vendorId: VendorId): boolean => {
    return storageService.hasConsent(farmerId, vendorId);
  };

  const giveConsent = async (farmer: Farmer, vendorId: VendorId): Promise<ConsentRecord> => {
    const record = storageService.saveConsent(farmer, vendorId);
    refreshData();
    return record;
  };

  const withdrawConsent = (farmerId: string, vendorId: VendorId) => {
    storageService.withdrawConsent(farmerId, vendorId);
    refreshData();
    triggerSuccess(
      language === 'te' ? 'అనుమతి రద్దు చేయబడింది' : 'Consent Withdrawn',
      VENDORS[vendorId].name
    );
  };

  const publishReport = (reportData: Omit<Report, 'id' | 'date'>): Report => {
    const rep = storageService.publishReport(reportData);
    refreshData();
    return rep;
  };

  const sendNotification = (data: Omit<AlertNotification, 'id' | 'date' | 'isRead'>): AlertNotification => {
    const alt = storageService.sendAlert(data);
    refreshData();
    return alt;
  };

  const markAlertAsRead = (id: string) => {
    storageService.markAlertAsRead(id);
    refreshData();
  };

  const markReportAsRead = (id: string) => {
    storageService.markReportAsRead(id);
    refreshData();
  };

  const requestFieldVisit = (farmer: Farmer, message: string): FieldVisitRequest => {
    const req = storageService.addHelpRequest({
      farmerId: farmer.id,
      farmerName: farmer.name,
      phone: farmer.phone,
      village: farmer.village,
      crop: farmer.crop,
      message
    });
    refreshData();
    triggerSuccess(
      language === 'te' ? 'అభ్యర్థన పంపబడింది!' : 'Request Sent!',
      language === 'te' ? 'మా ఫీల్డ్ ఆఫీసర్ త్వరలో వస్తారు' : 'Our field officer will visit soon'
    );
    return req;
  };

  const simulateIncomingVendorAlert = (farmerId?: string) => {
    const targetFarmerId = farmerId || 'farmer-1';
    const templates = [
      {
        vendorId: 'fyllo' as VendorId,
        title: 'వాతావరణ హెచ్చరిక: రాబోయే 24 గంటల్లో గాలివాన',
        titleTe: 'వాతావరణ హెచ్చరిక: రాబోయే 24 గంటల్లో గాలివాన',
        message: 'మీ మండలంలో 40-50 కి.మీ వేగంతో ఈదురు గాలులు మరియు తేలికపాటి వర్షం సూచన ఉంది. చేలలో తగిన జాగ్రత్తలు తీసుకోండి.',
        messageTe: 'మీ మండలంలో 40-50 కి.మీ వేగంతో ఈదురు గాలులు మరియు తేలికపాటి వర్షం సూచన ఉంది. చేలలో తగిన జాగ్రత్తలు తీసుకోండి.',
        type: 'weather' as const
      },
      {
        vendorId: 'kshema' as VendorId,
        title: 'క్షేమ బీమా: మీ పాలసీ ధ్రువీకరణ పూర్తయింది',
        titleTe: 'క్షేమ బీమా: మీ పాలసీ ధ్రువీకరణ పూర్తయింది',
        message: 'మీ పంటకు క్షేమ సురక్ష పాలసీ సంఖ్య KSH-2026-9812 మంజూరైంది. డిజిటల్ బాండ్ సిద్ధంగా ఉంది.',
        messageTe: 'మీ పంటకు క్షేమ సురక్ష పాలసీ సంఖ్య KSH-2026-9812 మంజూరైంది. డిజిటల్ బాండ్ సిద్ధంగా ఉంది.',
        type: 'insurance' as const
      },
      {
        vendorId: 'samunnati' as VendorId,
        title: 'సమున్నతి రుణం: ₹50,000 ఆమోదం పొందింది',
        titleTe: 'సమున్నతి రుణం: ₹50,000 ఆమోదం పొందింది',
        message: 'ఎరువులు మరియు విత్తనాల కొనుగోలు కోసం మీ కిసాన్ క్రెడిట్ పరిమితి ₹50,000 మంజూరైంది.',
        messageTe: 'ఎరువులు మరియు విత్తనాల కొనుగోలు కోసం మీ కిసాన్ క్రెడిట్ పరిమితి ₹50,000 మంజూరైంది.',
        type: 'loan' as const
      },
      {
        vendorId: 'biota' as VendorId,
        title: 'బయోటా భూసార సలహా: జింక్ లోపం గమనించబడింది',
        titleTe: 'బయోటా భూసార సలహా: జింక్ లోపం గమనించబడింది',
        message: 'పంట పిలక దశలో ఎకరాకు 10 కేజీల జింక్ సల్ఫేట్ వేస్తే ఆకులు పసుపు రంగులోకి మారకుండా ఉంటాయి.',
        messageTe: 'పంట పిలక దశలో ఎకరాకు 10 కేజీల జింక్ సల్ఫేట్ వేస్తే ఆకులు పసుపు రంగులోకి మారకుండా ఉంటాయి.',
        type: 'soil' as const
      }
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    const vendor = VENDORS[pick.vendorId];

    sendNotification({
      farmerId: targetFarmerId,
      title: pick.title,
      titleTe: pick.titleTe,
      message: pick.message,
      messageTe: pick.messageTe,
      vendorId: pick.vendorId,
      vendorName: vendor.name,
      type: pick.type
    });

    triggerSuccess(
      language === 'te' ? 'కొత్త హెచ్చరిక వచ్చింది!' : 'New Alert Received!',
      vendor.name
    );
  };

  const resetDemoData = () => {
    storageService.resetToDefault();
    refreshData();
    triggerSuccess(
      language === 'te' ? 'డేటా రీసెట్ పూర్తయింది' : 'Demo Data Reset Done',
      language === 'te' ? 'రమేష్ రెడ్డి ప్రారంభ స్థితికి చేరింది' : 'Reset to Ramesh Reddy seed data'
    );
  };

  return (
    <DataContext.Provider
      value={{
        farmers,
        consents,
        reports,
        alerts,
        activityLogs,
        helpRequests,
        language,
        dataMode: DATA_MODE,
        setLanguage,
        toggleLanguage,
        registerNewFarmer,
        giveConsent,
        withdrawConsent,
        hasConsent,
        publishReport,
        sendNotification,
        markAlertAsRead,
        markReportAsRead,
        requestFieldVisit,
        simulateIncomingVendorAlert,
        resetDemoData,
        actionSuccess,
        triggerSuccess,
        dismissSuccess
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
