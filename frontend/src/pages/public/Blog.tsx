import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Blog() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase mb-6">
            <BookOpen size={14} /> Engineering Blog
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">Technical insights.</h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">Deep dives into our architecture, ledger logic, and scaling challenges.</p>
        </div>
      </section>
    </div>
  );
}