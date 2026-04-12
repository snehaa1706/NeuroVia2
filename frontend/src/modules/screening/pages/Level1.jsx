import { useState, useEffect } from 'react';
import { submitLevel1, resumeAssessment } from '../services/screeningApi';

const AD8_QUESTIONS = [
  "Problems with judgment (e.g., making decisions, bad financial choices)?",
  "Reduced interest in hobbies/activities?",
  "Repeats the same things over and over (questions, stories, or statements)?",
  "Trouble learning how to use a tool, appliance, or gadget?",
  "Forgets the correct month or year?",
  "Trouble handling complicated financial affairs (e.g., balancing checkbook, paying bills)?",
  "Trouble remembering appointments?",
  "Daily problems with thinking and/or memory?"
];

// Glassy Sage Base Button Styles
const getMcqBtnClass = (isSelected) => {
  return `w-full text-left p-5 rounded-2xl border transition-all duration-300 font-medium ${
    isSelected 
      ? 'bg-[#6b7c52]/15 border-[#6b7c52]/50 text-[#6b7c52] shadow-[0_4px_12px_rgba(107,124,82,0.15)] ring-1 ring-[#6b7c52]/30'
      : 'bg-white/40 backdrop-blur-md border-white/60 text-[#1a2744] hover:bg-white/70 hover:border-white hover:shadow-sm hover:-translate-y-[1px]'
  }`;
};

const getAd8BtnClass = (isSelected) => {
  return `flex-1 p-[1.1rem] rounded-[16px] border transition-all duration-300 font-medium text-center ${
    isSelected 
      ? 'bg-[#6b7c52]/15 border-[#6b7c52]/50 text-[#6b7c52] shadow-[0_4px_12px_rgba(107,124,82,0.15)] ring-1 ring-[#6b7c52]/30'
      : 'bg-white/40 backdrop-blur-md border-white/60 text-[#1a2744] hover:bg-white/70 hover:border-white hover:shadow-sm hover:-translate-y-[1px]'
  }`;
};

export default function Level1({ assessmentId, initialContext, onNext }) {
  const assessment_id = assessmentId || localStorage.getItem("screening_assessmentId");

  const [level1Context, setLevel1Context] = useState(initialContext || null);

  useEffect(() => {
    if (!level1Context && assessment_id) {
      resumeAssessment().then(res => {
        if (res.level1_context) {
          setLevel1Context(res.level1_context);
        }
      }).catch(err => console.error("Could not resume Level 1 context:", err));
    }
  }, [level1Context, assessment_id]);

  const orientationQuestions = level1Context?.orientation?.questions || [];
  const recallWords = level1Context?.recall_words || [];

  const [step, setStep] = useState('memorize');
  const [loading, setLoading] = useState(false);

  const [ad8, setAd8] = useState(Array(8).fill(null));
  const [orientationAnswers, setOrientationAnswers] = useState({});
  const [recall, setRecall] = useState("");
  const [dontRememberRecall, setDontRememberRecall] = useState(false);

  const handleAd8Change = (index, value) => {
    const newAd8 = [...ad8];
    newAd8[index] = value;
    setAd8(newAd8);
  };

  const handleOrientationSelect = (questionId, value) => {
    setOrientationAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e, forceNoRecall = false) => {
    if (e) e.preventDefault();

    setLoading(true);

    const noRecall = forceNoRecall || dontRememberRecall;

    const ad8_answers = {};
    ad8.forEach((val, i) => {
      ad8_answers[`q${i + 1}`] = val === true;
    });

    const hasNoRecallInput = recall.trim() === '' && !noRecall;
    const payload = {
      ad8_answers,
      orientation_answers: orientationAnswers,
      recall_words: {
        response: (noRecall || hasNoRecallInput) ? [] : recall.split(',').map(w => w.trim()).filter(w => w),
        dont_remember: noRecall || hasNoRecallInput
      },
    };

    try {
      const result = await submitLevel1(assessment_id, payload);
      setDontRememberRecall(false);
      onNext(result.level2_context || null);
    } catch (err) {
      alert("Error submitting Level 1: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!assessment_id) return <div className="p-5 text-center text-[#4a5578]">No active assessment ID found. Please go back and hit Start Screening.</div>;

  if (step === 'memorize') {
    return (
      <div className="w-full max-w-[600px] mx-auto text-center mt-8 animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] rounded-[32px] p-10 md:p-14 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <h2 className="font-serif text-[#1a2744] text-[36px] mb-8 leading-[1.2]">Phase 1: Foundation</h2>
          <div>
            <p className="font-sans text-[0.75rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-4">Memory Registration</p>
            <p className="text-[17px] mb-6 text-[#4a5578]">Please read and remember the following words:</p>
            
            <div className="bg-white border border-[#e2dcd0] py-8 px-4 rounded-[20px] shadow-sm mb-8">
              <p className="font-sans text-[22px] md:text-[26px] font-bold text-[#1a2744] tracking-[0.1em] leading-relaxed">
                {recallWords.map(w => w.toUpperCase()).join(" - ")}
              </p>
            </div>
            
            <button
              onClick={() => setStep('test')}
              className="w-full sm:w-auto px-8 py-4 bg-[#6b7c52] text-white font-semibold text-[1.05rem] rounded-[16px] hover:bg-[#556540] transition-all duration-300 hover:-translate-y-[2px] shadow-[0_4px_12px_rgba(107,124,82,0.2)] hover:shadow-[0_8px_20px_rgba(107,124,82,0.25)]"
            >
              I have memorized the words
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-10 items-start p-4 animate-[fadeIn_0.4s_ease-out]">
      
      {/* === STICKY SIDEBAR === */}
      <div className="flex-[1_1_300px] max-w-full md:max-w-[350px] sticky top-10 bg-[#0e1726]/95 backdrop-blur-xl text-white p-10 rounded-[32px] shadow-lg border border-white/5">
        <div className="text-[0.7rem] font-bold text-[#b8d49e] tracking-[0.15em] uppercase mb-4">
          Level 1 of 3
        </div>
        <h2 className="font-serif text-[36px] mt-0 mb-6 leading-[1.1]">
          Foundation<br/><span className="text-[#f5f0e8]/90 italic">Testing</span>
        </h2>
        <p className="text-[#f5f0e8]/70 text-[15px] leading-[1.6] mb-8">
          This phase assesses basic cognitive function through informant feedback, orientation questions, and immediate memory recall.
        </p>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-[20px] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">1</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">AD8 Interview</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">2</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Orientation</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">3</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Memory Recall</span>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-[2_1_600px] min-w-0">
        <form onSubmit={(e) => handleSubmit(e, false)}>

        {/* === AD8 === */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 1 OF 3</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Eight-item Informant Interview</h3>
          <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">Has there been a change in the patient's memory, problem-solving abilities, or orientation?</p>

          <div className="space-y-6">
            {AD8_QUESTIONS.map((question, i) => (
              <div key={i} className="bg-[#f5f0e8] border border-[#e2dcd0]/50 p-6 rounded-[24px] shadow-sm">
                <p className="m-0 mb-5 font-semibold text-[17px] text-[#1a2744] leading-[1.5]">{i + 1}. {question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleAd8Change(i, true)} className={getAd8BtnClass(ad8[i] === true)}>
                    Yes <span className="opacity-60 text-[13px] font-normal block mt-1">(A change)</span>
                  </button>
                  <button type="button" onClick={() => handleAd8Change(i, false)} className={getAd8BtnClass(ad8[i] === false)}>
                    No <span className="opacity-60 text-[13px] font-normal block mt-1">(No change)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === ORIENTATION === */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 2 OF 3</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Orientation</h3>
          <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">Please select the best answer for each question.</p>

          {orientationQuestions.length === 0 && (
            <div className="bg-[#f5eef8] p-4 rounded-xl text-[#6c3483] text-sm mb-6 border border-[#e8daef]">
              ⚠️ Orientation questions were not loaded. Please go back and start a new screening.
            </div>
          )}

          <div className="space-y-6">
            {orientationQuestions.map((q, idx) => (
              <div key={q.id} className="bg-[#f5f0e8] border border-[#e2dcd0]/50 p-6 rounded-[24px] shadow-sm">
                <p className="font-semibold text-[17px] mb-5 text-[#1a2744] leading-[1.4]">
                  {idx + 1}. {q.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleOrientationSelect(q.id, opt)}
                      className={getMcqBtnClass(orientationAnswers[q.id] === opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === MEMORY RECALL === */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 3 OF 3</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Memory Recall</h3>
          <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">Enter the words you memorized earlier.</p>
          
          <input
            type="text"
            placeholder="e.g., word1, word2, word3"
            value={recall}
            onChange={(e) => setRecall(e.target.value)}
            disabled={dontRememberRecall}
            className={`w-full px-5 py-4 rounded-[16px] border text-[16px] mb-6 outline-none transition-all ${dontRememberRecall ? 'bg-[#f5f0e8]/50 border-[#e2dcd0]/50 text-[#1a2744]/40' : 'bg-white border-[#d2c8b98c] text-[#1a2744] focus:border-[#6b7c52] focus:ring-4 focus:ring-[#6b7c52]/10 shadow-sm'}`}
          />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-[1.1rem] px-6 bg-[#6b7c52] text-white font-semibold text-[1.05rem] rounded-[16px] hover:bg-[#556540] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(107,124,82,0.2)] hover:shadow-[0_8px_20px_rgba(107,124,82,0.25)] hover:-translate-y-[2px]"
            >
              {loading ? "Analyzing..." : "Submit Phase 1"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setDontRememberRecall(true);
                setRecall("");
                handleSubmit(null, true);
              }}
              className="flex-1 py-[1.1rem] px-6 bg-transparent border-[1.5px] border-[#d2c8b98c] text-[#4a5578] font-semibold text-[1.05rem] rounded-[16px] hover:bg-[#f5f0e8]/50 hover:text-[#1a2744] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-[2px]"
            >
              {loading ? "Analyzing..." : "I Don't Remember"}
            </button>
          </div>
          <p className="text-[13px] text-[#4a5578]/60 mt-6 text-center font-medium">
            You can submit even if some sections are unanswered — unanswered parts will be scored as 0.
          </p>
        </div>
        
        </form>
      </div>
    </div>
  );
}
