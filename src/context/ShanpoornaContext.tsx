import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Farmer,
  Invoice,
  FieldVisit,
  Dealer,
  ResourceItem,
  NotificationItem,
  FarmerQA,
  INITIAL_FARMERS,
  INITIAL_INVOICES,
  INITIAL_VISITS,
  INITIAL_DEALERS,
  INITIAL_RESOURCES,
  INITIAL_NOTIFICATIONS,
} from '../mockData';
import { translations } from '../translations';

export type ScreenType =
  | 'LOGIN'
  | 'HOME'
  | 'MY_FARMERS'
  | 'ADD_FARMER'
  | 'INVOICE_APPROVAL'
  | 'FARMER_PROFILE'
  | 'LOG_FIELD_VISIT'
  | 'PREVIOUS_VISITS'
  | 'FARM_REPORTS'
  | 'RESOURCES'
  | 'PROFILE'
  | 'FARMER_HOME';

export type TabType = 'home' | 'farmers' | 'resources' | 'profile';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface FAProfile {
  name: string;
  id: string;
  location: string;
  phone: string;
  status: string;
}

interface ShanpoornaContextType {
  // Navigation
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  navigateToTab: (tab: TabType) => void;
  
  // Persona & Role
  userRole: 'FIELD_ASSISTANT' | 'FARMER';
  setUserRole: (role: 'FIELD_ASSISTANT' | 'FARMER') => void;
  faProfile: FAProfile;
  setFaProfile: React.Dispatch<React.SetStateAction<FAProfile>>;
  farmerLoggedIn: Farmer | null;
  setFarmerLoggedIn: (farmer: Farmer | null) => void;
  
  // Data
  farmers: Farmer[];
  activeFarmerId: string;
  setActiveFarmerId: (id: string) => void;
  activeFarmer: Farmer;
  invoices: Invoice[];
  visits: FieldVisit[];
  dealers: Dealer[];
  resources: ResourceItem[];
  notifications: NotificationItem[];
  
  // Modal / Detail states
  selectedVisitDetail: FieldVisit | null;
  setSelectedVisitDetail: (visit: FieldVisit | null) => void;
  selectedInvoiceDetail: Invoice | null;
  setSelectedInvoiceDetail: (invoice: Invoice | null) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  
  // Language & i18n
  language: 'en' | 'te';
  setLanguage: (lang: 'en' | 'te') => void;
  t: typeof translations['en'];
  
  // Actions
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  addFarmer: (qa: FarmerQA, status: 'MEMBER' | 'PAYMENT PENDING' | 'NEW', soilTestReport?: any) => Farmer;
  updateFarmerQA: (farmerId: string, updatedQA: Partial<FarmerQA>) => void;
  approveInvoice: (invoiceId: string) => void;
  rejectInvoice: (invoiceId: string) => void;
  addVisit: (visit: Omit<FieldVisit, 'id'>) => FieldVisit;
  updateVisitHOStatus: (visitId: string, status: 'APPROVED' | 'PENDING HO APPROVAL', hoRemarks?: string) => void;
  createMembershipPayment: (farmerId: string, utrId: string, amount: number, proofImage?: string) => void;
  resetDemoData: () => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const ShanpoornaContext = createContext<ShanpoornaContextType | undefined>(undefined);

export const ShanpoornaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('HOME');
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [userRole, setUserRole] = useState<'FIELD_ASSISTANT' | 'FARMER'>('FIELD_ASSISTANT');
  const [farmerLoggedIn, setFarmerLoggedIn] = useState<Farmer | null>(null);

  // Field Assistant Persona
  const [faProfile, setFaProfile] = useState<FAProfile>(() => {
    const saved = localStorage.getItem('shanpoorna_fa_profile');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'K. Srinivas',
          id: 'SAGL-FA-0142',
          location: 'Medak',
          phone: '+91 90000 00004',
          status: 'ACTIVE',
        };
  });

  // Farmers list
  const [farmers, setFarmers] = useState<Farmer[]>(() => {
    const saved = localStorage.getItem('shanpoorna_farmers');
    return saved ? JSON.parse(saved) : INITIAL_FARMERS;
  });

  // Active Farmer ID (defaults to Ramesh Goud)
  const [activeFarmerId, setActiveFarmerId] = useState<string>('F001');

  // Invoices list
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('shanpoorna_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  // Field Visits list
  const [visits, setVisits] = useState<FieldVisit[]>(() => {
    const saved = localStorage.getItem('shanpoorna_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  // Dealers
  const [dealers, setDealers] = useState<Dealer[]>(() => {
    const saved = localStorage.getItem('shanpoorna_dealers');
    return saved ? JSON.parse(saved) : INITIAL_DEALERS;
  });

  // Resources & Notifications
  const [resources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modals
  const [selectedVisitDetail, setSelectedVisitDetail] = useState<FieldVisit | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Language
  const [language, setLanguage] = useState<'en' | 'te'>('en');

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('shanpoorna_farmers', JSON.stringify(farmers));
  }, [farmers]);

  useEffect(() => {
    localStorage.setItem('shanpoorna_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('shanpoorna_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('shanpoorna_dealers', JSON.stringify(dealers));
  }, [dealers]);

  useEffect(() => {
    localStorage.setItem('shanpoorna_fa_profile', JSON.stringify(faProfile));
  }, [faProfile]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 3200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch tab & screen
  const navigateToTab = (tab: TabType) => {
    setCurrentTab(tab);
    switch (tab) {
      case 'home':
        setCurrentScreen('HOME');
        break;
      case 'farmers':
        setCurrentScreen('MY_FARMERS');
        break;
      case 'resources':
        setCurrentScreen('RESOURCES');
        break;
      case 'profile':
        setCurrentScreen('PROFILE');
        break;
    }
  };

  // Farmer operations
  const addFarmer = (
    qa: FarmerQA,
    status: 'MEMBER' | 'PAYMENT PENDING' | 'NEW',
    soilTestReport?: any
  ): Farmer => {
    const nextCodeNum = 220 + farmers.length;
    const newFarmer: Farmer = {
      id: 'F' + (Date.now().toString().slice(-4)),
      farmerIdCode: `SAGL-TG-26-000${nextCodeNum}`,
      status,
      qa,
      soilTestReport,
    };
    setFarmers((prev) => [newFarmer, ...prev]);
    setActiveFarmerId(newFarmer.id);
    showToast(`Farmer ${qa.farmerName} registered successfully!`, 'success');
    return newFarmer;
  };

  const updateFarmerQA = (farmerId: string, updatedQA: Partial<FarmerQA>) => {
    setFarmers((prev) =>
      prev.map((f) => (f.id === farmerId ? { ...f, qa: { ...f.qa, ...updatedQA } } : f))
    );
    showToast('Farmer details synced successfully!', 'success');
  };

  // Membership payment initiation
  const createMembershipPayment = (
    farmerId: string,
    utrId: string,
    amount: number = 500,
    proofImage?: string
  ) => {
    const targetFarmer = farmers.find((f) => f.id === farmerId);
    if (!targetFarmer) return;

    // Update farmer status to PAYMENT PENDING
    setFarmers((prev) =>
      prev.map((f) => (f.id === farmerId ? { ...f, status: 'PAYMENT PENDING' } : f))
    );

    const newInvoice: Invoice = {
      id: 'INV-' + Date.now().toString().slice(-4),
      invoiceNo: `SAGL-INV-2026-0${90 + invoices.length}`,
      farmerId: targetFarmer.id,
      farmerName: targetFarmer.qa.farmerName,
      farmerMobile: targetFarmer.qa.mobileNumber,
      amount,
      utrId: utrId || `UTR-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      date: '19 Nov 2026, 02:45 PM',
      status: 'PENDING',
      type: 'Membership Fee',
      proofImage:
        proofImage ||
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    showToast(`Payment receipt submitted for verification! (UTR: ${newInvoice.utrId})`, 'success');
  };

  // Invoice Approval
  const approveInvoice = (invoiceId: string) => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (!targetInvoice) return;

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'APPROVED' } : inv))
    );

    // If it's a membership fee, promote farmer to MEMBER
    if (targetInvoice.type === 'Membership Fee' || targetInvoice.farmerId) {
      setFarmers((prev) =>
        prev.map((f) => (f.id === targetInvoice.farmerId ? { ...f, status: 'MEMBER' } : f))
      );
    }

    showToast(`Invoice ${targetInvoice.invoiceNo} approved! Farmer is now a MEMBER.`, 'success');
  };

  const rejectInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'REJECTED' } : inv))
    );
    showToast('Invoice marked as rejected.', 'warning');
  };

  // Add Visit
  const addVisit = (visitData: Omit<FieldVisit, 'id'>): FieldVisit => {
    const newVisitId = `SV-2026-11-0${382 + visits.length}`;
    const newVisit: FieldVisit = {
      ...visitData,
      id: newVisitId,
    };
    setVisits((prev) => [newVisit, ...prev]);
    showToast(`Field visit recorded (${newVisitId})!`, 'success');
    return newVisit;
  };

  // Flip HO approval status
  const updateVisitHOStatus = (
    visitId: string,
    status: 'APPROVED' | 'PENDING HO APPROVAL',
    hoRemarks?: string
  ) => {
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id === visitId) {
          return {
            ...v,
            status,
            recommendation: {
              ...v.recommendation,
              hoExpertAdvice: v.recommendation.hoExpertAdvice
                ? {
                    ...v.recommendation.hoExpertAdvice,
                    status: status === 'APPROVED' ? 'APPROVED' : 'Pending reply',
                    hoRemarks:
                      hoRemarks ||
                      'Agronomist approved foliar dose of Emamectin Benzoate 5% SG + Shan-MagSul.',
                  }
                : undefined,
            },
          };
        }
        return v;
      })
    );
    showToast(
      status === 'APPROVED'
        ? '⚡ HO Agronomist has APPROVED the recommendation!'
        : 'Status updated to pending.',
      'success'
    );
  };

  // Reset demo
  const resetDemoData = () => {
    localStorage.removeItem('shanpoorna_farmers');
    localStorage.removeItem('shanpoorna_invoices');
    localStorage.removeItem('shanpoorna_visits');
    localStorage.removeItem('shanpoorna_dealers');
    localStorage.removeItem('shanpoorna_fa_profile');
    setFarmers(INITIAL_FARMERS);
    setInvoices(INITIAL_INVOICES);
    setVisits(INITIAL_VISITS);
    setDealers(INITIAL_DEALERS);
    setActiveFarmerId('F001');
    showToast('Demo data reset to initial showcase state', 'info');
  };

  // Active Farmer helper
  const activeFarmer = farmers.find((f) => f.id === activeFarmerId) || farmers[0];

  const t = translations[language];

  return (
    <ShanpoornaContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        currentTab,
        setCurrentTab,
        navigateToTab,
        userRole,
        setUserRole,
        faProfile,
        setFaProfile,
        farmerLoggedIn,
        setFarmerLoggedIn,
        farmers,
        activeFarmerId,
        setActiveFarmerId,
        activeFarmer,
        invoices,
        visits,
        dealers,
        resources,
        notifications,
        selectedVisitDetail,
        setSelectedVisitDetail,
        selectedInvoiceDetail,
        setSelectedInvoiceDetail,
        isNotificationsOpen,
        setIsNotificationsOpen,
        language,
        setLanguage,
        t,
        showToast,
        addFarmer,
        updateFarmerQA,
        approveInvoice,
        rejectInvoice,
        addVisit,
        updateVisitHOStatus,
        createMembershipPayment,
        resetDemoData,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </ShanpoornaContext.Provider>
  );
};

export const useShanpoorna = () => {
  const context = useContext(ShanpoornaContext);
  if (!context) {
    throw new Error('useShanpoorna must be used within a ShanpoornaProvider');
  }
  return context;
};
