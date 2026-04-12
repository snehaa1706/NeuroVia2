import { useState, useEffect, useRef, useCallback } from 'react';
import { submitLevel3, resumeAssessment } from '../services/screeningApi';

// === STROOP COMPONENT ===
function StroopTest({ stroopData, onComplete }) {
  const trials = stroopData?.trials || [];
  const totalTrials = stroopData?.total || 10;
  const timeLimitMs = stroopData?.time_limit_ms || 3000;
  const colorOptions = stroopData?.color_options || [];

  const [currentTrial, setCurrentTrial] = useState(0);
  const [responses, setResponses] = useState([]);
  const [phase, setPhase] = useState('intro');
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);

  const trialStartRef = useRef(null);
  const timerRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  const trial = trials[currentTrial] || null;

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'active') return;
    
    trialStartRef.current = Date.now();
    setTimeLeft(timeLimitMs);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - trialStartRef.current;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [phase, currentTrial]);

  const startTest = () => {
    setPhase('active');
  };

  const handleTimeout = useCallback(() => {
    const resp = {
      answer: "",
      reaction_time_ms: timeLimitMs,
      timed_out: true,
      trial_index: currentTrial
    };
    recordResponse(resp, false);
  }, [currentTrial, timeLimitMs]);

  const handleColorClick = (colorName) => {
    if (phase !== 'active') return;
    clearInterval(timerRef.current);

    const reactionTime = Date.now() - trialStartRef.current;
    const isCorrect = colorName.toUpperCase() === trial.color.toUpperCase();

    const resp = {
      answer: colorName,
      reaction_time_ms: reactionTime,
      timed_out: false,
      trial_index: currentTrial
    };
    recordResponse(resp, isCorrect);
  };

  const recordResponse = (resp, isCorrect) => {
    setResponses(prev => [...prev, resp]);
    setFeedback({ correct: isCorrect, message: isCorrect ? '✅ Correct!' : resp.timed_out ? '⏱️ Time\'s up!' : '❌ Incorrect' });
    setPhase('feedback');

    feedbackTimerRef.current = setTimeout(() => {
      if (currentTrial + 1 >= totalTrials) {
        setPhase('done');
        onComplete([...responses, resp]);
      } else {
        setCurrentTrial(prev => prev + 1);
        setFeedback(null);
        setPhase('active');
      }
    }, 800);
  };

  const correctCount = responses.filter((r, i) => 
    r.answer.toUpperCase() === (trials[i]?.color || "").toUpperCase() && !r.timed_out
  ).length;

  const timerPercent = (timeLeft / timeLimitMs) * 100;
  const timerColor = timerPercent > 50 ? '#6b7c52' : timerPercent > 25 ? '#e67e22' : '#c62828';

  if (phase === 'intro') {
    return (
      <div className="text-center bg-white border border-[#e2dcd0] p-8 md:p-10 rounded-[24px] shadow-sm">
        <h4 className="text-[#6b7c52] font-semibold tracking-wide text-[16px] uppercase mb-6">How it works</h4>
        <div className="bg-[#fcfaf7] border border-[#e2dcd0]/50 p-6 rounded-[20px] mb-8 text-left max-w-[500px] mx-auto shadow-sm">
          <p className="m-0 mb-3 text-[16px] leading-[1.6] text-[#4a5578]">
            You will see <strong className="text-[#1a2744]">color words</strong> displayed in <strong className="text-[#1a2744]">different colors</strong>.
          </p>
          <p className="m-0 mb-3 text-[16px] leading-[1.6] text-[#4a5578]">
            Your task: <strong className="text-[#1a2744]">Select the COLOR of the text</strong>, NOT the word itself.
          </p>
          <div className="bg-white p-5 rounded-[16px] text-center my-6 shadow-sm border border-[#e2dcd0]/30">
            <p className="m-0 mb-2 text-[13px] text-[#4a5578]/70 font-semibold uppercase tracking-wider">Example:</p>
            <span className="text-[36px] font-black text-[#198754] tracking-widest drop-shadow-sm">RED</span>
            <p className="m-0 mt-3 text-[14px] text-[#4a5578]">
              The word says "RED" but the color is <strong className="text-[#198754]">GREEN</strong>. 
              <br />You should tap <strong className="text-[#198754]">GREEN</strong>.
            </p>
          </div>
          <p className="m-0 text-[15px] text-[#c62828] font-medium bg-[#c62828]/5 inline-block py-2 px-4 rounded-xl">
            ⚡ You have <strong>{timeLimitMs / 1000} seconds</strong> per question. Be fast and accurate!
          </p>
        </div>
        <button onClick={startTest} className="px-10 py-4 bg-[#6b7c52] text-white rounded-2xl font-bold shadow-md hover:bg-[#556540] hover:shadow-lg transition-all hover:-translate-y-[2px]">
          🧠 Start Stroop Test ({totalTrials} trials)
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const avgRt = responses.length > 0
      ? Math.round(responses.filter(r => !r.timed_out).reduce((s, r) => s + r.reaction_time_ms, 0) / Math.max(responses.filter(r => !r.timed_out).length, 1))
      : 0;
    const accuracy = Math.round((correctCount / totalTrials) * 100);
    const interpretation = accuracy >= 80 ? "Good" : accuracy >= 50 ? "Moderate" : "Needs Attention";
    const interpColor = accuracy >= 80 ? "#6b7c52" : accuracy >= 50 ? "#e67e22" : "#c62828";

    return (
      <div className="text-center bg-white border border-[#e2dcd0] p-8 rounded-[24px] shadow-sm">
        <div className="text-[48px] mb-4">🎯</div>
        <h4 className="text-[#6b7c52] font-semibold text-[20px] mb-8">Stroop Test Complete</h4>
        <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto mb-8">
          <div className="bg-[#6b7c52]/10 border border-[#6b7c52]/30 p-5 rounded-[16px]">
            <div className="text-[32px] font-bold text-[#6b7c52]">{correctCount}/{totalTrials}</div>
            <div className="text-[13px] text-[#6b7c52] font-semibold uppercase tracking-wider mt-1">Correct</div>
          </div>
          <div className="bg-[#1a2744]/5 border border-[#1a2744]/10 p-5 rounded-[16px]">
            <div className="text-[32px] font-bold text-[#1a2744]">{avgRt}ms</div>
            <div className="text-[13px] text-[#4a5578] font-semibold uppercase tracking-wider mt-1">Avg React</div>
          </div>
          <div className="bg-[#e67e22]/10 border border-[#e67e22]/30 p-5 rounded-[16px]">
            <div className="text-[32px] font-bold text-[#e67e22]">{accuracy}%</div>
            <div className="text-[13px] text-[#e67e22] font-semibold uppercase tracking-wider mt-1">Accuracy</div>
          </div>
          <div className="bg-white border border-[#e2dcd0] p-5 rounded-[16px]">
            <div className="text-[24px] mt-2 font-bold" style={{ color: interpColor }}>{interpretation}</div>
            <div className="text-[13px] text-[#4a5578] font-semibold uppercase tracking-wider mt-1">Assessment</div>
          </div>
        </div>
        <div className="bg-[#6b7c52]/10 border border-[#6b7c52]/30 p-4 rounded-xl text-[#6b7c52] font-bold">
          ✅ Stroop Test data locked
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-[#e2dcd0] rounded-[24px] shadow-sm">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-[14px] text-[#4a5578] font-bold tracking-wide uppercase">
          Question {currentTrial + 1} / {totalTrials}
        </span>
        <span className="text-[14px] text-[#6b7c52] font-bold">
          ✅ {correctCount} correct
        </span>
      </div>

      <div className="w-full h-[6px] bg-[#f5f0e8] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-[#6b7c52] rounded-full transition-all duration-300" style={{ width: `${((currentTrial + 1) / totalTrials) * 100}%` }} />
      </div>

      <div className="w-full h-[8px] bg-[#f5f0e8] rounded-full mb-8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-75" style={{ width: `${timerPercent}%`, backgroundColor: timerColor }} />
      </div>

      {trial && (
        <div className={`text-center py-[60px] px-5 mb-8 rounded-[20px] transition-all duration-200 border-2 ${
          phase === 'feedback'
            ? (feedback?.correct ? 'bg-[#6b7c52]/10 border-[#6b7c52]' : 'bg-[#c62828]/10 border-[#c62828]')
            : 'bg-[#fcfaf7] border-[#e2dcd0]'
        }`}>
          <div className="text-[72px] font-black tracking-[6px] drop-shadow-sm select-none" style={{ color: trial.color_hex }}>
            {trial.word}
          </div>
          {phase === 'feedback' && feedback && (
            <div className={`mt-6 text-[20px] font-bold ${feedback.correct ? 'text-[#6b7c52]' : 'text-[#c62828]'}`}>
              {feedback.message}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {colorOptions.map(opt => (
          <button
            key={opt.name}
            type="button"
            onClick={() => handleColorClick(opt.name)}
            disabled={phase !== 'active'}
            className="p-5 rounded-2xl border-[3px] font-bold text-[18px] tracking-wide transition-all duration-200 shadow-md hover:scale-[1.02]"
            style={{
              borderColor: opt.hex,
              backgroundColor: opt.hex,
              color: opt.name === "YELLOW" ? "#333" : "#fff",
              cursor: phase === 'active' ? "pointer" : "not-allowed",
              opacity: phase === 'active' ? 1 : 0.6,
            }}
          >
            {opt.name}
          </button>
        ))}
      </div>

      <p className="text-center text-[13px] text-[#4a5578]/80 mt-6 font-medium">
        Select the COLOR of the text, not the word itself
      </p>
    </div>
  );
}


// === MAIN LEVEL 3 COMPONENT ===
export default function Level3({ assessmentId, initialContext, onNext }) {
  const assessment_id = assessmentId || localStorage.getItem("screening_assessmentId");

  const [level3Context, setLevel3Context] = useState(initialContext || null);

  useEffect(() => {
    if (!level3Context && assessment_id) {
      resumeAssessment().then(res => {
        if (res.level3_context) {
          setLevel3Context(res.level3_context);
        }
      }).catch(err => console.error("Could not resume Level 3 context:", err));
    }
  }, [level3Context, assessment_id]);

  const stroopData = level3Context?.stroop || null;

  const [loading, setLoading] = useState(false);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [stroopResponses, setStroopResponses] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file (JPG, PNG, etc.)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Max 10MB.");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStroopComplete = (responses) => {
    setStroopResponses(responses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const payload = {
      clock_image_url: previewBase64 || "",
      stroop_responses: stroopResponses || []
    };

    try {
      const result = await submitLevel3(assessment_id, payload);
      onNext(result);
    } catch (err) {
      console.error("Level 3 submission error:", err);
      setError("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!assessment_id) {
    return (
      <div className="p-10 text-center text-[#4a5578]">
        <h3 className="text-[20px] mb-2 font-bold text-[#1a2744]">No active assessment found.</h3>
        <p>Please go back and click <strong>Start Screening</strong>.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-10 items-start p-4 animate-[fadeIn_0.4s_ease-out]">
      
      {/* === STICKY SIDEBAR === */}
      <div className="flex-[1_1_300px] max-w-full md:max-w-[350px] sticky top-10 bg-[#0e1726]/95 backdrop-blur-xl text-white p-10 rounded-[32px] shadow-lg border border-white/5">
        <div className="text-[0.7rem] font-bold text-[#b8d49e] tracking-[0.15em] uppercase mb-4">
          Level 3 of 3
        </div>
        <h2 className="font-serif text-[36px] mt-0 mb-6 leading-[1.1]">
          Executive<br/><span className="text-[#f5f0e8]/90 italic">Function</span>
        </h2>
        <p className="text-[#f5f0e8]/70 text-[15px] leading-[1.6] mb-8">
          This final phase assesses response inhibition, attention, and visuospatial planning.
        </p>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-[20px] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">1</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Stroop Test</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">2</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Clock Drawing</span>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-[2_1_600px] min-w-0">
        <form onSubmit={handleSubmit}>

        {stroopData && (
          <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 1 OF 2</p>
            <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Stroop Color-Word Test</h3>
            <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">
              This test measures your <strong>attention</strong>, <strong>cognitive control</strong>, and <strong>response inhibition</strong> under time pressure.
            </p>
            <StroopTest stroopData={stroopData} onComplete={handleStroopComplete} />
          </div>
        )}

        {/* ===== CLOCK DRAWING ===== */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 2 OF 2</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">{stroopData ? "" : ""}Clock Drawing Test (CDT)</h3>
          <p className="text-[#4a5578] text-[16px] mb-6 leading-[1.6]">
            Assesses executive function, visuospatial ability, and cognitive planning.
          </p>
          <div className="bg-white border border-[#e2dcd0] p-6 rounded-[24px] mb-8 shadow-sm">
            <p className="m-0 mb-4 font-bold text-[#1a2744] text-[16px]">Instructions for patient:</p>
            <ol className="m-0 pl-5 text-[#4a5578] text-[15px] space-y-3 font-medium">
              <li>Draw a large circle on a blank piece of paper</li>
              <li>Place all 12 numbers inside the circle as on a clock</li>
              <li>Draw hands showing <strong>"10 minutes past 11"</strong> (11:10)</li>
            </ol>
          </div>
          <p className="text-[#6b7c52] font-semibold text-[15px] mb-4">
            Upload a photo or scan of the drawing below.
          </p>

          <div className={`bg-white p-10 rounded-[24px] mb-6 border-2 border-dashed transition-all text-center ${previewBase64 ? 'border-[#6b7c52] bg-[#fcfaf7]' : 'border-[#e2dcd0] hover:border-[#6b7c52]/50 hover:bg-[#fcfaf7]'}`}>
            <label htmlFor="clock-upload" className="inline-block px-8 py-4 bg-[#1a2744] text-white rounded-2xl cursor-pointer font-bold text-[16px] hover:bg-[#2e3f6b] hover:shadow-lg transition-all hover:-translate-y-[2px]">
              📷 {previewBase64 ? "Change Image" : "Upload Clock Drawing"}
            </label>
            <input id="clock-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {fileName && <p className="text-[#4a5578] text-[14px] mt-4 font-medium tracking-wide">Selected: {fileName}</p>}
          </div>

          {previewBase64 && (
            <div className="bg-white p-4 rounded-3xl border border-[#e2dcd0] text-center shadow-sm">
              <p className="text-[#4a5578] text-[13px] font-bold tracking-wider uppercase mb-3">Preview:</p>
              <img src={previewBase64} alt="Clock Drawing" className="max-w-full max-h-[350px] mx-auto rounded-xl border border-[#f5f0e8]" />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-[#c62828]/10 border border-[#c62828]/30 text-[#c62828] p-4 rounded-2xl mb-8 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="bg-[#e67e22]/10 border border-[#e67e22]/30 text-[#c65e00] p-6 rounded-3xl mb-8 text-center flex flex-col items-center">
            <div className="text-[32px] mb-3 animate-[spin_1.5s_linear_infinite]">🧠</div>
            <p className="m-0 font-bold text-[16px] uppercase tracking-wide">Analyzing with Vision AI...</p>
            <p className="m-0 mt-2 text-[14px]">This may take a few seconds.</p>
          </div>
        )}

        <div className="text-center flex flex-col gap-4 items-center mb-10">
          <button type="submit" disabled={loading} className="w-full sm:w-[400px] py-[1.15rem] bg-[#6b7c52] text-white font-semibold text-[1.1rem] rounded-[16px] hover:bg-[#556540] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(107,124,82,0.2)] hover:shadow-[0_8px_20px_rgba(107,124,82,0.25)] hover:-translate-y-[2px]">
            {loading ? "Analyzing..." : "Submit Final Assessment"}
          </button>
          <p className="text-[13px] text-[#4a5578]/60 m-0 font-medium tracking-wide">
            You can submit even if some sections are unanswered.
          </p>
        </div>
        </form>
      </div>
    </div>
  );
}
