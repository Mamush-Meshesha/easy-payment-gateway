import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  PieChart, Activity, ArrowRight, Building, 
  ArrowDownToLine, Landmark, CalendarClock, ShieldCheck, Banknote, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WaveBackground } from '@/components/ui/WaveBackground';

const fadeIn: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Settlements() {
  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-amber-500" opacity={0.3} className="opacity-70" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Landmark size={14} /> LIQUIDITY ENGINE
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Get your funds <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">faster.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              Automated T+1 payouts to your corporate bank account. Multi-currency settlements with transparent fee reconciliation built right into the ledger.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg group">
                <Link to="/login" className="flex items-center">
                  Configure Payouts 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Dashboard Visualizer */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Next Settlement</div>
                  <div className="text-4xl font-extrabold text-slate-900">ETB 142,500.00</div>
                </div>
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <ArrowDownToLine size={24}/>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center"><Building size={20} className="text-slate-400"/></div>
                    <div>
                      <div className="font-bold text-slate-900">CBE Corporate Account</div>
                      <div className="text-xs text-slate-500">**** 9081</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-500">Scheduled: 00:00</div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">Gross Volume</span>
                    <span className="text-sm font-bold text-slate-900">ETB 145,000.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Processing Fees</span>
                    <span className="text-sm font-bold text-rose-500">- ETB 2,500.00</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Reconciliation made easy.</h2>
            <p className="text-lg text-slate-600">Stop downloading messy CSVs to figure out what you were paid for. Our settlement reports match exact payouts to individual API transactions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <CalendarClock size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">T+1 Automated</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Funds processed today are automatically swept into your designated bank account at midnight tomorrow. Zero manual requests.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <PieChart size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Fee Transparency</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Every settlement carries a cryptographic ledger proof breaking down exactly what volume was processed minus exact processing fees.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Multi-Account Routing</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Route settlements to different bank accounts dynamically based on product lines, subsidiaries, or currency combinations.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. FINAL CTA - Enterprise Edition */}
      <section className="relative py-32 bg-slate-50 text-slate-900 overflow-hidden border-t border-slate-200">
        {/* Architectural Grid Background (Light Mode) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
        
        {/* Core Glow (Subtle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <Banknote size={14} /> Automated Payouts
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Connect your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                  bank account.
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Experience seamless next-day settlements. Reconcile millions of transactions down to the cent with complete cryptographic accuracy.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
                  <Link to="/login" className="flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-full px-10 h-16 font-bold text-lg shadow-sm">
                  Talk to an expert
                </Button>
              </div>
            </div>

            {/* Right Column: Abstract Graphic (Keep Dark Terminal vibe) */}
            <div className="hidden lg:flex justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent to-transparent z-10"></div>
              
              {/* Abstract Representation of Settlement logic */}
              <div className="relative w-full max-w-md">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-20 translate-x-8"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-2"><ArrowRight size={14}/> Payout Triggered</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">ETB 1,450,000.00</div>
                  <div className="text-sm text-slate-500 mb-6 border-b border-slate-700 pb-4">Net volume · Commercial Bank of Ethiopia</div>
                  
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Processing Fees</span>
                    <span className="text-amber-400">- ETB 14,500.00</span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-10 -translate-x-8 opacity-90 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center bg-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CheckCircle2 size={16}/></div>
                      <span className="text-slate-300 text-sm font-semibold">T+1 Settled</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
    </div>
  );
}