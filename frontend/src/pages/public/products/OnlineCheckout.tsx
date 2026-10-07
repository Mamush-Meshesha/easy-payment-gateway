import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, Smartphone, CreditCard, 
  CheckCircle2, Code2, Lock, Activity, BarChart3, Fingerprint
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

export default function OnlineCheckout() {
  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-white border-b border-slate-100">
        <WaveBackground color="text-emerald-500" opacity={0.3} className="opacity-70" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="text-left"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-slate-900/10">
              <Zap size={14} className="text-emerald-400" /> Prebuilt Checkout
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Higher conversion, <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                more revenue.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              Launch with a ready-to-use checkout that is mobile-friendly, secure, and built to convert. Access Telebirr, CBEBirr, and M-Pesa with zero extra code.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-emerald-500/20 group">
                <Link to="/login" className="flex items-center">
                  Start Integrating 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base border-slate-200 text-slate-700 bg-white hover:bg-slate-50">
                Contact Sales
              </Button>
            </motion.div>
          </motion.div>

          {/* Premium Enterprise Graphic - Rigid, Flat, Developer-Focused */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 relative"
          >
            {/* Box 1: API Response */}
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-slate-400 font-mono text-xs font-bold uppercase tracking-wider">POST /v1/checkout/intent</div>
                <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">200 OK</div>
              </div>
              <div className="font-mono text-sm text-slate-300">
                <span className="text-emerald-400">"id"</span>: <span className="text-slate-200">"pi_3M2X"</span>,<br/>
                <span className="text-emerald-400">"object"</span>: <span className="text-slate-200">"payment_intent"</span>,<br/>
                <span className="text-emerald-400">"amount"</span>: <span className="text-orange-400">450000</span>,<br/>
                <span className="text-emerald-400">"currency"</span>: <span className="text-slate-200">"ETB"</span>,<br/>
                <span className="text-emerald-400">"status"</span>: <span className="text-emerald-400 font-bold">"succeeded"</span>
              </div>
            </div>

            {/* Box 2: Payment Methods */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-40">
              <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Supported Methods</div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center"><Smartphone size={12}/></div>
                  <span className="text-sm font-semibold text-slate-700">Mobile Money</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><CreditCard size={12}/></div>
                  <span className="text-sm font-semibold text-slate-700">Bank Cards</span>
                </div>
              </div>
            </div>

            {/* Box 3: Global Reach */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-40">
              <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">Global Reach</div>
              <div>
                <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">15+</div>
                <div className="text-slate-600 text-sm font-medium">Currencies & localized methods</div>
              </div>
            </div>
            
          </motion.div>
        </div>
      </section>

      {/* 2. VALUE PROPS (BENTO GRID) */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Built for scale. Designed for conversion.</h2>
            <p className="text-lg text-slate-600">Every aspect of EasyPay Checkout is rigorously optimized to increase your revenue and reduce friction.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[320px]">
            <Card className="md:col-span-2 bg-slate-900 text-white border-none rounded-3xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-10 flex flex-col h-full justify-between relative z-10">
                <Globe size={40} className="text-emerald-400" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">15+ Methods in One API</h3>
                  <p className="text-slate-400 max-w-md leading-relaxed text-lg">Cards, bank transfers, and local mobile money. The right option is shown automatically based on the customer's location.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-10 flex flex-col h-full justify-between">
                <Activity size={40} className="text-blue-500" />
                <div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Smart Routing</h3>
                  <p className="text-slate-500">Automatic failover routing to maximize approval rates in every market.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-10 flex flex-col h-full justify-between">
                <Lock size={40} className="text-rose-500" />
                <div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">PCI Compliant</h3>
                  <p className="text-slate-500">We handle the heavy lifting. Card data never touches your servers.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-none rounded-3xl overflow-hidden relative group">
              <CardContent className="p-10 flex flex-col h-full justify-between relative z-10">
                <Fingerprint size={40} className="text-emerald-600" />
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-emerald-950">Security you can trust at scale</h3>
                  <p className="text-emerald-800/80 max-w-md leading-relaxed text-lg">Strong encryption, integrated fraud monitoring, and secure biometric authentication. Reduce chargebacks natively.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. CODE INTEGRATION SECTION */}
      <section className="py-32 bg-slate-50 text-slate-900 relative overflow-hidden border-t border-slate-200">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            
            <div className="order-2 lg:order-1">
              <div className="bg-[#0f172a] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-[#1e293b]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="mx-auto text-xs font-mono text-slate-400 flex items-center gap-2">
                    <Code2 size={14} /> initialize.ts
                  </div>
                </div>
                <div className="p-6 overflow-x-auto text-sm font-mono leading-loose">
                  <span className="text-purple-400">import</span> {'{'} EasyPay {'}'} <span className="text-purple-400">from</span> <span className="text-emerald-400">'@easypay/node'</span>;<br/><br/>
                  <span className="text-slate-500">{'// 1. Initialize SDK'}</span><br/>
                  <span className="text-purple-400">const</span> easypay = <span className="text-purple-400">new</span> <span className="text-amber-300">EasyPay</span>(<span className="text-emerald-400">'sk_live_...'</span>);<br/><br/>
                  <span className="text-slate-500">{'// 2. Create Checkout Session'}</span><br/>
                  <span className="text-purple-400">const</span> <span className="text-blue-400">session</span> = <span className="text-purple-400">await</span> easypay.checkout.<span className="text-blue-300">create</span>({'{'}<br/>
                  &nbsp;&nbsp;amount: <span className="text-orange-400">250000</span>, <span className="text-slate-500">{'// Minor units'}</span><br/>
                  &nbsp;&nbsp;currency: <span className="text-emerald-400">'ETB'</span>,<br/>
                  &nbsp;&nbsp;success_url: <span className="text-emerald-400">'https://yoursite.com/success'</span>,<br/>
                  &nbsp;&nbsp;cancel_url: <span className="text-emerald-400">'https://yoursite.com/cancel'</span>,<br/>
                  &nbsp;&nbsp;metadata: {'{'}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;order_id: <span className="text-emerald-400">'ord_987654321'</span><br/>
                  &nbsp;&nbsp;{'}'}<br/>
                  {'}'});<br/><br/>
                  <span className="text-slate-500">{'// 3. Redirect Customer'}</span><br/>
                  res.<span className="text-blue-300">redirect</span>(303, session.url);
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">Payment solutions built for developers</h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-10">Ship payments faster with one robust API integration. Go live with a checkout that fits your stack and scales with your business.</p>
              
              <ul className="space-y-5">
                {[
                  'Accept and verify payments via robust REST APIs',
                  'Webhooks for real-time asynchronous events',
                  'Test environment to simulate edge cases before going live',
                  'SDKs and plugins for Node, Go, React, and Python'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="mt-12 bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 rounded-full font-bold shadow-lg shadow-slate-900/10">
                Explore Documentation
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <Globe size={14} /> Global Reach
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Scale your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  digital presence.
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Join thousands of leading businesses relying on EasyPay's unified digital payment infrastructure. Built for speed, security, and global scale.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
                  <Link to="/login" className="flex items-center">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-full px-10 h-16 font-bold text-lg shadow-sm">
                  Contact Sales
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
                  <div className="text-xs font-mono text-slate-400 mb-4 border-b border-slate-700 pb-2 flex justify-between">
                    <span>POST /v1/payments</span>
                    <span className="text-emerald-400">200 OK</span>
                  </div>
                  <div className="font-mono text-sm text-slate-300 space-y-1">
                    <span className="text-blue-400">"status"</span>: <span className="text-emerald-400">"succeeded"</span>,<br/>
                    <span className="text-blue-400">"amount"</span>: <span className="text-orange-400">450000</span>,<br/>
                    <span className="text-blue-400">"currency"</span>: <span className="text-emerald-400">"ETB"</span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-16 -translate-x-8 opacity-90 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400"><CheckCircle2 size={20}/></div>
                    <div>
                      <div className="text-sm font-bold text-white">Payment Verified</div>
                      <div className="text-xs text-slate-400">Webhook fired at 14:02:45</div>
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