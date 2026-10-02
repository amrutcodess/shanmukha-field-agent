import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MapPin,
  Sprout,
  FileSpreadsheet,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/admin/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/admin/agents', label: t('nav.agents'), icon: Users },
    { to: '/admin/visits', label: t('nav.visits'), icon: ClipboardList },
    { to: '/admin/locations', label: t('nav.locations'), icon: MapPin },
    { to: '/admin/crops-products', label: t('nav.crops_products'), icon: Sprout },
    { to: '/admin/export', label: t('nav.export_print'), icon: FileSpreadsheet },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)] p-4 space-y-1">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        Admin Menu
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#E8F5E9] text-[#1B5E20] border-l-4 border-[#2E7D32]'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-5 h-5 text-[#2E7D32]" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
