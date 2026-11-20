import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Download, 
  Sprout, 
  Radio, 
  ShieldCheck, 
  Coins, 
  FlaskConical, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { Report, VendorId, KeyValueStatus, ReportKeyValue } from '../../../types';
import { VENDORS } from '../../../services/storageService';

interface ReportsScreenProps {
  selectedReportId?: string | null;
  onSelectReport?: (id: string | null) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  selectedReportId = null,
  onSelectReport
}) => {
  const { activeFarmer } = useAuth();
  const { 
    reports, 
    markReportAsRead, 
    language, 
    triggerSuccess 
  } = useData();
  const t = getTranslation(language);

  // Filter reports for the logged in farmer
  const farmerReports = activeFarmer 
    ? reports.filter(r => r.farmerId === activeFarmer.id)
    : [];

  const [activeReportId, setActiveReportId] = useState<string | null>(selectedReportId);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    if (selectedReportId) {
      setActiveReportId(selectedReportId);
      markReportAsRead(selectedReportId);
    }
  }, [selectedReportId, markReportAsRead]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeReportId]);

  const activeReport = farmerReports.find(r => r.id === activeReportId);

  const handleOpenReport = (report: Report) => {
    setActiveReportId(report.id);
    if (onSelectReport) onSelectReport(report.id);
    if (report.isNew) {
      markReportAsRead(report.id);
    }
  };

  const handleBackToList = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveReportId(null);
    if (onSelectReport) onSelectReport(null);
  };

  const getVendorIcon = (vendorId: VendorId) => {
    switch (vendorId) {
      case 'fyllo': return Radio;
      case 'kshema': return ShieldCheck;
      case 'samunnati': return Coins;
      case 'biota':
      default:
        return FlaskConical;
    }
  };

  const getStatusBadge = (status: KeyValueStatus) => {
    switch (status) {
      case 'good':
        return {
          icon: CheckCircle,
          text: t.statusGood,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          barColor: 'bg-emerald-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          text: t.statusWarning,
          color: 'text-amber-800 bg-amber-50 border-amber-200',
          barColor: 'bg-amber-500'
        };
      case 'critical':
      default:
        return {
          icon: AlertOctagon,
          text: t.statusCritical,
          color: 'text-red-700 bg-red-50 border-red-200',
          barColor: 'bg-red-500'
        };
    }
  };

  // Text-to-Speech Handler
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert(language === 'te' ? 'మీ బ్రౌజర్‌లో వాయిస్ సదుపాయం లేదు' : 'Speech synthesis not supported in this browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!activeReport) return;

    window.speechSynthesis.cancel();
    const textToRead = language === 'te' ? (activeReport.adviceTe || activeReport.advice) : activeReport.advice;
    const utterance = new SpeechSynthesisUtterance(textToRead);

    utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // PDF Download (creates formatted slip and triggers download)
  const handleDownloadPdf = () => {
    if (!activeReport || !activeFarmer) return;

    const content = `
=====================================================
         SHANMUKHA AGRITECH - FARMER ADVISORY REPORT
                   షణ్ముఖ రైతు సేవ నివేదిక
=====================================================
Date & Time: ${activeReport.date}
Farmer Name: ${activeFarmer.name} (${activeFarmer.nameTe})
Village: ${activeFarmer.village} | District: ${activeFarmer.district}
Crop: ${activeFarmer.crop} | Area: ${activeFarmer.acres} Acres
In Partnership With: ${activeReport.vendorName}
-----------------------------------------------------
REPORT TITLE:
${activeReport.title}

SUMMARY:
${activeReport.summary}

-----------------------------------------------------
KEY VALUES & METRICS:
${activeReport.keyValues.map((kv: ReportKeyValue) => `- ${kv.label}: ${kv.value} [Status: ${kv.status.toUpperCase()}]`).join('\n')}

-----------------------------------------------------
AGRONOMIST ADVICE FOR FARMER:
${activeReport.advice}

=====================================================
Generated securely inside Shanmukha Farmer Application.
All rights reserved © Shanmukha Agritech.
=====================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shanmukha_${activeReport.vendorId}_Report_${activeFarmer.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerSuccess(t.done, t.pdfDownloadedToast);
  };

  // 1. Report Detail View (Premium Document Layout)
  if (activeReport) {
    const vendor = VENDORS[activeReport.vendorId] || VENDORS.fyllo;
    const VendorIcon = getVendorIcon(activeReport.vendorId);

    return (
      <div className="p-4 space-y-4 pb-24">
        {/* Back Button */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-2 text-stone-700 bg-white/90 border border-stone-200 px-3.5 py-2 rounded-2xl font-bold text-sm active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            <span>{t.back}</span>
          </button>

          <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full border border-stone-200/80">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{activeReport.date}</span>
          </span>
        </div>

        {/* Clean Document Card */}
        <div className="glass-card rounded-3xl p-5 border border-emerald-900/10 shadow-sm space-y-5">
          {/* Header with Shanmukha Mark and Partner Badge */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#14532D] to-[#2E7D32] flex items-center justify-center text-white shadow-xs">
                <Sprout className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#14532D] leading-tight">
                  {language === 'te' ? 'షణ్ముఖ' : 'Shanmukha'}
                </h3>
                <p className="text-xs text-stone-500 font-bold">
                  {t.inPartnershipWith}{' '}
                  <span className="text-stone-800 font-black">{vendor.name}</span>
                </p>
              </div>
            </div>

            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: vendor.color }}
            >
              <VendorIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          {/* Title & Short Summary */}
          <div>
            <h2 className="text-xl font-black text-stone-900 leading-snug mb-2">
              {language === 'te' ? activeReport.titleTe : activeReport.title}
            </h2>
            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/50">
              <p className="text-sm font-semibold text-stone-800 leading-relaxed">
                {language === 'te' ? activeReport.summaryTe : activeReport.summary}
              </p>
            </div>
          </div>

          {/* Key Values with Progress Bars & Status Chips */}
          <div>
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2.5">
              {t.keyValuesTitle}
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {activeReport.keyValues.map((kv: ReportKeyValue, idx: number) => {
                const badge = getStatusBadge(kv.status);
                const BadgeIcon = badge.icon;
                const percent = kv.progressPercent || 60;

                return (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/70 flex flex-col justify-between shadow-2xs"
                  >
                    <span className="text-xs font-semibold text-stone-500 leading-tight line-clamp-2">
                      {kv.label}
                    </span>

                    <div className="my-2">
                      <span className="text-2xl font-black text-stone-900 tabular-nums leading-none">
                        {kv.value}
                      </span>
                    </div>

                    {/* Small progress bar */}
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full ${badge.barColor} rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.text}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advice Callout */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                <span>🌾</span>
                <span>{t.adviceTitle}</span>
              </h4>
            </div>

            <p className="text-base font-bold text-stone-800 leading-relaxed">
              {language === 'te' ? activeReport.adviceTe : activeReport.advice}
            </p>
          </div>

          {/* Clear Listen & Download PDF Button Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleToggleSpeech}
              className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold transition-all border shadow-xs min-h-[56px] ${
                isSpeaking
                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                  : 'bg-white hover:bg-amber-50 text-stone-800 border-stone-200'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span>{t.stopListening}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 text-[#2E7D32]" />
                  <span>{t.listenAdvice}</span>
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleDownloadPdf}
              className="bg-[#14532D] hover:bg-[#0F2A1A] text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[56px]"
            >
              <Download className="w-5 h-5 stroke-[2.2]" />
              <span>{t.downloadPdf}</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Reports List View
  return (
    <div className="p-4 space-y-4 pb-24">
      {/* List Header */}
      <div className="px-1">
        <h2 className="text-2xl font-black text-stone-900 leading-tight">
          {t.reportsTitle}
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          {farmerReports.length} {language === 'te' ? 'నివేదికలు సిద్ధంగా ఉన్నాయి' : 'reports ready'}
        </p>
      </div>

      {farmerReports.length === 0 ? (
        /* Friendly Empty State with SVG Illustration */
        <div className="glass-card rounded-3xl p-8 text-center border border-emerald-900/10 space-y-3">
          <svg className="w-20 h-20 mx-auto text-emerald-700/30" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="currentColor" fillOpacity="0.15" />
            <path d="M26 28H54M26 40H46M26 52H38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <circle cx="52" cy="50" r="10" fill="#2E7D32" />
            <path d="M49 50L51 52L55 48" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-base font-bold text-stone-600">
            {t.noReports}
          </p>
          <p className="text-xs text-stone-400">
            {language === 'te' ? 'భాగస్వామి సేవను ప్రారంభించి రిపోర్టును పొందండి.' : 'Start any partner service to receive your first advisory report.'}
          </p>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          className="space-y-3 pb-2"
        >
          {farmerReports.map((report) => {
            const vendor = VENDORS[report.vendorId] || VENDORS.fyllo;
            const VendorIcon = getVendorIcon(report.vendorId);

            return (
              <motion.button
                key={report.id}
                type="button"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenReport(report)}
                className={`w-full text-left rounded-3xl p-4 border transition-all shadow-xs flex items-start gap-3.5 min-h-[92px] glass-card ${
                  report.isNew 
                    ? 'border-[#2E7D32]/60 ring-2 ring-[#2E7D32]/10 bg-emerald-50/40' 
                    : 'border-stone-200/80 hover:border-stone-300'
                }`}
              >
                {/* Big Vendor Icon */}
                <div 
                  className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5"
                  style={{ backgroundColor: vendor.color }}
                >
                  <VendorIcon className="w-7 h-7 stroke-[2.2]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider truncate">
                      {vendor.name}
                    </span>
                    {report.isNew && (
                      <span className="inline-flex items-center gap-1 bg-[#F57C00] text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                        <Sparkles className="w-3 h-3" />
                        <span>{t.newBadge}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-stone-900 leading-snug line-clamp-2">
                    {language === 'te' ? report.titleTe : report.title}
                  </h3>

                  <p className="text-xs text-stone-400 font-semibold mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{report.date}</span>
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
