import React from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import {
  Bell,
  Sun,
  Users,
  FileCheck,
  Sparkles,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Activity,
  CloudSun,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    faProfile,
    setCurrentScreen,
    navigateToTab,
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    showToast,
    t,
  } = useShanpoorna();

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-24 text-stone-800">
      {/* 1. Header with Green Gradient */}
      <header className="bg-gradient-to-b from-[#096330] via-[#0B7A3B] to-[#0D8742] text-white px-5 pt-7 pb-6 rounded-b-[28px] shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-white drop-shadow-xs">
              {t.appName}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/90 mt-1">
              {t.appSubtitle}
            </p>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 transition-transform active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#E8731A] border-2 border-[#0B7A3B] rounded-full" />
          </button>
        </div>

        {/* Profile / Workspace Info */}
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-12 rounded-full bg-emerald-800/80 border-2 border-emerald-300/40 flex items-center justify-center font-bold text-base text-emerald-100 shadow-inner">
            {faProfile.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">
              {t.greeting}, {faProfile.name}
            </h2>
            <p className="text-xs text-emerald-100/80 truncate">
              {t.workspace} · {faProfile.location}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-[10px] font-semibold text-emerald-200 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.online}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 space-y-4 -mt-2">
        {/* 2. Weather Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-wider text-stone-500 uppercase">
              {t.weatherTitle}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0B7A3B]">
                {t.weatherTemp}
              </span>
              <span className="text-sm font-semibold text-stone-700">
                {t.weatherCondition}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">{t.weatherRange}</p>
            <p className="text-[10px] text-stone-400">{t.weatherFootnote}</p>
          </div>

          {/* Weather Icon */}
          <div className="relative p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-500">
            <CloudSun className="w-10 h-10 text-amber-500" />
            <Sun className="w-5 h-5 text-amber-400 absolute top-1 right-1 animate-spin-slow opacity-80" />
          </div>
        </section>

        {/* 3. Visit Overview */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#0B7A3B]">{t.visitOverview}</h3>
            <span className="text-[11px] text-stone-400">{t.tapCardToView}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Today's Visits */}
            <div
              onClick={() => {
                navigateToTab('farmers');
                showToast("Viewing today's assigned visits", 'info');
              }}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 cursor-pointer hover:border-amber-400 transition relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#E8731A]" />
              <p className="text-[10px] font-bold tracking-wider text-stone-500 uppercase mt-0.5">
                {t.todaysVisits}
              </p>
              <div className="text-3xl font-black text-[#0B7A3B] mt-1 mb-0.5">04</div>
              <p className="text-[11px] text-stone-600 font-medium">2 completed · 2 pending</p>
              
              {/* Progress bar */}
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden my-2.5">
                <div className="bg-[#0B7A3B] h-full rounded-full w-1/2" />
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-[#E8731A] pt-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>{t.viewTodaysVisits}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: This Month */}
            <div
              onClick={() => {
                navigateToTab('farmers');
                showToast('Viewing monthly completed visits', 'info');
              }}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 cursor-pointer hover:border-emerald-400 transition relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#0B7A3B]" />
              <p className="text-[10px] font-bold tracking-wider text-stone-500 uppercase mt-0.5">
                {t.thisMonth}
              </p>
              <div className="text-3xl font-black text-[#0B7A3B] mt-1 mb-0.5">68</div>
              <p className="text-[11px] text-stone-600 font-medium">52 completed · 16 pending</p>
              
              {/* Progress bar */}
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden my-2.5">
                <div className="bg-[#0B7A3B] h-full rounded-full w-[76%]" />
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-[#E8731A] pt-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>{t.viewMonthlyVisits}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Services */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#0B7A3B]">{t.services}</h3>
            <span className="text-[11px] text-stone-400">{t.selectOption}</span>
          </div>

          <div className="space-y-2.5">
            {/* Service 1: My Farmers */}
            <div
              onClick={() => navigateToTab('farmers')}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B7A3B] shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors">
                    {t.myFarmers}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{t.myFarmersDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#E8731A] group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Service 2: Invoice Approval */}
            <div
              onClick={() => setCurrentScreen('INVOICE_APPROVAL')}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 flex items-center justify-between cursor-pointer hover:border-amber-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8731A] shrink-0">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#E8731A] transition-colors">
                    {t.invoiceApproval}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{t.invoiceApprovalDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#E8731A] group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Service 3: Product Recommendation */}
            <div
              onClick={() => {
                // Shortcut directly into recommendation scanner flow for Ramesh Goud
                setCurrentScreen('LOG_FIELD_VISIT');
                showToast('Launching Product Recommendation & Scanner', 'info');
              }}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-[#0B7A3B] shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors">
                    {t.productRecommendation}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{t.productRecommendationDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#E8731A] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </section>

        {/* Footer Season Tag */}
        <div className="text-center pt-5 pb-2 text-[11px] font-bold tracking-wider text-stone-400 uppercase">
          {t.footerSeason}
        </div>
      </div>

      {/* Notifications Drawer Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#0B7A3B]" />
                <h3 className="text-base font-bold text-stone-900">Notifications</h3>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-white transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{n.title}</span>
                    <span className="text-[10px] text-stone-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-stone-100 bg-stone-50 text-center">
              <button
                onClick={() => {
                  showToast('All notifications marked as read', 'info');
                  setIsNotificationsOpen(false);
                }}
                className="text-xs text-[#0B7A3B] font-semibold hover:underline"
              >
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
