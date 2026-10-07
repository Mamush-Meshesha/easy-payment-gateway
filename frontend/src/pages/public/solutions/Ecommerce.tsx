import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, ArrowRight, Zap, Globe, ShieldCheck, 
  ShoppingCart, CreditCard, Smartphone, CheckCircle2 
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

export default function Ecommerce() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-emerald-500" opacity={0.4} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <ShoppingBag size={14} /> FOR ECOMMERCE
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Supercharge your <br/><span className="text-emerald-600">checkout.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl">
              Increase conversion rates by up to 35% with our seamless, localized payment experience. Plug and play with your favorite commerce platforms.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-emerald-500/20 group">
                <Link to="/contact" className="flex items-center">
                  Start Selling <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base border-slate-200 hover:bg-slate-50 text-slate-700">
                <Link to="/docs">View Plugins</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-3xl transform rotate-3 scale-105 -z-10 blur-xl"></div>
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
              <CardContent className="p-0">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">Checkout Preview</div>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="font-bold text-xl">Order Total</div>
                    <div className="font-extrabold text-2xl text-emerald-600">ETB 4,500.00</div>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="h-12 border border-emerald-500 bg-emerald-50 rounded-xl flex items-center px-4 gap-3 cursor-pointer">
                      <CreditCard className="text-emerald-600" size={20} />
                      <span className="font-bold text-emerald-900">Pay with Card</span>
                      <CheckCircle2 className="ml-auto text-emerald-600" size={20} />
                    </div>
                    <div className="h-12 border border-slate-200 rounded-xl flex items-center px-4 gap-3 text-slate-500 hover:border-emerald-300 transition-colors cursor-pointer">
                      <Smartphone size={20} />
                      <span className="font-medium">Telebirr Mobile Money</span>
                    </div>
                  </div>
                  <Button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold">
                    Complete Purchase
                  </Button>
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
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Built for conversion</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Everything you need to sell more, recover lost sales, and protect your business.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingCart size={24} className="text-emerald-600" />,
                title: "1-Click Checkout",
                desc: "Save customer payment details securely across the network for frictionless repeat purchases."
              },
              {
                icon: <Zap size={24} className="text-amber-600" />,
                title: "Platform Plugins",
                desc: "Native, deeply integrated plugins for Shopify, WooCommerce, Magento, and more."
              },
              {
                icon: <ShieldCheck size={24} className="text-indigo-600" />,
                title: "Fraud Prevention",
                desc: "AI-driven risk engine blocks fraudulent orders before they impact your chargeback ratio."
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Ready to scale your store?</h2>
          <p className="text-xl text-slate-600 mb-10">Join thousands of merchants growing their revenue with our seamless checkout experience.</p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
            <Link to="/contact" className="flex items-center">
              Get Started Today <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}