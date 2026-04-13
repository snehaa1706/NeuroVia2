import { useState, useEffect, useRef, useCallback } from 'react';
import { submitLevel2, transcribeAudio, resumeAssessment } from '../services/screeningApi';
import VoiceDictation from '@/components/ui/VoiceDictation';

export default function Level2({ assessmentId, initialContext, onNext }) {
  const assessment_id = assessmentId || localStorage.getItem("screening_assessmentId");

  // --- Level 2 Context from backend ---
  const [level2Context, setLevel2Context] = useState(initialContext || null);

  useEffect(() => {
    if (!level2Context && assessment_id) {
      resumeAssessment().then(res => {
        if (res.level2_context) {
          setLevel2Context(res.level2_context);
        }
      }).catch(err => console.error("Could not resume context:", err));
    }
  }, [level2Context, assessment_id]);

  const digitSequence = level2Context?.digit_span?.sequence || "";
  const displayDuration = level2Context?.digit_span?.display_duration || 4000;
  const vrData = level2Context?.visual_recognition || null;
  const patternData = level2Context?.visual_pattern || null;
  const fluencyData = level2Context?.verbal_fluency || null;
  const fluencyCategory = fluencyData?.category || "animals";
  const fluencyInstruction = fluencyData?.instruction || `Name as many ${fluencyCategory} as you can in 60 seconds.`;

  // --- General ---
  const [loading, setLoading] = useState(false);
  const [delayedRecall, setDelayedRecall] = useState("");
  const [dontRememberDelayedRecall, setDontRememberDelayedRecall] = useState(false);

  // --- Verbal Fluency State ---
  const [inputMode, setInputMode] = useState('idle');
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [micAvailable, setMicAvailable] = useState(true);

  // --- Digit Span State ---
  const [digitSpanPhase, setDigitSpanPhase] = useState('ready');
  const [showSequence, setShowSequence] = useState(false);
  const [digitForward, setDigitForward] = useState("");
  const [digitBackward, setDigitBackward] = useState("");
  const [dontRememberDigitForward, setDontRememberDigitForward] = useState(false);
  const [dontRememberDigitBackward, setDontRememberDigitBackward] = useState(false);
  const [digitCountdown, setDigitCountdown] = useState(0);

  // --- Visual Recognition State ---
  const [vrPhase, setVrPhase] = useState('ready');
  const [vrCountdown, setVrCountdown] = useState(0);
  const [vrSelected, setVrSelected] = useState([]);

  // --- Visual Pattern State ---
  const [selectedPatternAnswer, setSelectedPatternAnswer] = useState("");

  // --- Audio Refs ---
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIdRef = useRef(null);

  // === TIMER (Verbal Fluency) ===
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerIdRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      setTimerDone(true);
      if (inputMode === 'recording') {
        stopRecordingAndTranscribe();
      }
    }
    return () => clearTimeout(timerIdRef.current);
  }, [timerActive, timeLeft, inputMode]);

  // === VERBAL FLUENCY HANDLERS ===
  const startTimer = useCallback(() => {
    setTimerActive(true);
    setTimerDone(false);
    setTimeLeft(60);
  }, []);

  const startTypingMode = () => {
    setInputMode('typing');
    startTimer();
  };

  const startVoiceMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start();
      setInputMode('recording');
      setStatusMsg("🎙️ Recording... Speak now");
      startTimer();
    } catch (err) {
      setMicAvailable(false);
      setStatusMsg("Microphone unavailable. Use typing mode.");
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!mediaRecorderRef.current) return;
    setInputMode('transcribing');
    setStatusMsg("Processing audio...");
    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    await new Promise(r => setTimeout(r, 500));
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    try {
      const result = await transcribeAudio(blob);
      setTranscript(result.text || "");
      setStatusMsg("✅ Transcription complete");
    } catch (err) {
      setStatusMsg("❌ Transcription failed. Type your answers.");
    }
    setInputMode('done');
  };

  const processedAnimals = transcript.includes(',')
    ? transcript.split(',').map(a => a.trim()).filter(a => a.length > 0)
    : transcript.split(/[\s]+/).map(a => a.trim()).filter(a => a.length > 0);

  // === DIGIT SPAN HANDLERS ===
  const startDigitSpan = () => {
    setDigitSpanPhase('showing');
    setShowSequence(true);
    const totalSec = Math.ceil(displayDuration / 1000);
    setDigitCountdown(totalSec);
    const interval = setInterval(() => {
      setDigitCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    setTimeout(() => {
      setShowSequence(false);
      setDigitSpanPhase('input');
      clearInterval(interval);
    }, displayDuration);
  };

  // === VISUAL RECOGNITION HANDLERS ===
  const startVisualRecognition = () => {
    if (!vrData) return;
    setVrPhase('encoding');
    const durationMs = vrData.display_duration || 6000;
    const totalSec = Math.ceil(durationMs / 1000);
    setVrCountdown(totalSec);
    const interval = setInterval(() => {
      setVrCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    setTimeout(() => {
      setVrPhase('recognition');
      clearInterval(interval);
    }, durationMs);
  };

  const toggleVrSelection = (id) => {
    setVrSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // === SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const hasNoDigitForward = digitForward.trim() === '' && !dontRememberDigitForward;
    const hasNoDigitBackward = digitBackward.trim() === '' && !dontRememberDigitBackward;
    const hasNoDelayedRecall = delayedRecall.trim() === '' && !dontRememberDelayedRecall;

    const payload = {
      animals: processedAnimals,
      digit_span_forward: {
        response: (dontRememberDigitForward || hasNoDigitForward) ? "" : digitForward,
        dont_remember: dontRememberDigitForward || hasNoDigitForward
      },
      digit_span_backward: {
        response: (dontRememberDigitBackward || hasNoDigitBackward) ? "" : digitBackward,
        dont_remember: dontRememberDigitBackward || hasNoDigitBackward
      },
      visual_recognition_selected: vrSelected,
      pattern_answer: selectedPatternAnswer,
      delayed_recall: {
        response: (dontRememberDelayedRecall || hasNoDelayedRecall) ? [] : delayedRecall.split(',').map(w => w.trim()).filter(w => w),
        dont_remember: dontRememberDelayedRecall || hasNoDelayedRecall
      }
    };

    try {
      const result = await submitLevel2(assessment_id, payload);
      if (result.next_step === "COMPLETE" || result.current_level !== 3) {
        onNext(null, result);
      } else {
        onNext(result.level3_context, null);
      }
    } catch (err) {
      alert("Error submitting Level 2: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!assessment_id) {
    return <div className="p-5 text-center text-[#4a5578]">No active assessment ID. Go back and Start Screening.</div>;
  }

  if (!level2Context) {
    return (
      <div className="p-10 text-center text-[18px] text-[#4a5578]">
        Loading Phase 2 Assessment Context...
      </div>
    );
  }

  const fmt = (s) => String(s).padStart(2, '0');

  const getSelBtnStyle = (isActive) => {
    return `w-full flex items-center p-4 rounded-2xl border transition-all duration-300 font-medium ${
      isActive 
        ? 'bg-[#6b7c52]/10 border-[#6b7c52] text-[#1a2744] scale-[1.01] shadow-[0_4px_12px_rgba(107,124,82,0.15)]'
        : 'bg-transparent border-[#e2dcd0] text-[#1a2744] hover:bg-[#6b7c52]/5 hover:border-[#6b7c52]/50 hover:scale-[1.01]'
    }`;
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-10 items-start p-4 animate-[fadeIn_0.4s_ease-out]">
      
      {/* === STICKY SIDEBAR === */}
      <div className="flex-[1_1_300px] max-w-full md:max-w-[350px] sticky top-10 bg-[#0e1726]/95 backdrop-blur-xl text-white p-10 rounded-[32px] shadow-lg border border-white/5">
        <div className="text-[0.7rem] font-bold text-[#b8d49e] tracking-[0.15em] uppercase mb-4">
          Level 2 of 3
        </div>
        <h2 className="font-serif text-[36px] mt-0 mb-6 leading-[1.1]">
          MCI Testing
        </h2>
        <p className="text-[#f5f0e8]/70 text-[15px] leading-[1.6] mb-8">
          This phase assesses Mild Cognitive Impairment through verbal fluency, digit span memory, visual recognition, and delayed recall tasks.
        </p>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-[20px] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">1</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Verbal Fluency</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">2</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Digit Span</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">3</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Visual Memory</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#6b7c52]/20 border border-[#b8d49e]/30 flex items-center justify-center text-[13px] font-bold text-[#b8d49e]">4</div>
            <span className="text-[15px] text-[#f5f0e8] font-medium">Delayed Recall</span>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-[2_1_600px] min-w-0">
        <form onSubmit={handleSubmit}>

        {/* ===== SECTION 1: VERBAL FLUENCY ===== */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 1 OF 5</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Semantic Verbal Fluency</h3>
          <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">{fluencyInstruction}</p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="font-mono text-[28px] font-bold bg-white text-[#1a2744] px-5 py-2 rounded-[12px] border border-[#e2dcd0] shadow-sm">
              {fmt(Math.floor(timeLeft / 60))}:{fmt(timeLeft % 60)}
            </div>
            {inputMode === 'idle' && (
              <div className="flex gap-4">
                <button type="button" onClick={startVoiceMode} disabled={!micAvailable} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${micAvailable ? 'bg-[#6b7c52] text-white hover:bg-[#556540]' : 'bg-[#e2dcd0] text-[#4a5578] cursor-not-allowed'}`}>
                  🎤 Start with Voice
                </button>
                <button type="button" onClick={startTypingMode} className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-white bg-[#1a2744] hover:bg-[#2e3f6b] transition-all">
                  ⌨️ Start with Typing
                </button>
              </div>
            )}
          </div>

          {statusMsg && <p className="text-[#6b7c52] font-semibold text-[14px] mb-4">{statusMsg}</p>}

          {(inputMode === 'typing' || inputMode === 'done') && (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Type ${fluencyCategory} separated by commas: item1, item2, item3...`}
              rows={3}
              className="w-full px-5 py-4 rounded-[16px] border border-[#d2c8b98c] bg-white text-[#1a2744] text-[16px] outline-none focus:border-[#6b7c52] focus:ring-4 focus:ring-[#6b7c52]/10 transition-all shadow-sm"
            />
          )}

          {inputMode === 'recording' && !timerDone && (
            <button type="button" onClick={stopRecordingAndTranscribe} className="px-6 py-3 rounded-xl font-bold bg-[#c62828] text-white hover:bg-[#a92222] transition-all shadow-md">
              ⏹️ Stop Recording
            </button>
          )}

          {inputMode === 'transcribing' && (
            <div className="bg-[#e8f5e9]/50 border border-[#b8d49e] p-4 rounded-xl text-[#2e7d32] font-medium">⏳ Processing your recording...</div>
          )}

          {inputMode === 'done' && transcript && (
            <div className="mt-4">
              <p className="font-semibold text-[#1a2744] mb-2 text-[14px]">Transcribed (edit if needed):</p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={3}
                className="w-full px-5 py-4 rounded-[16px] border border-[#d2c8b98c] bg-white text-[#1a2744] text-[16px] outline-none focus:border-[#6b7c52] focus:ring-4 focus:ring-[#6b7c52]/10 transition-all shadow-sm"
              />
            </div>
          )}

          {processedAnimals.length > 0 && (
            <p className="text-[13px] text-[#4a5578]/80 mt-3 font-medium tracking-wide uppercase">{fluencyCategory} detected: {processedAnimals.length}</p>
          )}
        </div>

        {/* ===== SECTION 2: DIGIT SPAN ===== */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 2 OF 5</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Digit Span Test</h3>
          <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">
            A sequence of numbers will appear briefly. Memorize them, then enter them <strong>forward</strong> and <strong>backward</strong>.
          </p>

          {digitSpanPhase === 'ready' && (
            <div className="text-center my-6 bg-white border border-[#e2dcd0] p-8 rounded-2xl shadow-sm">
              <p className="text-[#4a5578] text-[15px] mb-6">
                When you click the button below, a sequence of <strong>{digitSequence.length} digits</strong> will appear for <strong>{displayDuration / 1000} seconds</strong>. Memorize them carefully.
              </p>
              <button type="button" onClick={startDigitSpan} className="px-8 py-3 rounded-xl font-bold bg-[#6b7c52] text-white hover:bg-[#556540] transition-all shadow-md">
                🧠 Begin Digit Span Test
              </button>
            </div>
          )}

          {digitSpanPhase === 'showing' && showSequence && (
            <div className="text-center my-6">
              <div className="font-mono text-[48px] font-bold tracking-[20px] text-[#1a2744] bg-white border border-[#e2dcd0] py-8 rounded-[24px] shadow-sm mb-4">
                {digitSequence}
              </div>
              <p className="text-[#6b7c52] font-semibold text-[16px] animate-pulse">⏱️ Memorize — {digitCountdown}s remaining</p>
            </div>
          )}

          {digitSpanPhase === 'input' && (
            <div className="my-6">
              <p className="font-semibold text-[#1a2744] mb-6">The sequence has been hidden. Now enter it:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[14px] font-semibold text-[#4a5578] mb-2 uppercase tracking-wide">Forward (left to right):</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={digitForward} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setDigitForward(e.target.value); }}
                    disabled={dontRememberDigitForward}
                    className={`w-full px-5 py-4 text-center rounded-[16px] border font-mono tracking-[8px] text-[20px] mb-4 outline-none transition-all ${dontRememberDigitForward ? 'bg-[#f5f0e8]/50 border-[#e2dcd0]/50 text-transparent' : 'bg-white border-[#d2c8b98c] text-[#1a2744] focus:border-[#6b7c52] shadow-sm'}`}
                    placeholder="e.g. 7392" />
                  <button type="button" onClick={() => { setDontRememberDigitForward(!dontRememberDigitForward); if(!dontRememberDigitForward) setDigitForward(""); }} 
                    className={`w-full p-3 rounded-xl border font-bold transition-all ${dontRememberDigitForward ? 'border-[#c62828] bg-[#c62828] text-white' : 'border-[#e2dcd0] bg-transparent text-[#4a5578] hover:bg-[#f5f0e8]'}`}>
                    I Don't Remember
                  </button>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#4a5578] mb-2 uppercase tracking-wide">Backward (right to left):</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={digitBackward} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setDigitBackward(e.target.value); }}
                    disabled={dontRememberDigitBackward}
                    className={`w-full px-5 py-4 text-center rounded-[16px] border font-mono tracking-[8px] text-[20px] mb-4 outline-none transition-all ${dontRememberDigitBackward ? 'bg-[#f5f0e8]/50 border-[#e2dcd0]/50 text-transparent' : 'bg-white border-[#d2c8b98c] text-[#1a2744] focus:border-[#6b7c52] shadow-sm'}`}
                    placeholder="e.g. 2937" />
                  <button type="button" onClick={() => { setDontRememberDigitBackward(!dontRememberDigitBackward); if(!dontRememberDigitBackward) setDigitBackward(""); }} 
                    className={`w-full p-3 rounded-xl border font-bold transition-all ${dontRememberDigitBackward ? 'border-[#c62828] bg-[#c62828] text-white' : 'border-[#e2dcd0] bg-transparent text-[#4a5578] hover:bg-[#f5f0e8]'}`}>
                    I Don't Remember
                  </button>
                </div>
              </div>
              {((digitForward || dontRememberDigitForward) && (digitBackward || dontRememberDigitBackward)) && (
                <div className="text-center mt-8">
                  <button type="button" onClick={() => setDigitSpanPhase('done')} className="px-8 py-3 bg-[#1a2744] text-white rounded-xl font-bold shadow-md hover:bg-[#2e3f6b] transition-all">
                    ✅ Lock Answers
                  </button>
                </div>
              )}
            </div>
          )}

          {digitSpanPhase === 'done' && (
            <div className="bg-[#6b7c52]/10 border border-[#6b7c52]/30 p-4 rounded-xl text-[#6b7c52] font-semibold mt-4">
              ✅ Digit Span answers locked (Forward: {digitForward}, Backward: {digitBackward})
            </div>
          )}
        </div>

        {/* ===== SECTION 3: VISUAL RECOGNITION ===== */}
        {vrData && (
          <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 3 OF 5</p>
            <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Visual Recognition</h3>
            <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">
              You will see a set of objects. Memorize them, then identify which ones you saw from a mixed set.
            </p>

            {vrPhase === 'ready' && (
              <div className="text-center my-6 bg-white border border-[#e2dcd0] p-8 rounded-2xl shadow-sm">
                <p className="text-[#4a5578] text-[15px] mb-6">
                  You will see <strong>{vrData.targets?.length || 4} objects</strong> for <strong>{(vrData.display_duration || 6000) / 1000} seconds</strong>. Memorize them carefully.
                </p>
                <button type="button" onClick={startVisualRecognition} className="px-8 py-3 rounded-xl font-bold bg-[#6b7c52] text-white hover:bg-[#556540] transition-all shadow-md">
                  👁️ Begin Visual Recognition
                </button>
              </div>
            )}

            {vrPhase === 'encoding' && (
              <div className="text-center my-6">
                <p className="text-[#6b7c52] text-[16px] font-bold mb-6 animate-pulse">⏱️ Memorize these — {vrCountdown}s remaining</p>
                <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto">
                  {vrData.targets?.map(obj => (
                    <div key={obj.id} className="bg-white rounded-2xl p-6 text-center border-2 border-[#6b7c52]/30 shadow-md">
                      <div className="text-[52px] mb-2 drop-shadow-sm">{obj.emoji}</div>
                      <div className="text-[16px] font-bold text-[#1a2744]">{obj.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vrPhase === 'recognition' && (
              <div className="my-6">
                <p className="font-semibold text-[#1a2744] mb-6 text-[16px]">Select ALL the objects you remember seeing:</p>
                <div className="grid grid-cols-3 gap-4">
                  {vrData.mixed_set?.map(obj => {
                    const isSelected = vrSelected.includes(obj.id);
                    return (
                      <button key={obj.id} type="button" onClick={() => toggleVrSelection(obj.id)}
                        className={`p-4 rounded-[16px] border-2 transition-all duration-200 text-center ${isSelected ? 'border-[#6b7c52] bg-[#6b7c52]/10 shadow-sm' : 'border-[#e2dcd0] bg-white hover:border-[#6b7c52]/50'}`}>
                        <div className="text-[40px] mb-2">{obj.emoji}</div>
                        <div className={`text-[14px] ${isSelected ? 'font-bold text-[#6b7c52]' : 'font-medium text-[#4a5578]'}`}>{obj.label}</div>
                        {isSelected && <div className="mt-2 text-[#6b7c52] text-[12px] font-bold">✅ Selected</div>}
                      </button>
                    );
                  })}
                </div>
                {vrSelected.length > 0 && (
                  <div className="text-center mt-8">
                    <button type="button" onClick={() => setVrPhase('done')} className="px-8 py-3 bg-[#1a2744] text-white rounded-xl font-bold shadow-md hover:bg-[#2e3f6b] transition-all">
                      ✅ Confirm Selection ({vrSelected.length} selected)
                    </button>
                  </div>
                )}
              </div>
            )}

            {vrPhase === 'done' && (
              <div className="bg-[#6b7c52]/10 border border-[#6b7c52]/30 p-4 rounded-xl text-[#6b7c52] font-semibold mt-4">
                ✅ Visual Recognition complete — {vrSelected.length} objects selected
              </div>
            )}
          </div>
        )}

        {/* ===== SECTION 4: VISUAL PATTERN RECOGNITION ===== */}
        {patternData && (
          <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 4 OF 5</p>
            <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Pattern Recognition</h3>
            <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">
              Look at the pattern and select what comes next.
            </p>

            <div className="bg-white border border-[#e2dcd0] p-6 md:p-8 rounded-[24px] text-center mb-8 shadow-sm">
              <p className="text-[15px] text-[#4a5578] mb-6 font-bold tracking-wide uppercase">
                {patternData.instruction || "What comes next?"}
              </p>
              <div className="flex justify-center flex-wrap gap-4">
                {patternData.sequence?.map((item, i) => (
                  <div key={i} className="text-[36px] px-5 py-3 bg-[#f5f0e8] rounded-[16px] border border-[#e2dcd0] shadow-sm text-[#1a2744]">
                    {item}
                  </div>
                ))}
                <div className="text-[36px] px-6 py-3 bg-white rounded-[16px] border-2 border-dashed border-[#6b7c52] text-[#6b7c52] font-bold">
                  ?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patternData.options && Object.entries(patternData.options).map(([key, value]) => {
                const isActive = selectedPatternAnswer === key;
                return (
                  <button key={key} type="button" onClick={() => setSelectedPatternAnswer(key)}
                    className={getSelBtnStyle(isActive)}>
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border mr-4 text-[13px] font-bold transition-all ${isActive ? 'bg-[#6b7c52] border-[#6b7c52] text-white' : 'bg-transparent border-[#e2dcd0] text-[#1a2744]'}`}>
                      {key}
                    </span>
                    <span className="text-[24px]">{value}</span>
                  </button>
                );
              })}
            </div>

            {selectedPatternAnswer && (
              <div className="text-center mt-6 bg-[#6b7c52]/10 border border-[#6b7c52]/30 p-3 rounded-xl text-[#6b7c52] font-semibold">
                ✅ Selected: Option {selectedPatternAnswer}
              </div>
            )}
          </div>
        )}

        {/* ===== SECTION 5: DELAYED RECALL ===== */}
        <div className="bg-[#fcfaf7] border border-[#e2dcd0] p-8 md:p-12 rounded-[32px] mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="font-sans text-[0.7rem] font-bold tracking-[0.15em] text-[#6b7c52] uppercase mb-2">SECTION 5 OF 5</p>
          <h3 className="mt-0 text-[#1a2744] font-serif text-[32px] leading-[1.2] mb-4">Delayed Recall</h3>
          <p className="text-[#4a5578] text-[16px] mb-8 leading-[1.6]">
            Earlier in Phase 1, you were asked to remember some words.<br/>
            <strong>Now recall and type them from memory.</strong>
          </p>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="text"
              placeholder="e.g., word1, word2, word3"
              value={delayedRecall}
              onChange={(e) => setDelayedRecall(e.target.value)}
              disabled={dontRememberDelayedRecall}
              className={`flex-1 px-5 py-4 rounded-[16px] border text-[16px] outline-none transition-all ${dontRememberDelayedRecall ? 'bg-[#f5f0e8]/50 border-[#e2dcd0]/50 text-[#1a2744]/40' : 'bg-white border-[#d2c8b98c] text-[#1a2744] focus:border-[#6b7c52] focus:ring-4 focus:ring-[#6b7c52]/10 shadow-sm'}`}
            />
            {!dontRememberDelayedRecall && (
              <VoiceDictation onTranscript={(text) => setDelayedRecall(prev => prev ? prev + ', ' + text : text)} size="md" />
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setDontRememberDelayedRecall(!dontRememberDelayedRecall);
              if (!dontRememberDelayedRecall) setDelayedRecall("");
            }}
            className={`w-full py-[1.1rem] px-6 text-[1.05rem] font-bold rounded-[16px] border transition-all duration-300 ${dontRememberDelayedRecall ? 'border-[#c62828] bg-[#c62828] text-white' : 'border-[#d2c8b98c] bg-transparent text-[#4a5578] hover:bg-[#f5f0e8]/50 hover:text-[#1a2744]'}`}
          >
            I Don't Remember
          </button>
        </div>

        {/* ===== SUBMIT ===== */}
        <div className="text-center flex flex-col gap-4 items-center mb-10">
          <button type="submit" disabled={loading}
            className="w-full sm:w-[400px] py-[1.15rem] bg-[#6b7c52] text-white font-semibold text-[1.1rem] rounded-[16px] hover:bg-[#556540] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(107,124,82,0.2)] hover:shadow-[0_8px_20px_rgba(107,124,82,0.25)] hover:-translate-y-[2px]"
          >
            {loading ? "Analyzing..." : "Submit Level 2 Assessment"}
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
