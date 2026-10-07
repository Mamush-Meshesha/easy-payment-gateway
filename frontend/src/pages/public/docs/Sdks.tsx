import React from 'react';
import { BookOpen, Box, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sdks() {
  const sdks = [
    {
      name: "Node.js",
      language: "JavaScript / TypeScript",
      install: "npm install @easypay/node",
      color: "bg-emerald-500",
      link: "https://github.com/easypay/easypay-node"
    },
    {
      name: "Go",
      language: "Golang",
      install: "go get github.com/easypay/easypay-go",
      color: "bg-blue-500",
      link: "https://github.com/easypay/easypay-go"
    },
    {
      name: "Python",
      language: "Python 3.7+",
      install: "pip install easypay-python",
      color: "bg-amber-500",
      link: "https://github.com/easypay/easypay-python"
    },
    {
      name: "PHP",
      language: "PHP 8.0+",
      install: "composer require easypay/easypay-php",
      color: "bg-indigo-500",
      link: "https://github.com/easypay/easypay-php"
    },
    {
      name: "Ruby",
      language: "Ruby 2.7+",
      install: "gem install easypay",
      color: "bg-rose-500",
      link: "https://github.com/easypay/easypay-ruby"
    },
    {
      name: "Java",
      language: "Java 11+",
      install: `<dependency>
  <groupId>com.easypay</groupId>
  <artifactId>easypay-java</artifactId>
  <version>1.2.0</version>
</dependency>`,
      color: "bg-orange-500",
      link: "https://github.com/easypay/easypay-java"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-8">
          <Link to="/docs" className="text-blue-600 font-bold hover:underline flex items-center text-sm">
            ← Back to Documentation
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase mb-6 border border-purple-200">
          <BookOpen size={14} /> Libraries & SDKs
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">
          Official Server-side SDKs
        </h1>
        <p className="text-xl text-slate-600 mb-12 leading-relaxed">
          The EasyPay API is organized around REST, but we strongly recommend using our official SDKs for interacting with the API from your backend servers. They provide robust error handling, automatic retries, and strict typings.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sdks.map((sdk, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${sdk.color}`}></div>
                  <h3 className="font-bold text-xl">{sdk.name}</h3>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {sdk.language}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-sm overflow-x-auto text-slate-800 mb-4">
                <pre><code>{sdk.install}</code></pre>
              </div>
              <a href={sdk.link} className="text-blue-600 font-semibold text-sm hover:underline flex items-center">
                View on GitHub <ArrowRight size={14} className="ml-1" />
              </a>
            </div>
          ))}
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Client-side SDKs (Browser, iOS, Android)</h2>
          <p className="text-slate-600 mb-6">
            For security reasons, you should <strong>never</strong> use the server-side SDKs listed above in client-side applications like React, Vue, iOS, or Android, because they require your secret API key.
          </p>
          <p className="text-slate-600 mb-6">
            Instead, use our client-side SDKs configured with your <strong>publishable key</strong> to securely collect payment details directly from your customers, without the sensitive data ever touching your servers.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center text-slate-700 font-semibold"><Box size={18} className="text-blue-500 mr-2" /> EasyPay.js (Vanilla JS)</li>
            <li className="flex items-center text-slate-700 font-semibold"><Box size={18} className="text-blue-500 mr-2" /> React Native EasyPay</li>
            <li className="flex items-center text-slate-700 font-semibold"><Box size={18} className="text-blue-500 mr-2" /> EasyPay iOS (Swift)</li>
            <li className="flex items-center text-slate-700 font-semibold"><Box size={18} className="text-blue-500 mr-2" /> EasyPay Android (Kotlin)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}