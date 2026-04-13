import { useState } from 'react';
import { startAssessment } from '../services/screeningApi';
import { Brain, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Start({ onNext }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await startAssessment();
      localStorage.setItem("screening_assessmentId", data.assessment_id);
      onNext(data.assessment_id, data.level1_context);
    } catch (err) {
      alert("Error starting test: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto text-center animate-[fadeIn_0.4s_ease-out]">
      <div className="bg-[#fcfaf7] border border-[#e2dcd0] rounded-[32px] p-10 md:p-14 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="w-16 h-16 bg-[#6b7c52]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-[#6b7c52]" />
        </div>
        
        <p className="font-sans text-[0.75rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-4">
          {t('screening_title')}
        </p>

        <h1 className="font-serif text-[#1a2744] text-[36px] md:text-[42px] leading-[1.15] mb-6">
          {t('screening_subtitle')}
        </h1>

        <p className="font-sans text-[#4a5578] text-[16px] leading-[1.6] mb-10 max-w-[420px] mx-auto">
          {t('screening_intro')}<br/>
          <strong>{t('screening_disclaimer')}</strong>
        </p>

        <div className="text-left mb-12 flex flex-col gap-4 max-w-[420px] mx-auto pl-2">
          {[
            t('screening_takes'),
            t('screening_confidential'),
            t('screening_no_wrong'),
            t('screening_consent')
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-[22px] h-[22px] rounded-full bg-[#6b7c52] flex items-center justify-center shrink-0">
                <Check className="w-[12px] h-[12px] text-white" strokeWidth={3} />
              </div>
              <span className="text-[#4a5578] text-[15px] font-medium">{text}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={handleStart} 
          disabled={loading}
          className="w-full sm:w-[85%] py-[1.1rem] bg-[#6b7c52] text-white font-semibold text-[1.05rem] rounded-[16px] hover:bg-[#556540] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-[2px] shadow-[0_4px_12px_rgba(107,124,82,0.2)] hover:shadow-[0_8px_20px_rgba(107,124,82,0.25)]"
        >
          {loading ? t('initializing') : `${t('begin_assessment')} →`}
        </button>
      </div>
    </div>
  );
}
