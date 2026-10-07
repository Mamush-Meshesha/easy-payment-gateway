import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, Crosshair, BrainCircuit, ShieldCheck, ArrowRight,
  Fingerprint, Activity, AlertOctagon, Lock, CheckCircle2, Search, XCircle, Shield
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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function FraudRadar() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-white border-b border-slate-200">
        <WaveBackground color="text-rose-500" opacity={0.3} className="opacity-70" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-left text-slate-900">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <ShieldAlert size={14} /> Intelligent Risk Management
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              Stop fraud before it <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">
                hits your ledger.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              Fraud Radar scores every transaction in milliseconds using advanced machine learning, device fingerprinting, and dynamic velocity checks to protect your revenue.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-rose-600/20 group">
                <Link to="/login" className="flex items-center">
                  Enable Protection
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                Read the Docs
              </Button>
            </motion.div>
          </motion.div>

          {/* Premium Enterprise Graphic - Rigid, Flat, High-Contrast Metrics */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 relative"
          >
            {/* Metric 1: Processing Time */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-48">
              <div className="text-slate-500 font-semibold text-sm">Avg. Analysis Time</div>
              <div>
                <div className="text-5xl font-black text-slate-900 tracking-tighter">12<span className="text-2xl text-slate-400">ms</span></div>
                <div className="text-emerald-500 font-medium text-sm mt-2 flex items-center gap-1">
                  <Activity size={14} /> Ultra-low latency
                </div>
              </div>
            </div>

            {/* Metric 2: Fraud Prevented */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-48">
              <div className="text-slate-400 font-semibold text-sm">Fraud Block Rate</div>
              <div>
                <div className="text-5xl font-black text-white tracking-tighter">99.9<span className="text-2xl text-slate-500">%</span></div>
                <div className="text-rose-400 font-medium text-sm mt-2 flex items-center gap-1">
                  <Shield size={14} /> Zero false positives
                </div>
              </div>
            </div>

            {/* Metric 3: Active Rules */}
            <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="text-slate-700 font-bold text-sm">Real-time Evaluation</div>
                <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Active</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-600 shadow-sm">
                <span className="text-purple-600 font-bold">IF</span> request.velocity {'>'} 5 / sec <br/>
                <span className="text-purple-600 font-bold">AND</span> risk.score {'>'} 85 <br/>
                <span className="text-purple-600 font-bold">THEN</span> action = <span className="text-rose-600 font-bold">'BLOCK_IP'</span>
              </div>
            </div>
            
          </motion.div>
        </div>
      </section>

      {/* 2. VALUE PROPS (BENTO GRID) */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Engineered to eliminate fraud.</h2>
            <p className="text-lg text-slate-600">Don't rely on basic CVV checks. Leverage an AI engine trained on millions of data points to drop bad actors instantly.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[320px]">
            <Card className="md:col-span-2 bg-slate-900 text-white border-none rounded-3xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-10 flex flex-col h-full justify-between relative z-10">
                <BrainCircuit size={40} className="text-rose-400" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Adaptive Machine Learning</h3>
                  <p className="text-slate-400 max-w-md leading-relaxed text-lg">Our models analyze hundreds of real-time signals including device telemetry, IP reputation, behavioral biometrics, and cross-merchant velocity.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-10 flex flex-col h-full justify-between">
                <Crosshair size={40} className="text-blue-500" />
                <div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Velocity Checks</h3>
                  <p className="text-slate-500">Automatically block rapid sequential transaction attempts to prevent brute-force attacks.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-10 flex flex-col h-full justify-between">
                <Fingerprint size={40} className="text-purple-500" />
                <div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Device Fingerprinting</h3>
                  <p className="text-slate-500">Identify bad actors persistently even if they clear cookies, change IPs, or use Tor.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-gradient-to-r from-rose-50 to-orange-50 border-none rounded-3xl overflow-hidden relative group">
              <CardContent className="p-10 flex flex-col h-full justify-between relative z-10">
                <ShieldCheck size={40} className="text-rose-600" />
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-rose-950">Dynamic Volume Limits</h3>
                  <p className="text-rose-900/80 max-w-md leading-relaxed text-lg">Set rigorous daily, weekly, or monthly volume limits based on customer KYC tiers. Over-limit transactions fail instantly.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. RULES ENGINE PREVIEW */}
      <section className="py-32 bg-slate-50 text-slate-900 relative overflow-hidden border-t border-slate-200">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            
            <div className="order-2 lg:order-1">
              <div className="bg-[#0f172a] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#1e293b]">
                  <div className="font-bold text-sm text-slate-300 flex items-center gap-2">
                    <Activity size={16} className="text-rose-400"/> Rule Editor
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                </div>
                <div className="p-6 text-sm font-mono leading-loose">
                  <div className="mb-4">
                    <span className="text-slate-500">{'// 1. Define conditions'}</span><br/>
                    <span className="text-purple-400">IF</span> {'{'} <br/>
                    &nbsp;&nbsp;<span className="text-blue-400">transaction.amount</span> {'>'} <span className="text-orange-400">100000</span> <span className="text-slate-500">{'/* $1,000 */'}</span><br/>
                    &nbsp;&nbsp;<span className="text-purple-400">AND</span> <span className="text-blue-400">card.country</span> !== <span className="text-blue-400">ip.country</span><br/>
                    &nbsp;&nbsp;<span className="text-purple-400">AND</span> <span className="text-blue-400">customer.account_age</span> {'<'} <span className="text-emerald-400">'30d'</span><br/>
                    {'}'}
                  </div>
                  
                  <div>
                    <span className="text-slate-500">{'// 2. Define action'}</span><br/>
                    <span className="text-purple-400">THEN</span> {'{'} <br/>
                    &nbsp;&nbsp;<span className="text-blue-300">action</span>: <span className="text-rose-400">'block'</span>,<br/>
                    &nbsp;&nbsp;<span className="text-blue-300">log_message</span>: <span className="text-emerald-400">'High value cross-border mismatch on new account.'</span><br/>
                    {'}'}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">Custom Rules Engine</h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-10">Take absolute control of your risk appetite. Write custom logical rules tailored to your unique business model, or let our AI handle the heavy lifting.</p>
              
              <ul className="space-y-5">
                {[
                  'Block transactions from specific countries or IPs',
                  'Trigger 3D Secure (OTP) for high-value purchases',
                  'Create allow-lists for trusted VIP customers',
                  'Evaluate rules in milliseconds with zero latency impact'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-rose-600" />
                    </div>
                    <span className="text-slate-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="mt-12 bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 rounded-full font-bold shadow-lg shadow-slate-900/10">
                See Rule Examples
              </Button>
            </div>
            
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA - Enterprise Edition */}
      <section className="relative py-32 bg-slate-50 text-slate-900 overflow-hidden border-t border-slate-200">
        {/* Architectural Grid Background (Light Mode) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
        
        {/* Core Glow (Subtle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <ShieldAlert size={14} /> Ready to deploy
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Secure your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500">
                  revenue stream.
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Activate Fraud Radar today and drastically reduce your chargeback ratios without impacting legitimate customers. Integrates in minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
                  <Link to="/login" className="flex items-center">
                    Create free account
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
              
              {/* Stacked Code Blocks */}
              <div className="relative w-full max-w-md">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-20 translate-x-8"
                >
                  <div className="text-xs font-mono text-slate-400 mb-4 border-b border-slate-700 pb-2 flex gap-2"><Lock size={14}/> radar.config.json</div>
                  <div className="font-mono text-sm text-slate-300 space-y-1">
                    <span className="text-emerald-400">"velocity_limit"</span>: <span className="text-orange-400">5</span>,<br/>
                    <span className="text-emerald-400">"time_window"</span>: <span className="text-emerald-400">"60s"</span>,<br/>
                    <span className="text-emerald-400">"action"</span>: <span className="text-blue-400">"block"</span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-16 -translate-x-8 opacity-90"
                >
                  <div className="text-xs font-mono text-slate-400 mb-4 border-b border-slate-700 pb-2">Response</div>
                  <div className="font-mono text-sm text-slate-300">
                    <span className="text-blue-400">status</span>: <span className="text-rose-400">"rejected"</span>,<br/>
                    <span className="text-blue-400">reason</span>: <span className="text-emerald-400">"rule_triggered"</span>
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