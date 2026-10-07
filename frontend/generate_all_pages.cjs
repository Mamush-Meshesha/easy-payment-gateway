const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages', 'public');

const templates = {
  products: (title, subtitle, desc, icon1, icon2, icon3, feature1, feature2, feature3, color) => `import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ${icon1}, ${icon2}, ${icon3}, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ${title.replace(/\s+/g, '')}() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-hidden">
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-b from-${color}-50/50 to-transparent pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${color}-100 text-${color}-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
              <${icon1} size={14} /> Product
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-6">
              ${title} <br className="hidden lg:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-${color}-600 to-${color}-400">${subtitle}</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">${desc}</p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-slate-900 text-white rounded-full px-8 h-14 font-bold shadow-lg shadow-slate-900/20">
                <Link to="/login" className="flex items-center">Get Started <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
            </div>
          </div>
          <div className="relative h-[400px] bg-gradient-to-tr from-${color}-100 to-white rounded-3xl border border-slate-100 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute w-64 h-64 bg-${color}-500/20 blur-3xl rounded-full"></div>
            <${icon2} size={120} className="text-${color}-500 relative z-10" strokeWidth={1} />
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Industry standard capabilities.</h2>
            <p className="text-lg text-slate-600">Enterprise grade infrastructure built for scale and reliability.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200 rounded-3xl shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <${icon1} className="text-${color}-500 w-10 h-10 mb-6"/>
                <h3 className="text-xl font-bold mb-3">${feature1}</h3>
                <p className="text-slate-500">Robust, secure, and optimized for maximum performance across all regions.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 rounded-3xl shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <${icon2} className="text-${color}-500 w-10 h-10 mb-6"/>
                <h3 className="text-xl font-bold mb-3">${feature2}</h3>
                <p className="text-slate-500">Seamless integration into your existing workflows without technical overhead.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 rounded-3xl shadow-md hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <${icon3} className="text-${color}-500 w-10 h-10 mb-6"/>
                <h3 className="text-xl font-bold mb-3">${feature3}</h3>
                <p className="text-slate-500">Scale automatically from day one to millions of transactions seamlessly.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-slate-900 rounded-[3rem] p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <h2 className="text-4xl font-black mb-6">Ready to scale your business?</h2>
            <Button size="lg" className="bg-white text-slate-900 rounded-full px-10 h-16 font-extrabold text-lg">
              <Link to="/login">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}`,

  solutions: (title, subtitle, desc, icon1, icon2, icon3, feature1, feature2, feature3) => `import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ${icon1}, ${icon2}, ${icon3} } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ${title.replace(/\s+/g, '')}() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden">
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold tracking-widest uppercase mb-6">
            <${icon1} size={14} /> Solutions
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">${title}</h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-3xl mx-auto">${subtitle} ${desc}</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8 h-14 font-bold shadow-lg">
              <Link to="/contact" className="flex items-center">Contact Sales <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><${icon1} size={28}/></div>
              <h3 className="text-2xl font-bold mb-4">${feature1}</h3>
              <p className="text-slate-600 text-lg">Customizable infrastructure tailored to your exact operational requirements.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><${icon2} size={28}/></div>
              <h3 className="text-2xl font-bold mb-4">${feature2}</h3>
              <p className="text-slate-600 text-lg">World-class reliability and uptime, ensuring your business never stops running.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6"><${icon3} size={28}/></div>
              <h3 className="text-2xl font-bold mb-4">${feature3}</h3>
              <p className="text-slate-600 text-lg">Dedicated account managers and technical support available 24/7/365.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}`,

  docs: (title, subtitle, code) => `import React from 'react';
import { Code2, Terminal, Database, BookOpen } from 'lucide-react';

export default function ${title.replace(/\s+/g, '')}() {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white pt-32 pb-24 font-sans">
      <div className="container mx-auto max-w-7xl px-6 grid xl:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/40 text-blue-400 text-xs font-bold uppercase mb-8 border border-blue-800">
            <BookOpen size={14} /> Developer Documentation
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">${title}</h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed">${subtitle}</p>
          <div className="space-y-6 text-slate-300">
            <div className="flex gap-4"><Terminal className="text-blue-500 shrink-0"/><div><h4 className="font-bold text-white text-lg">RESTful Endpoints</h4><p className="text-slate-400">Predictable, resource-oriented URLs.</p></div></div>
            <div className="flex gap-4"><Code2 className="text-emerald-500 shrink-0"/><div><h4 className="font-bold text-white text-lg">Strongly Typed SDKs</h4><p className="text-slate-400">Available in Node, Go, Python, and PHP.</p></div></div>
            <div className="flex gap-4"><Database className="text-purple-500 shrink-0"/><div><h4 className="font-bold text-white text-lg">Idempotent Requests</h4><p className="text-slate-400">Safe retries for every API call.</p></div></div>
          </div>
        </div>
        <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl p-6 font-mono text-sm overflow-x-auto">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <pre className="text-emerald-400"><code>${code}</code></pre>
        </div>
      </div>
    </div>
  );
}`
};

const pagesData = [
  // Products
  { path: 'products/PaymentLinks.tsx', type: 'products', args: ['Payment Links', 'Get paid instantly.', 'Share links via WhatsApp, SMS, or email. Perfect for invoices and social commerce.', 'LinkIcon', 'Smartphone', 'Zap', 'Instant Generation', 'Custom Amounts', 'Auto Receipts', 'blue'] },
  { path: 'products/QrPayments.tsx', type: 'products', args: ['QR Payments', 'Contactless in-person.', 'Generate dynamic QR codes for your customers to scan and pay instantly using mobile wallets.', 'Smartphone', 'Scan', 'ShieldCheck', 'Dynamic Pricing', 'Multi-Wallet', 'Offline Mode', 'purple'] },
  { path: 'products/Settlements.tsx', type: 'products', args: ['Settlements', 'Faster payouts.', 'Get your money faster, every single day automatically on a T+1 basis.', 'Banknote', 'PieChart', 'Activity', 'T+1 Payouts', 'Automated Recon', 'Multi-currency', 'amber'] },
  
  // Solutions
  { path: 'solutions/Enterprise.tsx', type: 'solutions', args: ['Enterprise', 'Scale without limits.', 'Custom architecture, dedicated TAMs, and SLAs for high-volume processors.', 'Building', 'Activity', 'ShieldCheck', '99.999% SLA', 'Custom Integration', 'Volume Pricing'] },
  { path: 'solutions/Ecommerce.tsx', type: 'solutions', args: ['Ecommerce', 'Optimize checkout.', 'Plug and play plugins for Shopify, WooCommerce and Magento.', 'ShoppingBag', 'Globe', 'Zap', 'Cart Recovery', 'Inventory Sync', '1-Click Buy'] },
  { path: 'solutions/Saas.tsx', type: 'solutions', args: ['SaaS', 'Smart subscriptions.', 'Automated recurring billing and proration logic.', 'Cloud', 'Repeat', 'Code2', 'Smart Retries', 'Usage Billing', 'Customer Portal'] },
  { path: 'solutions/Startups.tsx', type: 'solutions', args: ['Startups', 'Move fast.', 'Developer-first APIs with massive free-tier credits to help you grow.', 'Rocket', 'Zap', 'Terminal', 'Startup Credits', 'Slack Support', 'Modern SDKs'] },
  
  // Company
  { path: 'company/About.tsx', type: 'solutions', args: ['About Us', 'Our Mission.', 'Building the financial internet of Africa by unifying disparate payment methods.', 'Globe', 'Users', 'Activity', 'Founded 2023', 'Addis HQ', 'YC Backed'] },
  { path: 'company/Careers.tsx', type: 'solutions', args: ['Careers', 'Build the future.', 'Join our engineering and product teams to solve hard distributed systems problems.', 'Users', 'Code2', 'Rocket', 'Remote-first', 'Equity', 'Health Cover'] },
  { path: 'Blog.tsx', type: 'solutions', args: ['Engineering Blog', 'Technical insights.', 'Deep dives into our architecture, ledger logic, and scaling challenges.', 'BookOpen', 'Terminal', 'Database', 'Architecture', 'Updates', 'Culture'] },
  { path: 'Contact.tsx', type: 'solutions', args: ['Contact Sales', 'We are here to help.', 'Get in touch with our enterprise account executives.', 'Phone', 'Mail', 'MessageSquare', '24/7 Support', 'Consulting', 'Custom Pricing'] },
  { path: 'Community.tsx', type: 'solutions', args: ['Developer Forum', 'Build together.', 'Share integrations and get help from the developer community.', 'Users', 'Terminal', 'Code2', 'Q&A', 'Showcase', 'Beta Access'] },

  // Docs
  { path: 'docs/ApiReference.tsx', type: 'docs', args: ['API Reference', 'Complete REST API documentation.', 'curl -X POST https://api.easypay.com/v1/payments \\\n  -H "Authorization: Bearer sk_test_123" \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "amount": 5000,\n    "currency": "ETB"\n  }\''] },
  { path: 'docs/Quickstart.tsx', type: 'docs', args: ['Quickstart Guide', 'First transaction in 5 minutes.', 'npm install @easypay/node\n\nimport { EasyPay } from "@easypay/node";\nconst ep = new EasyPay("sk_test_123");\n\nconst session = await ep.checkout.create({\n  amount: 1000\n});'] },
  { path: 'docs/Sdks.tsx', type: 'docs', args: ['SDKs & Libraries', 'Native support for your stack.', 'npm install @easypay/node\ngo get github.com/easypay/easypay-go\npip install easypay-python\ncomposer require easypay/easypay-php'] },
  { path: 'docs/Sandbox.tsx', type: 'docs', args: ['Sandbox Testing', 'Simulate edge cases safely.', '// Force a declined card response\nconst session = await ep.checkout.create({\n  amount: 5000,\n  card: "4000 0000 0000 0002"\n});'] },
  { path: 'docs/Webhooks.tsx', type: 'docs', args: ['Webhooks', 'Listen for real-time events asynchronously.', 'app.post("/webhook", express.raw(), (req, res) => {\n  const sig = req.headers["easypay-signature"];\n  const event = ep.webhooks.constructEvent(req.body, sig, endpointSecret);\n  \n  if (event.type === "payment.succeeded") {\n    fulfillOrder(event.data.object);\n  }\n  res.json({received: true});\n});'] },
];

pagesData.forEach(({ path: p, type, args }) => {
  const fileContent = templates[type](...args);
  const fullPath = path.join(pagesDir, p);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  
  let finalContent = fileContent;
  if(type === 'products') {
     finalContent = finalContent.replace(/import { ArrowRight/g, 'import { ArrowRight, Link as LinkIcon, QrCode as Scan, Banknote, Smartphone, ShieldCheck, Activity, PieChart, Zap');
  }
  if(type === 'solutions') {
     finalContent = finalContent.replace(/import { ArrowRight/g, 'import { ArrowRight, Building, ShoppingBag, Cloud, Rocket, Globe, Users, BookOpen, Phone, Mail, MessageSquare, Terminal, Database, Code2, Repeat, Activity, ShieldCheck, Zap');
  }
  
  fs.writeFileSync(fullPath, finalContent);
});

console.log("All 17 pages generated successfully.");
