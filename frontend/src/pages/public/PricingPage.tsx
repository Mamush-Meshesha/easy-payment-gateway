import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

const PricingPage: React.FC = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', fontFamily: '"Inter", sans-serif' }}>
      
      {/* HERO SECTION */}
      <section style={{ 
        padding: '160px 24px 100px', 
        textAlign: 'center', 
        background: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{ position: 'absolute', top: '-50%', left: '20%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ color: '#10b981', fontWeight: 800, letterSpacing: '1px', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '24px' }}>
            Transparent Pricing
          </div>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-2px', marginBottom: '24px', lineHeight: 1.1 }}>
            Pay only for what you use.
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '0', lineHeight: 1.6 }}>
            No setup fees, no monthly minimums, no hidden charges. Everything you need to manage your business for one simple rate.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section style={{ padding: '0 24px 120px', background: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          {/* Standard Pay-as-you-go */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '48px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#10b981' }}></div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Pay as you go</h3>
            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.5, marginBottom: '32px' }}>For businesses of all sizes wanting to process payments online instantly.</p>
            
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>2.5%</span>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>per successful transaction</div>
            </div>

            <Link to="/login" style={{ display: 'block', width: '100%', textAlign: 'center', background: '#0f172a', color: 'white', padding: '16px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', marginBottom: '40px', transition: 'background 0.2s' }}>
              Create free account
            </Link>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>What's included</div>
              {[
                'Local Cards (Awash, Dashen, CBE)',
                'Mobile Money (Telebirr, M-Pesa)',
                'Next-day automatic settlements',
                'Advanced fraud protection radar',
                'Real-time webhook notifications',
                '24/7 dedicated email support'
              ].map(feature => (
                <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '0.95rem' }}>
                  <div style={{ background: '#f0fdf4', padding: '2px', borderRadius: '50%', display: 'flex' }}><Check size={16} color="#10b981" /></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise */}
          <div style={{ background: '#0f172a', borderRadius: '24px', padding: '48px', color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Enterprise</h3>
            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.5, marginBottom: '32px' }}>For businesses processing large volumes or requiring custom payment flows.</p>
            
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>Custom</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>volume-based pricing</div>
            </div>

            <a href="#sales" style={{ display: 'block', width: '100%', textAlign: 'center', background: 'white', color: '#0f172a', padding: '16px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', marginBottom: '40px' }}>
              Contact Sales
            </a>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Everything in standard, plus:</div>
              {[
                'Volume-based rate discounts',
                'Custom settlement timelines',
                'Dedicated Technical Account Manager',
                'SLA guaranteed 99.999% uptime',
                'Custom integrations and bespoke flows',
                'Direct Slack channel support'
              ].map(feature => (
                <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2px', borderRadius: '50%', display: 'flex' }}><Check size={16} color="white" /></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* DETAILED BREAKDOWN */}
      <section style={{ padding: '100px 24px', background: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>Payment Methods</h2>
            <p style={{ color: '#64748b', fontSize: '1.125rem', marginTop: '16px' }}>A unified fee structure across all major local payment channels.</p>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '24px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <div>Method</div>
              <div>Domestic Rate</div>
              <div>International Rate</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '32px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 48, height: 48, background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={24} /></div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>Mobile Money</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Telebirr, M-Pesa, CBE Birr</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>2.5%</div>
              <div style={{ color: '#94a3b8' }}>—</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '32px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 48, height: 48, background: '#fdf4ff', color: '#d946ef', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} /></div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>Cards</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Visa, Mastercard, Local ATM</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>3.5%</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>4.5%</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '100px 24px', background: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', marginBottom: '64px', textAlign: 'center' }}>Frequently Asked Questions</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}><HelpCircle size={20} color="#10b981" /> When do I get paid?</h4>
              <p style={{ color: '#64748b', lineHeight: 1.6, paddingLeft: '32px' }}>We process settlements automatically on a T+1 schedule (the next business day). Funds are deposited directly into your linked bank account without any manual intervention.</p>
            </div>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}><HelpCircle size={20} color="#10b981" /> Are there any hidden fees?</h4>
              <p style={{ color: '#64748b', lineHeight: 1.6, paddingLeft: '32px' }}>No. We charge a flat percentage based on the transaction type. There are absolutely no setup fees, monthly minimums, refund fees, or hidden costs.</p>
            </div>
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}><HelpCircle size={20} color="#10b981" /> Can I negotiate my rate?</h4>
              <p style={{ color: '#64748b', lineHeight: 1.6, paddingLeft: '32px' }}>Yes. If you process more than 1,000,000 ETB per month, please contact our sales team to discuss custom Enterprise pricing volume discounts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#090e17', color: 'white', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: '#10b981' }}>
            <div style={{ width: '24px', height: '24px', background: '#10b981', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '0.9rem', lineHeight: 1 }}>E</span>
            </div>
            EasyPay
          </div>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            © 2026 EasyPay Financial Technologies. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '32px', fontSize: '0.85rem', color: '#64748b' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
