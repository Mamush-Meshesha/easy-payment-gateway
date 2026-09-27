import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Globe, LayoutDashboard, ArrowRight, Code2, Banknote, ShieldCheck, Lock, Radar } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', fontFamily: '"Inter", sans-serif' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ 
        minHeight: '100vh',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        paddingTop: '60px',
        background: 'white'
      }}>
        {/* Stripe-style Mesh Gradient Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', right: '-10%', height: '120%', background: 'linear-gradient(140deg, #f8fafc 0%, #f1f5f9 100%)', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '80%', height: '80%', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, rgba(255,255,255,0) 70%)', transform: 'rotate(-15deg)', filter: 'blur(60px)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '70%', height: '70%', background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, rgba(255,255,255,0) 70%)', transform: 'rotate(20deg)', filter: 'blur(60px)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: '10%', right: '10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(50px)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40vh', background: 'linear-gradient(100deg, rgba(37,99,235,0.05) 0%, rgba(16,185,129,0.05) 100%)', transform: 'skewY(-6deg)', transformOrigin: 'bottom left', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}></div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-8)', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '6px 16px', borderRadius: '24px', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px', marginBottom: '32px' }}>
            <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span>
            THE NEW STANDARD FOR AFRICAN PAYMENTS
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.15, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '24px' }}>
            Powerful financial infrastructure for the internet.
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px', letterSpacing: '-0.2px' }}>
            EasyPay provides the API layer that seamlessly connects businesses in Ethiopia to global and local payment networks. Built for developers, optimized for conversion.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/login" style={{ background: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '6px', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>Start building</Link>
            <a href="#sales" style={{ background: 'transparent', color: '#0f172a', padding: '12px 24px', borderRadius: '6px', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', border: '1px solid #e2e8f0' }}>Contact sales</a>
          </div>
        </div>
      </section>

      {/* 2. BENTO BOX FEATURES */}
      <section style={{ padding: '80px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '16px' }}>
              Engineered for absolute reliability
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
              We've abstracted the complexity of banking rails into a suite of modular APIs.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', gridAutoRows: 'minmax(250px, auto)' }}>
            <div style={{ gridColumn: 'span 2', background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <Code2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Developer-centric APIs</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '80%' }}>
                  A unified, beautifully designed API that abstracts away the idiosyncrasies of local banks, mobile money operators, and international card networks.
                </p>
              </div>
              <div style={{ marginTop: '32px', padding: '16px', background: '#0f172a', borderRadius: '12px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <span style={{ color: '#c678dd' }}>await</span> easypay.payments.<span style={{ color: '#61afef' }}>create</span>(&#123;<br/>
                &nbsp;&nbsp;amount: <span style={{ color: '#d19a66' }}>5000</span>,<br/>
                &nbsp;&nbsp;currency: <span style={{ color: '#98c379' }}>"ETB"</span><br/>
                &#125;);
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '48px', height: '48px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Immutable Core Ledger</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Every transaction is backed by a double-entry ledger system. Mathematical certainty that your balances are always accurate, right down to the decimal.
              </p>
            </div>
            <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '48px', height: '48px', background: '#f0fdf4', color: '#22c55e', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Banknote size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Next-day Settlements</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Automated T+1 settlements directly to your bank account. Stop waiting weeks for your revenue to clear.
              </p>
            </div>
            <div style={{ gridColumn: 'span 2', background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ maxWidth: '50%' }}>
                <div style={{ width: '48px', height: '48px', background: '#fdf4ff', color: '#d946ef', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <LayoutDashboard size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Intelligent Dashboard</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Real-time visibility into your cash flow, webhooks, API keys, and dispute management, all from a world-class interface.
                </p>
              </div>
              <div style={{ width: '200px', height: '140px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '8px', width: '40%', background: '#cbd5e1', borderRadius: '4px' }}></div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px', marginTop: 'auto' }}>
                  <div style={{ flex: 1, background: '#3b82f6', height: '40%', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ flex: 1, background: '#3b82f6', height: '70%', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ flex: 1, background: '#10b981', height: '100%', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ flex: 1, background: '#3b82f6', height: '50%', borderRadius: '4px 4px 0 0' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TESTIMONIAL SECTION */}
      {/* 3. TESTIMONIAL / TRUST SECTION (Redesigned) */}
      <section style={{ padding: '100px 24px', background: 'white', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#10b981', fontWeight: 800, letterSpacing: '1.5px', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '32px' }}>
            Trusted by Pioneers
          </div>
          
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '48px', maxWidth: '800px', margin: '0 auto 48px' }}>
            "EasyPay hasn't just improved our payment success rates—it's fundamentally transformed how we operate our financial backend across East Africa."
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '80px' }}>
            <img src="https://i.pravatar.cc/100?img=12" alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #e2e8f0' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Elias Yirga</div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>CTO at Ride</div>
            </div>
          </div>

          {/* Trusted Logos Grid */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', opacity: 0.6, filter: 'grayscale(100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}><Globe /> Awash Bank</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}><Zap /> EthioTelecom</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}><Shield /> Dashen</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}><Banknote /> ZayRide</div>
          </div>
        </div>
      </section>

      {/* 4. SECURITY SECTION (Redesigned) */}
      <section style={{ padding: '120px 24px', background: '#090e17', color: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow for security */}
        <div style={{ position: 'absolute', top: '50%', left: '20%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}></div>

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          
          {/* Visual Left Side */}
          <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '50%', animation: 'pulse 4s infinite' }}></div>
            <div style={{ position: 'absolute', width: '70%', height: '70%', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '50%', animation: 'pulse 4s infinite 1s' }}></div>
            <div style={{ position: 'absolute', width: '40%', height: '40%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <ShieldCheck size={48} color="#10b981" />
            </div>
            
            <style>
              {`
                @keyframes pulse {
                  0% { transform: scale(0.8); opacity: 0; }
                  50% { opacity: 1; }
                  100% { transform: scale(1.2); opacity: 0; }
                }
              `}
            </style>
          </div>

          {/* Content Right Side */}
          <div>
            <div style={{ color: '#10b981', fontWeight: 800, letterSpacing: '1.5px', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '16px' }}>
              Fort Knox Security
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', letterSpacing: '-1px', marginBottom: '32px', lineHeight: 1.1 }}>
              Military-grade compliance, by default.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '40px' }}>
              We've abstracted away the heavy lifting of compliance and security. From PCI DSS to continuous AI fraud monitoring, your transactions are protected at the lowest hardware levels.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ marginTop: '4px' }}><Lock size={20} color="#10b981" /></div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '8px' }}>End-to-End Encryption</h4>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>AES-256 encryption at rest and TLS 1.3 in transit. Card data never touches your servers.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ marginTop: '4px' }}><Radar size={20} color="#10b981" /></div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '8px' }}>Real-time Velocity Checks</h4>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>Our risk engine analyzes behavioral patterns in milliseconds to block automated fraud rings.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ marginTop: '4px' }}><ShieldCheck size={20} color="#10b981" /></div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '8px' }}>PCI DSS Level 1 Certified</h4>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>The highest level of certification in the payments industry, audited annually by external QSAs.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION (Redesigned) */}
      <section style={{ padding: '80px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#0f172a', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}>
          {/* Artistic CTA Background */}
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-50%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, padding: '80px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', letterSpacing: '-1px', marginBottom: '24px' }}>
              Ready to scale your business?
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', marginBottom: '48px', lineHeight: 1.6 }}>
              Join thousands of businesses building the future of commerce in Africa. Go live in minutes with our developer-friendly APIs.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/login" style={{ background: 'white', color: '#0f172a', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>Create free account</Link>
              <a href="#sales" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', backdropFilter: 'blur(4px)' }}>Contact sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DARK FOOTER (RICH DESIGN) */}
      <footer style={{ background: '#090e17', color: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Glow accent at the very top of the footer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }}></div>
        
        {/* Huge watermark logo in the background */}
        <div style={{ position: 'absolute', right: '-5%', bottom: '-20%', fontSize: '40rem', fontWeight: 900, color: 'rgba(255,255,255,0.02)', lineHeight: 0.8, pointerEvents: 'none', userSelect: 'none' }}>
          E
        </div>

        <div style={{ padding: '100px 24px 40px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '80px' }}>
            
            <div style={{ paddingRight: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.75rem', marginBottom: '24px', color: 'white' }}>
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                  <span style={{ color: 'white', fontSize: '1.25rem', lineHeight: 1 }}>E</span>
                </div>
                EasyPay
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
                The financial infrastructure built for Africa's most ambitious businesses. Accept payments, manage risk, and scale globally.
              </p>
              
              {/* Newsletter Signup */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Subscribe to developer updates</div>
                <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '4px', border: '1px solid #334155' }}>
                  <input type="email" placeholder="Email address" style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '8px 12px', fontSize: '0.875rem', outline: 'none' }} />
                  <button style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Subscribe</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', color: '#94a3b8' }}>
                <a href="#" className="footer-social">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="#" className="footer-social">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>
                <a href="#" className="footer-social">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 2.8 11 2.8 11s1.3.1 2 .1c-1.5-1-2.9-2.9-2.9-5.1 0 0 1.2.6 2.4.6C2.2 5.5 2.9 2 2.9 2s2.6 3.1 7.1 3.3c-.7-3.9 4.3-6.2 7.1-3.6 1.1-.3 2.1-.8 3-1.4-.3 1.2-1.1 2-2 2.7z"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '24px', color: 'white', fontSize: '0.9rem', letterSpacing: '0.5px' }}>Products</h4>
              <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', lineHeight: 2.8, fontSize: '0.9rem' }}>
                <li><a href="#">Checkout</a></li>
                <li><a href="#">Payment Links</a></li>
                <li><a href="#">QR Payments</a></li>
                <li><a href="#">EasyPay Radar</a></li>
                <li><a href="#">Events & Ticketing</a></li>
                <li><a href="#">Donations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '24px', color: 'white', fontSize: '0.9rem', letterSpacing: '0.5px' }}>Platform</h4>
              <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', lineHeight: 2.8, fontSize: '0.9rem' }}>
                <li><a href="#">Solutions</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Partners</a></li>
                <li><a href="#">Request a demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '24px', color: 'white', fontSize: '0.9rem', letterSpacing: '0.5px' }}>Developers</h4>
              <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', lineHeight: 2.8, fontSize: '0.9rem' }}>
                <li><a href="#">Developer Hub</a></li>
                <li><a href="#">API Documentation</a></li>
                <li><a href="#">Libraries & SDKs</a></li>
                <li><a href="#">EasyPay AI Research</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '24px', color: 'white', fontSize: '0.9rem', letterSpacing: '0.5px' }}>Company</h4>
              <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, color: '#94a3b8', lineHeight: 2.8, fontSize: '0.9rem' }}>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            {/* Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
              All systems operational
            </div>
            
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
              © 2026 EasyPay Financial Technologies. All rights reserved.
            </div>
            
            <div className="footer-bottom-links" style={{ display: 'flex', gap: '32px', fontSize: '0.85rem' }}>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Merchant Agreement</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Footer CSS for Hover effects */}
      <style>
        {`
          .footer-links a {
            color: #94a3b8;
            text-decoration: none;
            transition: color 0.2s, transform 0.2s;
            display: inline-block;
          }
          .footer-links a:hover {
            color: #10b981;
            transform: translateX(4px);
          }
          .footer-social {
            color: #94a3b8;
            transition: color 0.2s, transform 0.2s;
            display: inline-block;
          }
          .footer-social:hover {
            color: white;
            transform: translateY(-2px);
          }
          .footer-bottom-links a {
            color: #64748b;
            text-decoration: none;
            transition: color 0.2s;
          }
          .footer-bottom-links a:hover {
            color: white;
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
