import React, { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { VendorId, Report } from '../../../types';
import { VENDORS } from '../../../services/storageService';

interface ProgressScreenProps {
  vendorId: VendorId;
  onViewReport: (reportId: string) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ vendorId, onViewReport }) => {
  const { activeFarmer } = useAuth();
  const { language, publishReport } = useData();
  const t = getTranslation(language);
  const vendor = VENDORS[vendorId];

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!activeFarmer) return;

    // Step 1: ~1s
    const timer1 = setTimeout(() => {
      setCurrentStep(1);
    }, 1000);

    // Step 2: ~2.4s
    const timer2 = setTimeout(() => {
      setCurrentStep(2);
    }, 2400);

    // Step 3: ~3.8s
    const timer3 = setTimeout(() => {
      setCurrentStep(3);

      let repData: Omit<Report, 'id' | 'date'>;
      if (vendorId === 'kshema') {
        repData = {
          farmerId: activeFarmer.id,
          vendorId: 'kshema',
          vendorName: 'Kshema',
          title: 'Kshema పంట బీమా ధ్రువీకరణ నివేదిక',
          titleTe: 'Kshema పంట బీమా ధ్రువీకరణ నివేదిక',
          summary: `మీ ${activeFarmer.crop} పంట (${activeFarmer.acres} ఎకరాలు) కు క్షేమ సురక్ష డిజిటల్ కవరేజ్ ఆమోదించబడింది. వర్షాభావం మరియు ప్రకృతి నష్టాలకు రక్షణ లభిస్తుంది.`,
          summaryTe: `మీ ${activeFarmer.crop} పంట (${activeFarmer.acres} ఎకరాలు) కు క్షేమ సురక్ష డిజిటల్ కవరేజ్ ఆమోదించబడింది. వర్షాభావం మరియు ప్రకృతి నష్టాలకు రక్షణ లభిస్తుంది.`,
          keyValues: [
            { label: 'బీమా పాలసీ (Policy No)', value: 'KSH-2026-8492', status: 'good', progressPercent: 100 },
            { label: 'బీమా మొత్తం (Sum Insured)', value: '₹1,20,000', status: 'good', progressPercent: 85 },
            { label: 'రైతు ప్రీమియం (Premium Paid)', value: '₹1,800', status: 'good', progressPercent: 95 },
            { label: 'రక్షణ గడువు (Coverage)', value: '31 మార్చి 2027', status: 'good', progressPercent: 90 }
          ],
          advice: 'మీ పంట బీమా వివరాలు షణ్ముఖ ఖాతాతో అనుసంధానం చేయబడ్డాయి. ఎలాంటి నష్టం జరిగినా వెంటనే సహాయ కేంద్రాన్ని సంప్రదించి క్లెయిమ్ నమోదు చేసుకోవచ్చు.',
          adviceTe: 'మీ పంట బీమా వివరాలు షణ్ముఖ ఖాతాతో అనుసంధానం చేయబడ్డాయి. ఎలాంటి నష్టం జరిగినా వెంటనే సహాయ కేంద్రాన్ని సంప్రదించి క్లెయిమ్ నమోదు చేసుకోవచ్చు.',
          isNew: true
        };
      } else if (vendorId === 'samunnati') {
        repData = {
          farmerId: activeFarmer.id,
          vendorId: 'samunnati',
          vendorName: 'Samunnati',
          title: 'Samunnati పంట రుణ అర్హత & మార్కెట్ రేటు',
          titleTe: 'Samunnati పంట రుణ అర్హత & మార్కెట్ రేటు',
          summary: `మీ ${activeFarmer.acres} ఎకరాల ${activeFarmer.crop} పంట ఆధారంగా ₹65,000 తక్కువ వడ్డీతో వర్కింగ్ కాపిటల్ రుణం మంజూరైంది.`,
          summaryTe: `మీ ${activeFarmer.acres} ఎకరాల ${activeFarmer.crop} పంట ఆధారంగా ₹65,000 తక్కువ వడ్డీతో వర్కింగ్ కాపిటల్ రుణం మంజూరైంది.`,
          keyValues: [
            { label: 'ఆమోదించిన రుణం (Approved Limit)', value: '₹65,000', status: 'good', progressPercent: 75 },
            { label: 'వడ్డీ రేటు (Interest Rate)', value: '7.0% p.a.', status: 'good', progressPercent: 70 },
            { label: 'మార్కెట్ ధర (Market Price)', value: '₹2,320 / Qt', status: 'good', progressPercent: 80 },
            { label: 'మార్కెట్ ట్రెండ్ (Trend)', value: 'పెరుగుతోంది (+4%)', status: 'good', progressPercent: 65 }
          ],
          advice: 'ఈ రుణ పరిమితిని ఎరువులు, విత్తనాల కొనుగోలుకు ఉపయోగించుకోవచ్చు. పంట కోత తర్వాత షణ్ముఖ సేకరణ కేంద్రం ద్వారా నేరుగా విక్రయించవచ్చు.',
          adviceTe: 'ఈ రుణ పరిమితిని ఎరువులు, విత్తనాల కొనుగోలుకు ఉపయోగించుకోవచ్చు. పంట కోత తర్వాత షణ్ముఖ సేకరణ కేంద్రం ద్వారా నేరుగా విక్రయించవచ్చు.',
          isNew: true
        };
      } else if (vendorId === 'biota') {
        repData = {
          farmerId: activeFarmer.id,
          vendorId: 'biota',
          vendorName: 'BioTa',
          title: 'BioTa తాజా భూసార & పోషకాల నివేదిక',
          titleTe: 'BioTa తాజా భూసార & పోషకాల నివేదిక',
          summary: 'ల్యాబ్ నుండి మీ నేల పోషకాల నివేదిక నవీకరించబడింది. భూమిలో తేమ మరియు ఎరువుల సమతుల్యత సాధారణ స్థాయిలో ఉంది.',
          summaryTe: 'ల్యాబ్ నుండి మీ నేల పోషకాల నివేదిక నవీకరించబడింది. భూమిలో తేమ మరియు ఎరువుల సమతుల్యత సాధారణ స్థాయిలో ఉంది.',
          keyValues: [
            { label: 'నేల pH (Soil pH)', value: '7.1', status: 'good', progressPercent: 71 },
            { label: 'సేంద్రీయ కర్బనం (Organic C)', value: '0.65%', status: 'good', progressPercent: 65 },
            { label: 'నత్రజని (Nitrogen)', value: '240 kg/ha', status: 'good', progressPercent: 60 },
            { label: 'భాస్వరం (Phosphorus)', value: '28 kg/ha', status: 'good', progressPercent: 75 }
          ],
          advice: 'ఈ సీజన్‌లో భూసారం నిలకడగా ఉంది. యూరియా మోతాదును పరిమితంగా ఉంచి, జీవన ఎరువులను విత్తన శుద్ధికి వాడండి.',
          adviceTe: 'ఈ సీజన్‌లో భూసారం నిలకడగా ఉంది. యూరియా మోతాదును పరిమితంగా ఉంచి, జీవన ఎరువులను విత్తన శుద్ధికి వాడండి.',
          isNew: true
        };
      } else {
        // Fyllo
        repData = {
          farmerId: activeFarmer.id,
          vendorId: 'fyllo',
          vendorName: 'Fyllo',
          title: 'Fyllo లైవ్ సెన్సార్ & వాతావరణ బులెటిన్',
          titleTe: 'Fyllo లైవ్ సెన్సార్ & వాతావరణ బులెటిన్',
          summary: 'సెన్సార్ల తాజా రీడింగ్ ప్రకారం నేల తేమ 72% గా ఉంది. రాబోయే 24 గంటల్లో తేలికపాటి జల్లులు పడే అవకాశం ఉంది.',
          summaryTe: 'సెన్సార్ల తాజా రీడింగ్ ప్రకారం నేల తేమ 72% గా ఉంది. రాబోయే 24 గంటల్లో తేలికపాటి జల్లులు పడే అవకాశం ఉంది.',
          keyValues: [
            { label: 'నేల తేమ (Soil Moisture)', value: '72%', status: 'good', progressPercent: 72 },
            { label: 'ఆకు ఉష్ణోగ్రత (Canopy Temp)', value: '29°C', status: 'good', progressPercent: 50 },
            { label: 'వర్షం అవకాశం (Rain Prob)', value: '70%', status: 'warning', progressPercent: 70 },
            { label: 'నీటి తడి సిఫార్సు (Irrigation)', value: 'అవసరం లేదు', status: 'good', progressPercent: 90 }
          ],
          advice: 'నేలలో తగినంత తేమ ఉన్నందున తదుపరి 3 రోజుల వరకు మోటారు ఆన్ చేయాల్సిన పని లేదు. వర్షపు నీరు నిల్వకుండా జాగ్రత్తపడండి.',
          adviceTe: 'నేలలో తగినంత తేమ ఉన్నందున తదుపరి 3 రోజుల వరకు మోటారు ఆన్ చేయాల్సిన పని లేదు. వర్షపు నీరు నిల్వకుండా జాగ్రత్తపడండి.',
          isNew: true
        };
      }

      const rep = publishReport(repData);
      setGeneratedReport(rep);
      setIsCompleted(true);

      // Subtle confetti burst on completion (respects prefers-reduced-motion)
      try {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#2E7D32', '#4CAF50', '#0D9488']
          });
        }
      } catch {}
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [vendorId, activeFarmer]);

  const steps = [
    { title: t.progressStep1, stepIndex: 1 },
    { title: t.progressStep2, stepIndex: 2 },
    { title: t.progressStep3, stepIndex: 3 }
  ];

  return (
    <div className="min-h-dvh flex flex-col justify-between p-5 max-w-[480px] mx-auto pb-24">
      {/* Header */}
      <div className="pt-2 text-center">
        <h2 className="text-xl font-black text-stone-900 leading-tight">
          {vendor.name} {t.progressTitle}
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-2">
        {!isCompleted ? (
          <div className="glass-card rounded-3xl p-6 border border-emerald-900/10 space-y-5">
            {/* Smooth animated gradient ring */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2E7D32] border-r-[#4CAF50] animate-spin" />
              <span className="text-xl font-black text-[#14532D] tabular-nums">
                {currentStep}/3
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {steps.map((s) => {
                const done = currentStep >= s.stepIndex;
                const active = currentStep === s.stepIndex - 1;

                return (
                  <div 
                    key={s.stepIndex}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                      done 
                        ? 'bg-emerald-50/70 border-emerald-300' 
                        : active 
                          ? 'bg-amber-50/70 border-amber-300' 
                          : 'bg-white/60 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                      done
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : active
                          ? 'bg-[#F57C00] text-white animate-spin'
                          : 'bg-stone-100 text-stone-400'
                    }`}>
                      {done ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : active ? (
                        <Loader2 className="w-5 h-5" />
                      ) : (
                        <span>{s.stepIndex}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-black leading-snug ${
                        done ? 'text-[#14532D]' : active ? 'text-stone-900' : 'text-stone-400'
                      }`}>
                        {s.title}
                      </p>
                      {active && (
                        <p className="text-xs font-semibold text-amber-700 animate-pulse">
                          {t.loading}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Completion Celebration Card */
          <div className="glass-card rounded-3xl p-6 border-2 border-emerald-500/40 text-center shadow-lg animate-in zoom-in-95 duration-300 space-y-3">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#14532D] to-[#2E7D32] rounded-3xl mx-auto flex items-center justify-center text-white shadow-md">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#14532D] font-black text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{t.progressStep3}</span>
            </span>

            <h3 className="text-2xl font-black text-stone-900 leading-tight">
              {language === 'te' ? 'నివేదిక సిద్ధమైంది!' : 'Report Is Ready!'}
            </h3>

            <p className="text-sm font-semibold text-stone-600 leading-relaxed">
              {t.progressCompletedMsg}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        {isCompleted && (
          <button
            type="button"
            onClick={() => {
              if (generatedReport) {
                onViewReport(generatedReport.id);
              }
            }}
            className="w-full bg-[#14532D] hover:bg-[#0F2A1A] text-white py-4 px-6 rounded-3xl font-black text-xl shadow-lg flex items-center justify-center gap-2.5 active:scale-97 transition-all min-h-[60px]"
          >
            <FileText className="w-6 h-6 stroke-[2.5]" />
            <span>{t.viewReport}</span>
          </button>
        )}
      </div>
    </div>
  );
};
