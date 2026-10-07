import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, ArrowRight, Laptop, Heart, 
  BookOpen, Plane, Coffee, ChevronRight
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

export default function Careers() {
  const jobs = [
    { title: 'Senior Backend Engineer', department: 'Engineering', location: 'Addis Ababa / Remote', type: 'Full-time' },
    { title: 'Frontend Engineer (React)', department: 'Engineering', location: 'Remote', type: 'Full-time' },
    { title: 'Product Designer', department: 'Design', location: 'Addis Ababa', type: 'Full-time' },
    { title: 'Developer Advocate', department: 'Developer Relations', location: 'Remote', type: 'Full-time' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden font-sans">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-white border-b border-slate-100 overflow-hidden">
        <WaveBackground color="text-indigo-400" opacity={0.3} className="opacity-70" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-indigo-100">
              <Users size={14} /> Hiring
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8">
              Do the best work <br className="hidden md:block"/> of your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">career.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              We are tackling the hardest distributed systems problems in FinTech. Join us in building the financial infrastructure for the next billion digital consumers.
            </motion.p>
            
            <motion.div variants={fadeIn}>
               <a href="#open-roles">
                 <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-14 font-bold shadow-lg shadow-slate-900/10">
                   View Open Roles
                 </Button>
               </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PERKS SECTION */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">How we take care of you.</h2>
            <p className="text-lg text-slate-600">We demand excellence, and we support you with the best benefits, tools, and culture to help you achieve it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-6">
                  <Laptop size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Top-tier Equipment</h3>
                <p className="text-slate-600 leading-relaxed text-sm">You choose your setup. We provide top-of-the-line MacBooks or ThinkPads, monitors, and an ergonomic home office stipend.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                  <Heart size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Premium Health</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Comprehensive medical, dental, and vision coverage for you and your dependents, plus mental health days.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Plane size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Work from Anywhere</h3>
                <p className="text-slate-600 leading-relaxed text-sm">We are a remote-first team. Work from our beautiful HQ in Addis Ababa or anywhere in the world with reliable internet.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Learning Budget</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Annual stipend for books, courses, conferences, or specialized training to help you master your craft.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden md:col-span-2">
              <CardContent className="p-8 flex flex-col justify-center h-full bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <Coffee size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Annual Retreats</h3>
                <p className="text-slate-600 leading-relaxed text-sm max-w-xl">Once a year, we fly the entire company to a beautiful location for a week of strategy, team building, hacking on fun projects, and celebrating our milestones.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section id="open-roles" className="py-32 px-6 bg-white border-t border-slate-100">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Open Roles</h2>
            <p className="text-lg text-slate-600">Join our engineering and product teams.</p>
          </div>

          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div key={idx} className="group p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 bg-white flex flex-col md:flex-row md:items-center justify-between cursor-pointer">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <span>{job.department}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{job.location}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-indigo-600 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  <Button variant="ghost" className="rounded-full hover:bg-indigo-50 hover:text-indigo-700">
                    Apply <ChevronRight size={18} className="ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Don't see a perfect fit?</h3>
            <p className="text-slate-600 mb-6">We are always eager to meet exceptional builders. Send your resume and a bit about yourself.</p>
            <Button variant="outline" className="bg-white border-slate-300 hover:bg-slate-100 rounded-full font-bold">
              Email careers@easypay.co
            </Button>
          </div>
        </div>
      </section>
      
    </div>
  );
}