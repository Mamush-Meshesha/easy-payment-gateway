import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Cloud, ArrowRight, RefreshCcw, BarChart3, Clock, 
  Code2, CheckCircle2, FileText
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

export default function Saas() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-indigo-500" opacity={0.4} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Cloud size={14} /> FOR SAAS PLATFORMS
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Automate your <br/><span className="text-indigo-600">subscriptions.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl">
              Smart recurring billing, complex proration logic, and intelligent dunning management built for modern software companies.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-indigo-500/20 group">
                <Link to="/contact" className="flex items-center">
                  Start Billing <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base border-slate-200 hover:bg-slate-50 text-slate-700">
                <Link to="/docs/billing">Read the Docs</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-3xl transform -rotate-3 scale-105 -z-10 blur-xl"></div>
            <div className="bg-[#0f172a] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-[#1e293b]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Code2 size={14} /> subscription.ts
                </div>
              </div>
              <div className="p-6 overflow-x-auto text-sm font-mono leading-loose">
                <span className="text-slate-500">{'// Create a new subscription'}</span><br/>
                <span className="text-purple-400">const</span> <span className="text-blue-400">subscription</span> = <span className="text-purple-400">await</span> easypay.subscriptions.<span className="text-blue-300">create</span>({'{'}<br/>
                &nbsp;&nbsp;customer: <span className="text-emerald-400">'cus_9s8d7f6g'</span>,<br/>
                &nbsp;&nbsp;plan: <span className="text-emerald-400">'plan_pro_monthly'</span>,<br/>
                &nbsp;&nbsp;prorate: <span className="text-orange-400">true</span>,<br/>
                &nbsp;&nbsp;trial_period_days: <span className="text-orange-400">14</span>,<br/>
                &nbsp;&nbsp;behavior_on_failure: <span className="text-emerald-400">'smart_retry'</span><br/>
                {'}'});<br/><br/>
                <span className="text-slate-500">{'// Automatic webhooks handle the rest!'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">The billing engine for B2B</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">We handle the edge cases so you can focus on building your core product.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <RefreshCcw size={24} className="text-indigo-600" />,
                title: "Flexible Models",
                desc: "Support for flat-rate, tiered, usage-based, and hybrid pricing models out of the box."
              },
              {
                icon: <Clock size={24} className="text-rose-600" />,
                title: "Smart Dunning",
                desc: "Machine learning optimizes retry schedules to recover up to 40% of failed payments automatically."
              },
              {
                icon: <FileText size={24} className="text-emerald-600" />,
                title: "Tax & Invoicing",
                desc: "Automated calculation of global taxes and generation of compliant PDF invoices."
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Stop building billing systems.</h2>
          <p className="text-xl text-slate-600 mb-10">Offload subscription management to us and get back to shipping features your users love.</p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
            <Link to="/contact" className="flex items-center">
              Talk to an Expert <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}