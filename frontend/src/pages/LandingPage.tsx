import { useNavigate } from 'react-router-dom';
import { Brain, Heart, Activity, Stethoscope } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F9F8F4] flex flex-col font-sans">
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Left Side: Hero Branding */}
                <div className="w-full md:w-[45%] bg-[#0D2B45] text-white flex flex-col justify-center p-12 lg:p-24 relative overflow-hidden" style={{
                    backgroundImage: 'linear-gradient(to right, rgba(13, 43, 69, 0.95), rgba(13, 43, 69, 0.8)), url("https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    <div className="relative z-10 mt-[-10vh]">
                        <div className="flex items-center gap-3 mb-16">
                            <Brain className="w-8 h-8 text-[#8C9A86]" />
                            <span className="text-xl font-bold tracking-wide">NeuroVia</span>
                        </div>
                        <p className="text-[#8C9A86] tracking-widest text-xs uppercase font-extrabold mb-6">AI-Powered Care Intelligence</p>
                        <h1 className="text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
                            Empowering<br/><span className="italic font-light text-[#8C9A86]">Better Care</span>
                        </h1>
                        <p className="text-lg text-slate-300 max-w-sm leading-relaxed mb-12">
                            AI-powered dementia screening and caregiver monitoring — helping families detect early, act faster, and give doctors the clarity they need.
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                            {['Early Detection', 'Real-Time Monitoring', 'Caregiver Support'].map(badge => (
                                <span key={badge} className="px-4 py-2 rounded-full border border-[#8C9A86]/40 bg-[#8C9A86]/10 text-[#8C9A86] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Action Menu */}
                <div className="w-full md:w-[55%] bg-[#F9F8F4] flex flex-col justify-center p-12 lg:px-32 lg:py-24">
                    <div className="max-w-xl mx-auto w-full">
                        <h2 className="text-4xl lg:text-5xl font-serif text-[#0D2B45] mb-5">Where would you like to start?</h2>
                        <p className="text-slate-500 mb-12 text-lg">NeuroVia adapts to your role in the care journey. Choose yours to get started.</p>

                        <div className="space-y-5">
                            <button onClick={() => navigate('/screening')} className="w-full group flex items-center justify-between p-6 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#8C9A86] hover:shadow-lg transition-all text-left">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-full bg-[#8C9A86]/10 flex items-center justify-center border border-[#8C9A86]/20 group-hover:bg-[#8C9A86] transition-colors">
                                        <Activity className="w-6 h-6 text-[#8C9A86] group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D2B45] mb-1">Take a Cognitive Screening</h3>
                                        <p className="text-sm text-slate-500">5-minute, research-backed memory assessment</p>
                                    </div>
                                </div>
                                <span className="text-[#8C9A86] group-hover:translate-x-2 transition-transform text-2xl font-light">→</span>
                            </button>

                            <button onClick={() => navigate('/login')} className="w-full group flex items-center justify-between p-6 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#8C9A86] hover:shadow-lg transition-all text-left">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-full bg-[#8C9A86]/10 flex items-center justify-center border border-[#8C9A86]/20 group-hover:bg-[#8C9A86] transition-colors">
                                        <Heart className="w-6 h-6 text-[#8C9A86] group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D2B45] mb-1">I'm a Caregiver</h3>
                                        <p className="text-sm text-slate-500">Log and track daily observations, mood, and health</p>
                                    </div>
                                </div>
                                <span className="text-[#8C9A86] group-hover:translate-x-2 transition-transform text-2xl font-light">→</span>
                            </button>
                            
                            <button onClick={() => navigate('/login')} className="w-full group flex items-center justify-between p-6 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#8C9A86] hover:shadow-lg transition-all text-left">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-full bg-[#8C9A86]/10 flex items-center justify-center border border-[#8C9A86]/20 group-hover:bg-[#8C9A86] transition-colors">
                                        <Stethoscope className="w-6 h-6 text-[#8C9A86] group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D2B45] mb-1">I Want to Consult a Doctor</h3>
                                        <p className="text-sm text-slate-500">Find a specialist and share your care report securely</p>
                                    </div>
                                </div>
                                <span className="text-[#8C9A86] group-hover:translate-x-2 transition-transform text-2xl font-light">→</span>
                            </button>
                        </div>

                        <div className="mt-14 text-center">
                            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-4">Or</p>
                            <p className="text-base text-slate-600">
                                Already have an account? <span onClick={() => navigate('/login')} className="font-bold text-[#0D2B45] cursor-pointer hover:text-[#8C9A86] transition-colors underline underline-offset-4 decoration-2">Sign In</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
