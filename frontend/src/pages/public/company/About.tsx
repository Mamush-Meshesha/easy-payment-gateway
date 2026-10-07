import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Globe, ArrowRight, ShieldCheck, Zap, Heart, 
  Users, Building, Target, Code, Activity
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

export default function About() {
  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden font-sans">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-slate-400" opacity={0.3} className="opacity-70" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <Globe size={14} /> Our Mission
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8">
              Building the <br className="hidden md:block"/> financial internet of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600">Africa.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              We are a team of engineers, designers, and financial experts dedicated to solving the fragmentation of African payments, starting with Ethiopia.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* THE STORY */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                Why we started EasyPay.
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  For too long, integrating digital payments in our region meant navigating outdated documentation, opaque pricing, and fragmented APIs that required weeks of engineering effort.
                </p>
                <p>
                  We believe that starting an online business should be as simple as writing a few lines of code. By abstracting the complexity of local banks, mobile money providers, and regulatory requirements, we empower developers to focus on what matters most: building great products.
                </p>
                <p>
                  Our ledger-first architecture ensures that every transaction is cryptographically verifiable, instantly reconciled, and seamlessly settled.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-3xl blur-2xl transform -rotate-6 scale-105"></div>
              <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl relative z-10">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-2">3+</div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Major Providers</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-2">T+1</div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Settlement Time</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-2">99.9%</div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Uptime SLA</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-2">5</div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Native SDKs</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-32 px-6 bg-white border-y border-slate-100">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Our Core Values.</h2>
            <p className="text-lg text-slate-600">The principles that guide our engineering decisions, product design, and how we treat our merchants.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Security First</h3>
                <p className="text-slate-600 leading-relaxed text-sm">We handle money, so trust is our primary currency. Our ledger is immutable, and security is built into every layer.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Code size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Developer Centric</h3>
                <p className="text-slate-600 leading-relaxed text-sm">APIs should be joyful to use. We prioritize pristine documentation, strong typing, and intuitive interfaces.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Extreme Reliability</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Downtime means lost revenue for our merchants. We engineer for resilience and graceful degradation.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Target size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Transparency</h3>
                <p className="text-slate-600 leading-relaxed text-sm">No hidden fees, no opaque algorithms. What you see on the dashboard is exactly what happens in the ledger.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 bg-slate-50 overflow-hidden text-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Help us build the future.</h2>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            We are always looking for exceptional engineers, product managers, and designers who want to solve hard distributed systems problems.
          </p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
            <Link to="/company/careers" className="flex items-center">
              View Open Roles
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
      
    </div>
  );
}