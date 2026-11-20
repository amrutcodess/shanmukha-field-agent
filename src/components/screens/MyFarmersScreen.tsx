import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import {
  ArrowLeft,
  Bell,
  Search,
  Download,
  Plus,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export const MyFarmersScreen: React.FC = () => {
  const {
    farmers,
    setActiveFarmerId,
    setCurrentScreen,
    setIsNotificationsOpen,
    showToast,
    t,
  } = useShanpoorna();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MEMBERS' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFarmers = farmers.filter((farmer) => {
    // Filter by tab
    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'MEMBERS'
        ? farmer.status === 'MEMBER'
        : farmer.status === 'PAYMENT PENDING' || farmer.status === 'NEW';

    // Filter by search
    const matchesSearch =
      farmer.qa.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.qa.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.qa.village.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleSelectFarmer = (farmerId: string) => {
    setActiveFarmerId(farmerId);
    setCurrentScreen('FARMER_PROFILE');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const maskPhone = (phone: string) => {
    const digits = phone.replace(/[\s+-]/g, '');
    if (digits.length >= 10) {
      const start = digits.slice(-10, -8);
      const end = digits.slice(-2);
      return `${start}XXXXXX${end}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-28 text-stone-800">
      {/* Top Header */}
      <header className="bg-white px-4 pt-4 pb-3 border-b border-stone-200/80 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('HOME')}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 text-[#0B7A3B] transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              {t.myFarmers}
            </h1>
          </div>

          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-full hover:bg-stone-100 text-stone-600 transition"
          >
            <Bell className="w-5 h-5 text-[#0B7A3B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E8731A] rounded-full" />
          </button>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{t.myFarmersDesc}</p>
      </header>

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B7A3B] shadow-xs"
          />
          <ChevronRight className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-[#0B7A3B] text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            onClick={() => setActiveFilter('MEMBERS')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === 'MEMBERS'
                ? 'bg-[#0B7A3B] text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {t.filterMembers}
          </button>
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === 'PENDING'
                ? 'bg-[#E8731A] text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            {t.filterPaymentPending}
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-sm font-bold text-stone-900">{t.farmerProfiles}</h2>
            <p className="text-[11px] text-stone-500">{t.farmerProfilesSub}</p>
          </div>

          <button
            onClick={() => showToast('Report generated successfully!', 'success')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-semibold text-[#0B7A3B] shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.generateReport}</span>
          </button>
        </div>

        {/* 2-Column Grid of Farmer Cards */}
        <div className="grid grid-cols-2 gap-3">
          {filteredFarmers.map((farmer) => {
            const initials = getInitials(farmer.qa.farmerName);
            const isMember = farmer.status === 'MEMBER';
            const isPending = farmer.status === 'PAYMENT PENDING';

            return (
              <div
                key={farmer.id}
                onClick={() => handleSelectFarmer(farmer.id)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group"
              >
                {/* Top: Avatar & Name */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isMember
                          ? 'bg-emerald-100 text-[#0B7A3B]'
                          : isPending
                          ? 'bg-orange-100 text-[#E8731A]'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {initials}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors line-clamp-1">
                    {farmer.qa.farmerName}
                  </h3>

                  <div className="mt-1">
                    <StatusChip status={farmer.status} />
                  </div>
                </div>

                {/* Bottom Details */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] space-y-1">
                  <div>
                    <span className="text-[10px] text-stone-400 block">{t.mobile}</span>
                    <span className="font-semibold text-stone-700">
                      {maskPhone(farmer.qa.mobileNumber)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">{t.village}</span>
                    <span className="font-medium text-stone-600 truncate block">
                      {farmer.qa.village}
                    </span>
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="absolute bottom-3 right-3 text-stone-400 group-hover:text-[#0B7A3B] group-hover:translate-x-0.5 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating / Sticky Add New Farmer Button */}
      <div className="sticky bottom-3 left-0 right-0 px-4 z-20 pointer-events-none mt-4">
        <button
          onClick={() => setCurrentScreen('ADD_FARMER')}
          className="pointer-events-auto w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0B7A3B] to-[#096330] text-white font-bold text-sm shadow-xl hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2"
        >
          <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white" />
          </div>
          <span>{t.addNewFarmer}</span>
        </button>
      </div>
    </div>
  );
};
