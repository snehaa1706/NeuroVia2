import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Alerts = () => {
  const { t } = useTranslation();
  const alerts = [
    { id: 1, type: 'high', titleKey: 'alert_missed_med', descKey: 'alert_missed_med_desc', time: t('alert_2h_ago') },
    { id: 2, type: 'medium', titleKey: 'alert_low_activity', descKey: 'alert_low_activity_desc', time: t('alert_1d_ago') },
    { id: 3, type: 'low', titleKey: 'alert_score_update', descKey: 'alert_score_update_desc', time: t('alert_3d_ago') },
  ];

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <AlertCircle className="w-8 h-8 text-red-500" /> };
      case 'medium':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: <AlertTriangle className="w-8 h-8 text-orange-500" /> };
      case 'low':
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <Info className="w-8 h-8 text-blue-500" /> };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <h2 className="text-4xl font-bold text-(--color-navy)">{t('alerts_title')}</h2>

      <div className="space-y-4">
        {alerts.map(alert => {
          const styles = getAlertStyles(alert.type);
          return (
            <div key={alert.id} className={`flex gap-6 p-6 rounded-3xl border-2 ${styles.bg} ${styles.border}`}>
              <div className="pt-2">
                {styles.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className={`text-2xl font-bold ${styles.text}`}>{t(alert.titleKey)}</h3>
                  <span className={`text-md font-medium uppercase tracking-wider px-3 py-1 rounded-full ${styles.bg} border ${styles.border} ${styles.text}`}>
                    {t(alert.type + '_priority')}
                  </span>
                </div>
                <p className={`text-xl mt-2 mb-4 ${styles.text} opacity-80`}>{t(alert.descKey)}</p>
                <p className={`text-sm font-bold ${styles.text} opacity-60`}>{alert.time}</p>
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center p-12 bg-white rounded-3xl border border-(--color-border-light)">
            <p className="text-2xl font-medium text-(--color-navy)/50">{t('no_alerts')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
