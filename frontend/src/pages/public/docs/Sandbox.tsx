import React from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sandbox() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-8">
          <Link to="/docs" className="text-blue-600 font-bold hover:underline flex items-center text-sm">
            ← Back to Documentation
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase mb-6 border border-amber-200">
          <BookOpen size={14} /> Sandbox Testing
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">
          Testing your integration
        </h1>
        <p className="text-xl text-slate-600 mb-12 leading-relaxed">
          EasyPay provides a complete sandbox environment that mirrors production. You can use it to test your integration without moving real money. 
          All requests made using your test mode API keys (`sk_test_...` and `pk_test_...`) never hit the banking networks.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Test Card Numbers</h2>
          <p className="text-slate-600 mb-6">
            Use the following test card numbers to simulate successful payments. For the expiration date, use any valid date in the future. For the CVC, use any 3 digits.
          </p>
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Brand</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Card Number</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Expected Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Visa</td>
                  <td className="px-4 py-3 font-mono text-blue-600">4242 4242 4242 4242</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold flex items-center gap-2">Success</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Mastercard</td>
                  <td className="px-4 py-3 font-mono text-blue-600">5555 5555 5555 4444</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold flex items-center gap-2">Success</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">American Express</td>
                  <td className="px-4 py-3 font-mono text-blue-600">3782 822463 10005</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold flex items-center gap-2">Success</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Simulating Declines</h2>
          <p className="text-slate-600 mb-6">
            It is critical to test how your application handles failed payments. Use these card numbers to force specific decline codes.
          </p>
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Decline Reason</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Card Number</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Error Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Generic Decline</td>
                  <td className="px-4 py-3 font-mono text-rose-600">4000 0000 0000 0002</td>
                  <td className="px-4 py-3 font-mono text-slate-500">card_declined</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Insufficient Funds</td>
                  <td className="px-4 py-3 font-mono text-rose-600">4000 0000 0000 0003</td>
                  <td className="px-4 py-3 font-mono text-slate-500">insufficient_funds</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Lost/Stolen Card</td>
                  <td className="px-4 py-3 font-mono text-rose-600">4000 0000 0000 0004</td>
                  <td className="px-4 py-3 font-mono text-slate-500">stolen_card</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
          <AlertTriangle className="text-amber-600 w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-900 text-lg mb-2">Going Live</h3>
            <p className="text-amber-800 leading-relaxed">
              When you are ready to accept real money, you must switch your API keys from <code>sk_test_...</code> to <code>sk_live_...</code>. Real cards will immediately fail if used with test keys, and test cards will be rejected by live keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}