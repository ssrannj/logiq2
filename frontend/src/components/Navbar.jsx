import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartItemCount } = useCart();

  return (
    <header className="fixed top-0 w-full z-50 glass-header">
      <nav className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tighter text-green-900"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            Mangala Showroom
          </Link>
          <div className="hidden md:flex gap-6 items-center text-sm tracking-wide" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            <Link to="/catalog" className="text-zinc-600 hover:text-green-800 transition-colors py-1 font-bold">
              Furniture
            </Link>
            <Link to="/catalog?category=Electronics" className="text-zinc-600 hover:text-green-800 transition-colors py-1 font-bold">
              Electronics
            </Link>
            <Link to="/track" className="text-zinc-600 hover:text-green-800 transition-colors py-1 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-base leading-none">package_2</span>
              Track Order
            </Link>
            {user && (
              <button onClick={() => navigate('/dashboard')} className="text-zinc-600 hover:text-green-800 transition-colors py-1 font-bold cursor-pointer">
                My Profile
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 ml-4 hover:bg-blue-100 transition-all">
                ADMIN PORTAL
              </Link>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-[var(--color-surface-container-high)] px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-[var(--color-outline)] text-sm mr-2">search</span>
            <input
              className="bg-transparent border-none outline-none text-sm w-48"
              style={{ fontFamily: 'Inter' }}
              placeholder="Search curated pieces..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group cursor-pointer flex items-center gap-2 bg-[#f5f3f3] px-3 py-1.5 rounded-full border border-[#bfcab8]">
                <span className="text-[#005a07] font-bold text-sm" onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')}>
                  {user.name.split(' ')[0]}
                </span>
                <span className="material-symbols-outlined text-[#005a07] !text-lg" onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')}>
                   person
                </span>
                
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="absolute top-10 right-0 bg-white border border-[#bfcab8]/30 shadow-xl rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto flex items-center gap-2 text-red-600 hover:bg-red-50 w-32 font-bold text-sm"
                >
                  <span className="material-symbols-outlined !text-sm">logout</span> Logout
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} className="hover:opacity-80 transition-all scale-95 active:scale-100 duration-200">
                <span className="material-symbols-outlined text-[#005a07]">login</span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/checkout')}
              className="hover:opacity-80 transition-all scale-95 active:scale-100 duration-200 relative p-2"
            >
              <span className="material-symbols-outlined text-[#005a07]">shopping_cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
