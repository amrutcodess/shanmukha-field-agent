import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Users, 
  ShieldCheck, 
  FileText, 
  Bell, 
  Send, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  ArrowRight, 
  LogOut, 
  Clock, 
  ChevronRight,
  X,
  UploadCloud,
  FileCheck,
  Menu,
  Navigation,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { VENDORS } from '../services/storageService';
import { 
  VendorId, 
  KeyValueStatus, 
  ReportKeyValue, 
  Farmer 
} from '../types';
import { FarmMap } from '../components/common/FarmMap';

// Smooth counting number component
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const start = displayValue;
    const end = value;
    if (start === end) return;
    const duration = 450;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad
      const ease = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <>{displayValue}</>;
};

export const AdminPage: React.FC = () => {
  const { isAdminLoggedIn, loginAdmin, logoutAdmin } = useAuth();
  const { 
    farmers, 
    consents, 
    reports, 
    alerts, 
    activityLogs, 
    publishReport, 
    sendNotification, 
    triggerSuccess,
    dataMode 
  } = useData();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'farmers' | 'notifications' | 'reports' | 'consents'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin Login Form State
  const [email, setEmail] = useState('admin@shanmukha.in');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Search Farmers
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState<Farmer | null>(null);

  // Send Notification Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAudienceType, setNotifAudienceType] = useState<'all' | 'specific' | 'village' | 'crop'>('all');
  const [notifSpecificFarmerId, setNotifSpecificFarmerId] = useState(farmers[0]?.id || 'farmer-1');
  const [notifVendor, setNotifVendor] = useState<VendorId | ''>('');

  // Send Report Form State
  const [repFarmerId, setRepFarmerId] = useState(farmers[0]?.id || 'farmer-1');
  const [repVendorId, setRepVendorId] = useState<VendorId>('fyllo');
  const [repTitle, setRepTitle] = useState('');
  const [repSummary, setRepSummary] = useState('');
  const [repAdvice, setRepAdvice] = useState('');
  const [repKeyValues, setRepKeyValues] = useState<ReportKeyValue[]>([
    { label: 'Soil Moisture', value: '70%', status: 'good', progressPercent: 70 },
    { label: 'Leaf Temperature', value: '28°C', status: 'good', progressPercent: 45 },
    { label: 'Rain Prediction', value: '25 mm', status: 'warning', progressPercent: 60 }
  ]);
  const [mockPdfName, setMockPdfName] = useState<string>('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(email, password);
    if (!ok) {
      setLoginError('Invalid credentials. Use admin@shanmukha.in / admin123');
    } else {
      setLoginError('');
    }
  };

  const handleFillDemoCreds = () => {
    setEmail('admin@shanmukha.in');
    setPassword('admin123');
  };

  const handleAddKeyValue = () => {
    if (repKeyValues.length < 5) {
      setRepKeyValues([...repKeyValues, { label: '', value: '', status: 'good', progressPercent: 60 }]);
    }
  };

  const handleRemoveKeyValue = (index: number) => {
    setRepKeyValues(repKeyValues.filter((_, i) => i !== index));
  };

  const handleUpdateKeyValue = (index: number, field: keyof ReportKeyValue, value: any) => {
    const updated = [...repKeyValues];
    updated[index] = { ...updated[index], [field]: value };
    setRepKeyValues(updated);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    let targetFarmerId = 'all';
    if (notifAudienceType === 'specific') {
      targetFarmerId = notifSpecificFarmerId;
    }

    sendNotification({
      farmerId: targetFarmerId,
      title: notifTitle.trim(),
      titleTe: notifTitle.trim(),
      message: notifMessage.trim(),
      messageTe: notifMessage.trim(),
      vendorId: notifVendor ? notifVendor : undefined,
      vendorName: notifVendor ? VENDORS[notifVendor].name : 'Shanmukha Admin',
      type: notifVendor === 'fyllo' ? 'weather' : notifVendor === 'kshema' ? 'insurance' : notifVendor === 'samunnati' ? 'loan' : notifVendor === 'biota' ? 'soil' : 'admin'
    });

    triggerSuccess('Notification Sent', `Delivered to target audience`);
    setNotifTitle('');
    setNotifMessage('');
  };

  const handlePublishReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repSummary.trim()) return;

    const vendor = VENDORS[repVendorId];
    publishReport({
      farmerId: repFarmerId,
      vendorId: repVendorId,
      vendorName: vendor.name,
      title: repTitle.trim(),
      titleTe: repTitle.trim(),
      summary: repSummary.trim(),
      summaryTe: repSummary.trim(),
      advice: repAdvice.trim() || 'Follow recommended irrigation schedule.',
      adviceTe: repAdvice.trim() || 'పొలంలో సిఫార్సు చేసిన నీటి యాజమాన్య పద్ధతులను పాటించండి.',
      keyValues: repKeyValues.filter(kv => kv.label && kv.value),
      isNew: true,
      pdfUrl: mockPdfName ? `/reports/${mockPdfName}` : undefined
    });

    triggerSuccess('Report Published', `Delivered to farmer app with New badge`);
    setRepTitle('');
    setRepSummary('');
    setRepAdvice('');
  };

  const handleExportConsentsCSV = () => {
    const headers = ['Consent ID', 'Farmer Name', 'Phone', 'Village', 'Partner Vendor', 'Status', 'Consented At', 'Withdrawn At'];
    const rows = consents.map(c => [
      c.id,
      `"${c.farmerName}"`,
      c.farmerPhone,
      `"${c.farmerVillage}"`,
      `"${c.vendorName}"`,
      c.status,
      `"${c.consentedAt}"`,
      `"${c.withdrawnAt || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shanmukha_consents_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerSuccess('CSV Exported', 'Downloaded consent records');
  };

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.village.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.crop.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.phone.includes(farmerSearch)
  );

  // If not logged in, show Admin Login
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#F6FAF5] to-[#E8F5E9] flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md max-w-md w-full rounded-3xl p-8 shadow-xl border border-emerald-900/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#14532D] to-[#2E7D32] flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-stone-900 leading-tight">Shanmukha Admin</h1>
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Partner & Operations Portal</p>
            </div>
          </div>

          {/* Hint credentials banner with Auto-fill button */}
          <div className="mb-6 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-stone-500 uppercase">Demo Access</p>
              <p className="text-xs font-black text-[#14532D]">admin@shanmukha.in / admin123</p>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCreds}
              className="text-xs bg-[#14532D] text-white px-3 py-1.5 rounded-xl font-bold hover:bg-[#0F2A1A] transition-colors"
            >
              Auto-fill demo
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:border-[#2E7D32]"
                required
              />
            </div>

            {loginError && (
              <p className="text-xs font-bold text-red-600">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-3.5 rounded-2xl font-black text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Metrics
  const activeConsentsCount = consents.filter(c => c.status === 'active').length;
  const totalReportsCount = reports.length;
  const totalAlertsCount = alerts.length;
  const geotaggedCount = farmers.filter(f => f.lat && f.lng).length;

  return (
    <div className="min-h-dvh bg-[#F6FAF5] flex flex-col text-stone-800 antialiased">
      {/* Slim Top Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile menu drawer trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-xl hover:bg-stone-100 text-stone-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#14532D] to-[#2E7D32] flex items-center justify-center text-white shadow-2xs">
            <Sprout className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              Shanmukha Admin
            </h1>
            <span className="text-[10px] bg-emerald-50 text-[#14532D] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
              {dataMode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right text-xs">
            <p className="font-bold text-stone-800">admin@shanmukha.in</p>
          </div>
          <button
            type="button"
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all border border-stone-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Navigation Sidebar (Desktop + Mobile Drawer) */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-white md:bg-transparent rounded-3xl p-4 shadow-xl md:shadow-none border border-stone-200 md:border-0 shrink-0 h-fit space-y-1 transition-transform duration-200
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex items-center justify-between pb-3 md:hidden border-b border-stone-100 mb-2">
            <span className="text-sm font-black text-stone-900">Menu</span>
            <button 
              type="button" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: Clock },
            { id: 'farmers', label: `Farmers (${farmers.length})`, icon: Users },
            { id: 'notifications', label: 'Send Notification', icon: Bell },
            { id: 'reports', label: 'Send Report', icon: FileText },
            { id: 'consents', label: 'Consent Log', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-[#14532D] to-[#2E7D32] text-white shadow-sm'
                    : 'text-stone-600 hover:bg-emerald-50/60 hover:text-[#14532D]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards Grid with Animated Number Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-900/10 shadow-2xs">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Farmers</span>
                    <Users className="w-4 h-4 text-[#14532D]" />
                  </div>
                  <motion.p 
                    className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <AnimatedCounter value={farmers.length} />
                  </motion.p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    <AnimatedCounter value={geotaggedCount} /> Geotagged
                  </p>
                </div>

                <div className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-900/10 shadow-2xs">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Consents</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <motion.p 
                    className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <AnimatedCounter value={activeConsentsCount} />
                  </motion.p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Across 4 partners</p>
                </div>

                <div className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-900/10 shadow-2xs">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Reports</span>
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <motion.p 
                    className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <AnimatedCounter value={totalReportsCount} />
                  </motion.p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Shanmukha branded</p>
                </div>

                <div className="glass-card rounded-3xl p-4 sm:p-5 border border-emerald-900/10 shadow-2xs">
                  <div className="flex items-center justify-between text-stone-400 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Alerts</span>
                    <Bell className="w-4 h-4 text-[#F57C00]" />
                  </div>
                  <motion.p 
                    className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <AnimatedCounter value={totalAlertsCount} />
                  </motion.p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Direct advisories</p>
                </div>
              </div>

              {/* Vendor Activity Log */}
              <div className="glass-card rounded-3xl border border-emerald-900/10 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-stone-900">Vendor Activity Log</h3>
                    <p className="text-xs text-stone-400">Automatic event stream from partner services</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50/60 text-stone-400 uppercase text-[11px] border-b border-stone-100 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-bold">Time</th>
                        <th className="px-5 py-3 font-bold">Farmer</th>
                        <th className="px-5 py-3 font-bold">Partner Vendor</th>
                        <th className="px-5 py-3 font-bold">Action</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-5 py-3.5 text-stone-400 text-xs font-medium whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-stone-900">
                            {log.farmerName}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-stone-700">
                            {log.vendorName}
                          </td>
                          <td className="px-5 py-3.5 text-stone-600 text-xs font-medium">
                            {log.action}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#14532D]">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FARMERS (Responsive Table + Stacked Cards on Mobile) */}
          {activeTab === 'farmers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-4 rounded-3xl border border-emerald-900/10 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    placeholder="Search by name, village, or crop..."
                    className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-xs font-semibold border border-stone-200 focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div className="text-xs text-stone-500 font-bold">
                  {filteredFarmers.length} Registered Farmers
                </div>
              </div>

              {/* Farmers Table / Stacked Cards */}
              <div className="glass-card rounded-3xl border border-emerald-900/10 shadow-2xs overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50/60 text-stone-400 uppercase text-[11px] border-b border-stone-100 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-bold">Farmer Name</th>
                        <th className="px-5 py-3 font-bold">Phone Number</th>
                        <th className="px-5 py-3 font-bold">Village & District</th>
                        <th className="px-5 py-3 font-bold">Crop & Area</th>
                        <th className="px-5 py-3 font-bold">Geotag</th>
                        <th className="px-5 py-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredFarmers.map((f) => (
                        <tr 
                          key={f.id} 
                          onClick={() => setSelectedFarmerDetail(f)}
                          className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{f.avatar || '👨‍🌾'}</span>
                              <div>
                                <p className="font-bold text-stone-900">{f.name}</p>
                                <p className="text-xs text-stone-400">{f.nameTe}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-stone-700 tabular-nums">
                            {f.phone}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-stone-800 text-xs">{f.village}</p>
                            <p className="text-[11px] text-stone-400">{f.district}, {f.state}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-[#14532D]">
                              {f.crop} • {f.acres} Acres
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {f.lat && f.lng ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#14532D]">
                                <Navigation className="w-3 h-3" />
                                <span>Captured</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-400">
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              className="text-[#14532D] hover:underline font-bold text-xs inline-flex items-center gap-1"
                            >
                              <span>View Profile</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards View */}
                <div className="md:hidden divide-y divide-stone-100 p-2 space-y-2">
                  {filteredFarmers.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFarmerDetail(f)}
                      className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-2 active:bg-emerald-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{f.avatar || '👨‍🌾'}</span>
                          <div>
                            <p className="font-bold text-stone-900">{f.name}</p>
                            <p className="text-xs text-stone-400">{f.phone}</p>
                          </div>
                        </div>
                        {f.lat ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-[#14532D] px-2 py-0.5 rounded-full">
                            Captured
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                            Missing
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                        <span>{f.village}, {f.district}</span>
                        <span className="font-black text-[#14532D]">{f.crop} ({f.acres} ac)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Farmer Profile Modal Drawer with Geotag Map Card */}
              {selectedFarmerDetail && (
                <div 
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                  onClick={() => setSelectedFarmerDetail(null)}
                >
                  <div 
                    className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-emerald-900/10 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                    data-lenis-prevent
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedFarmerDetail.avatar || '👨‍🌾'}</span>
                        <div>
                          <h3 className="text-lg font-black text-stone-900">{selectedFarmerDetail.name}</h3>
                          <p className="text-xs text-stone-500">{selectedFarmerDetail.phone} • {selectedFarmerDetail.village}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFarmerDetail(null)}
                        className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Geotag Map Card in Admin Detail */}
                    {selectedFarmerDetail.lat && selectedFarmerDetail.lng ? (
                      <div className="glass-card rounded-2xl p-3 border border-emerald-900/10 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-[#14532D]">
                            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>GPS Farm Location</span>
                          </span>
                          <span className="text-[11px] text-stone-400 tabular-nums">
                            {selectedFarmerDetail.lat.toFixed(4)}, {selectedFarmerDetail.lng.toFixed(4)}
                          </span>
                        </div>

                        <FarmMap
                          lat={selectedFarmerDetail.lat}
                          lng={selectedFarmerDetail.lng}
                          accuracy={selectedFarmerDetail.accuracy || 10}
                          readOnly={true}
                          heightClass="h-40"
                        />

                        {selectedFarmerDetail.geotagCapturedAt && (
                          <p className="text-[10px] text-stone-400">
                            Captured on: {selectedFarmerDetail.geotagCapturedAt}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-400 text-center">
                        Geotag coordinates not recorded for this farmer.
                      </div>
                    )}

                    {/* Consents Given */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Partner Consents</h4>
                      <div className="space-y-2">
                        {consents.filter(c => c.farmerId === selectedFarmerDetail.id).length === 0 ? (
                          <p className="text-xs text-stone-400 italic">No partner consents given yet.</p>
                        ) : (
                          consents.filter(c => c.farmerId === selectedFarmerDetail.id).map(c => (
                            <div key={c.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-stone-900">{c.vendorName}</p>
                                <p className="text-[10px] text-stone-400">{c.consentedAt}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'active' ? 'bg-emerald-100 text-[#14532D]' : 'bg-stone-200 text-stone-600'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Reports Delivered */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Delivered Reports</h4>
                      <div className="space-y-2">
                        {reports.filter(r => r.farmerId === selectedFarmerDetail.id).length === 0 ? (
                          <p className="text-xs text-stone-400 italic">No reports delivered yet.</p>
                        ) : (
                          reports.filter(r => r.farmerId === selectedFarmerDetail.id).map(r => (
                            <div key={r.id} className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/50 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-[#14532D]">{r.vendorName}</span>
                                <span className="text-[10px] text-stone-400">{r.date}</span>
                              </div>
                              <p className="font-bold text-stone-900">{r.title}</p>
                              <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">{r.summary}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEND NOTIFICATION */}
          {activeTab === 'notifications' && (
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-2xs space-y-5">
              <div>
                <h3 className="text-lg font-black text-stone-900">Send Notification to Farmers</h3>
                <p className="text-xs text-stone-500">
                  Instantly pushes alerts into farmer app with real-time bottom navigation badge.
                </p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Target Audience</label>
                    <select
                      value={notifAudienceType}
                      onChange={(e) => setNotifAudienceType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:border-[#2E7D32]"
                    >
                      <option value="all">All Farmers (Broadcast)</option>
                      <option value="specific">Specific Farmer (e.g. Ramesh Reddy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Partner Origin</label>
                    <select
                      value={notifVendor}
                      onChange={(e) => setNotifVendor(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:border-[#2E7D32]"
                    >
                      <option value="">Shanmukha Agritech Admin</option>
                      <option value="fyllo">Fyllo (Weather & IoT)</option>
                      <option value="kshema">Kshema (Insurance)</option>
                      <option value="samunnati">Samunnati (Finance & Sale)</option>
                      <option value="biota">BioTa (Soil Test)</option>
                    </select>
                  </div>
                </div>

                {notifAudienceType === 'specific' && (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Select Specific Farmer</label>
                    <select
                      value={notifSpecificFarmerId}
                      onChange={(e) => setNotifSpecificFarmerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:border-[#2E7D32]"
                    >
                      {farmers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} - {f.village} ({f.crop})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Alert Title</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g. తుఫాను హెచ్చరిక (Cyclone Warning)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-900 focus:border-[#2E7D32]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Message</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="e.g. రాబోయే 24 గంటల్లో భారీ గాలులు వీయవచ్చు. చేలలో తగిన జాగ్రత్తలు తీసుకోండి."
                    rows={3}
                    className="w-full p-3.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-900 focus:border-[#2E7D32] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#14532D] hover:bg-[#0F2A1A] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-md flex items-center gap-2 active:scale-97 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Notification</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: SEND REPORT */}
          {activeTab === 'reports' && (
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-2xs space-y-5">
              <div>
                <h3 className="text-lg font-black text-stone-900">Publish Report to Farmer</h3>
                <p className="text-xs text-stone-500">
                  Delivers a Shanmukha-branded partner report directly into the farmer's "My Reports" tab.
                </p>
              </div>

              <form onSubmit={handlePublishReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Select Farmer</label>
                    <select
                      value={repFarmerId}
                      onChange={(e) => setRepFarmerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:border-[#2E7D32]"
                    >
                      {farmers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} - {f.village} ({f.crop})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Partner Vendor</label>
                    <select
                      value={repVendorId}
                      onChange={(e) => setRepVendorId(e.target.value as VendorId)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs focus:border-[#2E7D32]"
                    >
                      <option value="fyllo">Fyllo (Soil & Climate)</option>
                      <option value="kshema">Kshema (Crop Insurance)</option>
                      <option value="samunnati">Samunnati (Loans & Market)</option>
                      <option value="biota">BioTa (Soil Testing)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Report Title</label>
                  <input
                    type="text"
                    value={repTitle}
                    onChange={(e) => setRepTitle(e.target.value)}
                    placeholder="e.g. Fyllo నేల & వాతావరణ తాజా సలహా"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-900 focus:border-[#2E7D32]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Summary</label>
                  <textarea
                    value={repSummary}
                    onChange={(e) => setRepSummary(e.target.value)}
                    placeholder="Short summary for the farmer..."
                    rows={2}
                    className="w-full p-3.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-900 focus:border-[#2E7D32] resize-none"
                    required
                  />
                </div>

                {/* Key Values */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-stone-400 uppercase">
                      Key Metrics (Up to 5)
                    </label>
                    {repKeyValues.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddKeyValue}
                        className="text-xs font-bold text-[#14532D] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Metric</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {repKeyValues.map((kv, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={kv.label}
                          onChange={(e) => handleUpdateKeyValue(idx, 'label', e.target.value)}
                          placeholder="Label (e.g. Moisture)"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={kv.value}
                          onChange={(e) => handleUpdateKeyValue(idx, 'value', e.target.value)}
                          placeholder="Value (e.g. 70%)"
                          className="w-24 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold"
                        />
                        <select
                          value={kv.status}
                          onChange={(e) => handleUpdateKeyValue(idx, 'status', e.target.value as KeyValueStatus)}
                          className="w-24 px-2 py-1.5 rounded-xl border border-stone-200 bg-white text-[11px] font-bold"
                        >
                          <option value="good">Good</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyValue(idx)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Plain Advice</label>
                  <textarea
                    value={repAdvice}
                    onChange={(e) => setRepAdvice(e.target.value)}
                    placeholder="Agronomist advice paragraph for the farmer..."
                    rows={2}
                    className="w-full p-3.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-900 focus:border-[#2E7D32] resize-none"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-stone-400" />
                    <span className="font-semibold text-stone-600">
                      {mockPdfName ? `Attached: ${mockPdfName}` : 'Optional PDF Attachment'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMockPdfName(`Shanmukha_${repVendorId.toUpperCase()}_Cert.pdf`)}
                    className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg font-bold"
                  >
                    {mockPdfName ? 'Attached' : 'Mock Attach'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="bg-[#14532D] hover:bg-[#0F2A1A] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-md flex items-center gap-2 active:scale-97 transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Publish to Farmer</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: CONSENTS LOG */}
          {activeTab === 'consents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between glass-card p-4 rounded-3xl border border-emerald-900/10 shadow-2xs">
                <div>
                  <h3 className="text-base font-black text-stone-900">Partner Consent Registry</h3>
                  <p className="text-xs text-stone-400">Audit trail of farmer data sharing permissions</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportConsentsCSV}
                  className="flex items-center gap-1.5 bg-[#14532D] hover:bg-[#0F2A1A] text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to CSV</span>
                </button>
              </div>

              <div className="glass-card rounded-3xl border border-emerald-900/10 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50/60 text-stone-400 uppercase text-[11px] border-b border-stone-100 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-bold">Farmer Name</th>
                        <th className="px-5 py-3 font-bold">Phone & Village</th>
                        <th className="px-5 py-3 font-bold">Partner Vendor</th>
                        <th className="px-5 py-3 font-bold">Date & Time</th>
                        <th className="px-5 py-3 font-bold">Consent Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {consents.map((c) => (
                        <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-stone-900">
                            {c.farmerName}
                          </td>
                          <td className="px-5 py-3.5 text-stone-600 text-xs">
                            <p className="font-semibold">{c.farmerPhone}</p>
                            <p className="text-stone-400">{c.farmerVillage}</p>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-stone-700">
                            {c.vendorName}
                          </td>
                          <td className="px-5 py-3.5 text-stone-400 text-xs">
                            {c.consentedAt}
                            {c.withdrawnAt && (
                              <p className="text-red-500 font-semibold mt-0.5">Withdrawn: {c.withdrawnAt}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              c.status === 'active' 
                                ? 'bg-emerald-100 text-[#14532D]' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {c.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
