import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import {
  PlusCircle,
  ClipboardList,
  LayoutDashboard,
  Users,
  MapPin,
  MoreHorizontal,
  FileSpreadsheet,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();

  if (!profile) return null;

  const isAgent = profile.role === 'agent';

  const agentItems = [
    { to: '/agent/new-visit', label: t('nav.new_visit'), icon: PlusCircle },
    { to: '/agent/my-visits', label: t('nav.my_visits'), icon: ClipboardList },
  ];

  const adminItems = [
    { to: '/admin/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/admin/agents', label: t('nav.agents'), icon: Users },
    { to: '/admin/visits', label: t('nav.visits'), icon: ClipboardList },
    { to: '/admin/locations', label: t('nav.locations'), icon: MapPin },
    { to: '/admin/more', label: t('nav.more'), icon: MoreHorizontal },
  ];

  const items = isAgent ? agentItems : adminItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition min-h-[48px] ${
                  isActive
                    ? 'text-[#2E7D32] font-bold border-t-2 border-[#2E7D32]'
                    : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-6 h-6 mb-0.5" />
              <span className="truncate max-w-[70px] text-[11px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
