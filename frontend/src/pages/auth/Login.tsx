import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, TrendingUp, Activity, Lock, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const endpoint = baseUrl + (isSignup ? '/api/v1/auth/register-merchant' : '/api/v1/auth/login');
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
    <div className="min-h-screen flex w-full font-sans bg-slate-50 overflow-hidden relative">
      
      {/* FULL PAGE FLUID ZIGZAG SVG BACKGROUND (LIGHT THEME) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse duration-10000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-7000"></div>
        
        {/* Unpredictable Zigzag/Wave SVG */}
        <svg className="absolute min-w-[120vw] min-h-[120vh] -left-[10vw] -top-[10vh] opacity-[0.35]" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path 
            initial={{ d: "M0,450 C200,350 400,550 600,450 C800,350 1000,550 1200,450 C1400,350 1440,400 1440,400 L1440,900 L0,900 Z" }}
            animate={{ d: [
              "M0,450 C200,350 400,550 600,450 C800,350 1000,550 1200,450 C1400,350 1440,400 1440,400 L1440,900 L0,900 Z",
              "M0,500 C200,600 400,400 600,500 C800,600 1000,400 1200,500 C1400,600 1440,550 1440,550 L1440,900 L0,900 Z",
              "M0,450 C200,350 400,550 600,450 C800,350 1000,550 1200,450 C1400,350 1440,400 1440,400 L1440,900 L0,900 Z"
            ] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave1)"
          />
          <motion.path 
            initial={{ d: "M0,600 C250,500 500,700 750,600 C1000,500 1250,700 1440,650 L1440,900 L0,900 Z" }}
            animate={{ d: [
              "M0,600 C250,500 500,700 750,600 C1000,500 1250,700 1440,650 L1440,900 L0,900 Z",
              "M0,550 C250,650 500,450 750,550 C1000,650 1250,450 1440,500 L1440,900 L0,900 Z",
              "M0,600 C250,500 500,700 750,600 C1000,500 1250,700 1440,650 L1440,900 L0,900 Z"
            ] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave2)"
          />
          <motion.path 
            initial={{ d: "M0,300 C300,500 600,100 900,300 C1200,500 1400,200 1440,250 L1440,900 L0,900 Z" }}
            animate={{ d: [
              "M0,300 C300,500 600,100 900,300 C1200,500 1400,200 1440,250 L1440,900 L0,900 Z",
              "M0,250 C300,150 600,450 900,250 C1200,50 1400,350 1440,300 L1440,900 L0,900 Z",
              "M0,300 C300,500 600,100 900,300 C1200,500 1400,200 1440,250 L1440,900 L0,900 Z"
            ] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave3)"
          />
          <defs>
            <linearGradient id="wave1" x1="0" y1="450" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="wave2" x1="1440" y1="600" x2="0" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" stopOpacity="0.5" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="wave3" x1="0" y1="200" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="1" stopColor="#10B981" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* LEFT: FORM SIDE */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 bg-white/70 backdrop-blur-2xl border-r border-slate-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Brand Logo */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-16">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl text-slate-900">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white text-lg leading-none">
              E
            </div>
            EasyPay
          </Link>
        </div>

        <motion.div 
          className="max-w-md w-full mx-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {mode === 'signup' ? `Create ${displayType} Account` : 'Welcome back'}
            </h1>
            <p className="text-slate-500">
              {mode === 'signup' 
                ? `Enter your details to create your new ${type} account and start processing.` 
                : `Enter your details to securely access your ${type} dashboard.`}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm font-medium">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700">First Name <span className="text-emerald-500">*</span></Label>
                    <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Abebe" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700">Last Name <span className="text-emerald-500">*</span></Label>
                    <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Bikila" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
                  </div>
                </div>
                {(type === 'merchant' || type === 'developer') && (
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-slate-700">Business Name <span className="text-emerald-500">*</span></Label>
                    <Input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address {mode === 'signup' && <span className="text-emerald-500">*</span>}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">Password {mode === 'signup' && <span className="text-emerald-500">*</span>}</Label>
                {mode === 'login' && (
                  <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
            </div>

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password <span className="text-emerald-500">*</span></Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-slate-700">Country <span className="text-emerald-500">*</span></Label>
                    <select id="country" value={country} onChange={e => setCountry(e.target.value)} required className="flex h-10 w-full rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="Ethiopia">🇪🇹 Ethiopia</option>
                      <option value="Kenya">🇰🇪 Kenya</option>
                      <option value="Rwanda">🇷🇼 Rwanda</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-slate-700">Phone Number <span className="text-emerald-500">*</span></Label>
                    <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+251 911 234 567" required className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500" />
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 pt-2">
                  <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} required className="mt-1 accent-emerald-500" />
                  <Label htmlFor="terms" className="text-sm text-slate-500 font-normal leading-relaxed">
                    I consent to the collection and processing of my personal data in line with data regulations as described in the <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a> & <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a>.
                  </Label>
                </div>
              </>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base mt-4 shadow-lg shadow-slate-900/10 transition-all border-0">
              {isLoading ? (mode === 'signup' ? 'Creating Account...' : 'Authenticating...') : (
                <span className="flex items-center gap-2">
                  {mode === 'signup' ? 'Create Account' : 'Sign in'} <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {mode === 'signup' ? (
              <>Already have an account? <Link to={`/login?type=${type}`} className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">Sign in instead</Link></>
            ) : (
              <>Don't have an account? <Link to={`/login?mode=signup&type=${type}`} className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">Create one</Link></>
            )}
          </p>
        </motion.div>
        
        {/* Footer Links */}
        <div className="absolute bottom-8 left-8 sm:left-12 lg:left-16 flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* RIGHT: VISUAL SIDE */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden bg-transparent">
        <motion.div 
          className="relative z-10 w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {type === 'developer' ? (
            <Card className="bg-white/80 border-white shadow-2xl shadow-indigo-500/10 overflow-hidden backdrop-blur-xl">
              <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-white/90">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-slate-500 flex items-center gap-2">
                  <Terminal size={12} /> initialize.ts
                </div>
              </div>
              <CardContent className="p-8">
                <pre className="text-sm font-mono leading-relaxed overflow-x-auto">
                  <code className="text-slate-700">
                    <span className="text-purple-600">const</span> easypay <span className="text-purple-600">=</span> <span className="text-blue-600">require</span>(<span className="text-emerald-600">'easypay'</span>)(<br/>
                    &nbsp;&nbsp;<span className="text-emerald-600">'sk_live_...'</span><br/>
                    );<br/><br/>
                    <span className="text-purple-600">const</span> payment <span className="text-purple-600">=</span> <span className="text-purple-600">await</span> easypay.payments.<span className="text-blue-600">create</span>({'{'}<br/>
                    &nbsp;&nbsp;amount: <span className="text-orange-500">2500</span>,<br/>
                    &nbsp;&nbsp;currency: <span className="text-emerald-600">'ETB'</span>,<br/>
                    &nbsp;&nbsp;method: <span className="text-emerald-600">'telebirr'</span><br/>
                    {'}'});
                  </code>
                </pre>
                <div className="mt-8 pt-6 border-t border-slate-200 text-sm font-medium text-emerald-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Start building in seconds.
                </div>
              </CardContent>
            </Card>
          ) : type === 'admin' ? (
            <div className="text-center text-slate-900">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200/50 backdrop-blur-md">
                <ShieldCheck size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4">Command Center</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-12 max-w-md mx-auto">
                Access global risk settings, monitor gateway health, and manage merchant compliance across the entire EasyPay network.
              </p>
              <div className="flex justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <Activity size={24} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">99.99% Uptime</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Lock size={24} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">E2E Encryption</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-900 relative">
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-slate-200 text-xs font-bold tracking-widest text-slate-600 uppercase mb-6 backdrop-blur-md shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  EasyPay for Merchants
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mb-6">
                  {mode === 'signup' ? (
                    <>Built for <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">scale.</span></>
                  ) : (
                    <>Secure. Fast.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Reliable.</span></>
                  )}
                </h2>
                <p className="text-lg text-slate-600 max-w-md">
                  {mode === 'signup' 
                    ? 'Join thousands of businesses who trust EasyPay for un-interrupted payment processing across Ethiopia.'
                    : 'Welcome back. Everything you need to grow your business is right here.'}
                </p>
              </div>

              {/* Glassmorphic Dashboard Preview */}
              <div className="bg-white/80 border border-white p-6 rounded-2xl backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-sm text-slate-500 font-medium mb-1">Today's Revenue</div>
                    <div className="text-2xl font-bold text-slate-900">ETB 45,200.00</div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-sm font-semibold">
                    <TrendingUp size={16} /> +12.5%
                  </div>
                </div>
                
                <div className="flex items-end gap-3 h-24 mt-auto w-full">
                  <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} transition={{ duration: 1, delay: 0.5 }} className="w-full bg-slate-200 rounded-t-sm"></motion.div>
                  <motion.div initial={{ height: 0 }} animate={{ height: '70%' }} transition={{ duration: 1, delay: 0.6 }} className="w-full bg-slate-200 rounded-t-sm"></motion.div>
                  <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} transition={{ duration: 1, delay: 0.7 }} className="w-full bg-slate-200 rounded-t-sm"></motion.div>
                  <motion.div initial={{ height: 0 }} animate={{ height: '90%' }} transition={{ duration: 1, delay: 0.8 }} className="w-full bg-emerald-500 rounded-t-sm relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded shadow-lg">Peak</div>
                  </motion.div>
                  <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} transition={{ duration: 1, delay: 0.9 }} className="w-full bg-slate-200 rounded-t-sm"></motion.div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
