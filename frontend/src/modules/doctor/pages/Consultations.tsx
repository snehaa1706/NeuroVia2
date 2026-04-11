import React, { useState, useEffect } from 'react';
import { Mail, Clock, AlertCircle, CheckCircle2, ChevronRight, Filter, Search, User, Inbox, MessageSquare, Calendar } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';
import { Link } from 'react-router-dom';

const Consultations = () => {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                const data = await doctorApi.getConsultations();
                setConsultations(data);
            } catch (err) {
                console.error('Error fetching consultations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConsultations();
    }, []);

    const filtered = consultations.filter(c => {
        if (filter === 'all') return true;
        return c.status === filter;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 fade-in pb-20">
            {/* 🔹 Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold text-(--color-navy) mb-2">Consultation Inbox</h2>
                    <p className="text-lg text-(--color-navy)/60 font-medium">Review and respond to new patient requests and screening results.</p>
                </div>
                
                <div className="flex bg-white p-1.5 rounded-2xl border border-(--color-border-light) shadow-sm">
                    {['all', 'pending', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-(--color-navy) text-white shadow-lg shadow-(--color-navy)/20' : 'text-(--color-navy)/40 hover:bg-(--color-surface-alt)'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🔹 Consultation List */}
            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-(--color-border-light)" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((consult) => {
                        const isConsultModule = window.location.pathname.startsWith('/consult');
                        const linkBase = isConsultModule ? '/consult/doctor' : '/doctor';
                        return (
                        <Link to={`${linkBase}/consultation/${consult.id}`} key={consult.id} 
                            className="bg-white p-6 rounded-3xl border border-(--color-border-light) shadow-sm hover:shadow-md hover:border-(--color-sage) transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${consult.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {consult.status === 'pending' ? <Clock className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl font-bold text-(--color-navy)">{consult.patient?.full_name || 'Anonymous Patient'}</h4>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${consult.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {consult.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium text-(--color-navy)/40">
                                        <div className="flex items-center gap-1.5 line-clamp-1 max-w-[200px]">
                                            <Mail className="w-4 h-4 opacity-40" /> {consult.patient?.email}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 opacity-40" /> {consult.created_at ? new Date(consult.created_at).toLocaleDateString() : 'Recent'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-xs font-bold text-(--color-navy)/30 uppercase tracking-widest mb-1">Clinic Risk</span>
                                    <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-lg">
                                        <AlertCircle className="w-4 h-4" /> HIGH
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-(--color-surface-alt) rounded-2xl flex items-center justify-center group-hover:bg-(--color-navy) group-hover:text-white transition-all">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>
                        );
                    })
                ) : (
                    <div className="py-24 text-center bg-white rounded-[40px] border border-(--color-border-light) shadow-inner">
                        <div className="w-20 h-20 bg-(--color-surface-alt) rounded-full flex items-center justify-center mx-auto mb-6">
                            <Inbox className="w-10 h-10 text-(--color-navy)/20" />
                        </div>
                        <h3 className="text-2xl font-bold text-(--color-navy) mb-2">Your inbox is empty</h3>
                        <p className="text-(--color-navy)/40 max-w-sm mx-auto">No new {filter !== 'all' ? filter : ''} consultations found. Great job staying on top of your work!</p>
                    </div>
                )}
            </div>
            
            {/* 🔹 Summary Footnote */}
            <div className="p-8 bg-(--color-navy) rounded-3xl text-white flex items-center justify-between shadow-2xl shadow-(--color-navy)/30">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-xl">Quick Note</h4>
                     <p className="opacity-70 text-sm">Most consultations are resolved within 24 hours.</p>
                  </div>
               </div>
               <button className="px-6 py-3 bg-white text-(--color-navy) font-bold rounded-xl hover:bg-white/90 transition-all active:scale-95">
                  Priority Support
               </button>
            </div>
        </div>
    );
};

export default Consultations;
