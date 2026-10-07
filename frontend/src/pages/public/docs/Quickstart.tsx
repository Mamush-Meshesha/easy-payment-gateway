import React from 'react';
import { BookOpen, Terminal, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Quickstart() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pt-32 pb-24 font-sans">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="mb-8">
          <Link to="/docs" className="text-blue-600 font-bold hover:underline flex items-center text-sm">
            ← Back to Documentation
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase mb-6 border border-emerald-200">
          <BookOpen size={14} /> Quickstart Guide
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">
          Accept your first payment
        </h1>
        <p className="text-xl text-slate-600 mb-12 leading-relaxed">
          Learn how to integrate EasyPay into your application in less than 5 minutes. We will guide you through creating an API key, installing the SDK, and processing a test transaction.
        </p>

        <div className="space-y-16">
          {/* Step 1 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg">1</div>
              <h2 className="text-2xl font-bold">Get your API Keys</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Before you can make any requests to the EasyPay API, you need to authenticate yourself using your secret API key. 
              You can find your test API keys in the <Link to="/dashboard/api-keys" className="text-blue-600 font-semibold hover:underline">Developer Dashboard</Link>.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
              <CheckCircle2 className="shrink-0 w-5 h-5 text-blue-600" />
              <p>Keep your secret key confidential! Never commit it to version control or expose it in client-side code (like the browser or a mobile app).</p>
            </div>
          </section>

          {/* Step 2 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg">2</div>
              <h2 className="text-2xl font-bold">Install the SDK</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              While you can interact with our REST API directly using HTTP clients like <code>curl</code> or <code>axios</code>, we highly recommend using our official SDKs for a safer, typed experience.
            </p>
            <div className="bg-[#0f172a] rounded-xl border border-slate-700 p-4 font-mono text-sm overflow-x-auto">
              <div className="text-slate-500 mb-2"># Using npm</div>
              <pre className="text-emerald-400"><code>npm install @easypay/node</code></pre>
              <div className="text-slate-500 mt-4 mb-2"># Using yarn</div>
              <pre className="text-emerald-400"><code>yarn add @easypay/node</code></pre>
            </div>
          </section>

          {/* Step 3 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg">3</div>
              <h2 className="text-2xl font-bold">Create a Checkout Session</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              A Checkout Session represents your customer's intent to pay. You create a session on your server, which returns a secure URL. You then redirect your customer to this URL to securely enter their payment details.
            </p>
            <div className="bg-[#0f172a] rounded-xl border border-slate-700 p-6 font-mono text-sm overflow-x-auto text-slate-300">
              <pre><code>{`import { EasyPay } from "@easypay/node";

// Initialize the client with your secret key
const ep = new EasyPay("sk_test_123456789");

// Define a route to handle the checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await ep.checkout.sessions.create({
      payment_method_types: ['card', 'telebirr', 'm-pesa'],
      line_items: [{
        name: 'Premium Subscription',
        amount: 2500, // Amount in cents (e.g., 25.00 ETB)
        currency: 'ETB',
        quantity: 1,
      }],
      success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/cancel',
    });

    // Send the checkout URL to the client
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`}</code></pre>
            </div>
          </section>

          {/* Step 4 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg">4</div>
              <h2 className="text-2xl font-bold">Fulfill the Order</h2>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Once the customer completes the payment, EasyPay redirects them back to your <code>success_url</code>. However, you should not rely on the client-side redirect for order fulfillment (as the user might close the browser before it redirects). Instead, use Webhooks to asynchronously receive a notification when the payment succeeds.
            </p>
            <Link to="/docs/webhooks" className="inline-flex items-center font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Learn how to set up Webhooks <ArrowRight size={16} className="ml-1" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}