import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase mb-6">
            <Phone size={14} /> Contact Sales
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">We are here to help.</h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-3xl mx-auto">Get in touch with our enterprise account executives.</p>
        </div>
      </section>
    </div>
  );
}