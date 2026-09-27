import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BookOpen, Code2, PlaySquare, Settings, Users, Terminal, Database, CreditCard, Link as LinkIcon, Smartphone, Shield, Laptop, Zap, PieChart, Globe, Building, ShoppingBag, Cloud, Rocket, LayoutDashboard } from 'lucide-react';

const PublicLayout: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Helper to handle menu timing
  let timeoutId: any = null;
  const handleMouseEnter = (menuName: string) => {
    clearTimeout(timeoutId);
    setActiveMenu(menuName);
  };
  const handleMouseLeave = () => {
    timeoutId = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  return (
    <div className="public-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header 
        style={{ 
          padding: '0 32px', 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'fixed', 
          top: 0, left: 0, right: 0, 
          zIndex: 50,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          height: '72px',
          display: 'flex',
          alignItems: 'center'
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          
          {/* Left Nav */}
          <nav style={{ display: 'flex', gap: '32px', fontSize: '0.9rem', fontWeight: 600, color: '#111827', height: '72px', alignItems: 'center' }}>
            
            {/* Products Menu */}
            <div 
              onMouseEnter={() => handleMouseEnter('products')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', height: '100%', position: 'relative' }}
            >
              Products <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: activeMenu === 'products' ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {/* Solutions Menu */}
            <div 
              onMouseEnter={() => handleMouseEnter('solutions')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', height: '100%', position: 'relative' }}
            >
              Solutions <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: activeMenu === 'solutions' ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {/* Developers Menu */}
            <div 
              onMouseEnter={() => handleMouseEnter('developers')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', height: '100%', position: 'relative' }}
            >
              Developers <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: activeMenu === 'developers' ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {/* Company Menu */}
            <div 
              onMouseEnter={() => handleMouseEnter('company')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', height: '100%', position: 'relative' }}
            >
              Company <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: activeMenu === 'company' ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            <Link to="/pricing" style={{ cursor: 'pointer', textDecoration: 'none', color: '#111827' }}>Pricing</Link>
          </nav>

          {/* Center Logo */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.5rem', color: '#10b981', textDecoration: 'none', letterSpacing: '-0.5px' }}>
              <div style={{ width: '28px', height: '28px', background: '#10b981', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '1.2rem', lineHeight: 1 }}>E</span>
              </div>
              Easy<span style={{ color: '#111827' }}>Pay</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', height: '72px' }}>
            <div 
              onMouseEnter={() => handleMouseEnter('signIn')}
              style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Sign in <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: activeMenu === 'signIn' ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>
            </div>

            <div 
              onMouseEnter={() => handleMouseEnter('getStarted')}
              style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{ background: '#10b981', color: 'white', padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.3)' }}>
                Get Started <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: activeMenu === 'getStarted' ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* MEGA MENUS (Absolute positioned overlay) */}
        
        {/* Developers Mega Menu */}
        <div style={{
          position: 'absolute', top: '72px', left: '10%', right: '10%', 
          background: 'white', borderRadius: '0 0 16px 16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: activeMenu === 'developers' ? 'grid' : 'none',
          gridTemplateColumns: '2fr 1fr',
          overflow: 'hidden',
          border: '1px solid #f1f5f9', borderTop: 'none',
          animation: 'fadeSlideDown 0.2s ease-out'
        }}
        onMouseEnter={() => handleMouseEnter('developers')}
        >
          <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '24px' }}>DOCUMENTATION & GUIDES</div>
              <div className="mega-menu-item"><div className="icon-box"><BookOpen size={18}/></div><div><h4>API Reference</h4><p>Complete RESTful endpoint documentation.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><PlaySquare size={18}/></div><div><h4>Quickstart Guide</h4><p>Get an integration live in minutes.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><Code2 size={18}/></div><div><h4>SDKs & Libraries</h4><p>Plug-ins for Python, Go, Node.js & React.</p></div></div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '24px' }}>DEVELOPER TOOLS</div>
              <div className="mega-menu-item"><div className="icon-box"><Terminal size={18}/></div><div><h4>Sandbox</h4><p>Safe testing credentials and environments.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><Database size={18}/></div><div><h4>Webhooks</h4><p>Listen for real-time events and updates.</p></div></div>
              
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', margin: '32px 0 24px' }}>COMMUNITY & SUPPORT</div>
              <div className="mega-menu-item"><div className="icon-box"><Users size={18}/></div><div><h4>Developer Forum</h4><p>Community-driven technical support.</p></div></div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '40px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>Developers</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>Everything you need to build the next generation of financial products in Africa.</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}/>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}/>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}/>
              </div>
              <code style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>$ npm install @easypay/node</code>
            </div>
          </div>
        </div>

        {/* Products Mega Menu */}
        <div style={{
          position: 'absolute', top: '72px', left: '10%', right: '10%', 
          background: 'white', borderRadius: '0 0 16px 16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: activeMenu === 'products' ? 'grid' : 'none',
          gridTemplateColumns: '2fr 1fr',
          overflow: 'hidden',
          border: '1px solid #f1f5f9', borderTop: 'none',
          animation: 'fadeSlideDown 0.2s ease-out'
        }}
        onMouseEnter={() => handleMouseEnter('products')}
        >
          <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '24px' }}>PAYMENTS</div>
              <div className="mega-menu-item"><div className="icon-box"><CreditCard size={18}/></div><div><h4>Online Checkout</h4><p>Accept cards and mobile money globally.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><LinkIcon size={18}/></div><div><h4>Payment Links</h4><p>Get paid via WhatsApp, SMS, or email.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><Smartphone size={18}/></div><div><h4>QR Payments</h4><p>In-person contactless payments.</p></div></div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '24px' }}>INFRASTRUCTURE</div>
              <div className="mega-menu-item"><div className="icon-box"><Shield size={18}/></div><div><h4>Fraud Radar</h4><p>AI-powered protection against fraud.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><Settings size={18}/></div><div><h4>Core Ledger</h4><p>Immutable double-entry accounting.</p></div></div>
              <div className="mega-menu-item"><div className="icon-box"><PieChart size={18}/></div><div><h4>Settlements</h4><p>Automated T+1 payouts to your bank.</p></div></div>
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '40px', borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <Zap size={32} color="#10b981" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>New: Instant Payouts</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '16px' }}>Move funds to partner bank accounts in under 5 minutes, 24/7/365.</p>
              <a href="#" style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>Learn more →</a>
            </div>
          </div>
        </div>

        {/* Solutions Mega Menu */}
        <div style={{
          position: 'absolute', top: '72px', left: '10%', right: '10%', 
          background: 'white', borderRadius: '0 0 16px 16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: activeMenu === 'solutions' ? 'grid' : 'none',
          gridTemplateColumns: '1fr',
          overflow: 'hidden',
          border: '1px solid #f1f5f9', borderTop: 'none',
          animation: 'fadeSlideDown 0.2s ease-out'
        }}
        onMouseEnter={() => handleMouseEnter('solutions')}
        >
          <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            <div className="mega-menu-item"><div className="icon-box"><Building size={18}/></div><div><h4>Enterprise</h4><p>Custom integrations for large scale operations.</p></div></div>
            <div className="mega-menu-item"><div className="icon-box"><ShoppingBag size={18}/></div><div><h4>Ecommerce</h4><p>Plug-and-play checkout for online stores.</p></div></div>
            <div className="mega-menu-item"><div className="icon-box"><Cloud size={18}/></div><div><h4>SaaS</h4><p>Manage recurring billing and subscriptions.</p></div></div>
            <div className="mega-menu-item"><div className="icon-box"><Rocket size={18}/></div><div><h4>Startups</h4><p>Launch fast with developer-friendly APIs.</p></div></div>
          </div>
        </div>

        {/* Company Mega Menu */}
        <div style={{
          position: 'absolute', top: '72px', left: '10%', right: '10%', 
          background: 'white', borderRadius: '0 0 16px 16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: activeMenu === 'company' ? 'grid' : 'none',
          gridTemplateColumns: '1fr',
          overflow: 'hidden',
          border: '1px solid #f1f5f9', borderTop: 'none',
          animation: 'fadeSlideDown 0.2s ease-out'
        }}
        onMouseEnter={() => handleMouseEnter('company')}
        >
          <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            <div className="mega-menu-item"><div className="icon-box"><Globe size={18}/></div><div><h4>About Us</h4><p>Our mission and story.</p></div></div>
            <div className="mega-menu-item"><div className="icon-box"><Users size={18}/></div><div><h4>Careers</h4><p>Come build the future of finance.</p></div></div>
            <div className="mega-menu-item"><div className="icon-box"><BookOpen size={18}/></div><div><h4>Blog</h4><p>News and engineering insights.</p></div></div>
            <div className="mega-menu-item"><div className="icon-box"><Laptop size={18}/></div><div><h4>Contact</h4><p>Get in touch with our team.</p></div></div>
          </div>
        </div>

        {/* Sign In Dropdown */}
        <div style={{
          position: 'absolute', top: '72px', right: '140px', width: '280px',
          background: 'white', borderRadius: '0 0 16px 16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: activeMenu === 'signIn' ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #f1f5f9', borderTop: 'none',
          animation: 'fadeSlideDown 0.2s ease-out'
        }}
        onMouseEnter={() => handleMouseEnter('signIn')}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>LOGIN AS</div>
            <Link to="/login?type=merchant" className="mega-menu-item" style={{ marginBottom: '4px' }}>
              <div className="icon-box" style={{ width: '32px', height: '32px' }}><LayoutDashboard size={16}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><h4 style={{ fontSize: '0.9rem' }}>Merchant</h4></div>
            </Link>
            <Link to="/login?type=developer" className="mega-menu-item" style={{ marginBottom: '4px' }}>
              <div className="icon-box" style={{ width: '32px', height: '32px', background: '#f8fafc', color: '#64748b' }}><Code2 size={16}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><h4 style={{ fontSize: '0.9rem' }}>Developer</h4></div>
            </Link>
            <Link to="/login?type=admin" className="mega-menu-item" style={{ marginBottom: '4px' }}>
              <div className="icon-box" style={{ width: '32px', height: '32px', background: '#fef2f2', color: '#ef4444' }}><Shield size={16}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><h4 style={{ fontSize: '0.9rem' }}>Admin / Staff</h4></div>
            </Link>
          </div>
        </div>

        {/* Get Started Dropdown */}
        <div style={{
          position: 'absolute', top: '72px', right: '32px', width: '300px',
          background: 'white', borderRadius: '0 0 16px 16px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          display: activeMenu === 'getStarted' ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #f1f5f9', borderTop: 'none',
          animation: 'fadeSlideDown 0.2s ease-out'
        }}
        onMouseEnter={() => handleMouseEnter('getStarted')}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>CREATE ACCOUNT</div>
            <Link to="/login?mode=signup&type=merchant" className="mega-menu-item" style={{ marginBottom: '8px' }}>
              <div className="icon-box" style={{ width: '36px', height: '36px' }}><Building size={18}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '0.95rem' }}>Business Account</h4>
                <p style={{ fontSize: '0.75rem' }}>Start accepting payments.</p>
              </div>
            </Link>
            <Link to="/login?mode=signup&type=developer" className="mega-menu-item" style={{ marginBottom: '0' }}>
              <div className="icon-box" style={{ width: '36px', height: '36px', background: '#f8fafc', color: '#64748b' }}><Terminal size={18}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '0.95rem' }}>Developer Sandbox</h4>
                <p style={{ fontSize: '0.75rem' }}>Get API keys and test.</p>
              </div>
            </Link>
          </div>
          <div style={{ background: '#f8fafc', padding: '16px 24px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            Takes less than 2 minutes.
          </div>
        </div>

      </header>

      {/* Global styles for the mega menu */}
      <style>
        {`
          @keyframes fadeSlideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .mega-menu-item {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: background 0.2s;
          }
          .mega-menu-item:hover {
            background: #f8fafc;
          }
          .mega-menu-item .icon-box {
            width: 40px;
            height: 40px;
            background: #f0fdf4;
            color: #10b981;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-center;
            flex-shrink: 0;
            justify-content: center;
          }
          .mega-menu-item h4 {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .mega-menu-item p {
            font-size: 0.85rem;
            color: #64748b;
            margin: 0;
            line-height: 1.4;
          }
        `}
      </style>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
