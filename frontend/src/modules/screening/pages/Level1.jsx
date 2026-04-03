import { useState, useEffect } from 'react';
import { submitLevel1, resumeAssessment } from '../api/screeningApi';

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

// Styles
const mcqBtnStyle = (isSelected) => ({
  padding: "16px 20px",
  borderRadius: "12px",
  border: isSelected ? "2px solid var(--color-navy)" : "1px solid var(--color-primary-100)",
  background: isSelected ? "var(--color-navy)" : "var(--color-bg-card)",
  color: isSelected ? "#fff" : "var(--color-navy)",
  fontSize: "16px",
  fontWeight: isSelected ? "600" : "400",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: isSelected ? "0 4px 12px rgba(27, 42, 65, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)",
  transform: isSelected ? "scale(1.02)" : "scale(1)",
  minHeight: "54px",
  textAlign: "center"
});

const ad8BtnStyle = (isSelected) => ({
  flex: 1,
  padding: "16px 20px",
  borderRadius: "12px",
  border: isSelected ? "2px solid var(--color-navy)" : "1px solid var(--color-primary-100)",
  background: isSelected ? "var(--color-navy)" : "var(--color-bg-card)",
  color: isSelected ? "white" : "var(--color-navy)",
  fontSize: "16px",
  fontWeight: isSelected ? "600" : "500",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textAlign: "center",
  boxShadow: isSelected ? "0 4px 12px rgba(27, 42, 65, 0.2)" : "0 2px 4px rgba(0,0,0,0.02)",
  minHeight: "54px"
});

export default function Level1({ assessmentId, initialContext, onNext }) {
  const assessment_id = assessmentId || localStorage.getItem("screening_assessmentId");

  // Level 1 context from backend
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

  // Flow State
  const [step, setStep] = useState('memorize');
  const [loading, setLoading] = useState(false);

  // Form State
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

  if (!assessment_id) return <div style={{ padding: "20px", textAlign: "center" }}>No active assessment ID found. Please go back and hit Start Screening.</div>;

  // --- MEMORY REGISTRATION PHASE ---
  if (step === 'memorize') {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "auto", textAlign: "center", background: "var(--color-bg-card)", borderRadius: "20px", marginTop: "30px", borderTop: "8px solid var(--color-teal)", boxShadow: "0 10px 30px rgba(27, 42, 65, 0.05)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--color-navy)", fontSize: "36px", marginBottom: "30px" }}>Phase 1: Foundation</h2>
        <div style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--color-teal-dark)" }}>Memory Registration</h3>
          <p style={{ fontSize: "18px", marginBottom: "10px", color: "var(--color-text-secondary)" }}>Please read and remember the following words:</p>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-navy)", background: "var(--color-bg-hover)", padding: "20px", borderRadius: "12px", letterSpacing: "2px", margin: "20px 0", border: "1px solid var(--color-primary-50)" }}>
            {recallWords.map(w => w.toUpperCase()).join(" - ")}
          </div>
          <button
            onClick={() => setStep('test')}
            style={{ padding: "16px 30px", background: "var(--color-teal)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "16px", fontWeight: "600", boxShadow: "0 4px 12px rgba(143, 163, 150, 0.3)" }}>
            I have memorized the words
          </button>
        </div>
      </div>
    );
  }

  // --- TESTING PHASE ---
  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "auto", display: "flex", gap: "40px", alignItems: "flex-start", flexWrap: "wrap" }}>
      
      {/* === STICKY SIDEBAR === */}
      <div style={{ 
        flex: "1 1 300px", 
        maxWidth: "350px",
        position: "sticky", 
        top: "40px", 
        background: "var(--color-navy)", 
        color: "white", 
        padding: "40px", 
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(27, 42, 65, 0.15)"
      }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-teal)", letterSpacing: "1px", marginBottom: "10px", textTransform: "uppercase" }}>
          Level 1 of 3
        </div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "36px", marginTop: 0, marginBottom: "20px", lineHeight: "1.2" }}>
          Foundation Testing
        </h2>
        <p style={{ color: "var(--color-primary-100)", fontSize: "16px", lineHeight: "1.6", marginBottom: "30px" }}>
          This phase assesses basic cognitive function through informant feedback, orientation questions, and immediate memory recall.
        </p>
        <div style={{ background: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" }}>1</div>
            <span style={{ fontSize: "15px", color: "white", fontWeight: "500" }}>AD8 Interview</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" }}>2</div>
            <span style={{ fontSize: "15px", color: "white", fontWeight: "500" }}>Orientation</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" }}>3</div>
            <span style={{ fontSize: "15px", color: "white", fontWeight: "500" }}>Memory Recall</span>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div style={{ flex: "2 1 600px", minWidth: 0 }}>
        <form onSubmit={handleSubmit}>

        {/* === AD8 === */}
        <div style={{ background: "var(--color-bg-card)", padding: "40px", borderRadius: "20px", marginBottom: "40px", borderTop: "8px solid var(--color-teal)", boxShadow: "0 10px 30px rgba(27, 42, 65, 0.06)" }}>
          <h3 style={{ marginTop: 0, color: "var(--color-navy)", fontFamily: "var(--font-serif)", fontSize: "28px" }}>1. Eight-item Informant Interview (AD8)</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px", marginBottom: "25px", lineHeight: "1.6" }}>Has there been a change in the patient's memory, problem-solving abilities, or orientation?</p>

          {AD8_QUESTIONS.map((question, i) => (
            <div key={i} style={{ marginBottom: "24px", background: "var(--color-bg-hover)", padding: "24px", borderRadius: "16px", border: "1px solid var(--color-primary-50)" }}>
              <p style={{ margin: "0 0 20px 0", fontWeight: "600", fontSize: "18px", color: "var(--color-navy)", lineHeight: "1.5" }}>{i + 1}. {question}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button type="button" onClick={() => handleAd8Change(i, true)} style={ad8BtnStyle(ad8[i] === true)}>
                  Yes (A change)
                </button>
                <button type="button" onClick={() => handleAd8Change(i, false)} style={ad8BtnStyle(ad8[i] === false)}>
                  No (No change)
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* === ORIENTATION (MCQ) === */}
        <div style={{ background: "var(--color-bg-card)", padding: "40px", borderRadius: "20px", marginBottom: "40px", borderTop: "8px solid var(--color-teal)", boxShadow: "0 10px 30px rgba(27, 42, 65, 0.06)" }}>
          <h3 style={{ marginTop: 0, color: "var(--color-navy)", fontFamily: "var(--font-serif)", fontSize: "28px" }}>2. Orientation</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px", marginBottom: "25px", lineHeight: "1.6" }}>Please select the best answer for each question.</p>

          {orientationQuestions.length === 0 && (
            <div style={{ background: "#fff3cd", padding: "12px", borderRadius: "5px", color: "#856404", fontSize: "14px", marginBottom: "15px" }}>
              ⚠️ Orientation questions were not loaded. Please go back and start a new screening.
            </div>
          )}

          {orientationQuestions.map((q, idx) => (
            <div key={q.id} style={{ marginBottom: "24px", background: "var(--color-bg-hover)", padding: "24px", borderRadius: "16px", border: "1px solid var(--color-primary-50)" }}>
              <p style={{ fontWeight: "600", fontSize: "18px", marginBottom: "20px", color: "var(--color-navy)" }}>
                {idx + 1}. {q.label}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {q.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleOrientationSelect(q.id, opt)}
                    style={mcqBtnStyle(orientationAnswers[q.id] === opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* === MEMORY RECALL === */}
        <div style={{ background: "var(--color-bg-card)", padding: "40px", borderRadius: "20px", marginBottom: "40px", borderTop: "8px solid var(--color-teal)", boxShadow: "0 10px 30px rgba(27, 42, 65, 0.06)" }}>
          <h3 style={{ marginTop: 0, color: "var(--color-navy)", fontFamily: "var(--font-serif)", fontSize: "28px" }}>3. Memory Recall</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px", marginBottom: "25px", lineHeight: "1.6" }}>Enter the words you memorized earlier.</p>
          <input
            type="text"
            placeholder="e.g., word1, word2, word3"
            value={recall}
            onChange={(e) => setRecall(e.target.value)}
            disabled={dontRememberRecall}
            style={{ width: "100%", padding: "16px 20px", boxSizing: "border-box", borderRadius: "12px", border: "2px solid var(--color-primary-100)", fontSize: "16px", backgroundColor: dontRememberRecall ? "var(--color-primary-50)" : "white", marginBottom: "24px", outline: "none", transition: "border 0.2s", color: "var(--color-navy)" }}
          />
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                background: loading ? "var(--color-primary-100)" : "var(--color-teal)",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(143, 163, 150, 0.3)"
              }}
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
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--color-primary-100)",
                background: loading ? "var(--color-primary-100)" : "var(--color-bg-card)",
                color: "var(--color-navy)",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Analyzing..." : "I Don't Remember"}
            </button>
          </div>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "16px 0 0 0", textAlign: "center" }}>
            You can submit even if some sections are unanswered — unanswered parts will be scored as 0.
          </p>
          </div>
        </form>
      </div>
    </div>
  );
}
