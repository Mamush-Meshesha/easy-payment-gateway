import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { ArrowRight, ShieldCheck, TrendingUp, Activity, Lock, Globe } from 'lucide-react';
import './Login.css'; // We'll create this to keep things clean

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Signup extra fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('Ethiopia');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get('mode') || 'login'; // 'login' or 'signup'
  const type = searchParams.get('type') || 'merchant'; // 'merchant', 'developer', 'admin'

  const displayType = type.charAt(0).toUpperCase() + type.slice(1);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const isSignup = mode === 'signup';
      const endpoint = isSignup ? '/api/v1/auth/register-merchant' : '/api/v1/auth/login';
      const body = isSignup 
        ? { email, password, firstName, lastName, businessName }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please try again.');
      }

      const role = data.user.roles?.[0]?.role;
      dispatch(setCredentials({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role,
          merchantId: data.user.roles?.[0]?.merchantId,
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));

      if (role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left side: Form */}
      <div className="auth-form-container">
        <div className="auth-form-header">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-logo">
              <span>E</span>
            </div>
            Easy<span className="auth-brand-highlight">Pay</span>
          </Link>
        </div>

        <div className={`auth-form-wrapper ${mode === 'signup' ? 'auth-form-wrapper--wide' : ''}`}>
          <div className="auth-form-titles">
            <h1>{mode === 'signup' ? `Create ${displayType} Account` : 'Welcome back'}</h1>
            <p>
              {mode === 'signup' 
                ? `Enter your details to create your new ${type} account and start processing.` 
                : `Enter your details to securely access your ${type} dashboard.`}
            </p>
          </div>

          {error && (
            <div className="auth-error-alert">
              <div className="auth-error-indicator"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            
            {mode === 'signup' && (
              <>
                <div className="auth-form-row">
                  <div className="auth-input-group">
                    <label>First Name <span>*</span></label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Abebe" required />
                  </div>
                  <div className="auth-input-group">
                    <label>Last Name <span>*</span></label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Bikila" required />
                  </div>
                </div>
                {(type === 'merchant' || type === 'developer') && (
                  <div className="auth-input-group">
                    <label>Business Name <span>*</span></label>
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" required />
                  </div>
                )}
              </>
            )}

            <div className="auth-input-group">
              <label>Email Address {mode === 'signup' && ' *'}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                required 
              />
            </div>

            <div className="auth-input-group">
              <div className="auth-password-header">
                <label>Password {mode === 'signup' && ' *'}</label>
                {mode === 'login' && <a href="#" className="auth-forgot-password">Forgot password?</a>}
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>

            {mode === 'signup' && (
              <>
                <div className="auth-input-group">
                  <label>Confirm Password <span>*</span></label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="auth-form-row auth-form-row--country">
                  <div className="auth-input-group">
                    <label>Country <span>*</span></label>
                    <select value={country} onChange={e => setCountry(e.target.value)} required>
                      <option value="Ethiopia">🇪🇹 Ethiopia</option>
                      <option value="Kenya">🇰🇪 Kenya</option>
                      <option value="Rwanda">🇷🇼 Rwanda</option>
                    </select>
                  </div>
                  <div className="auth-input-group">
                    <label>Phone Number <span>*</span></label>
                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+251 911 234 567" required />
                  </div>
                </div>
                <label className="auth-consent-checkbox">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} required />
                  <span>
                    I consent to the collection and processing of my personal data in line with data regulations as described in the <a href="#">Privacy Policy</a> & <a href="#">Terms of Service</a>.
                  </span>
                </label>
              </>
            )}
            
            <button 
              type="submit"
              disabled={isLoading}
              className={`auth-submit-btn ${isLoading ? 'auth-submit-btn--loading' : ''}`}
            >
              {isLoading ? (mode === 'signup' ? 'Creating Account...' : 'Authenticating...') : (
                <>{mode === 'signup' ? 'Create Account' : 'Sign in'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-switch-mode">
            {mode === 'signup' ? (
              <>Already have an account? <Link to={`/login?type=${type}`}>Sign in instead</Link></>
            ) : (
              <>Don't have an account? <Link to={`/login?mode=signup&type=${type}`}>Create one</Link></>
            )}
          </p>
        </div>

        <div className="auth-form-footer">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>

      {/* Right side: Abstract visual */}
      <div className={`auth-visual-container auth-visual-container--${type}`}>
        
        {/* Dynamic Background Effects */}
        <div className="auth-visual-bg-glow auth-visual-bg-glow--primary"></div>
        <div className="auth-visual-bg-glow auth-visual-bg-glow--secondary"></div>

        {/* Dynamic Content based on Type */}
        {type === 'developer' ? (
          <div className="auth-developer-card">
            <div className="auth-developer-card-header">
              <div className="auth-mac-btn auth-mac-btn--close"></div>
              <div className="auth-mac-btn auth-mac-btn--min"></div>
              <div className="auth-mac-btn auth-mac-btn--expand"></div>
            </div>
            <div className="auth-developer-card-code">
              <span className="code-keyword">const</span> easypay <span className="code-operator">=</span> <span className="code-function">require</span>(<span className="code-string">'easypay'</span>)(<br/>
              &nbsp;&nbsp;<span className="code-string">'sk_live_...'</span><br/>
              );<br/><br/>
              <span className="code-keyword">const</span> payment <span className="code-operator">=</span> <span className="code-keyword">await</span> easypay.payments.<span className="code-function">create</span>({'{'}<br/>
              &nbsp;&nbsp;amount: <span className="code-number">2500</span>,<br/>
              &nbsp;&nbsp;currency: <span className="code-string">'ETB'</span>,<br/>
              &nbsp;&nbsp;method: <span className="code-string">'telebirr'</span><br/>
              {'}'});
            </div>
            <div className="auth-developer-card-footer">
              🚀 Start building in seconds.
            </div>
          </div>
        ) : type === 'admin' ? (
          <div className="auth-admin-card">
            <div className="auth-admin-icon-wrapper">
              <ShieldCheck size={40} />
            </div>
            <h2>Command Center</h2>
            <p>
              Access global risk settings, monitor gateway health, and manage merchant compliance across the entire EasyPay network in real-time.
            </p>
            <div className="auth-admin-stats">
              <div className="auth-admin-stat-item">
                <Activity size={18} />
                <span>99.99% Uptime</span>
              </div>
              <div className="auth-admin-stat-item">
                <Lock size={18} />
                <span>End-to-End Encryption</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-merchant-visual">
            {/* Elegant Top Typography */}
            <div className="auth-merchant-header">
              <div className="auth-merchant-badge">
                <div className="auth-merchant-badge-dot"></div>
                <span>EasyPay for Merchants</span>
              </div>
              <h2 className="auth-merchant-title">
                {mode === 'signup' ? (
                  <>Built for <br/><span className="auth-merchant-title-highlight">scale.</span></>
                ) : (
                  <>Secure. Fast.<br/><span className="auth-merchant-title-highlight">Reliable.</span></>
                )}
              </h2>
              <p className="auth-merchant-subtitle">
                {mode === 'signup' 
                  ? 'Join thousands of businesses who trust EasyPay for un-interrupted payment processing across Ethiopia.'
                  : 'Welcome back. Everything you need to grow your business is right here.'}
              </p>
            </div>

            {/* Premium Aesthetic Visual Container */}
            <div className="auth-merchant-dashboard-preview">
              <div className="auth-merchant-dashboard-top">
                <div className="auth-merchant-metric">
                  <div className="auth-merchant-metric-label">Today's Revenue</div>
                  <div className="auth-merchant-metric-value">ETB 45,200.00</div>
                </div>
                <div className="auth-merchant-metric-trend">
                  <TrendingUp size={16} /> +12.5%
                </div>
              </div>
              
              <div className="auth-merchant-chart-skeleton">
                <div className="auth-merchant-chart-bar auth-merchant-chart-bar--1"></div>
                <div className="auth-merchant-chart-bar auth-merchant-chart-bar--2"></div>
                <div className="auth-merchant-chart-bar auth-merchant-chart-bar--3"></div>
                <div className="auth-merchant-chart-bar auth-merchant-chart-bar--4"></div>
                <div className="auth-merchant-chart-bar auth-merchant-chart-bar--active"></div>
              </div>

              <div className="auth-merchant-recent-tx">
                <div className="auth-merchant-tx-row">
                  <div className="auth-merchant-tx-icon"><Globe size={14} /></div>
                  <div className="auth-merchant-tx-details">
                    <div className="auth-merchant-tx-name">Web Payment</div>
                    <div className="auth-merchant-tx-time">Just now</div>
                  </div>
                  <div className="auth-merchant-tx-amount">+ ETB 1,250.00</div>
                </div>
                <div className="auth-merchant-tx-row">
                  <div className="auth-merchant-tx-icon auth-merchant-tx-icon--telebirr">T</div>
                  <div className="auth-merchant-tx-details">
                    <div className="auth-merchant-tx-name">Telebirr</div>
                    <div className="auth-merchant-tx-time">2 mins ago</div>
                  </div>
                  <div className="auth-merchant-tx-amount">+ ETB 840.00</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
