import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';

// ========================================
// LOCAL FALLBACK LIBRARY
// ========================================

const LOCAL_LIBRARY: Record<string, any[]> = {
    memory_recall: [
        { words: ["Apple", "River", "Cloud"] },
        { words: ["Chair", "Window", "Table"] },
        { words: ["Sun", "Moon", "Stars"] },
        { words: ["Garden", "Bicycle", "Ocean"] },
        { words: ["Candle", "Mountain", "Piano"] },
        { words: ["Elephant", "Library", "Sunset"] },
    ],
    image_recall: [
        { images: [
            { label: "Apple" }, { label: "Chair" }, { label: "Book" }
        ], options: ["Apple", "Chair", "Book", "Lamp", "Shoe", "Clock"] },
        { images: [
            { label: "Dog" }, { label: "Cat" }, { label: "Pineapple" }
        ], options: ["Dog", "Cat", "Pineapple", "Horse", "Mango", "Fish"] },
        { images: [
            { label: "Clock" }, { label: "Umbrella" }, { label: "Flower" }
        ], options: ["Clock", "Umbrella", "Flower", "Pen", "Guitar", "Hat"] },
        { images: [
            { label: "Car" }, { label: "Tree" }, { label: "Phone" }
        ], options: ["Car", "Tree", "Phone", "Bus", "Cloud", "Ring"] },
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
    digit_span: [
        { sequence: [3, 7, 2, 9] },
        { sequence: [5, 1, 8, 4, 6] },
        { sequence: [9, 2, 5] },
        { sequence: [4, 8, 1, 6] },
        { sequence: [7, 3, 9, 2, 5] },
    ],
    stroop_test: [
        { word: "RED", color: "blue", answer: "blue" },
        { word: "GREEN", color: "red", answer: "red" },
        { word: "BLUE", color: "yellow", answer: "yellow" },
        { word: "YELLOW", color: "green", answer: "green" },
        { word: "PURPLE", color: "red", answer: "red" },
    ],
    task_sequencing: [
        { steps: ["Boil water", "Add tea bag", "Pour water into cup", "Wait 3 minutes"] },
        { steps: ["Write letter", "Put in envelope", "Add stamp", "Mail it"] },
        { steps: ["Wake up", "Brush teeth", "Eat breakfast", "Get dressed"] },
        { steps: ["Pick up phone", "Dial number", "Wait for answer", "Say hello"] },
    ],
    sentence_completion: [
        { sentence: "The dog chased the ___ across the yard.", options: ["ball", "cloud", "river", "song"], answer: "ball" },
        { sentence: "It was raining, so I brought my ___.", options: ["umbrella", "guitar", "pillow", "spoon"], answer: "umbrella" },
        { sentence: "She put on her ___ before going outside in winter.", options: ["coat", "sandals", "sunglasses", "swimsuit"], answer: "coat" },
        { sentence: "The bird built a ___ in the tree.", options: ["nest", "road", "bridge", "cake"], answer: "nest" },
        { sentence: "He drank a glass of ___ with breakfast.", options: ["juice", "paint", "glue", "ink"], answer: "juice" },
    ],
    semantic_fluency: [
        { category: "Animals" },
        { category: "Fruits" },
        { category: "Furniture" },
        { category: "Colors" },
        { category: "Countries" },
    ],
    family_recognition: [],
    phone_recognition: [],
    object_matching: [
        { target: "Hammer", options: ["Nail", "Screw", "Tape"], answer: "Nail" },
        { target: "Sock", options: ["Shoe", "Hat", "Glove"], answer: "Shoe" },
        { target: "Key", options: ["Lock", "Window", "Chair"], answer: "Lock" },
        { target: "Brush", options: ["Paint", "Water", "Stone"], answer: "Paint" },
    ],
    word_association: [
        { prompt: "What goes best with 'Salt'?", options: ["Pepper", "Sugar", "Water"], answer: "Pepper" },
        { prompt: "What goes best with 'Day'?", options: ["Night", "Week", "Time"], answer: "Night" },
        { prompt: "What goes best with 'Bread'?", options: ["Butter", "Stone", "Paper"], answer: "Butter" },
        { prompt: "What goes best with 'Cup'?", options: ["Saucer", "Fork", "Pillow"], answer: "Saucer" },
    ],
    story_recall: [
        { story: "Maria went to the market and bought 3 apples and a loaf of bread. She paid with a blue wallet.", question: "What did Maria buy?", options: ["Apples and bread", "Oranges and milk", "Eggs and cheese", "Rice and beans"], answer: "Apples and bread" },
        { story: "John walked his dog in the park every morning at 7 AM. His dog's name was Buddy.", question: "What was the dog's name?", options: ["Buddy", "Max", "Rex", "Charlie"], answer: "Buddy" },
        { story: "Sarah baked a chocolate cake for her daughter's 10th birthday. The party was on Saturday.", question: "When was the party?", options: ["Saturday", "Sunday", "Friday", "Monday"], answer: "Saturday" },
        { story: "Peter took the train to the city. He arrived at noon and went to a bookstore on Main Street.", question: "Where did Peter go?", options: ["A bookstore", "A restaurant", "A museum", "A hospital"], answer: "A bookstore" },
    ],
};

// Build dynamic pools for family/phone from user's saved data
function getUserFamilyPool(): any[] {
    try {
        const raw = localStorage.getItem('neurovia_family_members');
        if (!raw) return [];
        const members: { name: string, relationship: string }[] = JSON.parse(raw);
        if (members.length < 2) return [];
        return members.map(m => {
            const distractors = members.filter(x => x.name !== m.name).slice(0, 2).map(x => x.relationship);
            const allOpts = [m.relationship, ...distractors].sort(() => Math.random() - 0.5);
            return { image: '', options: allOpts, answer: m.relationship, memberName: m.name };
        });
    } catch { return []; }
}

function getUserPhonePool(): any[] {
    try {
        const raw = localStorage.getItem('neurovia_phone_contacts');
        if (!raw) return [];
        const contacts: { name: string, number: string }[] = JSON.parse(raw);
        return contacts.filter(c => c.name && c.number);
    } catch { return []; }
}

function getLocalQuestion(type: string, usedIndices: Set<number>): { question: any, index: number } {
    let pool: any[];

    if (type === 'family_recognition') {
        pool = getUserFamilyPool();
        if (pool.length === 0) pool = [
            { image: '', options: ['Mother', 'Sister', 'Aunt'], answer: 'Mother', memberName: 'Mom' },
            { image: '', options: ['Brother', 'Father', 'Uncle'], answer: 'Brother', memberName: 'Sibling' },
            { image: '', options: ['Grandmother', 'Neighbor', 'Teacher'], answer: 'Grandmother', memberName: 'Grandma' },
        ];
    } else if (type === 'phone_recognition') {
        pool = getUserPhonePool();
        if (pool.length === 0) pool = [
            { name: 'Emergency', number: '911' },
            { name: 'Doctor', number: '555-0100' },
            { name: 'Pharmacy', number: '555-0234' },
        ];
    } else {
        pool = LOCAL_LIBRARY[type] || LOCAL_LIBRARY['memory_recall'];
    }

    // Find unused indices
    const available = pool.map((_, i) => i).filter(i => !usedIndices.has(i));
    // If all used, reset pool
    const pickFrom = available.length > 0 ? available : pool.map((_, i) => i);
    const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    return { question: pool[idx], index: idx };
}

// ========================================
// EMOJI MAP for Image Recall
// ========================================
const EMOJI_MAP: Record<string, string> = {
    Apple: '🍎', Chair: '🪑', Book: '📖', Dog: '🐶', Cat: '🐱',
    Pineapple: '🍍', Clock: '🕐', Umbrella: '☂️', Flower: '🌸',
    Lamp: '💡', Shoe: '👟', Horse: '🐴', Mango: '🥭', Fish: '🐟',
    Pen: '🖊️', Guitar: '🎸', Hat: '🎩', Car: '🚗', Tree: '🌳',
    Phone: '📱', Bus: '🚌', Cloud: '☁️', Ring: '💍',
};

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
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            setListening(false);
        };
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
const MicButton = ({ listening, onClick }: { listening: boolean, onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
            listening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                : 'bg-[#F7FBFF] border border-[#DCE5ED] text-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white'
        }`}
        title={listening ? "Stop listening" : "Use voice input"}
    >
        {listening ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        )}
    </button>
);

// ========================================
// COUNTDOWN TIMER
// ========================================
const CountdownTimer = ({ seconds, label }: { seconds: number, label: string }) => {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (remaining <= 0) return;
        const interval = setInterval(() => setRemaining(r => r - 1), 1000);
        return () => clearInterval(interval);
    }, [remaining]);

    const pct = (remaining / seconds) * 100;
    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#1A6FA8] uppercase tracking-wider">{label}</span>
                <span className="text-lg font-black text-[#28A98C]">{remaining}s</span>
            </div>
            <div className="w-full h-2.5 bg-[#DCE5ED] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${pct}%`, background: pct > 30 ? 'linear-gradient(90deg, #28A98C, #1A6FA8)' : '#ef4444' }}
                />
            </div>
        </div>
    );
};

// ========================================
// SUB COMPONENTS
// ========================================

const MemoryRecall = ({ data, onComplete }: { data: any, onComplete: (correct: boolean, detail?: { wordScores: { word: string, recalled: boolean }[], correctCount: number, totalWords: number }) => void }) => {
    const [show, setShow] = useState(true);
    const [input, setInput] = useState('');
    const voice = useVoiceInput((text) => setInput(prev => prev ? `${prev}, ${text}` : text));

    useEffect(() => {
        setShow(true);
        setInput('');
        const timer = setTimeout(() => setShow(false), 10000);
        return () => clearTimeout(timer);
    }, [data]);

    const handleSubmit = () => {
        const entered = input.toLowerCase().split(/[,\s]+/).map(w => w.trim()).filter(Boolean);
        const words: string[] = data.words || [];
        const wordScores = words.map((w: string) => ({
            word: w,
            recalled: entered.includes(w.toLowerCase()),
        }));
        const correctCount = wordScores.filter(ws => ws.recalled).length;
        onComplete(correctCount >= Math.ceil(words.length / 2), { wordScores, correctCount, totalWords: words.length });
    };

    return show ? (
        <div className="text-center p-10 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED]">
            <CountdownTimer seconds={10} label="Memorize these words" />
            <div className="flex justify-center gap-4 flex-wrap mt-4">
                {data.words?.map((w: string, i: number) => (
                    <span key={i} className="text-3xl font-black text-[#1A6FA8] bg-white px-6 py-3 rounded-2xl border border-[#DCE5ED] shadow-sm">{w}</span>
                ))}
            </div>
        </div>
    ) : (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#0D2B45]">What words do you remember?</h3>
            <div className="flex gap-3">
                <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 h-14 px-6 bg-[#F7FBFF] border border-[#DCE5ED] rounded-2xl text-[#0D2B45] outline-none focus:border-[#1A6FA8]" placeholder="Enter words separated by commas..." />
                <MicButton listening={voice.listening} onClick={voice.toggle} />
            </div>
            <button onClick={handleSubmit} className="w-full py-4 bg-[#1A6FA8] text-white rounded-xl font-bold hover:bg-[#155a8a] transition-colors">Submit Answer</button>
        </div>
    );
};

const ImageRecall = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => {
    const [show, setShow] = useState(true);
    const [selected, setSelected] = useState<string[]>([]);
    const correctLabels = data.images?.map((img: any) => img.label) || [];

    useEffect(() => {
        setShow(true);
        setSelected([]);
        const timer = setTimeout(() => setShow(false), 10000);
        return () => clearTimeout(timer);
    }, [data]);

    const toggleOption = (opt: string) => {
        setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
    };

    const handleSubmit = () => {
        const correctCount = selected.filter(s => correctLabels.includes(s)).length;
        onComplete(correctCount >= Math.ceil(correctLabels.length / 2));
    };

    return show ? (
        <div className="text-center p-10 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED]">
            <CountdownTimer seconds={10} label="Memorize these items" />
            <div className="flex justify-center gap-8 flex-wrap mt-4">
                {data.images?.map((img: any, i: number) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="w-28 h-28 bg-white rounded-2xl shadow border border-[#DCE5ED] flex items-center justify-center">
                            <span className="text-5xl">{EMOJI_MAP[img.label] || '🖼️'}</span>
                        </div>
                        <span className="mt-3 font-bold text-[#1A6FA8]">{img.label}</span>
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#0D2B45] text-center">Select the items you saw:</h3>
            <div className="grid grid-cols-3 gap-3">
                {(data.options || []).map((opt: string) => (
                    <button key={opt} onClick={() => toggleOption(opt)}
                        className={`p-4 rounded-xl border-2 font-bold text-lg transition-all flex flex-col items-center gap-2 ${
                            selected.includes(opt)
                                ? 'border-[#1A6FA8] bg-[#1A6FA8] text-white shadow-lg'
                                : 'border-[#DCE5ED] bg-[#F7FBFF] text-[#0D2B45] hover:border-[#1A6FA8]'
                        }`}>
                        <span className="text-3xl">{EMOJI_MAP[opt] || '❓'}</span>
                        {opt}
                    </button>
                ))}
            </div>
            <button onClick={handleSubmit} className="w-full py-4 bg-[#1A6FA8] text-white rounded-xl font-bold hover:bg-[#155a8a] transition-colors">
                Submit ({selected.length} selected)
            </button>
        </div>
    );
};

const PatternRecognition = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => (
    <div className="space-y-8 text-center">
        <h3 className="text-xl font-bold text-[#0D2B45]">What comes next in the sequence?</h3>
        <div className="flex justify-center gap-4 text-4xl font-black text-[#1A6FA8] tracking-[0.25em]">
            {data.sequence?.map((item: string, idx: number) => <span key={idx}>{item}</span>)}
            <span className="text-[#7AA3BE]">?</span>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
            {data.options?.map((opt: string) => (
                <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-[#F7FBFF] border-2 border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all rounded-xl font-bold text-2xl">
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const DigitSpan = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => {
    const [show, setShow] = useState(true);
    const [input, setInput] = useState('');
    const voice = useVoiceInput((text) => setInput(prev => prev + text.replace(/\D/g, '')));

    useEffect(() => {
        setShow(true);
        setInput('');
        const timer = setTimeout(() => setShow(false), 10000);
        return () => clearTimeout(timer);
    }, [data]);

    const handleSubmit = () => {
        const entered = input.replace(/\s/g, '');
        const correct = data.sequence?.join('') || '';
        onComplete(entered === correct);
    };

    return show ? (
        <div className="text-center p-10 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED]">
            <CountdownTimer seconds={10} label="Memorize this sequence" />
            <div className="flex justify-center gap-4 mt-4">
                {data.sequence?.map((d: number, i: number) => (
                    <span key={i} className="w-16 h-16 flex items-center justify-center text-3xl font-black text-[#1A6FA8] bg-white rounded-2xl border-2 border-[#DCE5ED] shadow-sm">{d}</span>
                ))}
            </div>
        </div>
    ) : (
        <div className="space-y-8 text-center">
            <h3 className="text-xl font-bold text-[#0D2B45]">Type the number sequence you saw:</h3>
            <div className="flex gap-3 justify-center">
                <input value={input} onChange={e => setInput(e.target.value)} className="w-full max-w-sm h-14 px-6 bg-[#F7FBFF] border border-[#DCE5ED] rounded-2xl text-[#0D2B45] outline-none text-center text-xl tracking-widest focus:border-[#1A6FA8]" placeholder="Type digits here" />
                <MicButton listening={voice.listening} onClick={voice.toggle} />
            </div>
            <button onClick={handleSubmit} className="w-full max-w-sm mx-auto block py-4 bg-[#1A6FA8] text-white rounded-xl font-bold hover:bg-[#155a8a] transition-colors">Verify</button>
        </div>
    );
};

const StroopTest = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => (
    <div className="space-y-8 text-center">
        <h3 className="text-xl font-bold text-[#0D2B45] mb-2">Identify the INK COLOR, not the word:</h3>
        <div className="my-10">
            <span className="text-7xl font-black uppercase" style={{ color: data.color }}>{data.word}</span>
        </div>
        <div className="flex justify-center flex-wrap gap-4 max-w-md mx-auto">
            {['red', 'blue', 'green', 'yellow', 'black', 'purple'].map(c => (
                <button key={c} onClick={() => onComplete(c === data.answer)} className="px-6 py-3 min-w-[100px] rounded-xl border-2 font-bold capitalize bg-white text-[#0D2B45] border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all">
                    {c}
                </button>
            ))}
        </div>
    </div>
);

const TaskSequencing = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => {
    const [show, setShow] = useState(true);
    const [shuffled, setShuffled] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        setShow(true);
        setSelected([]);
        setShuffled(data.steps ? [...data.steps].sort(() => Math.random() - 0.5) : []);
        const timer = setTimeout(() => setShow(false), 10000);
        return () => clearTimeout(timer);
    }, [data]);

    const selectStep = (step: string) => {
        if (selected.includes(step)) return;
        const newSelected = [...selected, step];
        setSelected(newSelected);
        if (newSelected.length === data.steps?.length) {
            const isCorrect = JSON.stringify(newSelected) === JSON.stringify(data.steps);
            setTimeout(() => onComplete(isCorrect), 300);
        }
    };

    return show ? (
        <div className="p-10 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED]">
            <CountdownTimer seconds={10} label="Memorize the correct order" />
            <div className="space-y-3 mt-4">
                {data.steps?.map((step: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-[#DCE5ED] bg-white text-center text-lg font-bold text-[#0D2B45]">
                        <span className="text-[#28A98C] mr-2">{idx + 1}.</span>{step}
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#0D2B45] text-center">Click the steps in the correct order:</h3>
            {selected.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                    {selected.map((s, i) => (
                        <span key={i} className="bg-[#EAF7F4] text-[#28A98C] px-3 py-1 rounded-full text-sm font-bold">{i + 1}. {s}</span>
                    ))}
                </div>
            )}
            <div className="space-y-3">
                {shuffled.map((step: string, idx: number) => (
                    <button key={idx} onClick={() => selectStep(step)} disabled={selected.includes(step)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors font-medium ${
                            selected.includes(step) ? 'border-[#28A98C] bg-[#EAF7F4] text-[#28A98C] opacity-60' : 'border-[#DCE5ED] bg-[#F7FBFF] hover:bg-white hover:border-[#1A6FA8]'
                        }`}>
                        {step}
                    </button>
                ))}
            </div>
        </div>
    );
};

const SentenceCompletion = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => (
    <div className="space-y-6 text-center">
        <h3 className="text-xl font-bold text-[#0D2B45]">Complete the sentence:</h3>
        <p className="text-2xl font-serif text-[#1A6FA8] my-8 leading-relaxed">{data.sentence}</p>
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {(data.options || []).map((opt: string) => (
                <button key={opt} onClick={() => onComplete(opt === data.answer)}
                    className="px-6 py-4 bg-[#F7FBFF] border-2 border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all rounded-xl font-bold text-lg capitalize">
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const SemanticFluency = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => {
    const [input, setInput] = useState('');
    const voice = useVoiceInput((text) => setInput(prev => prev ? `${prev}, ${text}` : text));

    const handleSubmit = () => {
        const count = input.split(',').map(w => w.trim()).filter(Boolean).length;
        onComplete(count >= 3);
    };

    return (
        <div className="space-y-6 text-center">
            <h3 className="text-xl font-bold text-[#0D2B45]">Name as many items as you can for:</h3>
            <p className="text-3xl font-black text-[#1A6FA8] uppercase tracking-wide my-6">"{data.category}"</p>
            <div className="flex gap-3">
                <textarea value={input} onChange={e => setInput(e.target.value)} className="flex-1 h-32 p-4 bg-[#F7FBFF] border border-[#DCE5ED] rounded-2xl outline-none focus:border-[#1A6FA8]" placeholder="Separate items with commas..." />
                <MicButton listening={voice.listening} onClick={voice.toggle} />
            </div>
            <button onClick={handleSubmit} className="w-full py-4 bg-[#1A6FA8] text-white rounded-xl font-bold hover:bg-[#155a8a] transition-colors">Done</button>
        </div>
    );
};

const FamilyRecognition = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => (
    <div className="space-y-8 text-center">
        <h3 className="text-xl font-bold text-[#0D2B45]">
            {data.memberName ? `What is ${data.memberName}'s relationship to you?` : 'Who is this family member?'}
        </h3>
        <div className="w-48 h-48 mx-auto bg-[#EAF7F4] border-2 border-[#28A98C] rounded-[3rem] flex flex-col items-center justify-center shadow-inner">
            <span className="text-6xl">👤</span>
            {data.memberName && <span className="text-lg font-bold text-[#28A98C] mt-2">{data.memberName}</span>}
        </div>
        <div className="flex justify-center gap-4 pt-4 flex-wrap">
            {data.options?.map((opt: string) => (
                <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-[#F7FBFF] border-2 border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all rounded-xl font-bold text-lg">
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const PhoneRecognition = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => {
    const [show, setShow] = useState(true);
    const [input, setInput] = useState('');
    const voice = useVoiceInput((text) => setInput(prev => prev + text.replace(/[^\d-]/g, '')));

    useEffect(() => {
        setShow(true);
        setInput('');
        const timer = setTimeout(() => setShow(false), 10000);
        return () => clearTimeout(timer);
    }, [data]);

    return show ? (
        <div className="text-center p-10 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED]">
            <CountdownTimer seconds={10} label="Memorize this number" />
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">📱</div>
            <h3 className="text-2xl font-bold text-[#0D2B45] mb-4">{data.name}</h3>
            <p className="text-4xl font-black text-[#1A6FA8] tracking-widest">{data.number}</p>
        </div>
    ) : (
        <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">📱</div>
            <h3 className="text-2xl font-bold text-[#0D2B45]">What is the number for: <span className="text-[#1A6FA8]">{data.name}</span>?</h3>
            <div className="flex gap-3 justify-center">
                <input value={input} onChange={e => setInput(e.target.value)} className="w-full max-w-sm h-16 px-6 bg-[#F7FBFF] border-2 border-[#DCE5ED] rounded-2xl outline-none focus:border-[#1A6FA8] text-center text-2xl font-bold tracking-widest" placeholder="___-___-____" />
                <MicButton listening={voice.listening} onClick={voice.toggle} />
            </div>
            <button onClick={() => onComplete(input.replace(/\s/g, '') === data.number)} className="w-full max-w-sm mx-auto block py-4 bg-[#1A6FA8] text-white rounded-xl font-bold hover:bg-[#155a8a] transition-colors">Dial Number</button>
        </div>
    );
};

const ObjectMatching = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => (
    <div className="space-y-8 text-center">
        <h3 className="text-xl font-bold text-[#0D2B45]">Match the object to its pair:</h3>
        <p className="text-3xl font-black text-[#1A6FA8] uppercase tracking-wide my-6">{data.target}</p>
        <div className="flex justify-center gap-4 flex-wrap">
            {data.options?.map((opt: string) => (
                <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-[#F7FBFF] border-2 border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all rounded-xl font-bold text-lg">
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const WordAssociation = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => (
    <div className="space-y-8 text-center">
        <h3 className="text-xl font-bold text-[#0D2B45]">{data.prompt}</h3>
        <div className="flex justify-center gap-4 mt-8 flex-wrap">
            {data.options?.map((opt: string) => (
                <button key={opt} onClick={() => onComplete(opt === data.answer)} className="px-8 py-4 bg-[#F7FBFF] border-2 border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all rounded-xl font-bold text-lg">
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const StoryRecall = ({ data, onComplete }: { data: any, onComplete: (correct: boolean) => void }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        setShow(true);
        const timer = setTimeout(() => setShow(false), 15000);
        return () => clearTimeout(timer);
    }, [data]);

    return show ? (
        <div className="text-center p-10 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED]">
            <CountdownTimer seconds={15} label="Read and memorize this story" />
            <p className="text-xl font-serif text-[#0D2B45] leading-relaxed mt-6 max-w-lg mx-auto">"{data.story}"</p>
        </div>
    ) : (
        <div className="space-y-6 text-center">
            <h3 className="text-xl font-bold text-[#0D2B45]">{data.question}</h3>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mt-6">
                {(data.options || []).map((opt: string) => (
                    <button key={opt} onClick={() => onComplete(opt === data.answer)}
                        className="px-6 py-4 bg-[#F7FBFF] border-2 border-[#DCE5ED] hover:border-[#1A6FA8] hover:bg-[#1A6FA8] hover:text-white transition-all rounded-xl font-bold text-lg">
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ========================================
// RESULTS SCREEN
// ========================================
interface RoundResult {
    round: number;
    correct: boolean;
    wordDetail?: { word: string, recalled: boolean }[];
    correctCount?: number;
    totalWords?: number;
}

const ResultsScreen = ({ results, type, onExit }: { results: RoundResult[], type: string, onExit: () => void }) => {
    // Calculate overall score: if we have word-level detail, use it for accuracy
    const hasWordDetail = results.some(r => r.wordDetail);
    let totalCorrectWords = 0;
    let totalAllWords = 0;
    if (hasWordDetail) {
        results.forEach(r => {
            totalCorrectWords += r.correctCount || 0;
            totalAllWords += r.totalWords || 0;
        });
    }
    const correct = results.filter(r => r.correct).length;
    const total = results.length;
    const pct = hasWordDetail && totalAllWords > 0
        ? Math.round((totalCorrectWords / totalAllWords) * 100)
        : Math.round((correct / total) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪';
    const message = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!';

    return (
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-[#DCE5ED] max-w-2xl w-full mx-auto animate-fadeIn text-center">
            <div className="text-8xl mb-6">{emoji}</div>
            <h2 className="text-3xl font-bold text-[#0D2B45] font-serif mb-2">{message}</h2>
            <p className="text-[#7AA3BE] mb-8 capitalize text-lg">{type.replaceAll('_', ' ')} — Complete</p>

            <div className="flex justify-center gap-8 mb-8">
                {hasWordDetail ? (
                    <div className="bg-[#EAF7F4] rounded-2xl p-6 min-w-[120px]">
                        <p className="text-4xl font-black text-[#28A98C]">{totalCorrectWords}/{totalAllWords}</p>
                        <p className="text-sm font-bold text-[#7AA3BE] mt-1 uppercase">Words Recalled</p>
                    </div>
                ) : (
                    <div className="bg-[#EAF7F4] rounded-2xl p-6 min-w-[120px]">
                        <p className="text-4xl font-black text-[#28A98C]">{correct}/{total}</p>
                        <p className="text-sm font-bold text-[#7AA3BE] mt-1 uppercase">Correct</p>
                    </div>
                )}
                <div className="bg-[#F7FBFF] rounded-2xl p-6 min-w-[120px]">
                    <p className="text-4xl font-black text-[#1A6FA8]">{pct}%</p>
                    <p className="text-sm font-bold text-[#7AA3BE] mt-1 uppercase">Score</p>
                </div>
            </div>

            <div className="space-y-2 mb-8 max-w-md mx-auto">
                {results.map((r, i) => (
                    <div key={i}>
                        <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${
                            r.correct ? 'bg-[#EAF7F4] text-[#28A98C]' : 'bg-red-50 text-red-500'
                        }`}>
                            <span>Round {r.round}</span>
                            <span>{r.correctCount !== undefined ? `${r.correctCount}/${r.totalWords} words` : (r.correct ? '✅ Correct' : '❌ Incorrect')}</span>
                        </div>
                        {/* Word-by-word breakdown */}
                        {r.wordDetail && (
                            <div className="flex flex-wrap gap-2 mt-2 mb-3 justify-center">
                                {r.wordDetail.map((wd, j) => (
                                    <span key={j} className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        wd.recalled ? 'bg-[#EAF7F4] text-[#28A98C] border border-[#28A98C]/30' : 'bg-red-50 text-red-400 border border-red-200 line-through'
                                    }`}>
                                        {wd.recalled ? '✓' : '✗'} {wd.word}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={onExit} className="w-full max-w-sm mx-auto py-4 bg-[#1A6FA8] text-white rounded-xl font-bold text-lg hover:bg-[#155a8a] transition-colors">
                Back to Activities
            </button>
        </div>
    );
};


// ========================================
// RUNNER ENGINE
// ========================================

export function ActivityRunner({ type, onExit }: { type: string, onExit: () => void }) {
    const [questionData, setQuestionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [round, setRound] = useState(1);
    const [results, setResults] = useState<RoundResult[]>([]);
    const [finished, setFinished] = useState(false);
    const usedIndicesRef = useRef<Set<number>>(new Set());
    const totalRounds = 3;

    useEffect(() => {
        usedIndicesRef.current = new Set();
        loadQuestion();
        // eslint-disable-next-line
    }, [type]);

    const loadQuestion = () => {
        setLoading(true);
        // Fire-and-forget for DB logging
        try { api.generateActivity(type, 'easy').catch(() => {}); } catch { /* ignore */ }
        // Always use local enriched library with de-duplication
        const { question, index } = getLocalQuestion(type, usedIndicesRef.current);
        usedIndicesRef.current.add(index);
        setQuestionData(question);
        setLoading(false);
    };

    const finishActivity = (allResults: RoundResult[]) => {
        // Use word-level detail for accurate scoring when available
        const hasWordDetail = allResults.some(r => r.wordDetail);
        let finalScore: number;
        if (hasWordDetail) {
            let totalCorrectWords = 0;
            let totalAllWords = 0;
            allResults.forEach(r => {
                totalCorrectWords += r.correctCount || 0;
                totalAllWords += r.totalWords || 0;
            });
            finalScore = totalAllWords > 0 ? Math.round((totalCorrectWords / totalAllWords) * 100) : 0;
        } else {
            const correct = allResults.filter(r => r.correct).length;
            finalScore = Math.round((correct / totalRounds) * 100);
        }
        const today = new Date().toLocaleDateString();
        const existingRaw = localStorage.getItem("activity_progress") || "[]";
        const existing = JSON.parse(existingRaw);
        existing.push({ date: today, score: finalScore, type: type.replaceAll('_', ' ') });
        localStorage.setItem("activity_progress", JSON.stringify(existing));
        setFinished(true);
    };

    const handleNext = (correct: boolean, detail?: { wordScores: { word: string, recalled: boolean }[], correctCount: number, totalWords: number }) => {
        const roundResult: RoundResult = {
            round,
            correct,
            wordDetail: detail?.wordScores,
            correctCount: detail?.correctCount,
            totalWords: detail?.totalWords,
        };
        const newResults = [...results, roundResult];
        setResults(newResults);
        if (round < totalRounds) {
            setRound(prev => prev + 1);
            loadQuestion();
        } else {
            finishActivity(newResults);
        }
    };

    if (finished) {
        return <ResultsScreen results={results} type={type} onExit={onExit} />;
    }

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-16 shadow-2xl border border-[#DCE5ED] max-w-2xl mx-auto flex flex-col items-center justify-center animate-fadeIn min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#1A6FA8] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#7AA3BE] font-bold">Generating unique exercise...</p>
            </div>
        );
    }

    if (!questionData) {
        return (
            <div className="bg-white rounded-3xl p-10 shadow-2xl border border-red-200 max-w-2xl mx-auto animate-fadeIn text-center">
                <p className="text-red-500 font-bold mb-4">Failed to load activity content.</p>
                <button onClick={onExit} className="px-6 py-2 bg-[#F7FBFF] border border-[#DCE5ED] rounded-xl font-bold">Go Back</button>
            </div>
        );
    }

    const renderActivity = () => {
        // key={round} forces React to remount the component each round, resetting all internal state (timers, inputs, show/hide)
        switch (type) {
            case "memory_recall": return <MemoryRecall key={round} data={questionData} onComplete={handleNext} />;
            case "image_recall": return <ImageRecall key={round} data={questionData} onComplete={handleNext} />;
            case "pattern_recognition": return <PatternRecognition key={round} data={questionData} onComplete={handleNext} />;
            case "digit_span": return <DigitSpan key={round} data={questionData} onComplete={handleNext} />;
            case "stroop_test": return <StroopTest key={round} data={questionData} onComplete={handleNext} />;
            case "task_sequencing": return <TaskSequencing key={round} data={questionData} onComplete={handleNext} />;
            case "sentence_completion": return <SentenceCompletion key={round} data={questionData} onComplete={handleNext} />;
            case "semantic_fluency": return <SemanticFluency key={round} data={questionData} onComplete={handleNext} />;
            case "family_recognition": return <FamilyRecognition key={round} data={questionData} onComplete={handleNext} />;
            case "phone_recognition": return <PhoneRecognition key={round} data={questionData} onComplete={handleNext} />;
            case "object_matching": return <ObjectMatching key={round} data={questionData} onComplete={handleNext} />;
            case "word_association": return <WordAssociation key={round} data={questionData} onComplete={handleNext} />;
            case "story_recall": return <StoryRecall key={round} data={questionData} onComplete={handleNext} />;
            default: return <div className="text-red-500 text-center font-bold">Unsupported activity type: {type}</div>;
        }
    };

    return (
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-[#DCE5ED] max-w-3xl w-full mx-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-[#EAF7F4]">
                <h2 className="text-2xl font-bold text-[#1A6FA8] font-serif capitalize tracking-wide">{type.replaceAll('_', ' ')}</h2>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {Array.from({ length: totalRounds }).map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full ${i < round ? 'bg-[#28A98C]' : 'bg-[#DCE5ED]'}`} />
                        ))}
                    </div>
                    <span className="bg-[#EAF7F4] text-[#28A98C] px-4 py-2 rounded-full font-black text-sm uppercase">Round {round} / {totalRounds}</span>
                </div>
            </div>

            <div className="min-h-[250px] flex flex-col justify-center">
                {renderActivity()}
            </div>
        </div>
    );
}
