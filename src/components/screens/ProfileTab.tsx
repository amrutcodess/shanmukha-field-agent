import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import {
  Phone,
  MapPin,
  Mail,
  Clock,
  Settings,
  Languages,
  Edit3,
  LogOut,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Users,
} from 'lucide-react';

export const ProfileTab: React.FC = () => {
  const {
    faProfile,
    setFaProfile,
    dealers,
    setCurrentScreen,
    setUserRole,
    language,
    setLanguage,
    resetDemoData,
    showToast,
    t,
  } = useShanpoorna();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Edit profile form
  const [nameInput, setNameInput] = useState(faProfile.name);
  const [mobileInput, setMobileInput] = useState(faProfile.phone);

  const assignedDealers = dealers.filter((d) => d.isAssigned);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFaProfile((prev) => ({
      ...prev,
      name: nameInput,
      phone: mobileInput,
    }));
    setIsEditProfileOpen(false);
    showToast('Field Assistant profile updated!', 'success');
  };

  const handleToggleLanguage = () => {
    const nextLang = language === 'en' ? 'te' : 'en';
    setLanguage(nextLang);
    showToast(`Language switched to ${nextLang === 'te' ? 'తెలుగు' : 'English'}`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-28 text-stone-800">
      {/* Top Brand Header (matching Screenshot 4) */}
      <header className="bg-white px-5 pt-4 pb-3 border-b border-stone-200 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B7A3B] to-[#085a2b] flex items-center justify-center text-white font-black text-sm shadow-xs border-2 border-amber-400">
            🌾
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-[#0B7A3B] uppercase">
              SHANMUKHA
            </h1>
            <p className="text-[10px] font-bold text-rose-700 tracking-wider uppercase">
              AGRITEC LIMITED
            </p>
            <p className="text-[9px] text-stone-400">Your Partner in Prosperity</p>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 rounded-full hover:bg-stone-100 text-stone-600 transition"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-stone-700" />
        </button>
      </header>

      <div className="p-4 space-y-4">
        <div className="px-1 text-[11px] font-bold tracking-wider text-stone-400 uppercase">
          {t.myProfile}
        </div>

        {/* 1. FA Profile Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0B7A3B] font-bold text-base flex items-center justify-center border-2 border-emerald-200 shrink-0">
              {faProfile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">{faProfile.name}</h2>
                <StatusChip status="ACTIVE" />
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Field Assistant · {faProfile.id}
              </p>
              <p className="text-xs font-semibold text-emerald-800 mt-1">
                Registered mobile: {faProfile.phone}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Performance Overview (6 Cards) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              {t.performanceOverview}
            </h3>
            <span className="text-[10px] text-stone-400">Demo metrics</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 relative overflow-hidden">
              <div className="absolute top-2 left-2 bottom-2 w-1 bg-[#0B7A3B] rounded-full" />
              <div className="pl-2.5">
                <div className="text-2xl font-black text-[#0B7A3B]">126</div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">{t.totalVisits}</div>
                <div className="text-[10px] text-stone-400">This season</div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 relative overflow-hidden">
              <div className="absolute top-2 left-2 bottom-2 w-1 bg-[#E8731A] rounded-full" />
              <div className="pl-2.5">
                <div className="text-2xl font-black text-[#E8731A]">3 / 4</div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">{t.todaysVisits}</div>
                <div className="text-[10px] text-stone-400">Completed / planned</div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 relative overflow-hidden">
              <div className="absolute top-2 left-2 bottom-2 w-1 bg-[#0B7A3B] rounded-full" />
              <div className="pl-2.5">
                <div className="text-2xl font-black text-[#0B7A3B]">28 / 32</div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">{t.monthlyVisits}</div>
                <div className="text-[10px] text-stone-400">Completed / planned</div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 relative overflow-hidden">
              <div className="absolute top-2 left-2 bottom-2 w-1 bg-[#E8731A] rounded-full" />
              <div className="pl-2.5">
                <div className="text-2xl font-black text-[#E8731A]">6</div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">{t.pendingFollowUps}</div>
                <div className="text-[10px] text-stone-400">Action required</div>
              </div>
            </div>

            {/* Metric 5 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 relative overflow-hidden">
              <div className="absolute top-2 left-2 bottom-2 w-1 bg-[#0B7A3B] rounded-full" />
              <div className="pl-2.5">
                <div className="text-2xl font-black text-[#0B7A3B]">100</div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">{t.farmersAssigned}</div>
                <div className="text-[10px] text-stone-400">Currently allotted</div>
              </div>
            </div>

            {/* Metric 6 */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 relative overflow-hidden">
              <div className="absolute top-2 left-2 bottom-2 w-1 bg-[#E8731A] rounded-full" />
              <div className="pl-2.5">
                <div className="text-2xl font-black text-[#E8731A]">₹0</div>
                <div className="text-xs font-bold text-stone-800 mt-0.5">{t.revenueGenerated}</div>
                <div className="text-[10px] text-stone-400">Demo value</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Assigned Dealers */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              {t.dealersAssigned}
            </h3>
            <span className="text-[10px] text-stone-400">Dealer Master</span>
          </div>

          <div className="space-y-3">
            {assignedDealers.map((dealer) => (
              <div
                key={dealer.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-[#E8731A] shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{dealer.name}</h4>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#0B7A3B]" />
                        <span>{dealer.phone}</span>
                      </p>
                      <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#E8731A]" />
                        <span>{dealer.location}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-50 text-[#E8731A] font-bold border border-orange-200">
                    DEMO DATA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                  <button
                    onClick={() => showToast(`Calling ${dealer.name}: ${dealer.phone}`, 'info')}
                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.callDealer}</span>
                  </button>
                  <button
                    onClick={() =>
                      showToast(`Opening GPS navigation to ${dealer.location}`, 'info')
                    }
                    className="py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#E8731A] font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{t.viewLocation}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Contact Head Office Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              {t.contactHeadOffice}
            </h4>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              DEMO CONTACT
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800">+91 90000 00002</span>
              <button
                onClick={() => showToast('Calling Shanmukha Head Office: +91 90000 00002', 'info')}
                className="py-1 px-3 rounded-lg bg-[#0B7A3B] hover:bg-[#096330] text-white font-bold text-[11px] flex items-center gap-1 transition"
              >
                <Phone className="w-3 h-3" />
                <span>{t.callHO}</span>
              </button>
            </div>
            <p className="text-stone-600 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>support@shanmukhaagritec.example</span>
            </p>
            <p className="text-stone-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>Hyderabad, Telangana (Demo)</span>
            </p>
            <p className="text-[10px] text-stone-400 pt-1">
              Support hours: Monday – Saturday, 9:00 AM – 6:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0B7A3B]" />
                <h3 className="text-base font-bold text-stone-900">{t.settings}</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Language Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2.5">
                  <Languages className="w-5 h-5 text-[#0B7A3B]" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{t.changeLanguage}</h4>
                    <p className="text-[10px] text-stone-400">Current: {language === 'en' ? 'English' : 'తెలుగు'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleLanguage}
                  className="px-3 py-1.5 rounded-xl bg-[#0B7A3B] text-white font-bold text-xs shadow-xs hover:bg-[#096330] transition"
                >
                  {language === 'en' ? 'తెలుగులోకి మార్చండి' : 'Switch to English'}
                </button>
              </div>

              {/* Edit Profile */}
              <div
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEditProfileOpen(true);
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 hover:bg-stone-100 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-5 h-5 text-[#E8731A]" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{t.editProfile}</h4>
                    <p className="text-[10px] text-stone-400">Name & contact number</p>
                  </div>
                </div>
                <span className="text-xs text-[#0B7A3B] font-bold">Edit →</span>
              </div>

              {/* Reset Demo Data */}
              <div
                onClick={() => {
                  resetDemoData();
                  setIsSettingsOpen(false);
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-5 h-5 text-amber-700" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Reset Demo Data</h4>
                    <p className="text-[10px] text-amber-700">Restore default presentation state</p>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div
                onClick={() => {
                  setIsSettingsOpen(false);
                  setUserRole('FIELD_ASSISTANT');
                  setCurrentScreen('LOGIN');
                  showToast('Logged out of session', 'info');
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100/80 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Log Out</h4>
                    <p className="text-[10px] text-rose-600">Return to role login screen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Edit Field Assistant Profile</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="text"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#0B7A3B]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-600 font-semibold text-xs hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B7A3B] text-white font-bold text-xs shadow-md hover:bg-[#096330] flex items-center justify-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
