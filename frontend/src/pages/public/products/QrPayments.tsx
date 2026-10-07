import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  QrCode, Smartphone, Zap, ArrowRight, Store, 
  MapPin, Clock, Fingerprint, ShieldAlert, WifiOff
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

export default function QrPayments() {
  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-purple-500" opacity={0.3} className="opacity-70" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <QrCode size={14} /> IN-PERSON PAYMENTS
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Contactless <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500">payments.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              Transform your physical storefront. Generate dynamic QR codes for customers to scan and pay instantly using Telebirr, CBEBirr, or M-Pesa.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-purple-600/20 group">
                <Link to="/login" className="flex items-center">
                  Start Generating 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Clean, Flat, Rigid QR Workflow Graphic */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-4 relative"
          >
            {/* API Request Block */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <div className="text-slate-400 font-mono text-xs font-bold uppercase tracking-wider mb-4 flex justify-between">
                <span>POST /v1/qr/generate</span>
                <span className="text-emerald-400">201 CREATED</span>
              </div>
              <div className="font-mono text-sm text-slate-300">
                <span className="text-purple-400">"amount"</span>: <span className="text-orange-400">450.00</span>,<br/>
                <span className="text-purple-400">"currency"</span>: <span className="text-emerald-400">"ETB"</span>,<br/>
                <span className="text-purple-400">"qr_url"</span>: <span className="text-blue-400">"https://api.easypay/qr/x82k..."</span>
              </div>
            </div>

            {/* Flat Customer Display Block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Customer Facing Display</div>
                <div className="text-2xl font-black text-slate-900">ETB 450.00</div>
                <div className="text-sm text-slate-500 mt-2 flex items-center gap-1"><Store size={14}/> Addis Coffee</div>
              </div>
              
              <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-2">
                <QrCode size={48} className="text-slate-800" strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID (BENTO) */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Point of sale, reimagined.</h2>
            <p className="text-lg text-slate-600">No expensive hardware terminals required. Turn any screen, tablet, or printed receipt into a secure checkout terminal.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Dynamic Pricing</h3>
                <p className="text-slate-600 leading-relaxed">Unlike static printed QR codes, our API generates unique codes per transaction ensuring the exact amount is paid.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Multi-Wallet Scan</h3>
                <p className="text-slate-600 leading-relaxed">A single QR code can be scanned by Telebirr, CBEBirr, and M-Pesa apps natively without friction.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Webhook Confirm</h3>
                <p className="text-slate-600 leading-relaxed">Your POS system receives an instant asynchronous confirmation event the second the user approves the payment.</p>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <QrCode size={14} /> Contactless POS
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Modernize your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500">
                  storefront.
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Generate dynamic QR codes for customers to scan and pay instantly using Telebirr, CBEBirr, or M-Pesa. No hardware required.
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
              
              {/* Abstract Representation of POS flow */}
              <div className="relative w-full max-w-md">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-20 translate-x-8"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono text-slate-400">Merchant Terminal</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">ETB 450.00</div>
                  <div className="text-sm text-slate-500 mb-6 border-b border-slate-700 pb-4">Waiting for customer scan...</div>
                  
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-2/3"></div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-10 -translate-x-8 opacity-90 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2"><QrCode className="text-slate-900" size={32}/></div>
                    <div>
                      <div className="text-sm font-bold text-white">QR Code Generated</div>
                      <div className="text-xs text-slate-400">Valid for 5:00 minutes</div>
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