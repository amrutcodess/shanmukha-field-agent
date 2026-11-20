import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { 
  Wand2, 
  RotateCcw, 
  Smartphone, 
  ShieldAlert, 
  X, 
  BellRing,
  Database
} from 'lucide-react';

export const DemoHelperFloating: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    simulateIncomingVendorAlert, 
    resetDemoData, 
    dataMode 
  } = useData();

  // Hide entirely if URL has ?clean=1
  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get('clean') === '1') {
    return null;
  }

  return (
    <>
      {/* Small, semi-transparent round button in bottom-left corner of viewport */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 rounded-full bg-stone-900/40 hover:bg-stone-900/70 backdrop-blur-md text-white/90 flex items-center justify-center shadow-lg border border-white/20 hover:scale-105 active:scale-95 transition-all"
          title="Demo Controls"
          aria-label="Demo Controls"
        >
          <Wand2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Sheet Drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200/80 max-h-[80vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#F57C00] flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Demo Controller</h3>
                  <p className="text-[11px] text-stone-400">Quick presentation helpers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Shortcuts */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Navigate</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { navigate('/'); setIsOpen(false); }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                    location.pathname === '/' 
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#14532D]' 
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#2E7D32]" />
                  <span>Farmer App (/)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { navigate('/admin'); setIsOpen(false); }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                    location.pathname.startsWith('/admin') 
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#14532D]' 
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-emerald-800" />
                  <span>Admin Panel (/admin)</span>
                </button>
              </div>
            </div>

            {/* Live Actions */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Simulation Actions</p>

              <button
                type="button"
                onClick={() => {
                  simulateIncomingVendorAlert();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl text-stone-800 text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F57C00] text-white flex items-center justify-center shrink-0">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="leading-tight">Simulate Partner Alert</p>
                    <p className="text-[10px] text-stone-500 font-normal">Pushes weather or policy alert to farmer</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-red-50/70 hover:bg-red-100/70 border border-red-200/80 rounded-2xl text-stone-800 text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="leading-tight">Reset Demo Data</p>
                    <p className="text-[10px] text-stone-500 font-normal">Restores initial Ramesh Reddy seed data</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Data Mode Info Badge */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs text-stone-600">
              <span className="flex items-center gap-1.5 font-bold">
                <Database className="w-4 h-4 text-[#2E7D32]" />
                <span>Data Mode:</span>
              </span>
              <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200 text-[11px] font-black uppercase text-[#14532D]">
                {dataMode}
              </span>
            </div>

            <p className="text-[10px] text-stone-400 text-center">
              Add <code className="bg-stone-100 px-1 py-0.5 rounded">?clean=1</code> to URL to hide this button during presentations.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
