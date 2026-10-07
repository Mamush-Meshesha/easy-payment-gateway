import React from 'react';
import { BookOpen, Terminal, Code2, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApiReference() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <Link to="/docs" className="text-blue-600 font-bold hover:underline flex items-center text-sm">
            ← Back to Documentation
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase mb-6 border border-blue-200">
                <BookOpen size={14} /> API Reference
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">EasyPay REST API</h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                The EasyPay API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 pb-2">Base URL</h2>
              <p className="text-slate-600 mb-4">All API requests should be made to the following base URL. We serve the API over HTTPS to ensure data privacy.</p>
              <div className="bg-slate-100 rounded p-3 font-mono text-sm border border-slate-200 text-slate-800">
                https://api.easypay.com/v1
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 pb-2">Authentication</h2>
              <p className="text-slate-600 mb-4">
                The EasyPay API uses Bearer tokens to authenticate requests. You can view and manage your API keys in the Developer Dashboard.
              </p>
              <p className="text-slate-600 mb-4">
                Provide your secret key in the Authorization header of every request:
              </p>
              <div className="bg-slate-100 rounded p-3 font-mono text-sm border border-slate-200 text-slate-800">
                Authorization: Bearer sk_test_...
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 pb-2">Create a Payment</h2>
              <p className="text-slate-600 mb-4">
                Creates a new payment intent. This is the first step in the payment flow.
              </p>
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded mr-3">POST</span>
                <code className="font-semibold">/v1/payments</code>
              </div>
              
              <h3 className="font-bold text-lg mb-3">Parameters</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-mono text-blue-600">amount <span className="text-rose-500">*</span></td>
                      <td className="px-4 py-3 text-slate-500">integer</td>
                      <td className="px-4 py-3 text-slate-600">Amount intended to be collected, in the smallest currency unit (e.g., 100 cents to charge $1.00).</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-blue-600">currency <span className="text-rose-500">*</span></td>
                      <td className="px-4 py-3 text-slate-500">string</td>
                      <td className="px-4 py-3 text-slate-600">Three-letter ISO currency code, in lowercase. Must be a supported currency.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-blue-600">description</td>
                      <td className="px-4 py-3 text-slate-500">string</td>
                      <td className="px-4 py-3 text-slate-600">An arbitrary string attached to the object. Often useful for displaying to users.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mb-4 border-b border-slate-200 pb-2">Retrieve a Payment</h2>
              <p className="text-slate-600 mb-4">
                Retrieves the details of a Payment that has previously been created.
              </p>
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded mr-3">GET</span>
                <code className="font-semibold">/v1/payments/:id</code>
              </div>
            </section>

          </div>

          {/* Right side: Code Examples */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24 self-start">
            <div className="bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl p-6 font-mono text-sm overflow-x-auto text-slate-300">
              <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2 font-sans font-semibold text-xs tracking-wider uppercase">Example Request: Create Payment</div>
              <pre className="text-emerald-400 mt-4 leading-relaxed"><code>{`curl -X POST https://api.easypay.com/v1/payments \\
  -H "Authorization: Bearer sk_test_123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "ETB",
    "description": "Premium Subscription"
  }'`}</code></pre>
            </div>
            
            <div className="bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl p-6 font-mono text-sm overflow-x-auto text-slate-300">
              <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2 font-sans font-semibold text-xs tracking-wider uppercase">Example Response</div>
              <pre className="text-blue-300 mt-4 leading-relaxed"><code>{`{
  "id": "pay_9a8b7c6d5e",
  "object": "payment",
  "amount": 5000,
  "currency": "etb",
  "status": "requires_payment_method",
  "created_at": 1678901234,
  "description": "Premium Subscription",
  "metadata": {}
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}