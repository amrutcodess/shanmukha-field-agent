import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../types/admin';
import { adminService } from '../services/adminService';

export type DateRange = 'TODAY' | '7D' | '30D' | 'CUSTOM';

interface AdminContextType {
  // Global filters
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedDistrict: District | 'ALL';
  setSelectedDistrict: (district: District | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data sets
  fas: FieldAssistant[];
  farmers: AdminFarmer[];
  visits: AdminVisit[];
  yields: YieldRecord[];
  loyalty: LoyaltyLedgerEntry[];
  broadcasts: Broadcast[];
  auditLogs: AuditLog[];
  thresholds: FlagThresholds;
  adminUser: AdminUser;

  // Filtered views
  filteredFAs: FieldAssistant[];
  filteredFarmers: AdminFarmer[];
  filteredVisits: AdminVisit[];

  // Auth
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;

  // Live simulation & actions
  lastRefreshTime: string;
  refreshData: () => void;
  resetDemoData: () => void;

  // Mutations
  updateFA: (id: string, updates: Partial<FieldAssistant>) => void;
  createFA: (data: any) => FieldAssistant;
  replaceFA: (oldId: string, newName: string, newPhone: string) => FieldAssistant;
  deactivateFA: (id: string) => void;
  bulkReassignFarmers: (farmerIds: string[], targetFaId: string) => void;
  updateVisitFlagStatus: (visitId: string, flagId: string, status: any) => void;
  approveLoyaltyPayout: (id: string) => void;
  createBroadcast: (data: any) => Broadcast;
  updateThresholds: (thresholds: FlagThresholds) => void;
  updateCurrentUser: (user: AdminUser) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dateRange, setDateRange] = useState<DateRange>('30D');
  const [selectedDistrict, setSelectedDistrict] = useState<District | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sagl_admin_auth') === 'true';
  });

  // State data
  const [fas, setFas] = useState<FieldAssistant[]>(() => adminService.getFAs());
  const [farmers, setFarmers] = useState<AdminFarmer[]>(() => adminService.getFarmers());
  const [visits, setVisits] = useState<AdminVisit[]>(() => adminService.getVisits());
  const [yields, setYields] = useState<YieldRecord[]>(() => adminService.getYieldRecords());
  const [loyalty, setLoyalty] = useState<LoyaltyLedgerEntry[]>(() => adminService.getLoyaltyLedger());
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => adminService.getBroadcasts());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => adminService.getAuditLogs());
  const [thresholds, setThresholds] = useState<FlagThresholds>(() => adminService.getThresholds());
  const [adminUser, setAdminUser] = useState<AdminUser>(() => adminService.getCurrentUser());
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Reload data from service
  const refreshData = useCallback(() => {
    setFas(adminService.getFAs());
    setFarmers(adminService.getFarmers());
    setVisits(adminService.getVisits());
    setYields(adminService.getYieldRecords());
    setLoyalty(adminService.getLoyaltyLedger());
    setBroadcasts(adminService.getBroadcasts());
    setAuditLogs(adminService.getAuditLogs());
    setThresholds(adminService.getThresholds());
    setAdminUser(adminService.getCurrentUser());
    setLastRefreshTime(new Date().toLocaleTimeString());
  }, []);

  // Live simulation timer (refreshes FA telemetry every 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate minor battery or sync changes
      setFas((prev) =>
        prev.map((fa) => {
          if (fa.status === 'ON_VISIT' || fa.status === 'ACTIVE') {
            const batteryChange = Math.random() > 0.85 ? -1 : 0;
            return {
              ...fa,
              batteryLevel: Math.max(12, fa.batteryLevel + batteryChange),
              lastSyncTime: 'Just now',
            };
          }
          return fa;
        })
      );
      setLastRefreshTime(new Date().toLocaleTimeString());
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Login / Logout
  const login = (email: string, pass: string): boolean => {
    if ((email === 'admin@shanmukha.com' || email === 'admin') && (pass === 'admin123' || pass === 'admin')) {
      setIsAuthenticated(true);
      localStorage.setItem('sagl_admin_auth', 'true');
      adminService.logAction('LOGIN', 'Authentication', `Admin ${adminUser.name} logged into Head Office Portal.`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sagl_admin_auth');
    adminService.logAction('LOGOUT', 'Authentication', `Admin ${adminUser.name} logged out.`);
  };

  // Reset demo data
  const resetDemoData = () => {
    adminService.resetAllData();
    refreshData();
  };

  // Mutation wrappers
  const updateFA = (id: string, updates: Partial<FieldAssistant>) => {
    adminService.updateFA(id, updates);
    refreshData();
  };

  const createFA = (data: any) => {
    const res = adminService.createFA(data);
    refreshData();
    return res;
  };

  const replaceFA = (oldId: string, newName: string, newPhone: string) => {
    const res = adminService.replaceFA(oldId, newName, newPhone);
    refreshData();
    return res;
  };

  const deactivateFA = (id: string) => {
    adminService.deactivateFA(id);
    refreshData();
  };

  const bulkReassignFarmers = (farmerIds: string[], targetFaId: string) => {
    adminService.bulkReassignFarmers(farmerIds, targetFaId);
    refreshData();
  };

  const updateVisitFlagStatus = (visitId: string, flagId: string, status: any) => {
    adminService.updateVisitFlagStatus(visitId, flagId, status, adminUser.name);
    refreshData();
  };

  const approveLoyaltyPayout = (id: string) => {
    adminService.approveLoyaltyPayout(id);
    refreshData();
  };

  const createBroadcast = (data: any) => {
    const res = adminService.createBroadcast(data);
    refreshData();
    return res;
  };

  const updateThresholds = (newThresholds: FlagThresholds) => {
    adminService.updateThresholds(newThresholds);
    refreshData();
  };

  const updateCurrentUser = (user: AdminUser) => {
    adminService.updateCurrentUser(user);
    refreshData();
  };

  // Filtered views computed
  const filteredFAs = useMemo(() => {
    return fas.filter((fa) => {
      const matchDistrict = selectedDistrict === 'ALL' || fa.district === selectedDistrict;
      const matchSearch =
        searchQuery === '' ||
        fa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fa.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fa.phone.includes(searchQuery) ||
        fa.mandal.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDistrict && matchSearch;
    });
  }, [fas, selectedDistrict, searchQuery]);

  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      const matchDistrict = selectedDistrict === 'ALL' || farmer.district === selectedDistrict;
      const matchSearch =
        searchQuery === '' ||
        farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.phone.includes(searchQuery) ||
        farmer.assignedFaName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDistrict && matchSearch;
    });
  }, [farmers, selectedDistrict, searchQuery]);

  const filteredVisits = useMemo(() => {
    const now = new Date();
    return visits.filter((v) => {
      const matchDistrict = selectedDistrict === 'ALL' || v.district === selectedDistrict;
      const matchSearch =
        searchQuery === '' ||
        v.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.faName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.crop.toLowerCase().includes(searchQuery.toLowerCase());

      // Date range filter
      let matchDate = true;
      const visitDate = new Date(v.createdAt);
      const diffDays = (now.getTime() - visitDate.getTime()) / (1000 * 3600 * 24);

      if (dateRange === 'TODAY') {
        matchDate = diffDays <= 1;
      } else if (dateRange === '7D') {
        matchDate = diffDays <= 7;
      } else if (dateRange === '30D') {
        matchDate = diffDays <= 30;
      }

      return matchDistrict && matchSearch && matchDate;
    });
  }, [visits, selectedDistrict, searchQuery, dateRange]);

  return (
    <AdminContext.Provider
      value={{
        dateRange,
        setDateRange,
        selectedDistrict,
        setSelectedDistrict,
        searchQuery,
        setSearchQuery,
        fas,
        farmers,
        visits,
        yields,
        loyalty,
        broadcasts,
        auditLogs,
        thresholds,
        adminUser,
        filteredFAs,
        filteredFarmers,
        filteredVisits,
        isAuthenticated,
        login,
        logout,
        lastRefreshTime,
        refreshData,
        resetDemoData,
        updateFA,
        createFA,
        replaceFA,
        deactivateFA,
        bulkReassignFarmers,
        updateVisitFlagStatus,
        approveLoyaltyPayout,
        createBroadcast,
        updateThresholds,
        updateCurrentUser,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
