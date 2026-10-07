import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Rocket, ArrowRight, Zap, Code2, 
  Terminal, ShieldCheck, Banknote, HelpCircle, CheckCircle2
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

export default function Startups() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-rose-500" opacity={0.3} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Rocket size={14} /> FOR STARTUPS
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Move fast.<br/>Scale <span className="text-rose-600">globally.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl">
              Developer-first APIs, massive free-tier credits, and instant onboarding to get your MVP to market today.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-rose-500/20 group">
                <Link to="/login" className="flex items-center">
                  Apply for Credits <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base border-slate-200 hover:bg-slate-50 text-slate-700">
                <Link to="/docs">Explore APIs</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 to-transparent rounded-3xl transform rotate-3 scale-105 -z-10 blur-xl"></div>
            <Card className="border border-slate-200 shadow-2xl rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Banknote size={40} className="text-rose-600" />
                </div>
                <h3 className="text-3xl font-extrabold mb-2">$50,000</h3>
                <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-6">In Free Processing Volume</p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Zero transaction fees for your first $50k
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Priority Slack support with engineers
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> Access to exclusive founder events
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Built for builders</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Everything an early-stage startup needs to validate ideas and capture revenue instantly.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap size={24} className="text-rose-600" />,
                title: "Instant Activation",
                desc: "No waiting for weeks. Start accepting payments in test mode immediately, go live the same day."
              },
              {
                icon: <Code2 size={24} className="text-blue-600" />,
                title: "Modern SDKs",
                desc: "Libraries for React, Node, Python, and Go that feel like they were written by your own team."
              },
              {
                icon: <HelpCircle size={24} className="text-amber-600" />,
                title: "Founder Support",
                desc: "Direct access to our engineering team via shared Slack channels for architecture reviews."
              }
            ].map((feat, i) => (
              <Card key={i} className="border border-slate-200 shadow-lg shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 bg-white">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CTA */}
      <section className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Launch your startup today.</h2>
          <p className="text-xl text-slate-600 mb-10">Apply to the Startup Program and get $50,000 in free processing volume to kickstart your growth.</p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
            <Link to="/login" className="flex items-center">
              Apply Now <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}