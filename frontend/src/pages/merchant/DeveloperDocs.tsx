import React, { useState } from 'react';
import { Book, Code, Terminal, Webhook } from 'lucide-react';
import './DeveloperDocs.css';
import './DashboardShared.css'; // Use shared dashboard styles

const DeveloperDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'api' | 'webhooks'>('quickstart');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Developer Documentation</h1>
        <p className="dashboard-subtitle">Everything you need to integrate EasyPay into your application.</p>
      </div>

      <div className="dev-docs-layout">
        <div className="dev-docs-sidebar">
          <button 
            className={`dev-docs-tab ${activeTab === 'quickstart' ? 'active' : ''}`}
            onClick={() => setActiveTab('quickstart')}
          >
            <Terminal size={18} />
            Node.js SDK Quickstart
          </button>
          <button 
            className={`dev-docs-tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Code size={18} />
            API Reference
          </button>
          <button 
            className={`dev-docs-tab ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            <Webhook size={18} />
            Webhook Verification
          </button>
        </div>

        <div className="dev-docs-content">
          {activeTab === 'quickstart' && (
            <div className="docs-section">
              <h2>Node.js SDK Quickstart</h2>
              <p>The official <code>@payment-gateway/node</code> SDK allows you to quickly integrate secure payment processing.</p>
              
              <h3>1. Installation</h3>
              <p>Since the SDK is currently in private preview, you can download the tarball package directly and install it into your Node.js project.</p>
              
              <div style={{ margin: '1rem 0 1.5rem 0' }}>
                <a href="/payment-gateway-node-1.0.0.tgz" download className="dashboard-btn primary">
                  <Terminal size={18} style={{ marginRight: '0.5rem' }} />
                  Download Node.js SDK (.tgz)
                </a>
              </div>

              <pre className="code-block">
                <code>npm install ./payment-gateway-node-1.0.0.tgz</code>
              </pre>

              <h3>2. Initialization</h3>
              <p>Use your <code>sk_test_...</code> API key for Sandbox or <code>sk_live_...</code> for Production.</p>
              <pre className="code-block">
                <code>{`import { PaymentGateway } from '@payment-gateway/node';

const gateway = new PaymentGateway('sk_test_a1b2c3d4e5f67890');`}</code>
              </pre>

              <h3>3. Processing a Payment</h3>
              <pre className="code-block">
                <code>{`try {
  const payment = await gateway.payments.create({
    amount: 5000, // 50.00 ETB
    currency: 'ETB',
    paymentMethod: 'TELEBIRR',
    providerId: 'e207906d-e4fb-4b53-b09e-76cba93d7c58',
    merchantReference: 'order-12345',
    returnUrl: 'https://your-store.com/checkout/complete'
  });

  console.log('Redirect URL:', payment.checkoutUrl);
} catch (error) {
  console.error('Failed to initialize payment:', error);
}`}</code>
              </pre>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="docs-section">
              <h2>REST API Reference</h2>
              <p>Our REST API follows strict OpenAPI 3.0 specifications. All requests must be authenticated via the <code>Authorization: Bearer &lt;API_KEY&gt;</code> header.</p>
              
              <div className="api-link-box">
                <Book size={24} className="api-link-icon" />
                <div className="api-link-content">
                  <h3>Interactive API Explorer</h3>
                  <p>View the full OpenAPI specification, including schemas, required fields, and test endpoints directly from your browser.</p>
                  <a href="http://192.168.122.127:8080/api-docs" target="_blank" rel="noreferrer" className="dashboard-btn primary">
                    Open API Docs
                  </a>
                </div>
              </div>

              <h3 style={{ marginTop: '2rem' }}>Error Handling</h3>
              <p>All API errors follow a canonical JSON structure:</p>
              <pre className="code-block">
                <code>{`{
  "error": "validation_error",
  "message": "Field 'amount' must be greater than 0",
  "reference": "trace-id-uuid"
}`}</code>
              </pre>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="docs-section">
              <h2>Webhook Verification</h2>
              <p>Webhooks allow your system to receive real-time updates when a payment succeeds or fails. You must verify the signature to ensure the payload is authentic.</p>

              <h3>Express.js Example</h3>
              <pre className="code-block">
                <code>{`import express from 'express';

const app = express();
const WEBHOOK_SECRET = 'whsec_...'; // From the Webhooks tab

// ⚠️ Crucial: You MUST parse the raw body to verify the signature correctly
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body.toString('utf8');

  try {
    // 1. Verify the signature (throws GatewayError on failure)
    gateway.webhooks.verifySignature(payload, signature, WEBHOOK_SECRET);
    
    // 2. Parse the verified payload
    const event = JSON.parse(payload);
    
    if (event.eventType === 'payment.status.changed') {
      console.log(\`Payment \${event.paymentId} is now \${event.status}\`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    res.status(400).send('Webhook Error');
  }
});`}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperDocs;
