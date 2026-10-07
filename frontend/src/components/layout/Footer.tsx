import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, MessageSquare, BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-20 px-6 font-sans border-t border-slate-800 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl text-white mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg leading-none">E</span>
              </div>
              EasyPay
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              The unified digital payment infrastructure for African businesses. Build, scale, and process payments securely.
            </p>
            
            {/* Socials */}
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                <MessageSquare size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                <BookOpen size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h4 className="text-white font-bold mb-6">Products</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/products/checkout" className="hover:text-emerald-400 transition-colors">Online Checkout</Link></li>
              <li><Link to="/products/payment-links" className="hover:text-emerald-400 transition-colors">Payment Links</Link></li>
              <li><Link to="/products/qr-payments" className="hover:text-emerald-400 transition-colors">QR Payments</Link></li>
              <li><Link to="/products/radar" className="hover:text-emerald-400 transition-colors">Fraud Radar</Link></li>
              <li><Link to="/products/ledger" className="hover:text-emerald-400 transition-colors">Core Ledger</Link></li>
              <li><Link to="/products/settlements" className="hover:text-emerald-400 transition-colors">Settlements</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Solutions</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/solutions/enterprise" className="hover:text-emerald-400 transition-colors">Enterprise</Link></li>
              <li><Link to="/solutions/ecommerce" className="hover:text-emerald-400 transition-colors">Ecommerce</Link></li>
              <li><Link to="/solutions/saas" className="hover:text-emerald-400 transition-colors">SaaS & Platforms</Link></li>
              <li><Link to="/solutions/startups" className="hover:text-emerald-400 transition-colors">Startups</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Developers</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/docs/api" className="hover:text-emerald-400 transition-colors">API Reference</Link></li>
              <li><Link to="/docs/quickstart" className="hover:text-emerald-400 transition-colors">Quickstart</Link></li>
              <li><Link to="/docs/sdks" className="hover:text-emerald-400 transition-colors">SDKs</Link></li>
              <li><Link to="/docs/webhooks" className="hover:text-emerald-400 transition-colors">Webhooks</Link></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/company/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link to="/company/careers" className="hover:text-emerald-400 transition-colors">Careers <span className="bg-emerald-500/20 text-emerald-400 py-0.5 px-2 rounded-full text-[10px] ml-2 font-bold uppercase">Hiring</span></Link></li>
              <li><Link to="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} EasyPay Technologies Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
