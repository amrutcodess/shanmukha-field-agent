import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { ShieldCheck, Phone, ArrowRight, User, UserCheck, AlertTriangle, KeyRound } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    setCurrentScreen,
    setUserRole,
    setFarmerLoggedIn,
    farmers,
    showToast,
  } = useShanpoorna();

  const [activeTab, setActiveTab] = useState<'FA' | 'FARMER'>('FA');

  // FA state
  const [faId, setFaId] = useState('SAGL-FA-0142');
  const [faMobile, setFaMobile] = useState('+91 90000 00004');
  const [faOtp, setFaOtp] = useState('');
  const [isFaOtpSent, setIsFaOtpSent] = useState(false);

  // Farmer state
  const [farmerMobile, setFarmerMobile] = useState('+91 98765 43210');
  const [farmerOtp, setFarmerOtp] = useState('');
  const [isFarmerOtpSent, setIsFarmerOtpSent] = useState(false);
  const [farmerError, setFarmerError] = useState<string | null>(null);
  const [detectedFarmer, setDetectedFarmer] = useState<any | null>(null);

  // Field Assistant Handlers
  const handleFaSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFaOtpSent(true);
    setFaOtp('123456');
    showToast('OTP sent: 123456 (Demo OTP)', 'info');
  };

  const handleFaVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (faOtp === '123456' || faOtp.length === 6) {
      setUserRole('FIELD_ASSISTANT');
      setCurrentScreen('HOME');
      showToast('Welcome back, K. Srinivas!', 'success');
    } else {
      showToast('Invalid OTP. Use demo OTP 123456', 'warning');
    }
  };

  // Farmer Login Handlers
  const handleFarmerCheckNumber = (e: React.FormEvent) => {
    e.preventDefault();
    setFarmerError(null);

    // Normalize phone number (strip whitespace and +91)
    const cleanInput = farmerMobile.replace(/[\s+-]/g, '').slice(-10);

    const foundFarmer = farmers.find((f) => {
      const cleanFPhone = f.qa.mobileNumber.replace(/[\s+-]/g, '').slice(-10);
      return cleanFPhone === cleanInput;
    });

    if (!foundFarmer || foundFarmer.status !== 'MEMBER') {
      setFarmerError(
        'Not registered. Please complete membership payment through your Field Assistant.'
      );
      showToast('Membership verification failed', 'warning');
      return;
    }

    setDetectedFarmer(foundFarmer);
    setIsFarmerOtpSent(true);
    setFarmerOtp('123456');
    showToast(`OTP sent to ${foundFarmer.qa.farmerName}: 123456`, 'info');
  };

  const handleFarmerVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (farmerOtp === '123456' || farmerOtp.length === 6) {
      setUserRole('FARMER');
      setFarmerLoggedIn(detectedFarmer);
      setCurrentScreen('FARMER_HOME');
      showToast(`Welcome, ${detectedFarmer.qa.farmerName}!`, 'success');
    } else {
      showToast('Invalid OTP. Demo OTP is 123456', 'warning');
    }
  };

  // Quick switch demo pre-fills
  const prefillMember = () => {
    setFarmerMobile('+91 98765 43210'); // Ramesh Goud (MEMBER)
    setFarmerError(null);
  };

  const prefillUnregistered = () => {
    setFarmerMobile('+91 97000 00042'); // Lakshmi Prasad (PAYMENT PENDING)
    setFarmerError(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-5">
      {/* Brand Header */}
      <div className="pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B7A3B] to-[#085a2b] shadow-lg text-white mb-3">
          <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4C14 4 6 12 6 22C6 32 15 42 24 44C33 42 42 32 42 22C42 12 34 4 24 4Z"
              stroke="#F2994A"
              strokeWidth="2.5"
              fill="#0B7A3B"
            />
            <path
              d="M24 12V36M24 20L18 26M24 28L30 34"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">SHANPOORNA</h1>
        <p className="text-xs uppercase tracking-widest text-[#0B7A3B] font-semibold mt-0.5">
          Shanmukha Agritec Limited
        </p>
        <p className="text-[11px] text-stone-500 mt-1">Your Partner in Prosperity</p>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/80 my-auto">
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('FA');
              setFarmerError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'FA'
                ? 'bg-white text-[#0B7A3B] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Field Assistant
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('FARMER');
              setFarmerError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'FARMER'
                ? 'bg-white text-[#0B7A3B] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Farmer Portal
          </button>
        </div>

        {/* TAB 1: FIELD ASSISTANT LOGIN */}
        {activeTab === 'FA' && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-stone-900">Field Assistant Login</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Head Office assigned credentials for K. Srinivas (Medak)
              </p>
            </div>

            {!isFaOtpSent ? (
              <form onSubmit={handleFaSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    FA Employee ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={faId}
                      onChange={(e) => setFaId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
                      placeholder="SAGL-FA-0142"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={faMobile}
                      onChange={(e) => setFaMobile(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
                      placeholder="+91 90000 00004"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B7A3B] to-[#0e8a44] text-white text-xs font-semibold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <span>Request Login OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleFaVerifyOtp} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <span className="font-semibold">Demo OTP:</span> 123456 has been pre-filled for
                  instant access.
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Enter 6-digit OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      value={faOtp}
                      onChange={(e) => setFaOtp(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
                      placeholder="123456"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFaOtpSent(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B7A3B] to-[#0e8a44] text-white text-xs font-semibold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Verify & Enter</span>
                    <UserCheck className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Quick 1-click Demo bypass */}
            <div className="mt-4 pt-3 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setUserRole('FIELD_ASSISTANT');
                  setCurrentScreen('HOME');
                  showToast('Instant demo entry active', 'success');
                }}
                className="text-[11px] text-[#0B7A3B] font-semibold hover:underline"
              >
                ⚡ Quick 1-Click FA Entry (Demo Mode)
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FARMER LOGIN */}
        {activeTab === 'FARMER' && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-stone-900">Farmer Self-Service Login</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Check membership and view field visits & advisory
              </p>
            </div>

            {farmerError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{farmerError}</div>
              </div>
            )}

            {!isFarmerOtpSent ? (
              <form onSubmit={handleFarmerCheckNumber} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Farmer Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={farmerMobile}
                      onChange={(e) => {
                        setFarmerMobile(e.target.value);
                        setFarmerError(null);
                      }}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                {/* Demo quick tests */}
                <div className="pt-1 flex flex-col gap-1.5 text-[11px]">
                  <span className="text-stone-400 font-medium">Quick presentation test numbers:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={prefillMember}
                      className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-semibold hover:bg-emerald-100"
                    >
                      ✓ Registered Member (Ramesh)
                    </button>
                    <button
                      type="button"
                      onClick={prefillUnregistered}
                      className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-semibold hover:bg-amber-100"
                    >
                      ⚠ Pending / Unregistered
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B7A3B] to-[#0e8a44] text-white text-xs font-semibold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <span>Verify Membership & Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleFarmerVerifyOtp} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <p className="font-semibold">Welcome, {detectedFarmer?.qa?.farmerName}!</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Demo OTP is <strong>123456</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={farmerOtp}
                    onChange={(e) => setFarmerOtp(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
                    placeholder="123456"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFarmerOtpSent(false);
                      setFarmerError(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                  >
                    Change Number
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B7A3B] to-[#0e8a44] text-white text-xs font-semibold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5"
                  >
                    <span>View My Farm</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center py-4 text-[11px] text-stone-400">
        <p>Shanmukha Agritec Limited · Client Demo Edition</p>
        <p className="text-[10px] text-stone-400 mt-0.5">All authentication & SMS mocked for presentation</p>
      </div>
    </div>
  );
};
