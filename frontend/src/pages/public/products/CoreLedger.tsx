import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Database, Lock, Activity, Scale, Server, ArrowRight,
  ShieldCheck, FileCode2, History, GitMerge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaveBackground } from '@/components/ui/WaveBackground';

export default function CoreLedger() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden border-b border-slate-200">
        <WaveBackground color="text-indigo-500" opacity={0.3} className="opacity-70" />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold tracking-widest uppercase mb-8">
              <Database size={14} /> Immutable Architecture
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 text-slate-900">
              Financial truth <br/> built on <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">absolute certainty.</span>
            </motion.h1>
            
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              The core ledger tracks every cent moving through your business with mathematical precision. Double-entry logic, atomic transactions, and an append-only architecture guarantee your balances are never wrong.
            </motion.p>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                Explore Ledger API <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Ledger Visualizer */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-10 font-mono text-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <span className="font-bold text-slate-300">txn_987654321</span>
                <span className="text-emerald-400 text-xs bg-emerald-900/30 px-2 py-1 rounded">COMMITTED</span>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="text-slate-500 text-xs mb-1">DEBIT (Source)</div>
                <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300"><GitMerge size={14} className="text-blue-400"/> acc_customer_wallet</div>
                  <div className="text-blue-400 font-bold">ETB 4,500.00</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-slate-500 text-xs mb-1">CREDIT (Destination)</div>
                <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300"><GitMerge size={14} className="text-emerald-400"/> acc_merchant_pending</div>
                  <div className="text-emerald-400 font-bold">ETB 4,350.00</div>
                </div>
                <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300"><GitMerge size={14} className="text-purple-400"/> acc_easypay_fees</div>
                  <div className="text-purple-400 font-bold">ETB 150.00</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-emerald-500"><Scale size={14}/> BALANCE: ZERO</div>
                <div className="text-slate-500">Atomic Validation Passed</div>
              </div>
            </div>

            {/* Floating decoration */}
            <div className="absolute -bottom-8 -left-8 bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-xl flex items-center gap-3 z-20">
              <Lock className="text-blue-400" />
              <div>
                <div className="text-xs text-slate-400 font-bold">State</div>
                <div className="font-bold text-white">Append-Only</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Engineered like a bank.</h2>
            <p className="text-slate-600 text-lg">We don't use simple database rows for balances. Every state change is a calculated sum of immutable journal entries.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <Lock className="text-blue-600 w-10 h-10 mb-6"/>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Immutability</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Entries can never be deleted or updated. Mistakes require a compensatory reversing entry, ensuring a perfect audit trail.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <Scale className="text-emerald-600 w-10 h-10 mb-6"/>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Double-Entry</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Credits and debits must sum to exactly zero. If a transaction is unbalanced, the database rejects it instantly.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <Activity className="text-purple-600 w-10 h-10 mb-6"/>
              <h3 className="text-xl font-bold mb-3 text-slate-900">High Velocity</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Optimized SQL queries and strict row-level locking allow thousands of concurrent transactions without race conditions.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <ShieldCheck className="text-amber-600 w-10 h-10 mb-6"/>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Idempotent API</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Safely retry network failures. By passing an Idempotency-Key, we guarantee a transaction is only committed to the ledger once.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FINAL CTA - Enterprise Edition */}
      <section className="relative py-32 bg-slate-50 text-slate-900 overflow-hidden border-t border-slate-200">
        {/* Architectural Grid Background (Light Mode) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
        
        {/* Core Glow (Subtle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-700 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                <Database size={14} /> Immutable Source of Truth
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900">
                Build on <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-500">
                  solid ground.
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
                Stop worrying about race conditions and dropped balances. Core Ledger provides the immutable financial truth your engineers need.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
                  <Link to="/login" className="flex items-center">
                    Explore API Docs
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
              
              {/* Abstract Representation of double-entry */}
              <div className="relative w-full max-w-md">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0f172a] rounded-2xl border border-slate-700 p-6 shadow-2xl relative z-20 translate-x-8"
                >
                  <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <span className="text-xs font-mono text-slate-400">Account: User Balance</span>
                    <span className="text-xs font-mono text-cyan-400">CREDIT</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">+ ETB 25,000.00</div>
                  <div className="text-sm text-slate-500">Txn: tx_891xnk23</div>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#1e293b] rounded-2xl border border-slate-600 p-6 shadow-2xl relative z-10 -mt-6 -translate-x-8 opacity-90 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <span className="text-xs font-mono text-slate-400">Account: Telebirr Settlement</span>
                    <span className="text-xs font-mono text-orange-400">DEBIT</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">- ETB 25,000.00</div>
                </motion.div>
                
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center z-30 shadow-2xl">
                  <Scale size={20} className="text-slate-400" />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

    </div>
  );
}