import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Calendar, Brain, ChevronRight, Mail, Clock, Users } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';
import { Link } from 'react-router-dom';

const PatientList = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await doctorApi.getPatients();
        setPatients(data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'accepted': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'No activity';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in pb-20">
      {/* 🔹 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="group cursor-default transition-all duration-300 hover:scale-[1.01]">
          <h2 className="text-4xl font-bold text-[#1a2744] mb-2 transition-colors duration-300 group-hover:text-[#6b7c52]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Patient Directory</h2>
          <p className="text-lg text-[#1a2744]/60 font-medium transition-colors duration-300 group-hover:text-[#1a2744]/80">Manage and review all patients in your care network.</p>
        </div>
        
        <div className="flex gap-4 group">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a2744]/30" />
              <input 
                type="text" 
                placeholder="Search patient name or email..." 
                className="pl-12 pr-6 py-3.5 bg-[#ede7d9] border border-[#d2c8b98c] rounded-2xl w-80 text-[0.95rem] outline-none hover:bg-[#f5f0e8] hover:border-[#6b7c52] focus:bg-[#f5f0e8] focus:border-[#6b7c52] focus:shadow-md transition-all shadow-sm placeholder:text-[#1a2744]/40 text-[#1a2744] font-medium"
              />
           </div>
           <button className="p-3.5 bg-[#ede7d9] border border-[#d2c8b98c] rounded-2xl hover:bg-[#f5f0e8] hover:border-[#6b7c52] hover:shadow-md hover:-translate-y-[1px] transition-all shadow-sm">
              <Filter className="w-5 h-5 text-[#1a2744]/60 hover:text-[#6b7c52] transition-colors" />
           </button>
        </div>
      </div>

      {/* 🔹 Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {loading ? (
           [1, 2, 3, 4].map(i => (
             <div key={i} className="h-64 bg-[#ede7d9] rounded-3xl animate-pulse border border-[#d2c8b98c]" />
           ))
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient: any, index: number) => (
            <Link to={patient.id ? `/doctor/patient/${patient.id}` : '/doctor/consultations'} key={patient.id || `pending-${index}`} 
               className="bg-[#ede7d9] p-8 rounded-3xl border border-[#d2c8b98c] shadow-sm hover:shadow-xl hover:shadow-[#1a2744]/5 hover:bg-[#f5f0e8] hover:border-[#6b7c52] hover:-translate-y-1 transition-all duration-500 group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-(--color-sage)/10 rounded-2xl flex items-center justify-center border border-(--color-sage)/20">
                    <User className="w-8 h-8 text-(--color-sage)" />
                  </div>
                  <div className="text-right">
                    {patient.latest_status && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter ${getStatusColor(patient.latest_status)}`}>
                        {patient.latest_status === 'pending' ? 'Pending Review' : 
                         patient.latest_status === 'completed' ? 'Completed' :
                         patient.latest_status === 'accepted' ? 'In Progress' :
                         patient.latest_status}
                      </span>
                    )}
                    <p className="text-xs text-(--color-navy)/40 font-medium mt-2">ID: {patient.id ? patient.id.slice(0, 8) : 'Pending'}</p>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-(--color-navy) mb-4 group-hover:text-(--color-sage) transition-colors">{patient.full_name}</h3>
                
                <div className="space-y-3 mb-8">
                  {patient.email && (
                    <div className="flex items-center gap-3 text-sm font-medium text-(--color-navy)/60">
                      <Mail className="w-4 h-4 text-(--color-navy)/30" /> {patient.email}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm font-medium text-(--color-navy)/60">
                     <Clock className="w-4 h-4 text-(--color-navy)/30" /> Last activity: {formatTimeAgo(patient.latest_consultation)}
                  </div>
                  {patient.consultation_count > 0 && (
                    <div className="flex items-center gap-3 text-sm font-medium text-(--color-navy)/60">
                      <Users className="w-4 h-4 text-(--color-navy)/30" /> {patient.consultation_count} consultation{patient.consultation_count > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-(--color-border-light) pt-6 mt-2">
                <div className="flex gap-2">
                   <div className="bg-(--color-surface-alt) p-2 rounded-xl border border-(--color-border-light)">
                      <Brain className="w-5 h-5 text-(--color-navy)/40" />
                   </div>
                   <div className="bg-(--color-surface-alt) p-2 rounded-xl border border-(--color-border-light)">
                      <Calendar className="w-5 h-5 text-(--color-navy)/40" />
                   </div>
                </div>
                <div className="flex items-center gap-2 text-(--color-sage) font-bold group-hover:gap-4 transition-all">
                   {patient.id ? 'View Patient Details' : 'Manage Consultation'} <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-[#ede7d9] rounded-3xl border-2 border-dashed border-[#d2c8b98c] group hover:bg-[#f5f0e8] hover:border-[#6b7c52] hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-3xl font-bold text-[#1a2744] mb-2 font-serif group-hover:text-[#6b7c52] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No patients found</h3>
            <p className="text-[#1a2744]/50 font-medium">Try adjusting your search criteria or checking another group.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
