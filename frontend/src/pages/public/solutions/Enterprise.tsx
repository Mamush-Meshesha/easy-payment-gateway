import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Building, ArrowRight, ShieldCheck, Activity, 
  Network, ServerCog, BadgeCheck
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

export default function Enterprise() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-slate-400" opacity={0.3} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-slate-200">
              <Building size={14} /> FOR ENTERPRISE
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Scale without <br/><span className="text-slate-600">limits.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl">
              Custom architecture, dedicated Technical Account Managers, and guaranteed 99.999% uptime SLAs for high-volume processors.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-slate-900/20 group">
                <Link to="/contact" className="flex items-center">
                  Contact Sales <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-500/10 to-transparent rounded-3xl transform -rotate-3 scale-105 -z-10 blur-xl"></div>
            
            {/* Abstract Architecture Diagram */}
            <Card className="border border-slate-200 shadow-2xl rounded-3xl overflow-hidden bg-white p-8">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <div className="font-bold text-slate-700 flex items-center gap-2"><Network size={20}/> Core Architecture</div>
                <BadgeCheck className="text-emerald-500" size={24} />
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">API</div>
                  <div className="h-2 bg-blue-100 rounded flex-1"></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">99.999% SLA</div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-1 bg-slate-200 h-12 ml-9"></div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold shrink-0"><Activity size={20}/></div>
                  <div className="h-2 bg-slate-200 rounded flex-1"></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Immutable Ledger</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Uncompromising reliability</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Engineered from the ground up to handle massive transaction volumes with perfect consistency.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck size={24} className="text-slate-700" />,
                title: "Bank-Grade Compliance",
                desc: "PCI DSS Level 1 certified, SOC 2 compliant, and fully audited by Tier 1 accounting firms."
              },
              {
                icon: <ServerCog size={24} className="text-blue-600" />,
                title: "Custom Integrations",
                desc: "Work directly with our engineering team to build custom routing rules and legacy ERP integrations."
              },
              {
                icon: <Activity size={24} className="text-emerald-600" />,
                title: "Dedicated TAMs",
                desc: "A dedicated Technical Account Manager and private Slack channel for 24/7 priority support."
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-100/80 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Upgrade your financial stack.</h2>
          <p className="text-xl text-slate-600 mb-10">Talk to our enterprise sales team about custom volume pricing and migration strategies.</p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
            <Link to="/contact" className="flex items-center">
              Contact Sales <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}