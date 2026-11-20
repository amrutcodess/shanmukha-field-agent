import React, { useState } from 'react';
import { Sprout, Phone, KeyRound, ArrowRight, CheckCircle2, UserPlus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { LanguageToggle } from '../../common/LanguageToggle';

interface WelcomeLoginScreenProps {
  onStartSignUp: (phone?: string) => void;
}

export const WelcomeLoginScreen: React.FC<WelcomeLoginScreenProps> = ({ onStartSignUp }) => {
  const { loginFarmer } = useAuth();
  const { language, triggerSuccess } = useData();
  const t = getTranslation(language);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('1234');
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError(t.invalidMobile);
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = loginFarmer(phone, otp);

    if (res.success) {
      triggerSuccess(t.done, language === 'te' ? 'లాగిన్ విజయవంతమైంది' : 'Logged In Successfully');
    } else if (res.needsSignUp) {
      // Unregistered number -> prompt and route to Sign Up
      onStartSignUp(phone);
    } else {
      setError(t.invalidOtp);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between p-5 relative z-10 max-w-[480px] mx-auto">
      {/* Top Bar with Language Toggle */}
      <div className="flex justify-end pt-1">
        <LanguageToggle size="md" />
      </div>

      {/* Center Branding & Form */}
      <div className="my-auto py-2">
        {/* App Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#14532D] to-[#2E7D32] flex items-center justify-center text-white shadow-xl mb-3 border-2 border-white/80">
            <Sprout className="w-11 h-11 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {t.appName}
          </h1>
          <p className="text-lg font-bold text-stone-700 mt-0.5">
            {t.appFullName}
          </p>
          <p className="text-sm font-medium text-stone-500 mt-0.5">
            {t.tagline}
          </p>
        </div>

        {/* Step 1: Phone input */}
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-xs">
              <label 
                htmlFor="mobile-input"
                className="block text-lg font-bold text-stone-800 mb-2.5"
              >
                {t.loginSubtitle}
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="mobile-input"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-xl font-black text-stone-900 focus:outline-none focus:border-[#2E7D32] tracking-wider min-h-[56px]"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 font-bold mt-2">
                  {error}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                <span>{language === 'te' ? 'డెమో నంబర్: 9876543210' : 'Demo Farmer: 9876543210'}</span>
                <span className="font-semibold text-emerald-800">{language === 'te' ? 'రమేష్ రెడ్డి' : 'Ramesh Reddy'}</span>
              </div>
            </div>

            {/* Big Action Button */}
            <button
              type="submit"
              className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-4 px-6 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[60px]"
            >
              <span>{t.continue}</span>
              <ArrowRight className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Sign Up Link Button */}
            <button
              type="button"
              onClick={() => onStartSignUp(phone)}
              className="w-full py-3 px-4 rounded-2xl text-stone-700 hover:text-[#14532D] font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-stone-200 bg-white/60"
            >
              <UserPlus className="w-4 h-4 text-[#2E7D32]" />
              <span>{t.startSignUp}</span>
            </button>
          </form>
        ) : (
          /* Step 2: 4-digit OTP */
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="otp-input"
                  className="block text-lg font-bold text-stone-800"
                >
                  {t.enterOtpTitle}
                </label>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-[#2E7D32] font-bold hover:underline"
                >
                  {t.changeNumber}
                </button>
              </div>

              <p className="text-sm font-semibold text-stone-600 mb-3">
                {phone}
              </p>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={4}
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  placeholder="1234"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-2xl font-black text-center tracking-[0.5em] text-stone-900 focus:outline-none focus:border-[#2E7D32] min-h-[56px]"
                  autoFocus
                />
              </div>

              {/* Demo Hint Banner */}
              <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-900">
                  {t.otpHint}
                </span>
              </div>

              {error && (
                <p className="text-sm text-red-600 font-bold mt-2">
                  {error}
                </p>
              )}
            </div>

            {/* Big Action Button */}
            <button
              type="submit"
              className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-4 px-6 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[60px]"
            >
              <span>{t.verifyAndLogin}</span>
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </button>
          </form>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center pt-2">
        <p className="text-xs font-semibold text-stone-400">
          {t.poweredBy}
        </p>
      </div>
    </div>
  );
};
