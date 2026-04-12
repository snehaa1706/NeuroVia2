import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, Trophy, ThumbsUp, Dumbbell, Mic, Square, Plus, Trash2, ChevronDown, Users, Phone } from 'lucide-react';

// ========================================
// VOICE TRANSCRIPTION HOOK
// ========================================
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => { onResult(event.results[0][0].transcript); setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult]);

  return { listening, toggle };
}

// ========================================
// MIC BUTTON
// ========================================
const MicButton = ({ listening, onClick }: { listening: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick}
    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
      listening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-(--color-surface-alt) border-2 border-(--color-border-light) text-(--color-sage) hover:bg-(--color-sage) hover:text-white'
    }`}
    title={listening ? "Stop listening" : "Use voice input"}>
    {listening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
  </button>
);

// ========================================
// LOCAL FALLBACK LIBRARY
// ========================================
const LOCAL_LIBRARY: Record<string, any[]> = {
  memory_recall: [
    { words: ["Apple", "River", "Cloud"] }, { words: ["Chair", "Window", "Table"] },
    { words: ["Sun", "Moon", "Stars"] }, { words: ["Garden", "Bicycle", "Ocean"] },
    { words: ["Candle", "Mountain", "Piano"] }, { words: ["Elephant", "Library", "Sunset"] },
  ],
  pattern_recognition: [
    { sequence: ["🔴", "🔵", "🔴", "🔵"], options: ["🔴", "🔵", "🟢"], answer: "🔴" },
    { sequence: ["☀️", "🌙", "☀️", "🌙"], options: ["⭐", "☀️", "🌙"], answer: "☀️" },
    { sequence: ["❤️", "❤️", "⭐", "❤️", "❤️"], options: ["⭐", "🌙", "❤️"], answer: "⭐" },
    { sequence: ["🐶", "🐱", "🐶", "🐱"], options: ["🐭", "🐶", "🐱"], answer: "🐶" },
    { sequence: ["🍎", "🍌", "🍎", "🍌"], options: ["🍇", "🍎", "🍌"], answer: "🍎" },
    { sequence: ["🌻", "🌹", "🌻", "🌹"], options: ["🌷", "🌻", "🌹"], answer: "🌻" },
    { sequence: ["🚗", "🚌", "🚗", "🚌"], options: ["🚲", "🚗", "🚌"], answer: "🚗" },
    { sequence: ["☕", "🥐", "☕", "🥐"], options: ["🍰", "☕", "🥐"], answer: "☕" },
  ],
  image_recall: [
    { images: [{ label: "Apple" }, { label: "Chair" }, { label: "Book" }], options: ["Apple", "Chair", "Book", "Lamp", "Shoe", "Clock"] },
    { images: [{ label: "Dog" }, { label: "Cat" }, { label: "Pineapple" }], options: ["Dog", "Cat", "Pineapple", "Horse", "Mango", "Fish"] },
    { images: [{ label: "Clock" }, { label: "Umbrella" }, { label: "Flower" }], options: ["Clock", "Umbrella", "Flower", "Pen", "Guitar", "Hat"] },
  ],
  digit_span: [
    { sequence: [3, 7, 2, 9] }, { sequence: [5, 1, 8, 4, 6] },
    { sequence: [9, 2, 5] }, { sequence: [4, 8, 1, 6] },
  ],
  stroop_test: [
    { word: "RED", color: "blue", answer: "blue" }, { word: "GREEN", color: "red", answer: "red" },
    { word: "BLUE", color: "yellow", answer: "yellow" }, { word: "YELLOW", color: "green", answer: "green" },
    { word: "PURPLE", color: "red", answer: "red" },
  ],
  task_sequencing: [
    { steps: ["Boil water", "Add tea bag", "Pour water into cup", "Wait 3 minutes"] },
    { steps: ["Write letter", "Put in envelope", "Add stamp", "Mail it"] },
    { steps: ["Wake up", "Brush teeth", "Eat breakfast", "Get dressed"] },
  ],
  sentence_completion: [
    { sentence: "The dog chased the ___ across the yard.", options: ["ball", "cloud", "river", "song"], answer: "ball" },
    { sentence: "It was raining, so I brought my ___.", options: ["umbrella", "guitar", "pillow", "spoon"], answer: "umbrella" },
    { sentence: "She put on her ___ before going outside in winter.", options: ["coat", "sandals", "sunglasses", "swimsuit"], answer: "coat" },
    { sentence: "The bird built a ___ in the tree.", options: ["nest", "road", "bridge", "cake"], answer: "nest" },
    { sentence: "He drank a glass of ___ with breakfast.", options: ["juice", "paint", "glue", "ink"], answer: "juice" },
  ],
  semantic_fluency: [
    { category: "Animals" }, { category: "Fruits" },
    { category: "Furniture" }, { category: "Colors" }, { category: "Countries" },
  ],
  family_recognition: [
    { options: ['Mother', 'Sister', 'Aunt'], answer: 'Mother', memberName: 'Mom' },
    { options: ['Brother', 'Father', 'Uncle'], answer: 'Brother', memberName: 'Sibling' },
    { options: ['Grandmother', 'Neighbor', 'Teacher'], answer: 'Grandmother', memberName: 'Grandma' },
  ],
  phone_recognition: [
    { name: 'Emergency', number: '911' }, { name: 'Doctor', number: '555-0100' },
    { name: 'Pharmacy', number: '555-0234' },
  ],
  object_matching: [
    { target: "Hammer", options: ["Nail", "Screw", "Tape"], answer: "Nail" },
    { target: "Sock", options: ["Shoe", "Hat", "Glove"], answer: "Shoe" },
    { target: "Key", options: ["Lock", "Window", "Chair"], answer: "Lock" },
    { target: "Brush", options: ["Paint", "Water", "Stone"], answer: "Paint" },
  ],
  word_association: [
    { prompt: "What goes best with 'Salt'?", options: ["Pepper", "Sugar", "Water", "Flour"], answer: "Pepper" },
    { prompt: "What goes best with 'Day'?", options: ["Night", "Week", "Time", "Year"], answer: "Night" },
    { prompt: "What goes best with 'Bread'?", options: ["Butter", "Stone", "Paper", "Pencil"], answer: "Butter" },
    { prompt: "What goes best with 'Cup'?", options: ["Saucer", "Fork", "Pillow", "Ladder"], answer: "Saucer" },
    { prompt: "What goes best with 'Lock'?", options: ["Key", "Brush", "Hat", "Ring"], answer: "Key" },
  ],
  story_recall: [
    { story: "Maria went to the market and bought 3 apples and a loaf of bread. She paid with a blue wallet.", question: "What did Maria buy?", options: ["Apples and bread", "Oranges and milk", "Eggs and cheese", "Rice and beans"], answer: "Apples and bread" },
    { story: "John walked his dog in the park every morning at 7 AM. His dog's name was Buddy.", question: "What was the dog's name?", options: ["Buddy", "Max", "Rex", "Charlie"], answer: "Buddy" },
    { story: "Sarah baked a chocolate cake for her daughter's 10th birthday. The party was on Saturday.", question: "When was the party?", options: ["Saturday", "Sunday", "Friday", "Monday"], answer: "Saturday" },
    { story: "Peter took the train to the city. He arrived at noon and went to a bookstore on Main Street.", question: "Where did Peter go?", options: ["A bookstore", "A restaurant", "A museum", "A hospital"], answer: "A bookstore" },
  ],
};

const EMOJI_MAP: Record<string, string> = {
  Apple: '🍎', Chair: '🪑', Book: '📖', Dog: '🐶', Cat: '🐱',
  Pineapple: '🍍', Clock: '🕐', Umbrella: '☂️', Flower: '🌸',
  Lamp: '💡', Shoe: '👟', Horse: '🐴', Mango: '🥭', Fish: '🐟',
  Pen: '🖊️', Guitar: '🎸', Hat: '🎩', Car: '🚗', Tree: '🌳',
  Phone: '📱', Bus: '🚌', Cloud: '☁️', Ring: '💍',
};

// ========================================
// PERSONAL DATA HELPERS
// ========================================
function getUserFamilyPool(): any[] {
  try {
    const raw = localStorage.getItem('neurovia_f2_family');
    if (!raw) return [];
    const members: { name: string; relationship: string; photo?: string }[] = JSON.parse(raw);
    if (members.length < 2) return [];
    return members.map(m => {
      const distractors = members.filter(x => x.name !== m.name).slice(0, 2).map(x => x.relationship);
      const allOpts = [m.relationship, ...distractors].sort(() => Math.random() - 0.5);
      return { image: m.photo || '', options: allOpts, answer: m.relationship, memberName: m.name };
    });
  } catch { return []; }
}

function getUserPhonePool(): any[] {
  try {
    const raw = localStorage.getItem('neurovia_f2_phones');
    if (!raw) return [];
    return JSON.parse(raw).filter((c: any) => c.name && c.number);
  } catch { return []; }
}

function getLocalQuestion(type: string, usedIndices: Set<number>): { question: any; index: number } {
  let pool: any[];
  if (type === 'family_recognition') {
    pool = getUserFamilyPool();
    if (pool.length === 0) pool = LOCAL_LIBRARY.family_recognition;
  } else if (type === 'phone_recognition') {
    pool = getUserPhonePool();
    if (pool.length === 0) pool = LOCAL_LIBRARY.phone_recognition;
  } else {
    pool = LOCAL_LIBRARY[type] || LOCAL_LIBRARY['memory_recall'];
  }
  const available = pool.map((_, i) => i).filter(i => !usedIndices.has(i));
  const pickFrom = available.length > 0 ? available : pool.map((_, i) => i);
  const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  return { question: pool[idx], index: idx };
}

// ========================================
// COUNTDOWN TIMER
// ========================================
const CountdownTimer = ({ seconds, label }: { seconds: number; label: string }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => { if (remaining <= 0) return; const i = setInterval(() => setRemaining(r => r - 1), 1000); return () => clearInterval(i); }, [remaining]);
  const pct = (remaining / seconds) * 100;
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-(--color-sage) uppercase tracking-wider">{label}</span>
        <span className="text-lg font-black text-(--color-navy)">{remaining}s</span>
      </div>
      <div className="w-full h-2.5 bg-(--color-border-light) rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear bg-(--color-sage)" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ========================================
// SUB COMPONENTS
// ========================================

const MemoryRecall = ({ data, onComplete }: { data: any; onComplete: (correct: boolean, detail?: any) => void }) => {
  const [show, setShow] = useState(true);
  const [input, setInput] = useState('');
  const voice = useVoiceInput((text) => setInput(prev => prev ? `${prev}, ${text}` : text));

  useEffect(() => { setShow(true); setInput(''); const t = setTimeout(() => setShow(false), 10000); return () => clearTimeout(t); }, [data]);

  const handleSubmit = () => {
    const entered = input.toLowerCase().split(/[,\s]+/).map(w => w.trim()).filter(Boolean);
    const words: string[] = data.words || [];
    const wordScores = words.map((w: string) => ({ word: w, recalled: entered.includes(w.toLowerCase()) }));
    const correctCount = wordScores.filter((ws: any) => ws.recalled).length;
    onComplete(correctCount >= Math.ceil(words.length / 2), { wordScores, correctCount, totalWords: words.length });
  };

  return show ? (
    <div className="text-center p-10 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light)">
      <CountdownTimer seconds={10} label="Memorize these words" />
      <div className="flex justify-center gap-4 flex-wrap mt-4">
        {data.words?.map((w: string, i: number) => (
          <span key={i} className="text-3xl font-black text-(--color-navy) bg-white px-6 py-3 rounded-2xl border border-(--color-border-light) shadow-sm">{w}</span>
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-(--color-navy)">What words do you remember?</h3>
      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 h-14 px-6 bg-(--color-surface-alt) border border-(--color-border-light) rounded-2xl text-(--color-navy) outline-none focus:border-(--color-sage)" placeholder="Enter words separated by commas..." />
        <MicButton listening={voice.listening} onClick={voice.toggle} />
      </div>
      <button onClick={handleSubmit} className="w-full py-4 bg-(--color-sage) text-white rounded-xl font-bold hover:bg-[#6b8c84] transition-colors">Submit Answer</button>
    </div>
  );
};

const PatternRecognition = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => (
  <div className="space-y-8 text-center">
    <h3 className="text-xl font-bold text-(--color-navy)">What comes next in the sequence?</h3>
    <div className="flex justify-center gap-4 text-4xl font-black tracking-[0.25em]">
      {data.sequence?.map((item: string, idx: number) => <span key={idx}>{item}</span>)}
      <span className="text-(--color-navy)/40">?</span>
    </div>
    <div className="flex justify-center gap-4 flex-wrap">
      {data.options?.map((opt: string) => (
        <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-(--color-surface-alt) border-2 border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all rounded-xl font-bold text-2xl">{opt}</button>
      ))}
    </div>
  </div>
);

const ImageRecall = ({ data, onComplete }: { data: any; onComplete: (correct: boolean, detail?: any) => void }) => {
  const [show, setShow] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const correctLabels = data.images?.map((img: any) => img.label) || [];
  useEffect(() => { setShow(true); setSelected([]); const t = setTimeout(() => setShow(false), 10000); return () => clearTimeout(t); }, [data]);
  const toggleOption = (opt: string) => setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  const handleSubmit = () => {
    const correctCount = selected.filter(s => correctLabels.includes(s)).length;
    const wrongCount = selected.filter(s => !correctLabels.includes(s)).length;
    const score = Math.max(0, correctCount - wrongCount);
    const isCorrect = score >= Math.ceil(correctLabels.length / 2);
    onComplete(isCorrect, {
      wordScores: correctLabels.map((label: string) => ({ word: label, recalled: selected.includes(label) })),
      correctCount: correctCount,
      totalWords: correctLabels.length,
    });
  };

  return show ? (
    <div className="text-center p-10 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light)">
      <CountdownTimer seconds={10} label="Memorize these items" />
      <div className="flex justify-center gap-8 flex-wrap mt-4">
        {data.images?.map((img: any, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-2xl shadow border border-(--color-border-light) flex items-center justify-center"><span className="text-5xl">{EMOJI_MAP[img.label] || '🖼️'}</span></div>
            <span className="mt-3 font-bold text-(--color-navy)">{img.label}</span>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-(--color-navy) text-center">Select the items you saw:</h3>
      <div className="grid grid-cols-3 gap-3">
        {(data.options || []).map((opt: string) => (
          <button key={opt} onClick={() => toggleOption(opt)} className={`p-4 rounded-xl border-2 font-bold text-lg transition-all flex flex-col items-center gap-2 ${selected.includes(opt) ? 'border-(--color-sage) bg-(--color-sage) text-white shadow-lg' : 'border-(--color-border-light) bg-(--color-surface-alt) text-(--color-navy) hover:border-(--color-sage)'}`}>
            <span className="text-3xl">{EMOJI_MAP[opt] || '❓'}</span>{opt}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} className="w-full py-4 bg-(--color-sage) text-white rounded-xl font-bold hover:bg-[#6b8c84] transition-colors">Submit ({selected.length} selected)</button>
    </div>
  );
};

const DigitSpan = ({ data, onComplete }: { data: any; onComplete: (correct: boolean, detail?: any) => void }) => {
  const [show, setShow] = useState(true);
  const [input, setInput] = useState('');
  const voice = useVoiceInput((text) => setInput(prev => prev + text.replace(/\D/g, '')));
  useEffect(() => { setShow(true); setInput(''); const t = setTimeout(() => setShow(false), 10000); return () => clearTimeout(t); }, [data]);
  const handleSubmit = () => {
    const entered = input.replace(/\s/g, '').split('');
    const expected = data.sequence?.map(String) || [];
    const correctDigits = entered.filter((d: string, i: number) => d === expected[i]).length;
    const isExact = entered.join('') === expected.join('');
    onComplete(isExact, {
      wordScores: expected.map((d: string, i: number) => ({ word: d, recalled: entered[i] === d })),
      correctCount: correctDigits,
      totalWords: expected.length,
    });
  };

  return show ? (
    <div className="text-center p-10 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light)">
      <CountdownTimer seconds={10} label="Memorize this sequence" />
      <div className="flex justify-center gap-4 mt-4">
        {data.sequence?.map((d: number, i: number) => (
          <span key={i} className="w-16 h-16 flex items-center justify-center text-3xl font-black text-(--color-navy) bg-white rounded-2xl border-2 border-(--color-border-light) shadow-sm">{d}</span>
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-8 text-center">
      <h3 className="text-xl font-bold text-(--color-navy)">Type the number sequence you saw:</h3>
      <div className="flex gap-3 justify-center">
        <input value={input} onChange={e => setInput(e.target.value)} className="w-full max-w-sm h-14 px-6 bg-(--color-surface-alt) border border-(--color-border-light) rounded-2xl text-(--color-navy) outline-none text-center text-xl tracking-widest focus:border-(--color-sage)" placeholder="Type digits here" />
        <MicButton listening={voice.listening} onClick={voice.toggle} />
      </div>
      <button onClick={handleSubmit} className="w-full max-w-sm mx-auto block py-4 bg-(--color-sage) text-white rounded-xl font-bold hover:bg-[#6b8c84] transition-colors">Verify</button>
    </div>
  );
};

const StroopTest = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => (
  <div className="space-y-8 text-center">
    <h3 className="text-xl font-bold text-(--color-navy)">Identify the INK COLOR, not the word:</h3>
    <div className="my-10"><span className="text-7xl font-black uppercase" style={{ color: data.color }}>{data.word}</span></div>
    <div className="flex justify-center flex-wrap gap-4 max-w-md mx-auto">
      {['red', 'blue', 'green', 'yellow', 'purple'].map(c => (
        <button key={c} onClick={() => onComplete(c === data.answer)} className="px-6 py-3 min-w-[100px] rounded-xl border-2 font-bold capitalize bg-white text-(--color-navy) border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all">{c}</button>
      ))}
    </div>
  </div>
);

const TaskSequencing = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => {
  const [show, setShow] = useState(true);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { setShow(true); setSelected([]); setShuffled(data.steps ? [...data.steps].sort(() => Math.random() - 0.5) : []); const t = setTimeout(() => setShow(false), 10000); return () => clearTimeout(t); }, [data]);
  const selectStep = (step: string) => {
    if (selected.includes(step)) return;
    const ns = [...selected, step]; setSelected(ns);
    if (ns.length === data.steps?.length) setTimeout(() => onComplete(JSON.stringify(ns) === JSON.stringify(data.steps)), 300);
  };

  return show ? (
    <div className="p-10 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light)">
      <CountdownTimer seconds={10} label="Memorize the correct order" />
      <div className="space-y-3 mt-4">
        {data.steps?.map((step: string, idx: number) => (
          <div key={idx} className="p-4 rounded-xl border border-(--color-border-light) bg-white text-center text-lg font-bold text-(--color-navy)"><span className="text-(--color-sage) mr-2">{idx + 1}.</span>{step}</div>
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-(--color-navy) text-center">Tap the steps in the correct order:</h3>
      {selected.length > 0 && <div className="flex gap-2 flex-wrap mb-2">{selected.map((s, i) => <span key={i} className="bg-(--color-sage)/10 text-(--color-sage) px-3 py-1 rounded-full text-sm font-bold">{i + 1}. {s}</span>)}</div>}
      <div className="space-y-3">
        {shuffled.map((step, idx) => (
          <button key={idx} onClick={() => selectStep(step)} disabled={selected.includes(step)} className={`w-full text-left p-4 rounded-xl border transition-colors font-medium ${selected.includes(step) ? 'border-(--color-sage) bg-(--color-sage)/10 text-(--color-sage) opacity-60' : 'border-(--color-border-light) bg-(--color-surface-alt) hover:bg-white hover:border-(--color-sage)'}`}>{step}</button>
        ))}
      </div>
    </div>
  );
};

// Multiple-choice Sentence Completion
const SentenceCompletion = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => (
  <div className="space-y-6 text-center">
    <h3 className="text-xl font-bold text-(--color-navy)">Complete the sentence:</h3>
    <p className="text-2xl text-(--color-navy) my-8 leading-relaxed italic">"{data.sentence}"</p>
    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
      {(data.options || []).map((opt: string) => (
        <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-6 py-5 bg-(--color-surface-alt) border-2 border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all rounded-xl font-bold text-lg capitalize">{opt}</button>
      ))}
    </div>
  </div>
);

const SemanticFluency = ({ data, onComplete }: { data: any; onComplete: (correct: boolean, detail?: any) => void }) => {
  const [input, setInput] = useState('');
  const voice = useVoiceInput((text) => setInput(prev => prev ? `${prev}, ${text}` : text));
  const TARGET_COUNT = 5; // Target items for full score
  const handleSubmit = () => {
    const items = input.split(',').map(w => w.trim()).filter(Boolean);
    const uniqueItems = [...new Set(items.map(i => i.toLowerCase()))];
    const count = uniqueItems.length;
    // Mark correct if at least 1 valid item entered
    const isCorrect = count >= 1;
    onComplete(isCorrect, {
      wordScores: uniqueItems.map(item => ({ word: item, recalled: true })),
      correctCount: Math.min(count, TARGET_COUNT),
      totalWords: TARGET_COUNT,
    });
  };
  return (
    <div className="space-y-6 text-center">
      <h3 className="text-xl font-bold text-(--color-navy)">Name as many items as you can for:</h3>
      <p className="text-3xl font-black text-(--color-sage) uppercase tracking-wide my-6">"{data.category}"</p>
      <p className="text-sm text-(--color-navy)/50">Try to name at least {TARGET_COUNT} items for a perfect score</p>
      <div className="flex gap-3">
        <textarea value={input} onChange={e => setInput(e.target.value)} className="flex-1 h-32 p-4 bg-(--color-surface-alt) border-2 border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) text-(--color-navy)" placeholder="Separate items with commas..." />
        <MicButton listening={voice.listening} onClick={voice.toggle} />
      </div>
      <button onClick={handleSubmit} className="w-full py-4 bg-(--color-sage) text-white rounded-xl font-bold hover:bg-[#6b8c84] transition-colors">Done</button>
    </div>
  );
};

// Family Recognition with user photos
const FamilyRecognition = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => (
  <div className="space-y-8 text-center">
    <h3 className="text-xl font-bold text-(--color-navy)">
      {data.memberName ? `What is ${data.memberName}'s relationship to you?` : 'Who is this family member?'}
    </h3>
    <div className="w-48 h-48 mx-auto bg-(--color-sage)/10 border-2 border-(--color-sage) rounded-[3rem] flex flex-col items-center justify-center shadow-inner overflow-hidden">
      {data.image ? (
        <img src={data.image} alt={data.memberName || 'Family'} className="w-full h-full object-cover" />
      ) : (
        <>
          <span className="text-6xl">👤</span>
          {data.memberName && <span className="text-lg font-bold text-(--color-sage) mt-2">{data.memberName}</span>}
        </>
      )}
    </div>
    <div className="flex justify-center gap-4 pt-4 flex-wrap">
      {data.options?.map((opt: string) => (
        <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-(--color-surface-alt) border-2 border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all rounded-xl font-bold text-lg">{opt}</button>
      ))}
    </div>
  </div>
);

const PhoneRecognition = ({ data, onComplete }: { data: any; onComplete: (correct: boolean, detail?: any) => void }) => {
  const [show, setShow] = useState(true);
  const [input, setInput] = useState('');
  const voice = useVoiceInput((text) => setInput(prev => prev + text.replace(/[^\d-]/g, '')));
  useEffect(() => { setShow(true); setInput(''); const t = setTimeout(() => setShow(false), 10000); return () => clearTimeout(t); }, [data]);

  const handleSubmit = () => {
    // Normalize both to just digits for comparison
    const normalizedInput = input.replace(/[^\d]/g, '');
    const normalizedExpected = (data.number || '').replace(/[^\d]/g, '');
    const isCorrect = normalizedInput === normalizedExpected;
    // Give partial credit for matching digits
    const digits = normalizedExpected.split('');
    const inputDigits = normalizedInput.split('');
    const correctDigits = digits.filter((d: string, i: number) => inputDigits[i] === d).length;
    onComplete(isCorrect, {
      wordScores: digits.map((d: string, i: number) => ({ word: d, recalled: inputDigits[i] === d })),
      correctCount: correctDigits,
      totalWords: digits.length,
    });
  };

  return show ? (
    <div className="text-center p-10 bg-(--color-surface-alt) rounded-2xl border-2 border-(--color-border-light)">
      <CountdownTimer seconds={10} label="Memorize this number" />
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">📱</div>
      <h3 className="text-2xl font-bold text-(--color-navy) mb-4">{data.name}</h3>
      <p className="text-4xl font-black text-(--color-sage) tracking-widest">{data.number}</p>
    </div>
  ) : (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">📱</div>
      <h3 className="text-2xl font-bold text-(--color-navy)">What is the number for: <span className="text-(--color-sage)">{data.name}</span>?</h3>
      <div className="flex gap-3 justify-center">
        <input value={input} onChange={e => setInput(e.target.value)} className="w-full max-w-sm h-16 px-6 bg-(--color-surface-alt) border-2 border-(--color-border-light) rounded-2xl outline-none focus:border-(--color-sage) text-center text-2xl font-bold tracking-widest text-(--color-navy)" placeholder="___-___-____" />
        <MicButton listening={voice.listening} onClick={voice.toggle} />
      </div>
      <button onClick={handleSubmit} className="w-full max-w-sm mx-auto block py-4 bg-(--color-sage) text-white rounded-xl font-bold hover:bg-[#6b8c84] transition-colors">Dial Number</button>
    </div>
  );
};

const ObjectMatching = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => (
  <div className="space-y-8 text-center">
    <h3 className="text-xl font-bold text-(--color-navy)">Match the object to its pair:</h3>
    <p className="text-3xl font-black text-(--color-sage) uppercase tracking-wide my-6">{data.target}</p>
    <div className="flex justify-center gap-4 flex-wrap">
      {data.options?.map((opt: string) => (
        <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-(--color-surface-alt) border-2 border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all rounded-xl font-bold text-lg">{opt}</button>
      ))}
    </div>
  </div>
);

// Multiple-choice Word Association
const WordAssociation = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => (
  <div className="space-y-8 text-center">
    <h3 className="text-2xl font-bold text-(--color-navy)">{data.prompt}</h3>
    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mt-8">
      {data.options?.map((opt: string) => (
        <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-6 py-5 bg-(--color-surface-alt) border-2 border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all rounded-xl font-bold text-lg">{opt}</button>
      ))}
    </div>
  </div>
);

const StoryRecall = ({ data, onComplete }: { data: any; onComplete: (correct: boolean) => void }) => {
  const [show, setShow] = useState(true);
  useEffect(() => { setShow(true); const t = setTimeout(() => setShow(false), 15000); return () => clearTimeout(t); }, [data]);

  return show ? (
    <div className="text-center p-10 bg-(--color-surface-alt) rounded-2xl border border-(--color-border-light)">
      <CountdownTimer seconds={15} label="Read and memorize this story" />
      <p className="text-xl text-(--color-navy) leading-relaxed mt-6 max-w-lg mx-auto">"{data.story}"</p>
    </div>
  ) : (
    <div className="space-y-6 text-center">
      <h3 className="text-xl font-bold text-(--color-navy)">{data.question}</h3>
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mt-6">
        {(data.options || []).map((opt: string) => (
          <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-6 py-5 bg-(--color-surface-alt) border-2 border-(--color-border-light) hover:border-(--color-sage) hover:bg-(--color-sage) hover:text-white transition-all rounded-xl font-bold text-lg">{opt}</button>
        ))}
      </div>
    </div>
  );
};

// ========================================
// RESULTS SCREEN
// ========================================
interface RoundResult { round: number; correct: boolean; wordDetail?: { word: string; recalled: boolean }[]; correctCount?: number; totalWords?: number; }

const ResultsScreen = ({ results, type, onExit }: { results: RoundResult[]; type: string; onExit: () => void }) => {
  const hasWordDetail = results.some(r => r.wordDetail);
  let totalCorrectWords = 0, totalAllWords = 0;
  if (hasWordDetail) { results.forEach(r => { totalCorrectWords += r.correctCount || 0; totalAllWords += r.totalWords || 0; }); }
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const pct = hasWordDetail && totalAllWords > 0 ? Math.round((totalCorrectWords / totalAllWords) * 100) : Math.round((correct / total) * 100);
  const IconComp = pct >= 80 ? Trophy : pct >= 50 ? ThumbsUp : Dumbbell;
  const message = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!';

  return (
    <div className="text-center py-4 fade-in">
      <IconComp size={64} className={`mx-auto mb-4 ${pct >= 80 ? 'text-yellow-500' : pct >= 50 ? 'text-(--color-sage)' : 'text-orange-400'}`} />
      <h2 className="text-3xl font-bold text-(--color-navy) mb-2">{message}</h2>
      <p className="text-(--color-navy)/60 mb-8 capitalize text-lg">{type.split('_').join(' ')} — Complete</p>
      <div className="flex justify-center gap-8 mb-8">
        {hasWordDetail ? (
          <div className="bg-(--color-sage)/10 rounded-2xl p-6 min-w-[120px]"><p className="text-4xl font-black text-(--color-sage)">{totalCorrectWords}/{totalAllWords}</p><p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Words Recalled</p></div>
        ) : (
          <div className="bg-(--color-sage)/10 rounded-2xl p-6 min-w-[120px]"><p className="text-4xl font-black text-(--color-sage)">{correct}/{total}</p><p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Correct</p></div>
        )}
        <div className="bg-(--color-surface-alt) rounded-2xl p-6 min-w-[120px]"><p className="text-4xl font-black text-(--color-navy)">{pct}%</p><p className="text-sm font-bold text-(--color-navy)/50 mt-1 uppercase">Score</p></div>
      </div>
      <div className="space-y-2 mb-8 max-w-md mx-auto">
        {results.map((r, i) => (
          <div key={i}>
            <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${r.correct ? 'bg-(--color-sage)/10 text-(--color-sage)' : 'bg-red-50 text-red-500'}`}>
              <span>Round {r.round}</span>
              <span>{r.correctCount !== undefined ? `${r.correctCount}/${r.totalWords} words` : (r.correct ? '✅ Correct' : '❌ Incorrect')}</span>
            </div>
            {r.wordDetail && (
              <div className="flex flex-wrap gap-2 mt-2 mb-3 justify-center">
                {r.wordDetail.map((wd, j) => (
                  <span key={j} className={`px-3 py-1 rounded-full text-xs font-bold ${wd.recalled ? 'bg-(--color-sage)/10 text-(--color-sage) border border-(--color-sage)/30' : 'bg-red-50 text-red-400 border border-red-200 line-through'}`}>{wd.recalled ? '✓' : '✗'} {wd.word}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={onExit} className="w-full max-w-sm mx-auto py-4 bg-(--color-sage) text-white rounded-xl font-bold text-lg hover:bg-[#6b8c84] transition-colors">Back to Activities</button>
    </div>
  );
};

// ========================================
// PERSONAL DATA SETUP PANEL (exported)
// ========================================
export const PersonalDataSetup = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<{ name: string; relationship: string; photo?: string }[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<{ name: string; number: string }[]>([]);
  const [newFamily, setNewFamily] = useState({ name: '', relationship: '' });
  const [newPhone, setNewPhone] = useState({ name: '', number: '' });

  useEffect(() => {
    try { const f = localStorage.getItem('neurovia_f2_family'); if (f) setFamilyMembers(JSON.parse(f)); } catch {}
    try { const p = localStorage.getItem('neurovia_f2_phones'); if (p) setPhoneContacts(JSON.parse(p)); } catch {}
  }, []);

  const addFamily = () => {
    if (!newFamily.name.trim() || !newFamily.relationship.trim()) return;
    const updated = [...familyMembers, { name: newFamily.name.trim(), relationship: newFamily.relationship.trim() }];
    setFamilyMembers(updated);
    localStorage.setItem('neurovia_f2_family', JSON.stringify(updated));
    setNewFamily({ name: '', relationship: '' });
  };

  const handlePhotoUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...familyMembers];
      updated[idx].photo = reader.result as string;
      setFamilyMembers(updated);
      localStorage.setItem('neurovia_f2_family', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const removeFamily = (idx: number) => {
    const updated = familyMembers.filter((_, i) => i !== idx);
    setFamilyMembers(updated);
    localStorage.setItem('neurovia_f2_family', JSON.stringify(updated));
  };

  const addPhone = () => {
    if (!newPhone.name.trim() || !newPhone.number.trim()) return;
    const updated = [...phoneContacts, { name: newPhone.name.trim(), number: newPhone.number.trim() }];
    setPhoneContacts(updated);
    localStorage.setItem('neurovia_f2_phones', JSON.stringify(updated));
    setNewPhone({ name: '', number: '' });
  };

  const removePhone = (idx: number) => {
    const updated = phoneContacts.filter((_, i) => i !== idx);
    setPhoneContacts(updated);
    localStorage.setItem('neurovia_f2_phones', JSON.stringify(updated));
  };

  return (
    <div className="bg-[#f5f0e8] rounded-3xl shadow-sm border border-(--color-border-light) overflow-hidden">
      <button onClick={() => setShowPanel(!showPanel)} className="w-full flex items-center justify-between p-6 hover:bg-(--color-surface-alt) transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm"><Users className="w-5 h-5 text-white" /></div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-(--color-navy)">Personal Details</h3>
            <p className="text-sm text-(--color-navy)/50">Add family photos & phone numbers for personalized exercises</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-(--color-navy)/40 transition-transform ${showPanel ? 'rotate-180' : ''}`} />
      </button>

      {showPanel && (
        <div className="p-6 pt-0 border-t border-(--color-border-light)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Family Members */}
            <div>
              <h4 className="text-base font-bold text-(--color-navy) mb-4 flex items-center gap-2"><span className="text-xl">👨‍👩‍👧‍👦</span> Family Members</h4>
              <div className="space-y-3 mb-4">
                {familyMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-(--color-surface-alt) rounded-xl border border-(--color-border-light)">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover border-2 border-(--color-sage)" />
                    ) : (
                      <label className="w-12 h-12 rounded-full bg-(--color-sage)/10 flex items-center justify-center cursor-pointer hover:bg-(--color-sage)/20 transition-colors border-2 border-dashed border-(--color-sage)/30" title="Upload photo">
                        <span className="text-xl">📷</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(i, e)} />
                      </label>
                    )}
                    <div className="flex-1">
                      <span className="font-bold text-(--color-navy)">{m.name}</span>
                      <span className="text-(--color-navy)/50 ml-2">— {m.relationship}</span>
                    </div>
                    <button onClick={() => removeFamily(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {familyMembers.length === 0 && <p className="text-sm text-(--color-navy)/40 italic p-3">No family members added yet. Add at least 2 for the Family Recognition exercise.</p>}
              </div>
              <div className="flex gap-2">
                <input value={newFamily.name} onChange={e => setNewFamily({ ...newFamily, name: e.target.value })} className="flex-1 h-10 px-3 bg-(--color-surface-alt) border border-(--color-border-light) rounded-lg text-sm outline-none focus:border-(--color-sage)" placeholder="Name (e.g. Sarah)" />
                <input value={newFamily.relationship} onChange={e => setNewFamily({ ...newFamily, relationship: e.target.value })} className="flex-1 h-10 px-3 bg-(--color-surface-alt) border border-(--color-border-light) rounded-lg text-sm outline-none focus:border-(--color-sage)" placeholder="Relationship (e.g. Daughter)" />
                <button onClick={addFamily} className="h-10 px-4 bg-(--color-sage) text-white rounded-lg font-bold text-sm hover:bg-[#6b8c84] transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
            </div>

            {/* Phone Contacts */}
            <div>
              <h4 className="text-base font-bold text-(--color-navy) mb-4 flex items-center gap-2"><span className="text-xl">📱</span> Important Phone Numbers</h4>
              <div className="space-y-3 mb-4">
                {phoneContacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-(--color-surface-alt) rounded-xl border border-(--color-border-light)">
                    <div>
                      <span className="font-bold text-(--color-navy)">{c.name}</span>
                      <span className="text-(--color-sage) ml-2 font-mono">{c.number}</span>
                    </div>
                    <button onClick={() => removePhone(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {phoneContacts.length === 0 && <p className="text-sm text-(--color-navy)/40 italic p-3">No contacts added yet. Add numbers for the Phone Recognition exercise.</p>}
              </div>
              <div className="flex gap-2">
                <input value={newPhone.name} onChange={e => setNewPhone({ ...newPhone, name: e.target.value })} className="flex-1 h-10 px-3 bg-(--color-surface-alt) border border-(--color-border-light) rounded-lg text-sm outline-none focus:border-(--color-sage)" placeholder="Name (e.g. Daughter)" />
                <input value={newPhone.number} onChange={e => setNewPhone({ ...newPhone, number: e.target.value })} className="flex-1 h-10 px-3 bg-(--color-surface-alt) border border-(--color-border-light) rounded-lg text-sm outline-none focus:border-(--color-sage)" placeholder="Number (e.g. 555-0199)" />
                <button onClick={addPhone} className="h-10 px-4 bg-(--color-sage) text-white rounded-lg font-bold text-sm hover:bg-[#6b8c84] transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// MAIN ACTIVITY PLAYER — 3 ROUNDS ENGINE
// ========================================
interface ActivityPlayerProps { activityType: string; onComplete: (score: number) => void; onExit: () => void; }

const ActivityPlayer: React.FC<ActivityPlayerProps> = ({ activityType, onComplete, onExit }) => {
  const [questionData, setQuestionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [finished, setFinished] = useState(false);
  const usedIndicesRef = useRef<Set<number>>(new Set());
  const totalRounds = 3;

  useEffect(() => { usedIndicesRef.current = new Set(); setRound(1); setResults([]); setFinished(false); loadQuestion(); }, [activityType]);

  const loadQuestion = () => {
    setLoading(true);
    const { question, index } = getLocalQuestion(activityType, usedIndicesRef.current);
    usedIndicesRef.current.add(index);
    setQuestionData(question);
    setLoading(false);
  };

  const finishActivity = (allResults: RoundResult[]) => {
    const hasWordDetail = allResults.some(r => r.wordDetail);
    let finalScore: number;
    if (hasWordDetail) {
      let tw = 0, ta = 0; allResults.forEach(r => { tw += r.correctCount || 0; ta += r.totalWords || 0; });
      finalScore = ta > 0 ? Math.round((tw / ta) * 100) : 0;
    } else { finalScore = Math.round((allResults.filter(r => r.correct).length / totalRounds) * 100); }
    const today = new Date().toLocaleDateString();
    const existing = JSON.parse(localStorage.getItem("activity_progress_f2") || "[]");
    existing.push({ date: today, score: finalScore, type: activityType.split('_').join(' ') });
    localStorage.setItem("activity_progress_f2", JSON.stringify(existing));
    onComplete(finalScore);
    setFinished(true);
  };

  const handleNext = (correct: boolean, detail?: any) => {
    const rr: RoundResult = {
      round,
      correct,
      wordDetail: detail?.wordScores,
      correctCount: detail?.correctCount,
      totalWords: detail?.totalWords,
    };
    const nr = [...results, rr];
    setResults(nr);
    if (round < totalRounds) {
      setRound(p => p + 1);
      loadQuestion();
    } else {
      finishActivity(nr);
    }
  };

  if (finished) return <ResultsScreen results={results} type={activityType} onExit={onExit} />;

  if (loading || !questionData) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 border-4 border-(--color-sage) border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-(--color-navy)/60 font-bold">Generating unique exercise...</p>
    </div>
  );

  const renderActivity = () => {
    const t = activityType;
    if (t === 'memory_recall') return <MemoryRecall data={questionData} onComplete={handleNext} />;
    if (t === 'pattern_recognition') return <PatternRecognition data={questionData} onComplete={handleNext} />;
    if (t === 'image_recall') return <ImageRecall data={questionData} onComplete={handleNext} />;
    if (t === 'digit_span') return <DigitSpan data={questionData} onComplete={handleNext} />;
    if (t === 'stroop_test') return <StroopTest data={questionData} onComplete={handleNext} />;
    if (t === 'task_sequencing') return <TaskSequencing data={questionData} onComplete={handleNext} />;
    if (t === 'sentence_completion') return <SentenceCompletion data={questionData} onComplete={handleNext} />;
    if (t === 'semantic_fluency') return <SemanticFluency data={questionData} onComplete={handleNext} />;
    if (t === 'family_recognition') return <FamilyRecognition data={questionData} onComplete={handleNext} />;
    if (t === 'phone_recognition') return <PhoneRecognition data={questionData} onComplete={handleNext} />;
    if (t === 'object_matching') return <ObjectMatching data={questionData} onComplete={handleNext} />;
    if (t === 'word_association') return <WordAssociation data={questionData} onComplete={handleNext} />;
    if (t === 'story_recall') return <StoryRecall data={questionData} onComplete={handleNext} />;
    return <PatternRecognition data={questionData} onComplete={handleNext} />;
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-(--color-border-light)">
        <div className="flex items-center gap-3">
          <BrainCircuit size={24} className="text-(--color-sage)" />
          <span className="text-lg font-bold text-(--color-navy) capitalize">{activityType.split('_').join(' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < round - 1 ? (results[i]?.correct ? 'bg-(--color-sage) text-white border-(--color-sage)' : 'bg-red-400 text-white border-red-400')
              : i === round - 1 ? 'bg-(--color-navy) text-white border-(--color-navy) scale-110'
              : 'bg-(--color-surface-alt) text-(--color-navy)/40 border-(--color-border-light)'
            }`}>{i + 1}</div>
          ))}
        </div>
      </div>
      {renderActivity()}
    </div>
  );
};

export default ActivityPlayer;
