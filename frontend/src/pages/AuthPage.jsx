import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await register(name, email, password);
        setIsLogin(true); // switch to login after successful register
        alert('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || 'An error occurred during authentication');
    }
  };

  return (
    <div className="bg-[#fbf9f8] font-body text-[#1b1c1c] antialiased overflow-hidden min-h-screen flex">
      <main className="min-h-screen flex w-full">
        {/* Left Side: Editorial Image */}
        <section className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#005a07]/10 mix-blend-multiply z-10"></div>
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
              <div className="h-px w-12 bg-white/50"></div>
              <p className="text-white/80 text-sm italic">Exclusive access to bespoke collections</p>
            </div>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-[#fbf9f8] relative">
          
          <div className="absolute top-8 left-8">
             <Link to="/" className="font-headline text-2xl font-bold tracking-tighter text-[#005a07]">MANGALA SHOWROOM</Link>
          </div>

          <div className="w-full max-w-md space-y-12 mt-12">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl font-bold text-[#1b1c1c] tracking-tight">
                {isLogin ? 'Welcome back' : 'Join the Gallery'}
              </h2>
              <p className="text-[#40493c] leading-relaxed">
                {isLogin 
                  ? 'Please enter your details to access your curated showroom dashboard.' 
                  : 'Register for exclusive access to bespoke furniture and track your artisan orders.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="bg-[#f5f3f3] p-1 rounded-full flex w-full">
              <button 
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-headline ${isLogin ? 'font-semibold bg-white rounded-full shadow-sm text-[#005a07]' : 'font-medium text-[#40493c] hover:text-[#005a07]'} transition-all`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-headline ${!isLogin ? 'font-semibold bg-white rounded-full shadow-sm text-[#005a07]' : 'font-medium text-[#40493c] hover:text-[#005a07]'} transition-all`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-200">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                
                {!isLogin && (
                  <div className="relative group">
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 transition-colors group-focus-within:text-[#005a07]" htmlFor="name">
                      Full Name
                    </label>
                    <input 
                      className="w-full bg-[#f5f3f3] border-b border-[#bfcab8]/30 py-4 px-0 text-[#1b1c1c] placeholder:text-[#707a6b]/50 focus:ring-0 focus:border-[#005a07] transition-all bg-transparent outline-none" 
                      id="name" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alexander Vance" 
                      type="text" 
                    />
                  </div>
                )}

                <div className="relative group">
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] mb-2 transition-colors group-focus-within:text-[#005a07]" htmlFor="email">
                    Email Address
                  </label>
                  <input 
                    className="w-full bg-[#f5f3f3] border-b border-[#bfcab8]/30 py-4 px-0 text-[#1b1c1c] placeholder:text-[#707a6b]/50 focus:ring-0 focus:border-[#005a07] transition-all bg-transparent outline-none" 
                    id="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alexander@gallery.com" 
                    type="email" 
                  />
                </div>

                <div className="relative group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider text-[#40493c] transition-colors group-focus-within:text-[#005a07]" htmlFor="password">
                      Password
                    </label>
                    {isLogin && <a className="text-[10px] font-headline font-bold uppercase tracking-tighter text-[#707a6b] hover:text-[#005a07] transition-colors" href="#">Forgot?</a>}
                  </div>
                  <input 
                    className="w-full bg-[#f5f3f3] border-b border-[#bfcab8]/30 py-4 px-0 text-[#1b1c1c] placeholder:text-[#707a6b]/50 focus:ring-0 focus:border-[#005a07] transition-all bg-transparent outline-none" 
                    id="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    type="password" 
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center gap-3">
                  <input className="w-4 h-4 rounded-sm border-[#bfcab8] text-[#005a07] focus:ring-[#005a07]/20" id="remember" type="checkbox" />
                  <label className="text-sm text-[#40493c]" htmlFor="remember">Remember me for 30 days</label>
                </div>
              )}

              <button 
                className="w-full bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white font-headline font-bold py-5 rounded-lg shadow-xl shadow-[#005a07]/10 active:scale-[0.98] transition-all" 
                type="submit"
              >
                {isLogin ? 'Access Showroom' : 'Create Account'}
              </button>
            </form>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#bfcab8]/20"></div></div>
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

            <p className="text-center text-xs text-[#40493c]/60 font-medium pb-8">
              New pieces arriving daily. 
              <Link to="/catalog" className="text-[#005a07] font-bold hover:underline decoration-2 underline-offset-4 ml-1">Explore our Collections</Link>
            </p>

          </div>
        </section>
      </main>
    </div>
  );
}
