import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Calendar, ArrowRight, ShieldCheck, Award, Heart, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getConsultPatientAuth } from '../../../utils/sessionBridge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  experience: string;
  image: string;
  tags: string[];
  bio: string;
  availability: string;
  isReal?: boolean;
}

const DUMMY_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Chen',
    specialty: 'Cognitive Neuroscientist',
    rating: 4.9,
    reviews: 128,
    location: 'Medical Center East',
    experience: '12 Years',
    image: 'https://images.unsplash.com/photo-1559839734-2b71f153678f?auto=format&fit=crop&q=80&w=200&h=200',
    tags: ['Dementia Specialist', 'Memory Care'],
    bio: 'Specializing in early onset dementia detection and personalized cognitive rehabilitation strategies.',
    availability: 'Tomorrow, 10:00 AM'
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Thorne',
    specialty: 'Geriatric Psychiatrist',
    rating: 4.8,
    reviews: 94,
    location: 'North Psychiatric Annex',
    experience: '15 Years',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
    tags: ['Mental Health', 'Elderly Care'],
    bio: 'Dedicated to improving the mental well-being of seniors through compassionate care and expert diagnosis.',
    availability: 'Mon, Apr 7'
  },
  {
    id: 'doc-3',
    name: 'Dr. Elena Rodriguez',
    specialty: 'Clinical Psychologist',
    rating: 5.0,
    reviews: 215,
    location: 'Hope Wellness Clinic',
    experience: '8 Years',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
    tags: ['Behavioral Therapy', 'Family Support'],
    bio: 'Passionate about supporting both patients and caregivers through the emotional journey of cognitive decline.',
    availability: 'Today, 4:30 PM'
  },
  {
    id: 'doc-4',
    name: 'Dr. James Wilson',
    specialty: 'Neurologist',
    rating: 4.7,
    reviews: 310,
    location: 'City General Hospital',
    experience: '20 Years',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200',
    tags: ['Neurodegenerative Diseases', 'Diagnostics'],
    bio: 'A leading researcher in Alzheimer\u2019s treatment with extensive clinical experience in complex neurological cases.',
    availability: 'Wed, Apr 9'
  },
  {
    id: 'doc-5',
    name: 'Dr. Amina Jaleel',
    specialty: 'Gerontology Specialist',
    rating: 4.9,
    reviews: 156,
    location: 'Silver Years Institute',
    experience: '10 Years',
    image: 'https://images.unsplash.com/photo-1527613470643-20b003596fc8?auto=format&fit=crop&q=80&w=200&h=200',
    tags: ['Holistic Care', 'Functional Health'],
    bio: 'Focused on holistic wellness and preventive care strategies for age-related cognitive health.',
    availability: 'Tomorrow, 1:00 PM'
  }
];

// Avatar colors for real doctors who don't have profile images
const AVATAR_COLORS = ['#8C9A86', '#0D2B45', '#D4A373', '#7C9885', '#5B7B6E', '#3D6B5C'];

const ConsultDoctors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screeningState = location.state || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('All');
  const [allDoctors, setAllDoctors] = useState<Doctor[]>(DUMMY_DOCTORS);
  const [loadingReal, setLoadingReal] = useState(true);

  // Session bridging: check consult auth OR main app auth
  const auth = getConsultPatientAuth();
  
  // Check consult auth fallback
  useEffect(() => {
    if (!auth) {
      navigate('/consult/login/patient', { replace: true });
    }
  }, [auth, navigate]);

  // Fetch real doctors from backend on mount
  useEffect(() => {
    const fetchRealDoctors = async () => {
      try {
        const res = await fetch(`${API_URL}/doctors/list`);
        if (!res.ok) throw new Error('Failed to fetch doctors');
        const data = await res.json();

        // Transform backend data into Doctor interface
        const realDoctors: Doctor[] = data.map((doc: any, i: number) => {
          // Resolve avatar URL — backend returns relative paths like /uploads/uuid.jpg
          let imageUrl = doc.avatar_url || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${API_URL}${imageUrl}`;
          }
          const fullName = doc.full_name || 'Specialist';
          return {
            id: doc.id,
            name: fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`,
            specialty: doc.specialty || 'General Specialist',
            rating: +(4.5 + Math.random() * 0.5).toFixed(1),
            reviews: Math.floor(10 + Math.random() * 50),
            location: doc.location || 'NeuroVia Network',
            experience: doc.experience || 'Verified',
            image: imageUrl,
            tags: ['NeuroVia Verified', ...(doc.specialty ? [doc.specialty] : []), ...(doc.gender ? [doc.gender] : [])],
            bio: doc.bio || 'Board-certified specialist available for consultations on the NeuroVia platform.',
            availability: 'Available Now',
            isReal: true,
          };
        });

        // Merge: real doctors first, then dummies (filter out any dummy duplicates by name)
        const realNames = new Set(realDoctors.map((d: Doctor) => d.name.toLowerCase()));
        const filteredDummies = DUMMY_DOCTORS.filter(d => !realNames.has(d.name.toLowerCase()));
        setAllDoctors([...realDoctors, ...filteredDummies]);
      } catch (err) {
        console.warn('Could not fetch real doctors, using dummy data:', err);
        setAllDoctors(DUMMY_DOCTORS);
      } finally {
        setLoadingReal(false);
      }
    };
    fetchRealDoctors();
  }, []);

  const allTags = ['All', ...Array.from(new Set(allDoctors.flatMap(d => d.tags)))];

  const filteredDoctors = allDoctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'All' || doc.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const handleConsult = (doc: Doctor) => {
    navigate('/consult/patient/request', {
      state: {
        ...screeningState,
        doctor_id: doc.id,
        doctor_name: doc.name,
        specialty: doc.specialty
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('consult_token');
    localStorage.removeItem('consult_role');
    localStorage.removeItem('consult_user');
    navigate('/consult');
  };

  const consultUser = auth?.user || {};

  if (!auth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Lightweight header */}
      <header className="bg-white border-b border-[#E5E5E0] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span onClick={() => navigate('/consult')} className="text-xl font-bold text-[#0D2B45] cursor-pointer hover:text-[#8C9A86] transition-colors">NeuroVia</span>
          <span className="text-xs font-black text-[#8C9A86] uppercase tracking-widest bg-[#8C9A86]/10 px-3 py-1 rounded-full">Consultation</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-[#0D2B45]">{consultUser.full_name || 'Patient'}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-600 font-bold transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-[#0D2B45] tracking-tight">Find a Specialist</h2>
              <p className="text-xl text-[#0D2B45]/40 font-medium">Select a doctor to book your consultation.</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#E5E5E0] shadow-lg shadow-black/5 flex-1 max-w-lg">
              <div className="pl-4 text-[#0D2B45]/30">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search by specialty or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[#0D2B45] font-bold placeholder:text-[#0D2B45]/20 text-lg py-2"
              />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-6 py-3 rounded-2xl font-bold text-base transition-all whitespace-nowrap ${
                  filterTag === tag
                    ? 'bg-[#8C9A86] text-white shadow-lg shadow-[#84A59D]/30'
                    : 'bg-white text-[#0D2B45]/50 border border-[#E5E5E0] hover:border-[#8C9A86]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group flex flex-col">
                <div className="p-8 pb-4">
                  <div className="flex items-start gap-6">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-[#8C9A86]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                      {doc.image ? (
                        <img src={doc.image} alt={doc.name} className="w-24 h-24 rounded-2xl object-cover relative z-10 border-2 border-white" />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-2xl relative z-10 border-2 border-white flex items-center justify-center text-white text-3xl font-black"
                          style={{ background: AVATAR_COLORS[doc.name.length % AVATAR_COLORS.length] }}
                        >
                          {doc.name.replace('Dr. ', '').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg z-20 border-2 border-white">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {doc.isReal && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">New on NeuroVia</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-[#0D2B45] text-sm">{doc.rating}</span>
                        <span className="text-[#0D2B45]/30 text-xs">({doc.reviews} reviews)</span>
                      </div>
                      <h3 className="text-2xl font-black text-[#0D2B45] truncate group-hover:text-[#8C9A86] transition-colors">{doc.name}</h3>
                      <p className="text-[#8C9A86] font-bold text-base">{doc.specialty}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {doc.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-[#FAFAF7] rounded-lg text-xs font-bold text-[#0D2B45]/40 tracking-wider uppercase border border-[#E5E5E0]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-6 text-[#0D2B45]/60 leading-relaxed font-medium line-clamp-2 italic">
                    "{doc.bio}"
                  </p>
                </div>

                <div className="px-8 pb-8 pt-4 space-y-4 mt-auto">
                  <div className="flex flex-col gap-2 pt-4 border-t border-[#E5E5E0]">
                    <div className="flex items-center gap-3 text-[#0D2B45]/40 text-sm font-bold">
                      <MapPin className="w-4 h-4" /> {doc.location}
                    </div>
                    <div className="flex items-center gap-3 text-[#0D2B45]/40 text-sm font-bold">
                      <Award className="w-4 h-4" /> {doc.experience} Experience
                    </div>
                  </div>

                  <div className="bg-[#FAFAF7] p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#8C9A86]" />
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#0D2B45]/30">Next Available</p>
                        <p className="text-sm font-bold text-[#0D2B45]">{doc.availability}</p>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-[#0D2B45]/20 hover:text-red-500 transition-colors cursor-pointer" />
                  </div>

                  <button
                    onClick={() => handleConsult(doc)}
                    className="w-full py-4 bg-[#0D2B45] text-white rounded-2xl font-black text-lg hover:bg-[#8C9A86] transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 group/btn"
                  >
                    Book Consultation
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-[#FAFAF7] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E5E5E0]">
                <Search className="w-8 h-8 text-[#0D2B45]/20" />
              </div>
              <h3 className="text-2xl font-bold text-[#0D2B45]">No specialists found</h3>
              <p className="text-[#0D2B45]/40 mt-2">Try adjusting your search terms or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultDoctors;
