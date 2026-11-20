import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  CloudRain, 
  ShieldCheck, 
  Coins, 
  FlaskConical, 
  Megaphone, 
  Check, 
  Calendar 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { getTranslation } from '../../../i18n/translations';
import { AlertNotification, AlertType } from '../../../types';

export const AlertsScreen: React.FC = () => {
  const { activeFarmer } = useAuth();
  const { alerts, markAlertAsRead, language } = useData();
  const t = getTranslation(language);

  // Filter alerts for the logged in farmer
  const farmerAlerts = activeFarmer
    ? alerts.filter(a => a.farmerId === activeFarmer.id || a.farmerId === 'all')
    : [];

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'weather': return { icon: CloudRain, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'insurance': return { icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'loan': return { icon: Coins, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'soil': return { icon: FlaskConical, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'admin': 
      default:
        return { icon: Megaphone, color: 'text-[#2E7D32] bg-emerald-50 border-emerald-200' };
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-2xl font-black text-stone-900 leading-tight">
          {t.alertsTitle}
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          {farmerAlerts.filter(a => !a.isRead).length > 0
            ? `${farmerAlerts.filter(a => !a.isRead).length} ${t.unreadAlertsCount}`
            : (language === 'te' ? 'అన్ని హెచ్చరికలు చదివారు' : 'All caught up')}
        </p>
      </div>

      {farmerAlerts.length === 0 ? (
        /* Friendly Empty State with SVG Illustration */
        <div className="glass-card rounded-3xl p-8 text-center border border-emerald-900/10 space-y-3">
          <svg className="w-20 h-20 mx-auto text-emerald-700/30" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="currentColor" fillOpacity="0.15" />
            <path d="M40 22C33.3726 22 28 27.3726 28 34V46L24 50H56L52 46V34C52 27.3726 46.6274 22 40 22Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M36 54C36 56.2091 37.7909 58 40 58C42.2091 58 44 56.2091 44 54" stroke="currentColor" strokeWidth="3" />
          </svg>
          <p className="text-base font-bold text-stone-600">
            {t.noAlerts}
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
          {farmerAlerts.map((alert: AlertNotification) => {
            const iconConfig = getAlertIcon(alert.type);
            const Icon = iconConfig.icon;

            return (
              <motion.div
                key={alert.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!alert.isRead) markAlertAsRead(alert.id);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer glass-card ${
                  !alert.isRead
                    ? 'border-[#F57C00]/80 shadow-md ring-2 ring-[#F57C00]/10 bg-amber-50/20'
                    : 'border-stone-200/80 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${iconConfig.color}`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-black uppercase text-stone-500">
                        {alert.vendorName || (language === 'te' ? 'షణ్ముఖ సేవ' : 'Shanmukha')}
                      </span>
                      {!alert.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F57C00] shadow-2xs" />
                      )}
                    </div>

                    <h3 className={`text-base font-black leading-snug mb-1 ${
                      !alert.isRead ? 'text-stone-900' : 'text-stone-700'
                    }`}>
                      {language === 'te' ? alert.titleTe : alert.title}
                    </h3>

                    <p className="text-sm font-medium text-stone-700 leading-relaxed">
                      {language === 'te' ? alert.messageTe : alert.message}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                      <span className="text-[11px] text-stone-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{alert.date}</span>
                      </span>

                      {!alert.isRead ? (
                        <span className="text-xs font-black text-[#F57C00] hover:underline flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.markRead}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-stone-400">
                          {language === 'te' ? 'చదివారు' : 'Read'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
