import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', address: ''
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError(null);
    setFieldErrors({});
    setSuccessMsg(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (registerForm.password !== registerForm.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    if (registerForm.password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: registerForm.fullName,
        email: registerForm.email,
        phoneNumber: registerForm.phoneNumber,
        password: registerForm.password,
        address: registerForm.address || null,
      });
      setSuccessMsg('Account created! Redirecting to sign in…');
      setTimeout(() => {
        switchTab(true);
        setSuccessMsg(null);
        setLoginForm({ email: registerForm.email, password: '' });
      }, 1800);
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) {
        setFieldErrors(data.fields);
      } else if (typeof data === 'string' && data.includes('Email is already in use')) {
        setFieldErrors({ email: 'This email is already registered' });
      } else {
        setError(data?.error || data || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full border-b py-4 px-0 text-[#1b1c1c] placeholder:text-[#707a6b]/50 focus:ring-0 transition-all bg-transparent outline-none text-sm ${
      fieldErrors[field]
        ? 'border-red-400 focus:border-red-500'
        : 'border-[#bfcab8]/40 focus:border-[#005a07]'
    }`;

  return (
    <div className="bg-[#fbf9f8] font-body text-[#1b1c1c] antialiased min-h-screen flex">
      <main className="min-h-screen flex w-full">

        {/* Left — editorial image */}
        <section className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#005a07]/10 mix-blend-multiply z-10" />
          <img
            className="absolute inset-0 w-full h-full object-cover"
            alt="luxury modern living room"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx_4WBC8o5g5iEAvEFtGKEXIhbiKqSagJYId2bJ3jJejJ0CnALoPWsaGexqjERe570n-gLEgtinMEOXGAES6bsTA4QP26pqlMXWFllaMXdbbCl5YpF1txROuXbuUfL8GmnUcXtsDKLDDflIP0-vDhQYwpIaOonUaJOpB6EEVNkgchfcZS3iwsxLUac9srqAbOKTPCoddmWUXVow09YDChfBA_5edDPukWvW24LQoZrMWociBjxMffrBNRE2bNJ7_oCWrrUYSlnts8"
          />
          <div className="absolute bottom-12 left-12 z-20 max-w-md">
            <p className="font-headline text-white text-xs uppercase tracking-[0.3em] mb-4">The Gallery Experience</p>
            <h1 className="font-headline text-4xl font-extrabold text-white leading-tight mb-6">
              Curating elegance for your digital sanctuary.
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-white/50" />
              <p className="text-white/80 text-sm italic">Exclusive access to bespoke collections</p>
            </div>
          </div>
        </section>

        {/* Right — form */}
        <section className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-[#fbf9f8] relative overflow-y-auto">
          <div className="absolute top-8 left-8">
            <Link to="/" className="font-headline text-2xl font-bold tracking-tighter text-[#005a07]">
              MANGALA SHOWROOM
            </Link>
          </div>

          <div className="w-full max-w-md space-y-8 mt-16 pb-8">
            <div className="space-y-2">
              <h2 className="font-headline text-3xl font-bold text-[#1b1c1c] tracking-tight">
                {isLogin ? 'Welcome back' : 'Join the Gallery'}
              </h2>
              <p className="text-[#40493c] text-sm leading-relaxed">
                {isLogin
                  ? 'Please enter your details to access your curated showroom dashboard.'
                  : 'Register for exclusive access to bespoke furniture and track your artisan orders.'}
              </p>
            </div>

            {/* Tab toggle */}
            <div className="bg-[#f5f3f3] p-1 rounded-full flex w-full">
              <button type="button" onClick={() => switchTab(true)}
                className={`flex-1 py-2 text-sm font-headline transition-all ${isLogin ? 'font-semibold bg-white rounded-full shadow-sm text-[#005a07]' : 'font-medium text-[#40493c] hover:text-[#005a07]'}`}>
                Sign In
              </button>
              <button type="button" onClick={() => switchTab(false)}
                className={`flex-1 py-2 text-sm font-headline transition-all ${!isLogin ? 'font-semibold bg-white rounded-full shadow-sm text-[#005a07]' : 'font-medium text-[#40493c] hover:text-[#005a07]'}`}>
                Sign Up
              </button>
            </div>

            {/* Global error */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-200">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {/* Success */}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm flex items-center gap-2 border border-green-200">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {successMsg}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {isLogin && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-6">
                  <div className="relative group">
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="login-email">
                      Email Address
                    </label>
                    <input id="login-email" type="email" required autoComplete="email"
                      className={inputClass('email')}
                      placeholder="alexander@gallery.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="relative group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] group-focus-within:text-[#005a07]" htmlFor="login-password">
                        Password
                      </label>
                      <a className="text-[10px] font-headline font-bold uppercase tracking-tighter text-[#707a6b] hover:text-[#005a07] transition-colors" href="#">Forgot?</a>
                    </div>
                    <input id="login-password" type="password" required autoComplete="current-password"
                      className={inputClass('password')}
                      placeholder="••••••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input className="w-4 h-4 rounded-sm border-[#bfcab8] text-[#005a07] focus:ring-[#005a07]/20" id="remember" type="checkbox" />
                  <label className="text-sm text-[#40493c]" htmlFor="remember">Remember me for 30 days</label>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white font-headline font-bold py-5 rounded-lg shadow-xl shadow-[#005a07]/10 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Signing in…</>
                    : 'Access Showroom'}
                </button>
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {!isLogin && (
              <form onSubmit={handleRegister} className="space-y-5">

                {/* Full Name */}
                <div className="relative group">
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="reg-fullName">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input id="reg-fullName" type="text" required autoComplete="name"
                    className={inputClass('fullName')}
                    placeholder="Alexander Vance"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm(f => ({ ...f, fullName: e.target.value }))}
                  />
                  {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="relative group">
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="reg-email">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input id="reg-email" type="email" required autoComplete="email"
                    className={inputClass('email')}
                    placeholder="alexander@gallery.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  />
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                </div>

                {/* Phone */}
                <div className="relative group">
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="reg-phone">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input id="reg-phone" type="tel" required autoComplete="tel"
                    className={inputClass('phoneNumber')}
                    placeholder="+94 77 123 4567"
                    value={registerForm.phoneNumber}
                    onChange={(e) => setRegisterForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  />
                  {fieldErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</p>}
                </div>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="reg-password">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <input id="reg-password" type="password" required autoComplete="new-password"
                      className={inputClass('password')}
                      placeholder="Min. 6 characters"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                    />
                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                  </div>

                  <div className="relative group">
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="reg-confirm">
                      Confirm <span className="text-red-400">*</span>
                    </label>
                    <input id="reg-confirm" type="password" required autoComplete="new-password"
                      className={inputClass('confirmPassword')}
                      placeholder="Repeat password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Address (optional) */}
                <div className="relative group">
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 group-focus-within:text-[#005a07]" htmlFor="reg-address">
                    Delivery Address <span className="text-[#707a6b] font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <input id="reg-address" type="text" autoComplete="street-address"
                    className={inputClass('address')}
                    placeholder="123 Gallery Lane, Colombo"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm(f => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white font-headline font-bold py-5 rounded-lg shadow-xl shadow-[#005a07]/10 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Creating account…</>
                    : 'Create Account'}
                </button>
              </form>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#bfcab8]/20" /></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-[#707a6b] bg-[#fbf9f8] px-4 font-headline font-medium">Or continue with</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-4 border border-[#bfcab8]/30 rounded-lg hover:bg-[#f5f3f3] transition-all text-[#40493c]">
                <span className="material-symbols-outlined text-lg">brand_awareness</span>
                <span className="text-sm font-headline font-semibold">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-4 border border-[#bfcab8]/30 rounded-lg hover:bg-[#f5f3f3] transition-all text-[#40493c]">
                <span className="material-symbols-outlined text-lg">terminal</span>
                <span className="text-sm font-headline font-semibold">Apple</span>
              </button>
            </div>

            <p className="text-center text-xs text-[#40493c]/60 font-medium pb-4">
              New pieces arriving daily.
              <Link to="/catalog" className="text-[#005a07] font-bold hover:underline decoration-2 underline-offset-4 ml-1">Explore our Collections</Link>
            </p>

          </div>
        </section>
      </main>
    </div>
  );
}
