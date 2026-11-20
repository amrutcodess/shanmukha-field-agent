import React from 'react';
import { useShanpoorna, ScreenType } from '../../context/ShanpoornaContext';
import { ToastContainer } from './ToastContainer';
import {
  Wifi,
  Battery,
  RotateCcw,
  Smartphone,
  ChevronRight,
  Sparkles,
  Users,
  Home,
  FileCheck,
  FileText,
  User,
  BookOpen,
} from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  const {
    currentScreen,
    setCurrentScreen,
    navigateToTab,
    resetDemoData,
    showToast,
    setActiveFarmerId,
    farmers,
  } = useShanpoorna();

  // Preset quick navigation shortcuts for client presentation
  const demoShortcuts: { label: string; screen: ScreenType; tab?: any }[] = [
    { label: '0. Login & Roles', screen: 'LOGIN' },
    { label: '1. Home Dashboard', screen: 'HOME', tab: 'home' },
    { label: '2. Invoice Approval', screen: 'INVOICE_APPROVAL' },
    { label: '3. My Farmers Grid', screen: 'MY_FARMERS', tab: 'farmers' },
    { label: '4. + Add New Farmer (Q-A & GPS)', screen: 'ADD_FARMER' },
    { label: '5. Farmer Profile (Ramesh Goud)', screen: 'FARMER_PROFILE' },
    { label: '6. Log Visit & Scan & HO', screen: 'LOG_FIELD_VISIT' },
    { label: '7. Previous Visits History', screen: 'PREVIOUS_VISITS' },
    { label: '8. Farm Reports & Bills', screen: 'FARM_REPORTS' },
    { label: '9. Resources Tab', screen: 'RESOURCES', tab: 'resources' },
    { label: '10. FA Profile & Dealers', screen: 'PROFILE', tab: 'profile' },
  ];

  const handleShortcutClick = (sc: typeof demoShortcuts[0]) => {
    if (sc.screen === 'FARMER_PROFILE' || sc.screen === 'LOG_FIELD_VISIT') {
      setActiveFarmerId('F001'); // Ensure Ramesh Goud
    }
    if (sc.tab) {
      navigateToTab(sc.tab);
    } else {
      setCurrentScreen(sc.screen);
    }
    showToast(`Jumped to: ${sc.label}`, 'info');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col lg:flex-row items-center justify-center p-0 lg:p-6 lg:gap-8 font-sans selection:bg-[#0B7A3B] selection:text-white">
      {/* LEFT: Presentation Quick Control Dock (Desktop only) */}
      <aside className="hidden lg:flex flex-col w-72 bg-stone-850/90 backdrop-blur-md rounded-3xl p-5 border border-stone-800 shadow-2xl h-[844px] justify-between">
        <div className="space-y-4">
          <div className="border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0B7A3B] animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                SHANPOORNA DEMO
              </h2>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Shanmukha Agritec Limited · Client Showcase
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-wider text-stone-500 uppercase block mb-2">
              1-Click Presentation Flow:
            </span>
            <div className="space-y-1.5 overflow-y-auto max-h-[520px] pr-1">
              {demoShortcuts.map((sc) => {
                const isActive = currentScreen === sc.screen;
                return (
                  <button
                    key={sc.screen}
                    onClick={() => handleShortcutClick(sc)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#0B7A3B] text-white shadow-md font-semibold'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{sc.label}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive
                          ? 'text-white'
                          : 'text-stone-600 group-hover:text-stone-400 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pt-3 border-t border-stone-800 space-y-2">
          <button
            onClick={resetDemoData}
            className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-stone-700/60 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
          <div className="text-[10px] text-stone-500 text-center">
            All data persists in localStorage
          </div>
        </div>
      </aside>

      {/* CENTER: Mobile Phone Frame Simulator */}
      <main className="relative w-full max-w-[410px] h-[100dvh] lg:h-[844px] bg-[#F4F6F4] text-stone-800 lg:rounded-[44px] lg:border-[9px] lg:border-stone-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
        {/* Dynamic Island & Status Bar */}
        <div className="sticky top-0 z-40 bg-transparent flex items-center justify-between px-6 pt-3 pb-1 text-stone-800 select-none pointer-events-none shrink-0">
          <span className="text-xs font-bold tracking-tight">9:41</span>

          {/* Dynamic Island Pill */}
          <div className="w-24 h-4 bg-stone-900 rounded-full mx-auto -mt-1 hidden sm:block shadow-inner" />

          <div className="flex items-center gap-1.5 text-stone-700">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {children}
        </div>

        {/* Bottom Home Indicator Bar (iOS style) */}
        <div className="hidden lg:flex justify-center pb-2 pt-1 bg-white select-none pointer-events-none shrink-0 border-t border-stone-100">
          <div className="w-32 h-1 bg-stone-400/80 rounded-full" />
        </div>
      </main>

      {/* Mobile-only presentation floating helper */}
      <div className="lg:hidden fixed top-2 right-2 z-50">
        <button
          onClick={() => {
            const next = currentScreen === 'HOME' ? 'MY_FARMERS' : 'HOME';
            setCurrentScreen(next);
          }}
          className="p-1.5 bg-black/70 text-white rounded-full text-[10px]"
        >
          Nav
        </button>
      </div>
    </div>
  );
};
