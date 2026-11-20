import React, { useState } from 'react';
import { PhoneCall, UserCheck, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';

export const HelpScreen: React.FC = () => {
  const { activeFarmer } = useAuth();
  const { language, requestFieldVisit } = useData();
  const t = getTranslation(language);

  const [message, setMessage] = useState('');
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!activeFarmer) return null;

  const handleSubmitVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    requestFieldVisit(activeFarmer, message.trim());
    setMessage('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3500);
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-2xl font-black text-stone-900 leading-tight">
          {t.helpTitle}
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          {t.helpSubtitle}
        </p>
      </div>

      {/* Button 1: Call Us */}
      <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setShowCallPrompt(true)}
          className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white p-4 sm:p-5 rounded-2xl font-black text-lg shadow-md flex items-center justify-between active:scale-97 transition-all min-h-[64px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="text-left">
              <p className="text-base sm:text-lg leading-tight">{t.callUsTitle}</p>
              <p className="text-[11px] text-emerald-200 font-bold">{t.callUsSubtitle}</p>
            </div>
          </div>
          <span className="text-[11px] bg-white text-[#14532D] px-2.5 py-1 rounded-full font-black uppercase shrink-0">
            {t.tapToCall}
          </span>
        </button>

        {showCallPrompt && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-center animate-in fade-in duration-200">
            <p className="text-[11px] text-stone-400 font-bold uppercase">{t.callUsSubtitle}</p>
            <a 
              href="tel:18001234567" 
              className="text-2xl sm:text-3xl font-black text-[#14532D] block my-1 tracking-wider hover:underline tabular-nums"
            >
              1800-123-4567
            </a>
            <p className="text-xs font-semibold text-stone-600">
              {language === 'te' 
                ? 'ఉదయం 8:00 నుండి సాయంత్రం 7:00 వరకు వ్యవసాయ నిపుణులు అందుబాటులో ఉంటారు' 
                : 'Available 8:00 AM - 7:00 PM Monday through Saturday'}
            </p>
          </div>
        )}
      </div>

      {/* Button 2: Ask for a Field Visit */}
      <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-[#F57C00] flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-stone-900 leading-tight">
              {t.askVisitTitle}
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {t.askVisitSubtitle}
            </p>
          </div>
        </div>

        {isSent ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h4 className="text-lg font-black text-[#14532D] mb-0.5">
              {t.sent}
            </h4>
            <p className="text-sm font-bold text-stone-700">
              {t.visitSentSuccess}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitVisit} className="space-y-3.5">
            {/* Pre-filled info pill */}
            <div className="bg-white/80 rounded-2xl p-3 border border-stone-200/60 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700">
                {language === 'te' ? (activeFarmer.nameTe || activeFarmer.name) : activeFarmer.name}
              </span>
              <span className="font-black text-[#14532D] bg-emerald-100 px-2 py-0.5 rounded-full">
                {language === 'te' ? (activeFarmer.villageTe || activeFarmer.village) : activeFarmer.village} • {activeFarmer.crop}
              </span>
            </div>

            {/* One Big Text Box */}
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.fieldMessagePlaceholder}
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-white border border-stone-200 text-base font-medium text-stone-900 focus:outline-none focus:border-[#2E7D32] resize-none"
                required
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-3.5 px-5 rounded-2xl font-black text-lg shadow-md flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[56px]"
            >
              <Send className="w-5 h-5 stroke-[2.2]" />
              <span>{t.sendVisitRequest}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
