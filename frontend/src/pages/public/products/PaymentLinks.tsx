import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Link as LinkIcon, Smartphone, Zap, ArrowRight, Share2, 
  MessageCircle, Mail, CheckCircle2, Globe, ShieldCheck
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

export default function PaymentLinks() {
  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-indigo-500" opacity={0.3} className="opacity-70" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <LinkIcon size={14} /> NO-CODE PAYMENTS
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Get paid <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">instantly.</span><br/> Anywhere.
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              Create a payment link in seconds and share it on WhatsApp, Telegram, email, or SMS. No website or coding required. Let your customers pay via Telebirr or CBEBirr instantly.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-blue-600/20 group">
                <Link to="/login" className="flex items-center">
                  Create a Link 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Clean, Flat Workflow Graphic */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-4 relative"
          >
            {/* Step 1: Create */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
              <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded">Step 1</div>
              <div className="text-slate-900 font-bold mb-4">Create Payment Link</div>
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Amount</span>
                  <span className="font-mono font-bold text-slate-700">ETB 1,250.00</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Description</span>
                  <span className="font-mono text-slate-700 text-sm">Consulting Services</span>
                </div>
                <div className="bg-blue-600 rounded-xl p-3 text-white text-center font-bold text-sm shadow-sm cursor-default">
                  Generate Link
                </div>
              </div>
            </div>

            {/* Step 2: Share */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative mt-2">
              <div className="absolute top-4 right-4 bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded">Step 2</div>
              <div className="text-white font-bold mb-4">Ready to Share</div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-inner">
                <span className="text-blue-400 font-mono text-sm truncate mr-4">pay.easypay.com/l/x78fj2k</span>
                <div className="bg-white text-slate-900 rounded p-1.5"><Share2 size={16}/></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-green-500/10 text-green-400 rounded-lg p-2 flex justify-center border border-green-500/20"><MessageCircle size={16}/></div>
                <div className="flex-1 bg-blue-500/10 text-blue-400 rounded-lg p-2 flex justify-center border border-blue-500/20"><Mail size={16}/></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Designed for modern commerce.</h2>
            <p className="text-lg text-slate-600">Close sales faster on social media, collect consulting fees, or manage recurring invoices without managing a complex web store.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Share2 size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Share Anywhere</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Copy and paste your link into Instagram DMs, Telegram channels, WhatsApp chats, or embed it directly into your PDF invoices.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Globe size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Multi-Currency</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Create links that accept ETB locally and USD internationally. The checkout automatically adapts to the customer's region.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Fraud Protected</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Every transaction processed through a Payment Link is automatically protected by Fraud Radar and velocity checks.</p>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <LinkIcon size={14} /> Instant Onboarding
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Start getting paid <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                  today.
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                It takes exactly 2 minutes to create an account and generate your first link. No code, no integration required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
                  <Link to="/login" className="flex items-center">
                    Create a Payment Link
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
              
              {/* Abstract Representation of a shared link */}
              <div className="relative w-full max-w-md">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-20 translate-x-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-semibold">Payment Link #9281</span>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase">Paid</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">ETB 1,250.00</div>
                  <div className="text-slate-500 text-sm">Consulting Services</div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-8 -translate-x-8 opacity-90 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <MessageCircle className="text-green-500" size={20}/>
                    <span className="text-slate-300 text-sm">Shared via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <Mail className="text-blue-500" size={20}/>
                    <span className="text-slate-300 text-sm">Shared via Email</span>
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