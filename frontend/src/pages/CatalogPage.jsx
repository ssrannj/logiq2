import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProducts, getCategories, addToWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CatalogPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const [selectedRootId, setSelectedRootId] = useState(null);
  const [selectedSubName, setSelectedSubName] = useState('');
  const [expandedRoots, setExpandedRoots] = useState({});
  const [selectedMaterials, setSelectedMaterials] = useState(new Set());
  const [maxPrice, setMaxPrice] = useState(1000000);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        const cats = catRes.data;
        setCategories(cats);
        const roots = cats.filter(c => !c.parentId);
        const initial = {};
        roots.forEach(r => { initial[r.id] = true; });
        setExpandedRoots(initial);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const rootCategories = useMemo(() =>
    categories.filter(c => !c.parentId),
    [categories]
  );

  const getChildren = useCallback((parentId) =>
    categories.filter(c => c.parentId === parentId),
    [categories]
  );

  const availableMaterials = useMemo(() => {
    const mats = new Set(products.map(p => p.material).filter(Boolean));
    return [...mats].sort();
  }, [products]);

  const finalProducts = useMemo(() => {
    let filtered = products;

    if (selectedSubName) {
      filtered = filtered.filter(p => p.category === selectedSubName);
    } else if (selectedRootId !== null) {
      const root = rootCategories.find(r => r.id === selectedRootId);
      const children = getChildren(selectedRootId);
      const childNames = children.map(c => c.name);
      filtered = filtered.filter(p =>
        childNames.includes(p.category) || p.category === root?.name
      );
    }

    if (selectedMaterials.size > 0) {
      filtered = filtered.filter(p =>
        p.material && selectedMaterials.has(p.material)
      );
    }

    filtered = filtered.filter(p => Number(p.price) <= maxPrice);

    return filtered;
  }, [products, selectedRootId, selectedSubName, selectedMaterials, maxPrice, rootCategories, getChildren]);

  const handleWishlist = async (product) => {
    if (!user) { navigate('/auth'); return; }
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
    if (!user) { navigate('/auth'); return; }
    try {
      await addToWishlist(product.id);
      setWishlistIds(prev => new Set([...prev, product.id]));
      showToast(`We'll notify you when "${product.name}" is back!`);
    } catch {
      showToast('Failed to subscribe.', 'error');
    }
  };

  const toggleRoot = (rootId) => {
    setExpandedRoots(prev => ({ ...prev, [rootId]: !prev[rootId] }));
  };

  const selectRoot = (rootId) => {
    setSelectedRootId(rootId);
    setSelectedSubName('');
  };

  const selectSub = (subName, rootId) => {
    setSelectedSubName(subName);
    setSelectedRootId(rootId);
  };

  const clearAll = () => {
    setSelectedRootId(null);
    setSelectedSubName('');
    setSelectedMaterials(new Set());
    setMaxPrice(1000000);
  };

  const toggleMaterial = (mat) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      if (next.has(mat)) next.delete(mat);
      else next.add(mat);
      return next;
    });
  };

  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  const headingLabel = selectedSubName
    ? selectedSubName
    : selectedRootId !== null
      ? (rootCategories.find(r => r.id === selectedRootId)?.name || 'All Products')
      : 'All Products';

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter' }}>
      <Navbar />

      {toast && (
        <div
          className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-lg shadow-2xl text-sm font-bold flex items-center gap-3 toast-slide-in ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[var(--color-primary)] text-white'
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
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  Filters
                </h2>
                {(selectedRootId !== null || selectedSubName || selectedMaterials.size > 0) && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-[var(--color-primary)] font-semibold hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="h-0.5 w-8 bg-[var(--color-primary)]" />
            </div>

            {/* Hierarchical Category Filter */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-outline)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                Category
              </h3>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="category-root"
                  checked={selectedRootId === null && !selectedSubName}
                  onChange={clearAll}
                  className="w-4 h-4 accent-[var(--color-primary)]"
                />
                <span className={`text-sm font-medium transition-colors ${selectedRootId === null && !selectedSubName ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]'}`}>
                  All Products
                </span>
              </label>

              {rootCategories.map(root => {
                const children = getChildren(root.id);
                const isRootSelected = selectedRootId === root.id && !selectedSubName;
                const isExpanded = expandedRoots[root.id];

                return (
                  <div key={root.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRoot(root.id)}
                        className="text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-base leading-none">
                          {isExpanded ? 'expand_more' : 'chevron_right'}
                        </span>
                      </button>
                      <label className="flex items-center gap-2 cursor-pointer group flex-1">
                        <input
                          type="radio"
                          name="category-root"
                          checked={isRootSelected}
                          onChange={() => selectRoot(root.id)}
                          className="w-4 h-4 accent-[var(--color-primary)]"
                        />
                        <span className={`text-sm font-semibold transition-colors ${isRootSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]'}`}>
                          {root.name}
                        </span>
                      </label>
                    </div>

                    {isExpanded && children.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2 border-l border-[var(--color-outline-variant)]/30 pl-4">
                        {children.map(sub => {
                          const isSubSelected = selectedSubName === sub.name;
                          return (
                            <label key={sub.id} className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="radio"
                                name="category-root"
                                checked={isSubSelected}
                                onChange={() => selectSub(sub.name, root.id)}
                                className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                              />
                              <span className={`text-sm transition-colors ${isSubSelected ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]'}`}>
                                {sub.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Material Filter — only shows if any products have material set */}
            {availableMaterials.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-outline)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  Material
                </h3>
                <div className="flex flex-col gap-3">
                  {availableMaterials.map(mat => (
                    <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(mat)}
                        onChange={() => toggleMaterial(mat)}
                        className="w-4 h-4 rounded accent-[var(--color-primary)]"
                      />
                      <span className={`text-sm font-medium transition-colors ${selectedMaterials.has(mat) ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]'}`}>
                        {mat}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {/* Price Range */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-outline)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  Price (LKR)
                </h3>
                <span className="text-xs font-mono text-[var(--color-primary)] font-semibold">
                  {maxPrice >= 1000000 ? 'Max' : `Rs. ${(maxPrice / 1000).toFixed(0)}k`}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="1000000"
                step="5000"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-[var(--color-surface-container-highest)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-outline)] font-bold uppercase tracking-tighter">
                <span>Rs. 5,000</span>
                <span>Rs. 1,000,000+</span>
              </div>
            </section>
          </aside>

          {/* ── Product Grid Area ── */}
          <div className="flex-grow">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tighter text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {headingLabel}
                </h1>
                <p className="text-[var(--color-on-surface-variant)] mt-2 max-w-md">
                  Refining Sri Lankan living spaces with artisanal craft and contemporary design.
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-[var(--color-outline)]">
                  {finalProducts.length} item{finalProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

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
            ) : finalProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)] mb-4">search_off</span>
                <p className="text-xl font-bold text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>No products found</p>
                <p className="text-sm text-[var(--color-outline)] mt-2">Try adjusting your filters or browse all categories.</p>
                <button
                  onClick={clearAll}
                  className="mt-6 px-6 py-2 bg-[var(--color-primary)] text-white font-bold text-sm rounded-lg hover:opacity-90 transition-all"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Clear Filters
                </button>
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
                          className={`w-full h-full object-cover transition-transform duration-700 ${inStock ? 'group-hover:scale-105' : 'grayscale-[20%]'}`}
                          src={product.imageUrl}
                          alt={product.name}
                        />

                        {!inStock && (
                          <div className="absolute inset-0 bg-zinc-900/10 flex items-center justify-center">
                            <span className="bg-white/90 text-zinc-900 text-[10px] font-extrabold uppercase tracking-[0.2em] px-4 py-2">
                              Out of Stock
                            </span>
                          </div>
                        )}

                        {inStock && (
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={() => handleWishlist(product)}
                              className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm ${
                                inWishlist
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                              }`}
                              title="Add to Wishlist"
                            >
                              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: inWishlist ? "'FILL' 1" : "'FILL' 0" }}>
                                favorite
                              </span>
                            </button>
                          </div>
                        )}

                        {product.material && (
                          <div className="absolute bottom-4 left-4">
                            <span className="bg-black/60 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm">
                              {product.material}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                          {product.name}
                        </h4>
                        <p className="text-xs text-[var(--color-outline)] uppercase tracking-wider font-semibold">
                          {product.brand}
                        </p>
                        <div className="pt-2 flex justify-between items-center">
                          <span className={`font-bold ${inStock ? 'text-[var(--color-primary)]' : 'text-[var(--color-outline)]'}`} style={{ fontFamily: 'monospace' }}>
                            {formatPrice(product.price)}
                          </span>
                          {inStock ? (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-xs font-bold px-4 py-2 rounded-sm tracking-wide shadow-md active:scale-95 transition-all"
                              style={{ fontFamily: 'Plus Jakarta Sans' }}
                            >
                              ADD TO BAG
                            </button>
                          ) : (
                            <button
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
