import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Zap, HelpCircle, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaveBackground } from '@/components/ui/WaveBackground';

const fadeIn: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-emerald-500" opacity={0.3} className="opacity-70" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-emerald-100">
              <Zap size={14} /> Transparent Pricing
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8">
              Pay only for <br className="hidden md:block"/> what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">use.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              No setup fees, no monthly minimums, no hidden charges. Everything you need to manage your business for one simple rate.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="py-24 px-6 bg-slate-50 relative -mt-10">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 relative z-20">
            
            {/* Standard Pay-as-you-go */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-3xl p-10 border border-slate-200 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Pay as you go</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">For businesses of all sizes wanting to process payments online instantly.</p>
              
              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 tracking-tight">2.5%</span>
                </div>
                <div className="text-slate-500 font-medium mt-2 uppercase tracking-wide text-sm">per successful transaction</div>
              </div>

              <Button size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-14 font-bold text-lg mb-10 shadow-lg">
                <Link to="/login" className="w-full">Create free account</Link>
              </Button>

              <div className="space-y-4">
                <div className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">What's included</div>
                {[
                  'Local Cards (Awash, Dashen, CBE)',
                  'Mobile Money (Telebirr, M-Pesa)',
                  'Next-day automatic settlements',
                  'Advanced fraud protection radar',
                  'Real-time webhook notifications',
                  '24/7 dedicated email support'
                ].map(feature => (
                  <div key={feature} className="flex items-start gap-3 text-slate-600">
                    <div className="bg-emerald-50 p-1 rounded-full mt-0.5"><Check size={14} className="text-emerald-600" /></div>
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Enterprise */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-slate-900 rounded-3xl p-10 text-white border border-slate-800 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

              <h3 className="text-2xl font-extrabold text-white mb-4 relative z-10">Enterprise</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 relative z-10">For businesses processing large volumes or requiring custom payment flows.</p>
              
              <div className="mb-10 relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white tracking-tight">Custom</span>
                </div>
                <div className="text-slate-400 font-medium mt-2 uppercase tracking-wide text-sm">volume-based pricing</div>
              </div>

              <Button size="lg" className="w-full bg-white hover:bg-slate-100 text-slate-900 rounded-xl h-14 font-bold text-lg mb-10 shadow-lg relative z-10">
                <Link to="/company/contact" className="w-full">Contact Sales</Link>
              </Button>

              <div className="space-y-4 relative z-10">
                <div className="font-bold text-white uppercase tracking-widest text-xs mb-6">Everything in standard, plus:</div>
                {[
                  'Volume-based rate discounts',
                  'Custom settlement timelines',
                  'Dedicated Technical Account Manager',
                  'SLA guaranteed 99.999% uptime',
                  'Custom integrations and bespoke flows',
                  'Direct Slack channel support'
                ].map(feature => (
                  <div key={feature} className="flex items-start gap-3 text-slate-300">
                    <div className="bg-white/10 p-1 rounded-full mt-0.5"><Check size={14} className="text-white" /></div>
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* DETAILED BREAKDOWN */}
      <section className="py-32 px-6 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Payment Methods</h2>
            <p className="text-lg text-slate-600">A unified fee structure across all major local payment channels.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-widest text-xs gap-4 hidden md:grid">
              <div className="col-span-2">Method</div>
              <div>Rate</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 border-b border-slate-100 items-center gap-6">
              <div className="col-span-2 flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Zap size={28} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xl mb-1">Mobile Money</div>
                  <div className="text-slate-500 text-sm">Telebirr, M-Pesa, CBE Birr</div>
                </div>
              </div>
              <div>
                <div className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</div>
                <div className="font-black text-slate-900 text-3xl">2.5%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 items-center gap-6">
              <div className="col-span-2 flex items-center gap-5">
                <div className="w-14 h-14 bg-fuchsia-50 text-fuchsia-600 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xl mb-1">Local Cards</div>
                  <div className="text-slate-500 text-sm">Awash, Dashen, CBE ATM Cards</div>
                </div>
              </div>
              <div>
                <div className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</div>
                <div className="font-black text-slate-900 text-3xl">3.5%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                <HelpCircle className="text-emerald-500 shrink-0" /> When do I get paid?
              </h4>
              <p className="text-slate-600 leading-relaxed ml-9 text-lg">
                We process settlements automatically on a T+1 schedule (the next business day). Funds are deposited directly into your linked corporate bank account without any manual intervention.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                <HelpCircle className="text-emerald-500 shrink-0" /> Are there any hidden fees?
              </h4>
              <p className="text-slate-600 leading-relaxed ml-9 text-lg">
                No. We charge a flat percentage based on the transaction type. There are absolutely no setup fees, monthly minimums, refund fees, or hidden costs.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                <HelpCircle className="text-emerald-500 shrink-0" /> Can I negotiate my rate?
              </h4>
              <p className="text-slate-600 leading-relaxed ml-9 text-lg">
                Yes. If you process more than 1,000,000 ETB per month, please contact our sales team to discuss custom Enterprise pricing volume discounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-32 bg-slate-900 text-white overflow-hidden text-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Ready to scale your business?</h2>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed">
            Join thousands of Ethiopian businesses using EasyPay to process payments globally.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-emerald-500/20 group">
              <Link to="/login" className="flex items-center">
                Create Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-full px-10 h-16 font-bold text-lg">
              <Link to="/company/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
      
    </div>
  );
}
