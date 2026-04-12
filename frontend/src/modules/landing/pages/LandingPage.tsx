import { useNavigate } from 'react-router-dom';
import { Brain, Heart, Activity, Stethoscope, Shield, ArrowRight, Lock, Clock, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const fontSans = { fontFamily: "'DM Sans', sans-serif" };
    const fontSerif = { fontFamily: "'Cormorant Garamond', serif" };

    return (
        <div style={fontSans} className="w-full bg-[#f5f0e8] text-[#1a2744] overflow-x-hidden scroll-smooth">
        
            {/* 1. HERO SECTION (TOP SPLIT) */}
            <section className="min-h-screen w-full flex flex-col md:flex-row relative">
                {/* LEFT PANEL */}
                <div className="relative flex-1 md:flex-[0_0_58%] overflow-hidden flex flex-col p-8 lg:p-[3.5rem_4.5rem]">
                    <img src="https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&w=1400&q=80" 
                         alt="Background" 
                         className="absolute inset-0 w-full h-full object-cover object-[center_30%] brightness-[0.88] saturate-[0.88] opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f1628a6] via-[#14230f59] to-[#0a0f081a]" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Nav Row */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-[#6b7c52] rounded-[8px] flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[1.15rem] font-semibold text-white">NeuroVia</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/login')} className="px-[1.1rem] py-[0.44rem] rounded-lg text-[0.83rem] font-medium border-[1.5px] border-[#f5f0e873] text-[#f5f0e8] bg-[#ffffff14] backdrop-blur-[10px] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#ffffff38] hover:border-[#ffffffbf] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-[1px]">Login</button>
                                <button onClick={() => navigate('/register')} className="px-[1.1rem] py-[0.44rem] rounded-lg text-[0.83rem] font-medium border-[1.5px] border-[#6b7c52] text-white bg-[#6b7c52] backdrop-blur-[10px] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#556540] hover:border-[#556540] hover:shadow-[0_4px_16px_rgba(107,124,82,0.3)] hover:-translate-y-[1px]">Sign Up</button>
                            </div>
                        </div>

                        {/* Hero Text Block */}
                        <div className="mt-auto pb-4">
                            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/70 uppercase mb-4">
                                AI-Powered Care Intelligence
                            </p>
                            <h1 style={fontSerif} className="text-[clamp(2.6rem,4.5vw,4rem)] font-semibold text-[#f5f0e8] leading-[1.08]">
                                Empowering <br />
                                <span className="italic block text-[#b8d49e]">Better Care</span>
                            </h1>
                            <p className="mt-[1.3rem] text-[0.92rem] font-light text-white/82 leading-[1.65] max-w-[380px]">
                                AI-powered dementia screening and caregiver monitoring — helping families detect early, act faster, and give doctors the clarity they need to help.
                            </p>
                            {/* Pills */}
                            <div className="flex flex-wrap gap-[0.6rem] mt-[2rem]">
                                {['Early Detection', 'Real-Time Monitoring', 'Caregiver Support'].map((label, idx) => (
                                    <div key={idx} className="flex items-center gap-[0.4rem] px-[0.9rem] py-[0.42rem] rounded-[100px] bg-white/10 backdrop-blur-[10px] border border-white/20 text-white/90 text-[0.77rem] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#ffffff38] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-[1px]">
                                        {idx === 0 && <Activity className="w-[13px] h-[13px] text-white/75" />}
                                        {idx === 1 && <Heart className="w-[13px] h-[13px] text-white/75" />}
                                        {idx === 2 && <Users className="w-[13px] h-[13px] text-white/75" />}
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 text-[0.72rem] text-white/35">
                            © 2026 NeuroVia Health Technologies. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 md:flex-[0_0_42%] bg-[#f5f0e8] flex items-center justify-center p-[2.5rem_1.5rem] lg:p-[3rem]">
                    <div className="w-full max-w-[380px] animate-[fadeUp_0.55s_cubic-bezier(0.22,1,0.36,1)_both]">
                        <h2 style={fontSerif} className="text-[2.2rem] font-semibold text-[#1a2744] mb-2 leading-tight">Where would you like to start?</h2>
                        <p className="text-[0.85rem] text-[#4a5578] font-light mb-8 leading-[1.55]">NeuroVia adapts to your role in the care journey. Choose yours to get started.</p>

                        <div className="space-y-4">
                            <button onClick={() => navigate('/screening')} className="w-full group text-left bg-white/60 p-5 rounded-[12px] border border-[#d2c8b98c] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:border-[#6b7c52] hover:bg-[#ede7d9d0] hover:shadow-[0_8px_24px_rgba(107,124,82,0.12)]">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-[42px] h-[42px] rounded-lg flex justify-center items-center bg-[#f5f0e8] border border-[#d2c8b98c] text-[#6b7c52] transition-colors duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#6b7c52] group-hover:text-white">
                                        <Brain className="w-[1.2rem] h-[1.2rem]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[0.92rem] font-medium text-[#1a2744]">Take a Cognitive Screening</h3>
                                        <p className="text-[0.76rem] text-[#4a5578] mt-1 line-clamp-2">A 5-minute, research-backed memory assessment.</p>
                                    </div>
                                    <ArrowRight className="w-[1.1rem] h-[1.1rem] text-[#4a5578] opacity-40 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#6b7c52] transition-all" />
                                </div>
                            </button>

                            <button onClick={() => navigate('/login')} className="w-full group text-left bg-white/60 p-5 rounded-[12px] border border-[#d2c8b98c] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:border-[#6b7c52] hover:bg-[#ede7d9d0] hover:shadow-[0_8px_24px_rgba(107,124,82,0.12)]">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-[42px] h-[42px] rounded-lg flex justify-center items-center bg-[#f5f0e8] border border-[#d2c8b98c] text-[#6b7c52] transition-colors duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#6b7c52] group-hover:text-white">
                                        <Heart className="w-[1.2rem] h-[1.2rem]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[0.92rem] font-medium text-[#1a2744]">I'm a Caregiver</h3>
                                        <p className="text-[0.76rem] text-[#4a5578] mt-1 line-clamp-2">Log and track daily observations, mood, and health patterns.</p>
                                    </div>
                                    <ArrowRight className="w-[1.1rem] h-[1.1rem] text-[#4a5578] opacity-40 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#6b7c52] transition-all" />
                                </div>
                            </button>

                            <button onClick={() => navigate('/consult')} className="w-full group text-left bg-white/60 p-5 rounded-[12px] border border-[#d2c8b98c] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:border-[#6b7c52] hover:bg-[#ede7d9d0] hover:shadow-[0_8px_24px_rgba(107,124,82,0.12)]">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-[42px] h-[42px] rounded-lg flex justify-center items-center bg-[#f5f0e8] border border-[#d2c8b98c] text-[#6b7c52] transition-colors duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#6b7c52] group-hover:text-white">
                                        <Stethoscope className="w-[1.2rem] h-[1.2rem]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-[0.92rem] font-medium text-[#1a2744]">I Want to Consult a Doctor</h3>
                                        <p className="text-[0.76rem] text-[#4a5578] mt-1 line-clamp-2">Find a specialist and share your care report securely.</p>
                                    </div>
                                    <ArrowRight className="w-[1.1rem] h-[1.1rem] text-[#4a5578] opacity-40 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#6b7c52] transition-all" />
                                </div>
                            </button>
                        </div>
                        
                        <div className="mt-8 flex items-center gap-3 text-[#2e3f6b] opacity-40">
                            <div className="h-px flex-1 bg-current"></div>
                            <span className="text-[0.66rem] uppercase tracking-widest font-bold">Or</span>
                            <div className="h-px flex-1 bg-current"></div>
                        </div>

                        <div className="mt-6 text-center text-[0.82rem] text-[#4a5578]">
                            Already have an account? <span onClick={() => navigate('/login')} className="text-[#6b7c52] font-semibold cursor-pointer hover:underline hover:text-[#556540] transition-colors">Sign in</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. HOW NEUROVIA WORKS */}
            <section className="py-[6rem] w-full flex flex-col justify-center items-center px-6 max-w-[1100px] mx-auto min-h-screen">
                <span className="text-[0.65rem] font-bold tracking-[0.16em] uppercase text-[#6b7c52] mb-3">How NeuroVia Works</span>
                <h2 style={fontSerif} className="text-[2.6rem] text-[#1a2744] font-medium mb-4 text-center">From First Concern to Clinical Clarity</h2>
                <p className="text-[#4a5578] text-[0.95rem] mb-16 text-center max-w-[600px] font-light leading-[1.6]">
                    Three focused steps — each one purpose-built to get you from uncertainty to answers, without the overwhelm.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 w-full">
                    {/* Step Card 1 */}
                    <div className="bg-[#ede7d9] border border-[#d2c8b98c] rounded-[1.2rem] p-8 flex flex-col items-center text-center transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52] relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#6b7c52] text-white flex items-center justify-center text-[0.8rem] font-bold absolute -top-4 -left-4 shadow-sm">1</div>
                        <div className="w-[3.5rem] h-[3.5rem] rounded-[14px] bg-[#f5f0e8] border border-[#d2c8b98c] flex items-center justify-center mb-5 text-[#6b7c52]">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-[1.2rem] font-medium text-[#1a2744] mb-3">Dementia Screening</h3>
                        <p className="text-[#4a5578] text-[0.85rem] leading-[1.6] mb-8 flex-1">
                            Take a short, research-backed cognitive assessment. Five questions, under five minutes. Our AI identifies patterns that may need a closer look.
                        </p>
                        <button onClick={() => navigate('/screening')} className="px-5 py-2.5 rounded-lg bg-[#f5f0e8] border border-[#d2c8b98c] text-[#1a2744] text-[0.85rem] font-medium transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-md hover:border-[#6b7c52] active:scale-[0.98]">
                            Start Your Screening →
                        </button>
                    </div>

                    {/* Step Card 2 */}
                    <div className="bg-[#ede7d9] border border-[#d2c8b98c] rounded-[1.2rem] p-8 flex flex-col items-center text-center transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52] relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#6b7c52] text-white flex items-center justify-center text-[0.8rem] font-bold absolute -top-4 -left-4 shadow-sm">2</div>
                        <div className="w-[3.5rem] h-[3.5rem] rounded-[14px] bg-[#f5f0e8] border border-[#d2c8b98c] flex items-center justify-center mb-5 text-[#6b7c52]">
                            <Heart className="w-6 h-6" />
                        </div>
                        <h3 className="text-[1.2rem] font-medium text-[#1a2744] mb-3">Caregiver Monitoring</h3>
                        <p className="text-[#4a5578] text-[0.85rem] leading-[1.6] mb-8 flex-1">
                            Family and caregivers log daily observations — mood, behavior, sleep, and changes over time. Small notes become powerful longitudinal data.
                        </p>
                        <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-lg bg-[#f5f0e8] border border-[#d2c8b98c] text-[#1a2744] text-[0.85rem] font-medium transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-md hover:border-[#6b7c52] active:scale-[0.98]">
                            View Caregiver Tools →
                        </button>
                    </div>

                    {/* Step Card 3 */}
                    <div className="bg-[#ede7d9] border border-[#d2c8b98c] rounded-[1.2rem] p-8 flex flex-col items-center text-center transition-all duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52] relative z-10">
                        <div className="w-8 h-8 rounded-full bg-[#6b7c52] text-white flex items-center justify-center text-[0.8rem] font-bold absolute -top-4 -left-4 shadow-sm">3</div>
                        <div className="w-[3.5rem] h-[3.5rem] rounded-[14px] bg-[#f5f0e8] border border-[#d2c8b98c] flex items-center justify-center mb-5 text-[#6b7c52]">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        <h3 className="text-[1.2rem] font-medium text-[#1a2744] mb-3">Consult a Doctor</h3>
                        <p className="text-[#4a5578] text-[0.85rem] leading-[1.6] mb-8 flex-1">
                            Walk into your consultation with a structured report already prepared. Your doctor sees the full picture — and can act on it immediately.
                        </p>
                        <button onClick={() => navigate('/consult')} className="px-5 py-2.5 rounded-lg bg-[#f5f0e8] border border-[#d2c8b98c] text-[#1a2744] text-[0.85rem] font-medium transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-md hover:border-[#6b7c52] active:scale-[0.98]">
                            Find Doctors →
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. CONNECTED SYSTEM SECTION */}
            <section className="min-h-screen w-full bg-[#ede7d9] py-[8rem] px-6 flex flex-col items-center justify-center border-y border-[#2e3f6b]/5">
                <span className="text-[0.65rem] font-bold tracking-[0.16em] uppercase text-[#6b7c52] mb-3">The Connected System</span>
                <h2 style={fontSerif} className="text-[2.6rem] text-[#1a2744] font-medium mb-4 text-center">How NeuroVia Works Together</h2>
                <p className="text-[#4a5578] text-[0.95rem] mb-16 text-center max-w-[650px] font-light leading-[1.6]">
                    Every data point flows automatically — from your first screening to your doctor's inbox. No manual handoffs. No lost context. Just one continuous care record.
                </p>

                <div className="bg-[#f5f0e8] rounded-[24px] border border-[#d2c8b98c] p-6 md:p-[3rem_2rem] w-full max-w-[950px] shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2 lg:gap-4">
                        
                        {/* Box 1 */}
                        <div className="group flex-1 bg-[#e0dacc] border border-[#d2c8b9] rounded-2xl p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[4px] hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(107,124,82,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] hover:border-[#6b7c52]/40 hover:bg-[#eae4d8]">
                            <div className="w-[3rem] h-[3rem] bg-[#6b7c52] rounded-full text-white flex items-center justify-center mx-auto mb-4 shadow-md transition-transform duration-[400ms] group-hover:scale-110 group-hover:rotate-[3deg]">
                                <Brain className="w-5 h-5" />
                            </div>
                            <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-3 transition-colors group-hover:text-[#6b7c52]">Screening Data</h4>
                            <ul className="text-[0.78rem] text-[#4a5578] space-y-[0.3rem]">
                                <li>Cognitive scores</li>
                                <li>Response patterns</li>
                                <li>Risk indicators</li>
                            </ul>
                        </div>

                        {/* Connector 1 */}
                        <div className="flex flex-col items-center justify-center py-2 md:py-0 md:px-1 lg:px-2 transition-opacity duration-[400ms]">
                            <div className="flex flex-col md:flex-row items-center gap-[4px] justify-center">
                                <div className="w-[1.5px] h-[15px] md:h-[1.5px] md:w-[15px] lg:w-[20px] bg-[#6b7c52]/30" />
                                <div className="w-[4px] h-[4px] rounded-full bg-[#6b7c52]" />
                                <div className="w-[1.5px] h-[15px] md:h-[1.5px] md:w-[15px] lg:w-[20px] bg-[#6b7c52]/30" />
                            </div>
                            <span className="text-[0.55rem] uppercase tracking-[0.15em] text-[#6b7c52] mt-[6px] font-bold text-center">Auto<br className="hidden md:block lg:hidden"/>Synced</span>
                        </div>

                        {/* Box 2 */}
                        <div className="group flex-1 bg-[#ede7d9] border border-[#d2c8b9] rounded-2xl p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[4px] hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(107,124,82,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] hover:border-[#6b7c52]/40 hover:bg-[#f3ead7]">
                            <div className="w-[3rem] h-[3rem] bg-[#6b7c52] rounded-full text-white flex items-center justify-center mx-auto mb-4 shadow-md transition-transform duration-[400ms] group-hover:scale-110 group-hover:rotate-[3deg]">
                                <Heart className="w-5 h-5" />
                            </div>
                            <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-3 transition-colors group-hover:text-[#6b7c52]">Care Observations</h4>
                            <ul className="text-[0.78rem] text-[#4a5578] space-y-[0.3rem]">
                                <li>Daily mood logs</li>
                                <li>Behavioral trends</li>
                                <li>Time-stamped notes</li>
                            </ul>
                        </div>

                        {/* Connector 2 */}
                        <div className="flex flex-col items-center justify-center py-2 md:py-0 md:px-1 lg:px-2 transition-opacity duration-[400ms]">
                            <div className="flex flex-col md:flex-row items-center gap-[4px] justify-center">
                                <div className="w-[1.5px] h-[15px] md:h-[1.5px] md:w-[15px] lg:w-[20px] bg-[#6b7c52]/30" />
                                <div className="w-[4px] h-[4px] rounded-full bg-[#6b7c52]" />
                                <div className="w-[1.5px] h-[15px] md:h-[1.5px] md:w-[15px] lg:w-[20px] bg-[#6b7c52]/30" />
                            </div>
                            <span className="text-[0.55rem] uppercase tracking-[0.15em] text-[#6b7c52] mt-[6px] font-bold text-center">Compiled<br className="hidden md:block lg:hidden"/>& Sent</span>
                        </div>

                        {/* Box 3 */}
                        <div className="group flex-1 bg-[#cbd4cd] border border-[#b2beb5] rounded-2xl p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[4px] hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(107,124,82,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] hover:border-[#6b7c52]/40 hover:bg-[#d6dfd8]">
                            <div className="w-[3rem] h-[3rem] bg-[#6b7c52] rounded-full text-white flex items-center justify-center mx-auto mb-4 shadow-md transition-transform duration-[400ms] group-hover:scale-110 group-hover:rotate-[3deg]">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-3 transition-colors group-hover:text-[#6b7c52]">Clinical Report</h4>
                            <ul className="text-[0.78rem] text-[#4a5578] space-y-[0.3rem]">
                                <li>Ready before the visit</li>
                                <li>Structured for diagnosis</li>
                                <li>Shareable securely</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. WHY NEUROVIA EXISTS */}
            <section className="min-h-screen w-full py-[8rem] px-6 max-w-[1100px] mx-auto flex flex-col items-center justify-center">
                <h2 style={fontSerif} className="text-[2.6rem] text-[#1a2744] font-medium mb-6 text-center">Why NeuroVia Exists</h2>
                <p className="text-[#4a5578] text-[0.95rem] mb-[4rem] text-center max-w-[700px] font-light leading-[1.65]">
                    Care decisions often begin with uncertainty — small changes that are easy to miss or hard to explain. NeuroVia exists to make those moments clearer, helping individuals and families understand what's happening and what to do next, without added complexity.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.5rem] w-full">
                    <div className="bg-[#f5f0e8] border border-[#d2c8b98c] rounded-[16px] p-7 flex flex-col transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52]">
                        <div className="w-10 h-10 rounded-xl bg-[#ede7d9] border border-[#d2c8b98c] text-[#6b7c52] flex items-center justify-center mb-5 transition-colors group-hover:bg-[#6b7c52] group-hover:text-white">
                            <Lock className="w-[1.2rem] h-[1.2rem]" />
                        </div>
                        <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-2.5">Your Data Stays Yours</h4>
                        <p className="text-[#4a5578] text-[0.8rem] leading-[1.6] font-light">Zero data selling. Zero third-party access. AES-256 encryption on every record, every time.</p>
                    </div>

                    <div className="bg-[#f5f0e8] border border-[#d2c8b98c] rounded-[16px] p-7 flex flex-col transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52]">
                        <div className="w-10 h-10 rounded-xl bg-[#ede7d9] border border-[#d2c8b98c] text-[#6b7c52] flex items-center justify-center mb-5 transition-colors group-hover:bg-[#6b7c52] group-hover:text-white">
                            <Clock className="w-[1.2rem] h-[1.2rem]" />
                        </div>
                        <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-2.5">Minutes, Not Months</h4>
                        <p className="text-[#4a5578] text-[0.8rem] leading-[1.6] font-light">Most users complete their first screening in under 5 minutes — no appointments, no waiting rooms.</p>
                    </div>

                    <div className="bg-[#f5f0e8] border border-[#d2c8b98c] rounded-[16px] p-7 flex flex-col transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52]">
                        <div className="w-10 h-10 rounded-xl bg-[#ede7d9] border border-[#d2c8b98c] text-[#6b7c52] flex items-center justify-center mb-5 transition-colors group-hover:bg-[#6b7c52] group-hover:text-white">
                            <Users className="w-[1.2rem] h-[1.2rem]" />
                        </div>
                        <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-2.5">A Tool for the Whole Team</h4>
                        <p className="text-[#4a5578] text-[0.8rem] leading-[1.6] font-light">Patients, family members, and clinicians all work from a single shared care record — no version conflicts.</p>
                    </div>

                    <div className="bg-[#f5f0e8] border border-[#d2c8b98c] rounded-[16px] p-7 flex flex-col transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-[#6b7c52]">
                        <div className="w-10 h-10 rounded-xl bg-[#ede7d9] border border-[#d2c8b98c] text-[#6b7c52] flex items-center justify-center mb-5 transition-colors group-hover:bg-[#6b7c52] group-hover:text-white">
                            <Zap className="w-[1.2rem] h-[1.2rem]" />
                        </div>
                        <h4 className="text-[0.95rem] font-medium text-[#1a2744] mb-2.5">AI That Knows When to Flag</h4>
                        <p className="text-[#4a5578] text-[0.8rem] leading-[1.6] font-light">Our model doesn't just collect data — it surfaces cognitive patterns that are easy to miss over weeks and months.</p>
                    </div>
                </div>
            </section>

            {/* 5. FINAL CTA SECTION & FOOTER */}
            <section className="min-h-screen w-full bg-gradient-to-br from-[#1a2744] to-[#122822] pt-[8rem] pb-[2rem] px-6 text-center flex flex-col items-center justify-between">
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <h2 style={fontSerif} className="text-[2.6rem] text-white font-medium mb-4 leading-tight">Start your journey to better brain health today</h2>
                <p className="text-white/70 text-[0.95rem] mb-[3rem] font-light">
                    No account needed to begin. No jargon. Just a clear picture of where things stand — and what to do next.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-[1rem] mb-[5rem]">
                    <button onClick={() => navigate('/screening')} className="w-full sm:w-auto px-[2rem] py-[0.85rem] rounded-[10px] bg-[#f5f0e8] text-[#1a2744] font-medium text-[0.9rem] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:bg-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] focus:ring-4 focus:ring-white/20 outline-none">
                        Start Free Screening
                    </button>
                    <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-[2rem] py-[0.85rem] rounded-[10px] bg-transparent border border-[rgba(255,255,255,0.25)] text-[#f5f0e8] font-medium text-[0.9rem] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.4)] focus:ring-4 focus:ring-white/10 outline-none">
                        I am a Caregiver
                    </button>
                    <button onClick={() => navigate('/consult')} className="w-full sm:w-auto px-[2rem] py-[0.85rem] rounded-[10px] bg-transparent border border-[rgba(255,255,255,0.25)] text-[#f5f0e8] font-medium text-[0.9rem] transition-all duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.4)] focus:ring-4 focus:ring-white/10 outline-none">
                        Find a Doctor
                    </button>
                </div>
                </div>

                <div className="w-full max-w-[1100px] border-t border-[rgba(255,255,255,0.1)] flex flex-col sm:flex-row items-center justify-between pt-8 text-[0.8rem] text-white/50 pb-4">
                    <div className="flex items-center gap-2 mb-4 sm:mb-0">
                        <div className="w-6 h-6 bg-[#6b7c52] rounded flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold tracking-wide text-white/80">NeuroVia</span>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-white transition-colors">About</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>

                    <div className="mt-4 sm:mt-0">
                        © 2026 NeuroVia Health Technologies
                    </div>
                </div>
            </section>

        </div>
    );
}
