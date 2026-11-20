// Admin Service Data Access Layer
// Abstracts localStorage data storage, facilitating clean swap to Supabase client in future.

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
} from '../types/admin';
import {
  SEED_FAS,
  generateSeedFarmers,
  generateSeedVisits,
  generateSeedYields,
  generateSeedLoyalty,
  SEED_BROADCASTS,
  SEED_AUDIT_LOGS,
  DEFAULT_THRESHOLDS,
  DEFAULT_ADMIN,
} from './seedData';

const STORAGE_KEYS = {
  FAS: 'sagl_admin_fas',
  FARMERS: 'sagl_admin_farmers',
  VISITS: 'sagl_admin_visits',
  YIELDS: 'sagl_admin_yields',
  LOYALTY: 'sagl_admin_loyalty',
  BROADCASTS: 'sagl_admin_broadcasts',
  AUDIT: 'sagl_admin_audit',
  THRESHOLDS: 'sagl_admin_thresholds',
  USER: 'sagl_admin_user',
  INITIALIZED: 'sagl_admin_initialized_v2',
};

class AdminService {
  private ensureInitialized() {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      this.resetAllData();
    }
  }

  public resetAllData() {
    const fas = SEED_FAS;
    const farmers = generateSeedFarmers(fas);
    const visits = generateSeedVisits(fas, farmers);
    const yields = generateSeedYields(farmers);
    const loyalty = generateSeedLoyalty(fas, farmers);

    localStorage.setItem(STORAGE_KEYS.FAS, JSON.stringify(fas));
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    localStorage.setItem(STORAGE_KEYS.YIELDS, JSON.stringify(yields));
    localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(loyalty));
    localStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(SEED_BROADCASTS));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(DEFAULT_THRESHOLDS));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_ADMIN));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // --- FIELD ASSISTANTS ---
  public getFAs(): FieldAssistant[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAS);
      return data ? JSON.parse(data) : SEED_FAS;
    } catch {
      return SEED_FAS;
    }
  }

  public getFAById(id: string): FieldAssistant | undefined {
    return this.getFAs().find((f) => f.id === id);
  }

  public createFA(faData: Omit<FieldAssistant, 'id' | 'assignedFarmersCount' | 'qualityScore'>): FieldAssistant {
    const fas = this.getFAs();
    const nextId = `SAGL-FA-0${167 + fas.length}`;
    const newFA: FieldAssistant = {
      ...faData,
      id: nextId,
      assignedFarmersCount: 0,
      qualityScore: 90,
    };
    const updated = [newFA, ...fas];
    localStorage.setItem(STORAGE_KEYS.FAS, JSON.stringify(updated));
    this.logAction('CREATE_FA', 'FA Management', `Created new FA ${newFA.name} (${newFA.id}) in ${newFA.district}.`);
    return newFA;
  }

  public updateFA(id: string, updates: Partial<FieldAssistant>): FieldAssistant | undefined {
    const fas = this.getFAs();
    let updatedFA: FieldAssistant | undefined;
    const updated = fas.map((fa) => {
      if (fa.id === id) {
        updatedFA = { ...fa, ...updates };
        return updatedFA;
      }
      return fa;
    });
    localStorage.setItem(STORAGE_KEYS.FAS, JSON.stringify(updated));
    if (updatedFA) {
      this.logAction('UPDATE_FA', 'FA Management', `Updated profile for FA ${updatedFA.name} (${id}).`);
    }
    return updatedFA;
  }

  public deactivateFA(id: string): void {
    this.updateFA(id, { isActive: false, status: 'OFFLINE' });
    this.logAction('DEACTIVATE_FA', 'FA Management', `Deactivated Field Assistant credentials for ID ${id}.`);
  }

  public replaceFA(oldFaId: string, newFaName: string, newFaPhone: string): FieldAssistant {
    const oldFA = this.getFAById(oldFaId);
    if (!oldFA) throw new Error('FA not found');

    // Create replacement FA
    const replacement = this.createFA({
      name: newFaName,
      phone: newFaPhone,
      email: `${newFaName.toLowerCase().replace(/\s+/g, '.')}@shanmukha.com`,
      district: oldFA.district,
      mandal: oldFA.mandal,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      appVersion: 'v2.4.1',
      batteryLevel: 95,
      lastSyncTime: 'Just now',
      currentLat: oldFA.currentLat,
      currentLng: oldFA.currentLng,
      deviceModel: 'Samsung Galaxy M14 5G',
      isActive: true,
      monitoringMonths: oldFA.monitoringMonths,
    });

    // Reassign all farmers from oldFA to replacement
    const farmers = this.getFarmers();
    const reassignedFarmers = farmers.map((f) => {
      if (f.assignedFaId === oldFaId) {
        return {
          ...f,
          assignedFaId: replacement.id,
          assignedFaName: replacement.name,
        };
      }
      return f;
    });
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(reassignedFarmers));

    // Deactivate old FA
    this.deactivateFA(oldFaId);

    // Update replacement count
    this.updateFA(replacement.id, { assignedFarmersCount: oldFA.assignedFarmersCount });

    this.logAction(
      'REPLACE_FA_HANDOVER',
      'FA Management',
      `Handed over ${oldFA.assignedFarmersCount} farmers and territory from ${oldFA.name} (${oldFaId}) to ${replacement.name} (${replacement.id}).`
    );

    return replacement;
  }

  // --- FARMERS ---
  public getFarmers(): AdminFarmer[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FARMERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getFarmerById(id: string): AdminFarmer | undefined {
    return this.getFarmers().find((f) => f.id === id);
  }

  public bulkReassignFarmers(farmerIds: string[], targetFaId: string): void {
    const targetFA = this.getFAById(targetFaId);
    if (!targetFA) throw new Error('Target FA not found');

    const farmers = this.getFarmers();
    const updated = farmers.map((f) => {
      if (farmerIds.includes(f.id)) {
        return {
          ...f,
          assignedFaId: targetFA.id,
          assignedFaName: targetFA.name,
        };
      }
      return f;
    });

    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(updated));

    // Update counts for FAs
    this.recomputeFACounts();

    this.logAction(
      'BULK_REASSIGN_FARMERS',
      'Farmers',
      `Reassigned ${farmerIds.length} farmers to FA ${targetFA.name} (${targetFA.id}).`
    );
  }

  private recomputeFACounts() {
    const fas = this.getFAs();
    const farmers = this.getFarmers();
    const counts: Record<string, number> = {};
    farmers.forEach((f) => {
      counts[f.assignedFaId] = (counts[f.assignedFaId] || 0) + 1;
    });
    const updatedFas = fas.map((fa) => ({
      ...fa,
      assignedFarmersCount: counts[fa.id] || 0,
    }));
    localStorage.setItem(STORAGE_KEYS.FAS, JSON.stringify(updatedFas));
  }

  // --- VISITS ---
  public getVisits(): AdminVisit[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VISITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getVisitById(id: string): AdminVisit | undefined {
    return this.getVisits().find((v) => v.id === id);
  }

  public updateVisitFlagStatus(
    visitId: string,
    flagId: string,
    status: 'RESOLVED_VALID' | 'FALSE_POSITIVE' | 'ESCALATED',
    reviewedBy: string
  ): void {
    const visits = this.getVisits();
    const updated = visits.map((v) => {
      if (v.id === visitId) {
        const updatedFlags = v.flags.map((flg) => {
          if (flg.id === flagId) {
            return {
              ...flg,
              isReviewed: true,
              reviewStatus: status,
              reviewedBy,
            };
          }
          return flg;
        });
        const hasUnresolved = updatedFlags.some((f) => f.reviewStatus === 'PENDING');
        return {
          ...v,
          flags: updatedFlags,
          hasFlags: hasUnresolved,
        };
      }
      return v;
    });

    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updated));
    this.logAction(
      'REVIEW_VISIT_FLAG',
      'Data Quality & Fraud',
      `Marked flag ${flagId} on visit ${visitId} as ${status} by ${reviewedBy}.`
    );
  }

  // --- YIELD RECORDS ---
  public getYieldRecords(): YieldRecord[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.YIELDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- LOYALTY LEDGER ---
  public getLoyaltyLedger(): LoyaltyLedgerEntry[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOYALTY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public approveLoyaltyPayout(id: string): void {
    const entries = this.getLoyaltyLedger();
    const updated = entries.map((e) => {
      if (e.id === id) {
        return { ...e, payoutStatus: 'PAID' as const };
      }
      return e;
    });
    localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(updated));
    this.logAction('APPROVE_LOYALTY_PAYOUT', 'Loyalty Points', `Approved points payout for entry ${id}.`);
  }

  // --- BROADCASTS ---
  public getBroadcasts(): Broadcast[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BROADCASTS);
      return data ? JSON.parse(data) : SEED_BROADCASTS;
    } catch {
      return SEED_BROADCASTS;
    }
  }

  public createBroadcast(bData: Omit<Broadcast, 'id' | 'sentAt' | 'deliveredCount' | 'readCount' | 'totalRecipients'>): Broadcast {
    const broadcasts = this.getBroadcasts();
    const fas = this.getFAs();
    const recipientsCount = bData.targetDistrict === 'ALL'
      ? fas.length
      : fas.filter((f) => f.district === bData.targetDistrict).length;

    const newBroadcast: Broadcast = {
      ...bData,
      id: `BC-0${broadcasts.length + 1}`,
      sentAt: bData.status === 'SENT' ? new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : undefined,
      deliveredCount: bData.status === 'SENT' ? recipientsCount : 0,
      readCount: bData.status === 'SENT' ? Math.floor(recipientsCount * 0.9) : 0,
      totalRecipients: recipientsCount,
    };

    const updated = [newBroadcast, ...broadcasts];
    localStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(updated));
    this.logAction('CREATE_BROADCAST', 'Broadcasts', `Created broadcast "${newBroadcast.title}" targeted to ${newBroadcast.targetDistrict}.`);
    return newBroadcast;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return data ? JSON.parse(data) : SEED_AUDIT_LOGS;
    } catch {
      return SEED_AUDIT_LOGS;
    }
  }

  public logAction(action: string, module: string, details: string): void {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      adminName: user.name,
      action,
      module,
      details,
      ipAddress: '192.168.1.42',
    };
    const updated = [newLog, ...logs].slice(0, 100); // keep last 100
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
  }

  // --- THRESHOLDS & SETTINGS ---
  public getThresholds(): FlagThresholds {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
      return data ? JSON.parse(data) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  }

  public updateThresholds(thresholds: FlagThresholds): void {
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
    this.logAction('UPDATE_THRESHOLDS', 'Settings', 'Updated anomaly detection flag thresholds.');
  }

  public getCurrentUser(): AdminUser {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
    }
  }

  public updateCurrentUser(user: AdminUser): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // --- CSV EXPORT UTILITY ---
  public exportToCSV(rows: Record<string, any>[], filename: string) {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const adminService = new AdminService();
