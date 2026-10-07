import React from 'react';
import { BookOpen, Webhook, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Webhooks() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-8">
          <Link to="/docs" className="text-blue-600 font-bold hover:underline flex items-center text-sm">
            ← Back to Documentation
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase mb-6 border border-rose-200">
          <BookOpen size={14} /> Webhooks
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">
          Listen for events
        </h1>
        <p className="text-xl text-slate-600 mb-12 leading-relaxed">
          Webhooks allow EasyPay to proactively notify your system about asynchronous events, like when a payment succeeds or a recurring subscription is renewed. This is more robust than relying solely on client-side callbacks.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Why use Webhooks?</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Many payment methods are asynchronous. For example, a bank transfer might take several hours to clear. Your application needs a way to be notified when the payment finally succeeds.
          </p>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Even for instantaneous payments like credit cards, webhooks are crucial. If a user closes their browser window exactly after a successful payment but before being redirected to your success URL, your system will never know they paid unless you listen to webhooks.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Important Event Types</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <ul className="divide-y divide-slate-100">
              <li className="p-4">
                <code className="font-mono font-bold text-blue-600 text-sm">payment.succeeded</code>
                <p className="text-slate-600 text-sm mt-1">Sent when a payment is successful. Use this to fulfill the order.</p>
              </li>
              <li className="p-4">
                <code className="font-mono font-bold text-rose-600 text-sm">payment.failed</code>
                <p className="text-slate-600 text-sm mt-1">Sent when a payment attempt fails. Use this to notify the customer.</p>
              </li>
              <li className="p-4">
                <code className="font-mono font-bold text-purple-600 text-sm">refund.completed</code>
                <p className="text-slate-600 text-sm mt-1">Sent when a refund has successfully cleared back to the customer's account.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Verifying Signatures
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Because anyone can send an HTTP POST request to your webhook endpoint, you must verify the cryptographic signature EasyPay includes in the <code>EasyPay-Signature</code> header to ensure the event actually came from us.
          </p>
          
          <div className="bg-[#0f172a] rounded-xl border border-slate-700 p-6 font-mono text-sm overflow-x-auto text-slate-300">
            <pre><code>{`const express = require('express');
const { EasyPay } = require('@easypay/node');

const app = express();
const ep = new EasyPay('sk_test_123');

// This is your webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_abc123";

// Use express.raw() to get the raw body for signature verification
app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['easypay-signature'];

  let event;

  try {
    // This will throw if the signature is invalid
    event = ep.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.log(\`⚠️  Webhook signature verification failed: \${err.message}\`);
    return response.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment.succeeded':
      const paymentIntent = event.data.object;
      console.log(\`Payment for \${paymentIntent.amount} succeeded!\`);
      // Fulfill the order in your database
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});`}</code></pre>
          </div>
        </section>

      </div>
    </div>
  );
}