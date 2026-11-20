import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin, DateRange } from '../../context/AdminContext';
import { District } from '../../types/admin';
import {
  LayoutDashboard,
  MapPin,
  Award,
  Footprints,
  Users,
  CalendarCheck,
  Sprout,
  ShoppingBag,
  TrendingUp,
  Coins,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Radio,
  FileSpreadsheet,
  History,
  Settings,
  Search,
  Bell,
  LogOut,
  RotateCcw,
  RefreshCw,
  Smartphone,
  ChevronDown,
  X,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const {
    dateRange,
    setDateRange,
    selectedDistrict,
    setSelectedDistrict,
    searchQuery,
    setSearchQuery,
    adminUser,
    logout,
    resetDemoData,
    lastRefreshTime,
    refreshData,
    visits,
  } = useAdmin();

  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Unresolved anomaly flags count
  const pendingFlags = visits.flatMap((v) => v.flags.filter((f) => f.reviewStatus === 'PENDING'));

  const navLinks = [
    { to: '/admin/fas', label: 'Field Assistant (FA) Management', icon: UserCheck },
    { to: '/admin/command', label: 'Command Center Overview', icon: LayoutDashboard },
    { to: '/admin/performance', label: 'FA Performance & Leaderboard', icon: Award },
    { to: '/admin/visits', label: 'Visit Explorer & Verification', icon: Footprints },
    { to: '/admin/agronomy', label: 'Agronomy Intelligence & Diagnostics', icon: Sprout },
    { to: '/admin/sales', label: 'Products & Value-Added Services Sales', icon: ShoppingBag },
    { to: '/admin/loyalty', label: 'Loyalty Points & Incentive Ledger', icon: Coins },
    {
      to: '/admin/fraud',
      label: 'Data Quality, Anomaly & Vigilance Console',
      icon: ShieldAlert,
      badge: pendingFlags.length > 0 ? pendingFlags.length : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { to: '/admin/broadcasts', label: 'Field Broadcasts & Advisory Alerts', icon: Radio },
    { to: '/admin/reports', label: 'Executive Reports & Audits', icon: FileSpreadsheet },
  ];

  const districts: (District | 'ALL')[] = [
    'ALL',
    'Medak',
    'Sangareddy',
    'Siddipet',
    'Vikarabad',
    'Nizamabad',
    'Kamareddy',
  ];

  const dateRanges: { id: DateRange; label: string }[] = [
    { id: 'TODAY', label: 'Today' },
    { id: '7D', label: '7 Days' },
    { id: '30D', label: '30 Days' },
    { id: 'CUSTOM', label: 'All (90d)' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-100 font-sans text-stone-900 selection:bg-[#0B7A3B] selection:text-white">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col justify-between shadow-xs z-30">
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center px-5 border-b border-stone-200 gap-3 bg-gradient-to-r from-emerald-50/50 to-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B7A3B] to-[#085a2b] flex items-center justify-center text-white text-base font-black shadow-xs border border-emerald-400">
              🌾
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-[#0B7A3B] uppercase leading-none">
                SHANMUKHA
              </h1>
              <p className="text-[10px] font-bold text-stone-500 tracking-wider uppercase mt-0.5">
                Head Office Admin Portal
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-none text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-[#0B7A3B] font-bold shadow-xs border border-emerald-200/60'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-inherit" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 space-y-2">
          {/* Quick switch to FA Mobile App */}
          <a
            href="/"
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-[#0B7A3B] text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Smartphone className="w-4 h-4 text-[#0B7A3B]" />
            <span>Switch to FA Mobile App</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>

          {/* Reset Demo State button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data back to initial showcase state?')) {
                resetDemoData();
              }
            }}
            className="w-full py-1.5 px-3 rounded-lg text-stone-500 hover:text-stone-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between gap-4 z-20 flex-shrink-0">
          {/* Global Search Bar */}
          <div className="relative w-72 max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FA, farmer, village, or ID..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B7A3B] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Filters & User */}
          <div className="flex items-center gap-3 text-xs">
            {/* District Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-semibold text-stone-500">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value as any)}
                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'All Districts' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="inline-flex bg-stone-100 p-0.5 rounded-xl border border-stone-200/80">
              {dateRanges.map((dr) => (
                <button
                  key={dr.id}
                  onClick={() => setDateRange(dr.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRange === dr.id
                      ? 'bg-white text-[#0B7A3B] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {dr.label}
                </button>
              ))}
            </div>

            {/* Live Telemetry Refresh Indicator */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-stone-200">
              <button
                onClick={refreshData}
                title="Refresh live metrics"
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xl:inline">Live:</span>
                <span className="font-mono">{lastRefreshTime}</span>
              </div>
            </div>

            {/* Notification Bell with Anomaly Drawer */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition"
              title="System Alerts & Anomalies"
            >
              <Bell className="w-4 h-4" />
              {pendingFlags.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Admin Profile Dropdown */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
              <img
                src={adminUser.avatar}
                alt={adminUser.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-300"
              />
              <div className="hidden sm:block text-left">
                <div className="font-bold text-stone-800 leading-none truncate max-w-[120px]">
                  {adminUser.name}
                </div>
                <div className="text-[10px] text-stone-400 font-semibold mt-0.5">
                  {adminUser.role.replace('_', ' ')}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of Admin Portal"
                className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route Workspace with Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>

      {/* Notifications / Alerts Slide-Over Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Active Anomaly Alerts ({pendingFlags.length})
                </h3>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingFlags.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No active anomaly alerts! All visits compliant.
                </div>
              ) : (
                pendingFlags.map((flag) => (
                  <div
                    key={flag.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/admin/fraud');
                    }}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-50 cursor-pointer transition space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 font-mono text-[11px]">
                        {flag.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-stone-700 leading-snug">{flag.description}</p>
                    <p className="text-[10px] text-stone-400 pt-1">
                      Detected: {new Date(flag.detectedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 text-center">
              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  navigate('/admin/fraud');
                }}
                className="text-xs font-bold text-[#0B7A3B] hover:underline"
              >
                Open Full Data Quality & Fraud Console →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
