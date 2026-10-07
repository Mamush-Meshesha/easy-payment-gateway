import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Globe, LayoutDashboard, ArrowRight, Code2,
  Banknote, ShieldCheck, Lock, Radar, ChevronRight, Terminal, Rocket, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WaveBackground } from '@/components/ui/WaveBackground';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans overflow-x-hidden">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden bg-white">
        <WaveBackground color="text-emerald-500" opacity={0.5} className="opacity-70" />

        <motion.div
          className="container mx-auto px-6 relative z-20 flex flex-col items-center text-center max-w-5xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeIn} className="mb-8">
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors border-none text-xs font-semibold tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              THE NEW STANDARD FOR AFRICAN PAYMENTS
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-8">
            Powerful financial <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
              infrastructure for the internet.
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
            EasyPay provides the API layer that seamlessly connects businesses to global and local payment networks. Built for developers, optimized for conversion.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 text-base font-semibold group shadow-xl shadow-slate-900/20">
              <Link to="/login" className="flex items-center">
                Start building
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-semibold border-slate-200 hover:bg-slate-50 text-slate-700">
              Contact sales
            </Button>
          </motion.div>

          {/* Hero Code Snippet / Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-4xl mx-auto z-30 hidden lg:block text-left"
          >
            <Card className="bg-[#0f172a] border-slate-700/50 shadow-2xl shadow-indigo-500/10 overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-[#1e293b]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Terminal size={12} /> create-payment.ts
                </div>
              </div>
              <CardContent className="p-6 overflow-x-auto">
                <pre className="text-sm font-mono leading-relaxed">
                  <code className="text-slate-300">
                    <span className="text-purple-400">import</span> {'{'} EasyPay {'}'} <span className="text-purple-400">from</span> <span className="text-emerald-400">'@easypay/node'</span>;<br /><br />
                    <span className="text-slate-500">{'// Initialize with your secret key'}</span><br />
                    <span className="text-purple-400">const</span> easypay = <span className="text-purple-400">new</span> <span className="text-amber-300">EasyPay</span>(<span className="text-emerald-400">'sk_test_...'</span>);<br /><br />
                    <span className="text-purple-400">const</span> <span className="text-blue-400">payment</span> = <span className="text-purple-400">await</span> easypay.payments.<span className="text-blue-300">create</span>({'{'}<br />
                    &nbsp;&nbsp;amount: <span className="text-orange-400">5000</span>,<br />
                    &nbsp;&nbsp;currency: <span className="text-emerald-400">'ETB'</span>,<br />
                    &nbsp;&nbsp;payment_method: <span className="text-emerald-400">'telebirr'</span>,<br />
                    &nbsp;&nbsp;metadata: {'{'}<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;order_id: <span className="text-emerald-400">'ord_12345'</span><br />
                    &nbsp;&nbsp;{'}'}<br />
                    {'}'});
                  </code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Spacer for the overlapping terminal (Removed since it's now in-flow) */}
      <div className="h-12 bg-slate-50"></div>

      {/* 2. BENTO BOX FEATURES */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Engineered for absolute reliability
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We've abstracted the complexity of banking rails into a suite of modular APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,_auto)]">

            {/* Feature 1 */}
            <Card className="md:col-span-2 border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative bg-white">
              <CardContent className="p-8 h-full flex flex-col justify-between z-10 relative">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Code2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Developer-centric APIs</h3>
                  <p className="text-slate-600 leading-relaxed max-w-md">
                    A unified, beautifully designed API that abstracts away the idiosyncrasies of local banks, mobile money operators, and international card networks.
                  </p>
                </div>
              </CardContent>
              {/* Decorative background element */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none"></div>
            </Card>

            {/* Feature 2 */}
            <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Immutable Core Ledger</h3>
                <p className="text-slate-600 leading-relaxed">
                  Every transaction is backed by a double-entry ledger system. Mathematical certainty that your balances are always accurate.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Banknote size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Next-day Settlements</h3>
                <p className="text-slate-600 leading-relaxed">
                  Automated T+1 settlements directly to your bank account. Stop waiting weeks for your revenue to clear.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="md:col-span-2 border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group bg-white overflow-hidden relative">
              <CardContent className="p-8 h-full flex flex-col md:flex-row items-center justify-between gap-8 z-10 relative">
                <div className="max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <LayoutDashboard size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Intelligent Dashboard</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Real-time visibility into your cash flow, webhooks, API keys, and dispute management, all from a world-class interface.
                  </p>
                </div>
                {/* Mini Dashboard Graphic */}
                <div className="w-full md:w-48 h-32 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-inner">
                  <div className="h-2 w-1/3 bg-slate-300 rounded-full"></div>
                  <div className="flex gap-2 items-end h-full mt-auto">
                    <motion.div animate={{ height: ['40%', '60%', '40%'] }} transition={{ repeat: Infinity, duration: 2 }} className="w-full bg-blue-500 rounded-t-sm"></motion.div>
                    <motion.div animate={{ height: ['70%', '50%', '70%'] }} transition={{ repeat: Infinity, duration: 2.5 }} className="w-full bg-blue-500 rounded-t-sm"></motion.div>
                    <motion.div animate={{ height: ['100%', '80%', '100%'] }} transition={{ repeat: Infinity, duration: 3 }} className="w-full bg-emerald-500 rounded-t-sm"></motion.div>
                    <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ repeat: Infinity, duration: 2.2 }} className="w-full bg-blue-500 rounded-t-sm"></motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* 3. TRUST SECTION */}
      <section className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-12 max-w-3xl mx-auto">
            "EasyPay hasn't just improved our payment success rates—it's fundamentally transformed how we operate our financial backend."
          </h2>

          <div className="flex items-center justify-center gap-4 mb-20">
            <img src="https://i.pravatar.cc/100?img=12" alt="Avatar" className="w-14 h-14 rounded-full border-2 border-slate-200 shadow-sm" />
            <div className="text-left">
              <div className="font-bold text-slate-900 text-lg">John Due</div>
              <div className="text-slate-500">CEO at EasyPay</div>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by Pioneers</p>
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-2 text-xl font-extrabold text-slate-800"><Globe className="text-blue-600" /> Awash Bank</div>
            <div className="flex items-center gap-2 text-xl font-extrabold text-slate-800"><Zap className="text-emerald-500" /> EthioTelecom</div>
            <div className="flex items-center gap-2 text-xl font-extrabold text-slate-800"><Shield className="text-indigo-600" /> Dashen</div>
          </div>
        </div>
      </section>

      {/* 4. SECURITY SECTION */}
      <section className="py-32 px-6 bg-slate-50 text-slate-900 relative overflow-hidden border-t border-slate-200">
        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center">

          {/* Visual Left Side */}
          <div className="relative h-80 flex items-center justify-center">
            <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute inset-10 border border-emerald-500/30 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
            <div className="relative z-10 w-32 h-32 bg-white border border-emerald-200 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={56} className="text-emerald-500" />
            </div>
          </div>

          {/* Content Right Side */}
          <div className="relative z-20">
            <div className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-4">
              Fort Knox Security
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-slate-900">
              Military-grade compliance, by default.
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-10">
              We've abstracted away the heavy lifting of compliance and security. From PCI DSS to continuous AI fraud monitoring, your transactions are protected at the lowest hardware levels.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <Lock className="text-emerald-500 shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">End-to-End Encryption</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">AES-256 encryption at rest and TLS 1.3 in transit. Card data never touches your servers.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Radar className="text-emerald-500 shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Real-time Velocity Checks</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">Our risk engine analyzes behavioral patterns in milliseconds to block automated fraud rings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION - Enterprise Edition */}
      <section className="relative py-32 bg-slate-50 text-slate-900 overflow-hidden border-t border-slate-200">
        {/* Architectural Grid Background (Light Mode) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

        {/* Core Glow (Subtle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <Rocket size={14} /> Built for Scale
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Ready to scale <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
                  your business?
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Join thousands of businesses building the future of commerce in Africa. Go live in minutes with our developer-friendly APIs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
                  <Link to="/login" className="flex items-center">
                    Create free account
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-full px-10 h-16 font-bold text-lg shadow-sm">
                  Contact sales
                </Button>
              </div>
            </div>

            {/* Right Column: Abstract Graphic (Keep Dark Terminal vibe) */}
            <div className="hidden lg:flex justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent to-transparent z-10"></div>

              {/* Stacked Code/API Blocks */}
              <div className="relative w-full max-w-md">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-20 translate-x-8"
                >
                  <div className="text-xs font-mono text-slate-400 mb-4 border-b border-slate-700 pb-2 flex justify-between">
                    <span>GET /v1/balance</span>
                    <span className="text-emerald-400">200 OK</span>
                  </div>
                  <div className="font-mono text-sm text-slate-300 space-y-1">
                    <span className="text-blue-400">"available"</span>: [<br />
                    &nbsp;&nbsp;{'{'} <span className="text-blue-400">"amount"</span>: <span className="text-orange-400">4500000</span>, <span className="text-blue-400">"currency"</span>: <span className="text-emerald-400">"ETB"</span> {'}'}<br />
                    ]
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-10 -translate-x-8 opacity-90 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><Activity size={16} /></div>
                      <span className="text-slate-300 text-sm font-semibold">System Status: 100% Uptime</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#040914] text-white pt-24 pb-12 px-6 border-t border-slate-800/50 overflow-hidden relative">
        <div className="absolute bottom-0 right-0 text-[30rem] font-black text-white/[0.02] leading-none pointer-events-none select-none translate-y-1/4">
          E
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

            <div className="lg:col-span-2 pr-8">
              <div className="flex items-center gap-2 font-extrabold text-2xl mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white text-xl leading-none">E</span>
                </div>
                EasyPay
              </div>
              <p className="text-slate-400 leading-relaxed mb-8">
                The financial infrastructure built for Africa's most ambitious businesses. Accept payments, manage risk, and scale globally.
              </p>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 max-w-sm">
                <input type="email" placeholder="Email address" className="bg-transparent border-none text-sm text-white px-4 py-2 outline-none w-full" />
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-md">Subscribe</Button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-slate-300">Products</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Checkout</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Payment Links</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">QR Payments</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Radar Fraud</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-slate-300">Developers</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Open Source</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-slate-300">Company</h4>
              <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Customers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>&copy; {new Date().getFullYear()} EasyPay. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
