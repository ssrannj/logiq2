import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProducts, addToWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CatalogPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryFilter = searchParams.get('category') || '';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    getProducts(categoryFilter)
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleWishlist = async (product) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await addToWishlist(product.id);
      setWishlistIds(prev => new Set([...prev, product.id]));
      showToast(`"${product.name}" added to wishlist!`);
    } catch {
      showToast('Failed to add to wishlist.', 'error');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`"${product.name}" added to bag!`);
  };

  const handleNotifyMe = async (product) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await addToWishlist(product.id);
      setWishlistIds(prev => new Set([...prev, product.id]));
      showToast(`We'll notify you when "${product.name}" is back!`);
    } catch {
      showToast('Failed to subscribe.', 'error');
    }
  };

  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  const categories = ['All', 'Living', 'Kitchen', 'Electronics', 'Bedroom'];
  const [activeCategory, setActiveCategory] = useState('All');
  const finalProducts = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-lg shadow-2xl text-sm font-bold flex items-center gap-3 toast-slide-in ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[var(--color-primary)] text-white'
          }`}
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          <span className="material-symbols-outlined text-sm">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}

      <main className="pt-24 pb-20 px-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12">
          {/* ── Filter Sidebar ── */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-10">
            <div className="space-y-4">
              <h2
                className="text-xl font-bold tracking-tight text-[var(--color-on-surface)]"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Filters
              </h2>
              <div className="h-0.5 w-8 bg-[var(--color-primary)]" />
            </div>

            {/* Category Filter */}
            <section className="space-y-6">
              <h3
                className="text-sm font-semibold uppercase tracking-widest text-[var(--color-outline)]"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Category
              </h3>
              <div className="flex flex-col gap-3">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={activeCategory === cat}
                      onChange={() => setActiveCategory(cat)}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        activeCategory === cat
                          ? 'text-[var(--color-primary)] font-bold'
                          : 'text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Material Filter */}
            <section className="space-y-6">
              <h3
                className="text-sm font-semibold uppercase tracking-widest text-[var(--color-outline)]"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Material
              </h3>
              <div className="flex flex-col gap-3">
                {['Teak Wood', 'Mahogany', 'Velvet Fabric', 'Tempered Glass'].map(mat => (
                  <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-medium text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors">
                      {mat}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Price Range */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3
                  className="text-sm font-semibold uppercase tracking-widest text-[var(--color-outline)]"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Price (LKR)
                </h3>
                <span className="text-xs font-mono text-[var(--color-primary)] font-semibold">Max 750k</span>
              </div>
              <div className="space-y-4">
                <input
                  type="range"
                  min="5000" max="1000000" step="5000"
                  className="w-full h-1 bg-[var(--color-surface-container-highest)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--color-outline)] font-bold uppercase tracking-tighter">
                  <span>Rs. 5,000</span>
                  <span>Rs. 1,000,000+</span>
                </div>
              </div>
            </section>
          </aside>

          {/* ── Product Grid Area ── */}
          <div className="flex-grow">
            {/* Grid Header */}
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1
                  className="text-4xl font-extrabold tracking-tighter text-[var(--color-on-surface)]"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Curated Living
                </h1>
                <p className="text-[var(--color-on-surface-variant)] mt-2 max-w-md">
                  Refining Sri Lankan living spaces with artisanal wood and contemporary design.
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-[var(--color-outline)]">
                  Showing {finalProducts.length} items
                </span>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-[var(--color-surface-container)] rounded-lg mb-4" />
                    <div className="h-4 bg-[var(--color-surface-container)] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[var(--color-surface-container)] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                {finalProducts.map(product => {
                  const inStock = product.stockCount > 0;
                  const inWishlist = wishlistIds.has(product.id);

                  return (
                    <article key={product.id} className={`group ${!inStock ? 'opacity-90' : ''}`}>
                      <div className="relative aspect-[3/4] bg-[var(--color-surface-container-lowest)] overflow-hidden rounded-lg mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                        <img
                          className={`w-full h-full object-cover transition-transform duration-700 ${
                            inStock ? 'group-hover:scale-105' : 'grayscale-[20%]'
                          }`}
                          src={product.imageUrl}
                          alt={product.name}
                        />

                        {/* Out of stock overlay */}
                        {!inStock && (
                          <div className="absolute inset-0 bg-zinc-900/10 flex items-center justify-center">
                            <span className="bg-white/90 text-zinc-900 text-[10px] font-extrabold uppercase tracking-[0.2em] px-4 py-2">
                              Out of Stock
                            </span>
                          </div>
                        )}

                        {/* Wishlist heart button (in-stock items) */}
                        {inStock && (
                          <div className="absolute top-4 right-4">
                            <button
                              id={`wishlist-btn-${product.id}`}
                              onClick={() => handleWishlist(product)}
                              className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm ${
                                inWishlist
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                              }`}
                              title="Add to Wishlist"
                            >
                              <span
                                className="material-symbols-outlined text-xl"
                                style={{ fontVariationSettings: inWishlist ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                favorite
                              </span>
                            </button>
                          </div>
                        )}

                        {/* New Arrival badge */}
                        {inStock && product.category === 'Living' && (
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                              New Arrival
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4
                          className="text-lg font-bold text-[var(--color-on-surface)]"
                          style={{ fontFamily: 'Plus Jakarta Sans' }}
                        >
                          {product.name}
                        </h4>
                        <p className="text-xs text-[var(--color-outline)] uppercase tracking-wider font-semibold">
                          {product.brand}
                        </p>
                        <div className="pt-2 flex justify-between items-center">
                          <span
                            className={`font-bold ${inStock ? 'text-[var(--color-primary)]' : 'text-[var(--color-outline)]'}`}
                            style={{ fontFamily: 'monospace' }}
                          >
                            {formatPrice(product.price)}
                          </span>
                          {inStock ? (
                            <button
                              id={`buy-btn-${product.id}`}
                              onClick={() => handleAddToCart(product)}
                              className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-xs font-bold px-4 py-2 rounded-sm tracking-wide shadow-md active:scale-95 transition-all"
                              style={{ fontFamily: 'Plus Jakarta Sans' }}
                            >
                              ADD TO BAG
                            </button>
                          ) : (
                            <button
                              id={`notify-btn-${product.id}`}
                              onClick={() => handleNotifyMe(product)}
                              className={`border text-xs font-bold px-4 py-2 rounded-sm transition-colors ${
                                inWishlist
                                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                  : 'border-[var(--color-outline-variant)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'
                              }`}
                              style={{ fontFamily: 'Plus Jakarta Sans' }}
                            >
                              {inWishlist ? '✓ NOTIFIED' : 'NOTIFY ME'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
