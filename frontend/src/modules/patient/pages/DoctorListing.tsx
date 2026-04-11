import React, { useState } from 'react';
import { Search, Filter, Star, MapPin, Calendar, ArrowRight, ShieldCheck, Award, MessageSquare, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    bio: 'A leading researcher in Alzheimer’s treatment with extensive clinical experience in complex neurological cases.',
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

const DoctorListing = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('All');

  const allTags = ['All', ...Array.from(new Set(DUMMY_DOCTORS.flatMap(d => d.tags)))];

  const filteredDoctors = DUMMY_DOCTORS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'All' || doc.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const handleConsult = (doc: Doctor) => {
    // Navigate to request form with pre-selected doctor
    navigate('/consultation/request', { 
      state: { 
        doctor_id: doc.id, 
        doctor_name: doc.name,
        specialty: doc.specialty 
      } 
    });
  };

  return (
    <div className="space-y-10 fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-(--color-navy) tracking-tight">Find a Specialist</h2>
          <p className="text-xl text-(--color-navy)/40 font-medium">Book a professional review for your latest cognitive report.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-(--color-border-light) shadow-lg shadow-black/5 flex-1 max-w-lg">
          <div className="pl-4 text-(--color-navy)/30">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="Search by specialty or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-(--color-navy) font-bold placeholder:text-(--color-navy)/20 text-lg py-2"
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {allTags.map(tag => (
          <button 
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`px-6 py-3 rounded-2xl font-bold text-base transition-all whitespace-nowrap ${
              filterTag === tag 
                ? 'bg-(--color-sage) text-white shadow-lg shadow-[#84A59D]/30' 
                : 'bg-white text-(--color-navy)/50 border border-(--color-border-light) hover:border-(--color-sage)'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredDoctors.map(doc => (
          <div key={doc.id} className="bg-white rounded-3xl border border-(--color-border-light) shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group flex flex-col">
            <div className="p-8 pb-4">
              <div className="flex items-start gap-6">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-(--color-sage)/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                  <img src={doc.image} alt={doc.name} className="w-24 h-24 rounded-2xl object-cover relative z-10 border-2 border-white" />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg z-20 border-2 border-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-(--color-navy) text-sm">{doc.rating}</span>
                      <span className="text-(--color-navy)/30 text-xs text-sm">({doc.reviews} reviews)</span>
                   </div>
                   <h3 className="text-2xl font-black text-(--color-navy) truncate group-hover:text-(--color-sage) transition-colors">{doc.name}</h3>
                   <p className="text-(--color-sage) font-bold text-base">{doc.specialty}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                {doc.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-(--color-surface-alt) rounded-lg text-xs font-bold text-(--color-navy)/40 tracking-wider uppercase border border-(--color-border-light)">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-(--color-navy)/60 leading-relaxed font-medium line-clamp-2 italic">
                "{doc.bio}"
              </p>
            </div>

            <div className="px-8 pb-8 pt-4 space-y-4 mt-auto">
              <div className="flex flex-col gap-2 pt-4 border-t border-(--color-border-light)">
                <div className="flex items-center gap-3 text-(--color-navy)/40 text-sm font-bold">
                  <MapPin className="w-4 h-4" /> {doc.location}
                </div>
                <div className="flex items-center gap-3 text-(--color-navy)/40 text-sm font-bold">
                  <Award className="w-4 h-4" /> {doc.experience} Experience
                </div>
              </div>

              <div className="bg-(--color-surface-alt) p-4 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-(--color-sage)" />
                    <div>
                       <p className="text-[10px] uppercase font-black tracking-widest text-(--color-navy)/30">Next Available</p>
                       <p className="text-sm font-bold text-(--color-navy)">{doc.availability}</p>
                    </div>
                 </div>
                 <Heart className="w-5 h-5 text-(--color-navy)/20 hover:text-red-500 transition-colors cursor-pointer" />
              </div>

              <button 
                onClick={() => handleConsult(doc)}
                className="w-full py-4 bg-(--color-navy) text-white rounded-2xl font-black text-lg hover:bg-(--color-sage) transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 group/btn"
              >
                Request Consultation
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-(--color-surface-alt) rounded-full flex items-center justify-center mx-auto mb-6">
             <Search className="w-8 h-8 text-(--color-navy)/20" />
          </div>
          <h3 className="text-2xl font-bold text-(--color-navy)">No specialists found</h3>
          <p className="text-(--color-navy)/40 mt-2">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorListing;
