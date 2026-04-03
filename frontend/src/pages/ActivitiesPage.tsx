import { useState, useEffect } from 'react';
import { Loader2, Sparkles, ChevronDown, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../lib/api';
import { ActivityRunner } from '../components/activities/ActivityRunner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ACTIVITY_TYPES = [
    { key: 'memory_recall', label: 'Memory Recall', emoji: '🧠', description: 'Remember and recall information', domain: 'Memory' },
    { key: 'pattern_recognition', label: 'Pattern Recognition', emoji: '🧩', description: 'Identify logical patterns', domain: 'Logic' },
    { key: 'image_recall', label: 'Image Recall', emoji: '📷', description: 'Remember visual details', domain: 'Visual' },
    { key: 'word_association', label: 'Word Association', emoji: '🗣️', description: 'Connect related concepts', domain: 'Language' },
    { key: 'object_matching', label: 'Object Matching', emoji: '🔍', description: 'Match and categorize objects', domain: 'Visual' },
    { key: 'story_recall', label: 'Story Recall', emoji: '📖', description: 'Recall details from a short story', domain: 'Memory' },
    { key: 'family_recognition', label: 'Family Recognition', emoji: '👨‍👩‍👧‍👦', description: 'Recognize family members', domain: 'Memory' },
    { key: 'phone_recognition', label: 'Phone Recognition', emoji: '📱', description: 'Recall important phone numbers', domain: 'Memory' },
    { key: 'stroop_test', label: 'Stroop Test', emoji: '🎨', description: 'Color/Word interference task', domain: 'Attention' },
    { key: 'digit_span', label: 'Digit Span', emoji: '🔢', description: 'Remember sequences of numbers', domain: 'Memory' },
    { key: 'task_sequencing', label: 'Task Sequencing', emoji: '📋', description: 'Order steps of a task logically', domain: 'Logic' },
    { key: 'sentence_completion', label: 'Sentence Completion', emoji: '✍️', description: 'Complete sentences logically', domain: 'Language' },
    { key: 'semantic_fluency', label: 'Semantic Fluency', emoji: '💡', description: 'Name items in a category rapidly', domain: 'Language' }
];

interface FamilyMember { name: string; relationship: string; }
interface PhoneContact { name: string; number: string; }

export default function ActivitiesPage() {
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeActivity, setActiveActivity] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [showPersonalSetup, setShowPersonalSetup] = useState(false);

    // Personal data state
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
    const [newFamily, setNewFamily] = useState<FamilyMember>({ name: '', relationship: '' });
    const [newPhone, setNewPhone] = useState<PhoneContact>({ name: '', number: '' });

    useEffect(() => { loadData(); loadPersonalData(); }, []);

    const loadData = async () => {
        try {
            const progRes = await api.getActivityProgress().catch(() => ({}));
            setProgress(progRes);
            const rawChart = localStorage.getItem("activity_progress");
            if (rawChart) setChartData(JSON.parse(rawChart));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadPersonalData = () => {
        try {
            const fam = localStorage.getItem('neurovia_family_members');
            if (fam) setFamilyMembers(JSON.parse(fam));
            const ph = localStorage.getItem('neurovia_phone_contacts');
            if (ph) setPhoneContacts(JSON.parse(ph));
        } catch { /* ignore */ }
    };

    const addFamilyMember = () => {
        if (!newFamily.name.trim() || !newFamily.relationship.trim()) return;
        const updated = [...familyMembers, { name: newFamily.name.trim(), relationship: newFamily.relationship.trim() }];
        setFamilyMembers(updated);
        localStorage.setItem('neurovia_family_members', JSON.stringify(updated));
        setNewFamily({ name: '', relationship: '' });
    };

    const removeFamilyMember = (idx: number) => {
        const updated = familyMembers.filter((_, i) => i !== idx);
        setFamilyMembers(updated);
        localStorage.setItem('neurovia_family_members', JSON.stringify(updated));
    };

    const addPhoneContact = () => {
        if (!newPhone.name.trim() || !newPhone.number.trim()) return;
        const updated = [...phoneContacts, { name: newPhone.name.trim(), number: newPhone.number.trim() }];
        setPhoneContacts(updated);
        localStorage.setItem('neurovia_phone_contacts', JSON.stringify(updated));
        setNewPhone({ name: '', number: '' });
    };

    const removePhoneContact = (idx: number) => {
        const updated = phoneContacts.filter((_, i) => i !== idx);
        setPhoneContacts(updated);
        localStorage.setItem('neurovia_phone_contacts', JSON.stringify(updated));
    };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-[#7AA3BE]">
                    <Loader2 className="w-10 h-10 animate-spin text-[#1A6FA8]" />
                    <p className="font-medium animate-pulse">Loading activities...</p>
                </div>
            </div>
        );
    }

    if (activeActivity) {
        return (
            <div className="page-container animate-fadeIn max-w-4xl">
                <ActivityRunner type={activeActivity} onExit={() => { setActiveActivity(null); loadData(); }} />
            </div>
        );
    }

    return (
        <div className="page-container animate-fadeIn">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-bold text-[#0D2B45] font-serif tracking-tight">Cognitive Library</h2>
                    <p className="text-lg text-[#7AA3BE] mt-2">AI-generated exercises tailored to maintain cognitive health</p>
                </div>
                {progress && (
                    <div className="flex items-center gap-6 bg-white px-6 py-4 rounded-2xl shadow-sm border border-[#DCE5ED]">
                        <div>
                            <p className="text-xs font-bold text-[#7AA3BE] uppercase tracking-wider">Completed</p>
                            <p className="text-2xl font-bold text-[#1A6FA8] font-serif">{progress.completed || 0}</p>
                        </div>
                        <div className="w-px h-10 bg-[#DCE5ED]" />
                        <div>
                            <p className="text-xs font-bold text-[#7AA3BE] uppercase tracking-wider">Avg Score</p>
                            <p className="text-2xl font-bold text-[#28A98C] font-serif">{progress.average_score || 0}%</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Personal Data Setup */}
            <div className="bg-white rounded-3xl shadow-lg border border-[#DCE5ED] mb-10 overflow-hidden">
                <button
                    onClick={() => setShowPersonalSetup(!showPersonalSetup)}
                    className="w-full flex items-center justify-between p-6 hover:bg-[#F7FBFF] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-[#0D2B45]">Personal Details</h3>
                            <p className="text-sm text-[#7AA3BE]">Add family members & phone numbers for personalized exercises</p>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#7AA3BE] transition-transform ${showPersonalSetup ? 'rotate-180' : ''}`} />
                </button>

                {showPersonalSetup && (
                    <div className="p-6 pt-0 border-t border-[#DCE5ED]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                            {/* Family Members */}
                            <div>
                                <h4 className="text-base font-bold text-[#0D2B45] mb-4 flex items-center gap-2">
                                    <span className="text-xl">👨‍👩‍👧‍👦</span> Family Members
                                </h4>
                                <div className="space-y-2 mb-4">
                                    {familyMembers.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-[#F7FBFF] rounded-xl border border-[#DCE5ED]">
                                            <div>
                                                <span className="font-bold text-[#0D2B45]">{m.name}</span>
                                                <span className="text-[#7AA3BE] ml-2">— {m.relationship}</span>
                                            </div>
                                            <button onClick={() => removeFamilyMember(i)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {familyMembers.length === 0 && (
                                        <p className="text-sm text-[#9BB8CD] italic p-3">No family members added yet. Add at least 2 for the Family Recognition exercise.</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newFamily.name} onChange={e => setNewFamily({ ...newFamily, name: e.target.value })}
                                        className="flex-1 h-10 px-3 bg-[#F7FBFF] border border-[#DCE5ED] rounded-lg text-sm outline-none focus:border-[#1A6FA8]" placeholder="Name (e.g. Sarah)" />
                                    <input value={newFamily.relationship} onChange={e => setNewFamily({ ...newFamily, relationship: e.target.value })}
                                        className="flex-1 h-10 px-3 bg-[#F7FBFF] border border-[#DCE5ED] rounded-lg text-sm outline-none focus:border-[#1A6FA8]" placeholder="Relationship (e.g. Daughter)" />
                                    <button onClick={addFamilyMember} className="h-10 px-4 bg-[#1A6FA8] text-white rounded-lg font-bold text-sm hover:bg-[#155a8a] transition-colors flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Phone Contacts */}
                            <div>
                                <h4 className="text-base font-bold text-[#0D2B45] mb-4 flex items-center gap-2">
                                    <span className="text-xl">📱</span> Important Phone Numbers
                                </h4>
                                <div className="space-y-2 mb-4">
                                    {phoneContacts.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-[#F7FBFF] rounded-xl border border-[#DCE5ED]">
                                            <div>
                                                <span className="font-bold text-[#0D2B45]">{c.name}</span>
                                                <span className="text-[#1A6FA8] ml-2 font-mono">{c.number}</span>
                                            </div>
                                            <button onClick={() => removePhoneContact(i)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {phoneContacts.length === 0 && (
                                        <p className="text-sm text-[#9BB8CD] italic p-3">No contacts added yet. Add numbers for the Phone Recognition exercise.</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newPhone.name} onChange={e => setNewPhone({ ...newPhone, name: e.target.value })}
                                        className="flex-1 h-10 px-3 bg-[#F7FBFF] border border-[#DCE5ED] rounded-lg text-sm outline-none focus:border-[#1A6FA8]" placeholder="Name (e.g. Daughter)" />
                                    <input value={newPhone.number} onChange={e => setNewPhone({ ...newPhone, number: e.target.value })}
                                        className="flex-1 h-10 px-3 bg-[#F7FBFF] border border-[#DCE5ED] rounded-lg text-sm outline-none focus:border-[#1A6FA8]" placeholder="Number (e.g. 555-0199)" />
                                    <button onClick={addPhoneContact} className="h-10 px-4 bg-[#1A6FA8] text-white rounded-lg font-bold text-sm hover:bg-[#155a8a] transition-colors flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Exercise Cards */}
            <div className="mb-14">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-[#0D2B45] font-serif flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Exercises
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {ACTIVITY_TYPES.map((type) => (
                        <div key={type.key} className="bg-white rounded-3xl p-6 shadow-md border border-[#DCE5ED] hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col h-full group">
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-16 h-16 text-4xl bg-[#F7FBFF] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    {type.emoji}
                                </div>
                                <span className="px-3 py-1 bg-[#EAF7F4] text-[#28A98C] rounded-full text-xs font-bold uppercase tracking-wider">
                                    {type.domain}
                                </span>
                            </div>
                            <h4 className="text-xl font-bold text-[#0D2B45] mb-2 leading-tight">{type.label}</h4>
                            <p className="text-[#7AA3BE] text-base flex-grow mb-6 leading-relaxed">{type.description}</p>
                            <button
                                onClick={() => setActiveActivity(type.key)}
                                className="w-full py-3 rounded-xl bg-[#F7FBFF] text-[#1A6FA8] text-lg font-bold border border-[#DCE5ED] hover:bg-[#1A6FA8] hover:text-white hover:border-[#1A6FA8] transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                            >
                                ▶ Play
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Progress Graph */}
            <div className="bg-white rounded-3xl p-10 shadow-2xl border border-[#DCE5ED] mb-10">
                <h3 className="text-2xl font-bold text-[#0D2B45] font-serif mb-6">Daily Progress</h3>
                {chartData && chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData.map((d: any, i: number) => ({ ...d, uniqueKey: `${d.date}#${i}` }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EAF7F4" />
                                <XAxis dataKey="uniqueKey" stroke="#7AA3BE" strokeWidth={2} tick={{ fontSize: 12 }} tickFormatter={(val: string) => val.split('#')[0]} />
                                <YAxis stroke="#7AA3BE" strokeWidth={2} domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                                    labelFormatter={(label: any) => typeof label === 'string' ? label.split('#')[0] : label}
                                    formatter={(value: any, _name: any, props: any) => [
                                        `${value}%`,
                                        props.payload.type || 'Score'
                                    ]}
                                />
                                <Line type="monotone" dataKey="score" stroke="#1A6FA8" strokeWidth={3} dot={{ r: 5, fill: '#28A98C', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#1A6FA8' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-[#F7FBFF] rounded-2xl border border-[#DCE5ED] border-dashed">
                        <p className="text-[#7AA3BE] font-medium text-lg mb-2">No activity history yet</p>
                        <p className="text-[#9BB8CD]">Complete some activities to start tracking your daily progress here!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
