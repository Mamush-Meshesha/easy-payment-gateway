import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Code2, Terminal, ShieldCheck, 
  Database, RefreshCcw, ArrowRight, Webhook
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

export default function DocsLanding() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-blue-500" opacity={0.3} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-blue-200">
              <BookOpen size={14} /> Documentation
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              Build with <br/><span className="text-blue-600">confidence.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10">
              Explore our guides and API reference to integrate payments seamlessly. Everything you need to get up and running quickly.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 font-bold text-base shadow-lg shadow-blue-500/20 group">
                <Link to="/docs/quickstart" className="flex items-center">
                  Quickstart Guide <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base border-slate-200 hover:bg-slate-50 text-slate-700">
                <Link to="/docs/api">API Reference</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. DOCS CATEGORIES */}
      <section className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Terminal size={24} className="text-emerald-600" />,
                title: "Quickstart",
                desc: "Get your first transaction running in under 5 minutes.",
                link: "/docs/quickstart"
              },
              {
                icon: <Database size={24} className="text-blue-600" />,
                title: "API Reference",
                desc: "Complete REST API documentation and endpoints.",
                link: "/docs/api"
              },
              {
                icon: <Code2 size={24} className="text-purple-600" />,
                title: "SDKs & Libraries",
                desc: "Official client libraries for Node, Go, Python, and PHP.",
                link: "/docs/sdks"
              },
              {
                icon: <ShieldCheck size={24} className="text-amber-600" />,
                title: "Sandbox Testing",
                desc: "Simulate edge cases and test safely in our sandbox.",
                link: "/docs/sandbox"
              },
              {
                icon: <Webhook size={24} className="text-rose-600" />,
                title: "Webhooks",
                desc: "Listen for real-time events asynchronously.",
                link: "/docs/webhooks"
              }
            ].map((doc, i) => (
              <Link to={doc.link} key={i} className="block group">
                <Card className="h-full border border-slate-200 shadow-md shadow-slate-200/50 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 bg-white">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      {doc.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                    <p className="text-slate-600 leading-relaxed mb-4">{doc.desc}</p>
                    <div className="font-bold text-sm text-blue-600 flex items-center">
                      Read Docs <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CTA */}
      <section className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Need technical help?</h2>
          <p className="text-xl text-slate-600 mb-10">Join our developer community or reach out to support for architectural guidance.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-10 h-16 font-extrabold text-lg shadow-xl shadow-slate-900/10 group">
              <Link to="/community" className="flex items-center">
                Join Discord <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-10 h-16 font-extrabold text-lg border-slate-200 hover:bg-slate-50 text-slate-700">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
