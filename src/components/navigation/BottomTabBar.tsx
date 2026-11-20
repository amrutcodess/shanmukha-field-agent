import React from 'react';
import { useShanpoorna, TabType } from '../../context/ShanpoornaContext';
import { Home, Users, BookOpen, User } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const { currentTab, navigateToTab, t } = useShanpoorna();

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    {
      id: 'home',
      label: t.navHome,
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'farmers',
      label: t.navFarmers,
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'resources',
      label: t.navResources,
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: t.navProfile,
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 flex items-center justify-around z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] shrink-0">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigateToTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 ${
              isActive ? 'text-[#0B7A3B] font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-105' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] sm:text-[11px] tracking-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B7A3B] mt-0.5 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
