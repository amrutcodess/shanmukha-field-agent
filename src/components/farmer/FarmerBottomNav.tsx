import React from 'react';
import { Home, FileText, Bell, HelpCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getTranslation } from '../../i18n/translations';

export type FarmerTab = 'home' | 'reports' | 'alerts' | 'help';

interface FarmerBottomNavProps {
  currentTab: FarmerTab;
  onTabChange: (tab: FarmerTab) => void;
}

export const FarmerBottomNav: React.FC<FarmerBottomNavProps> = ({ currentTab, onTabChange }) => {
  const { language, alerts, reports } = useData();
  const { activeFarmer } = useAuth();
  const t = getTranslation(language);

  // Filter alerts & reports for the logged in farmer
  const farmerAlerts = activeFarmer 
    ? alerts.filter(a => a.farmerId === activeFarmer.id || a.farmerId === 'all')
    : [];
  const farmerReports = activeFarmer
    ? reports.filter(r => r.farmerId === activeFarmer.id)
    : [];

  const unreadAlertsCount = farmerAlerts.filter(a => !a.isRead).length;
  const hasUnreadReport = farmerReports.some(r => r.isNew);

  const tabs: { id: FarmerTab; label: string; icon: typeof Home; badge?: number | boolean }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'reports', label: t.navReports, icon: FileText, badge: hasUnreadReport },
    { id: 'alerts', label: t.navAlerts, icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
    { id: 'help', label: t.navHelp, icon: HelpCircle }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 max-w-[480px] mx-auto">
      <nav 
        className="pointer-events-auto bg-white/90 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(20,83,45,0.12)] rounded-3xl p-1.5 flex items-center justify-around min-h-[64px]"
        aria-label="Farmer navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[56px] relative active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-tr from-[#14532D] to-[#2E7D32] text-white shadow-sm'
                  : 'text-stone-500 hover:text-[#14532D] hover:bg-emerald-50/60'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                
                {/* Count badge for Alerts */}
                {tab.badge && typeof tab.badge === 'number' && (
                  <span className="absolute -top-1.5 -right-3 bg-[#F57C00] text-white text-[11px] font-black min-w-[18px] h-4.5 rounded-full flex items-center justify-center px-1 shadow-sm border border-white">
                    {tab.badge}
                  </span>
                )}
                {/* Subtle dot for new Reports */}
                {tab.badge && typeof tab.badge === 'boolean' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#F57C00] rounded-full border border-white shadow-xs" />
                )}
              </div>

              <span className={`text-xs font-bold mt-1 tracking-tight leading-none ${
                isActive ? 'text-white' : 'text-stone-600'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
