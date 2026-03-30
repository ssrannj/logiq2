import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProducts } from '../services/api';

const HERO_IMAGES = {
  furniture: "https://lh3.googleusercontent.com/aida-public/AB6AXuBc_dtPJlPNfoAyTEuyq1zYk4h95SX3ke9NtSe71V4V06VHYgnoFKS5spJD7SpC64tM-dlRSruRDZ2BIEutDKLegjUHZQZ0Sv70ymhAmFWT3VgmmjMviPfXv8terR1NdVpe3IPGToF-L9t3t88Ss1Tscm6JHG0-YyJHQMSmDE0p-RV0oiXiiphIm5VrIkPzTj9oZYGL5St68kgvObuMC8DUeVTGbL5N0UPSBiVs9z2SUNZvercV3Viuc2Ra22r6Pux1dKkwWKWVhoA",
  electronics: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtdYGvMdamhHvNmSDKepYTst37aSp9pm6Vo5b2atTI-dqSyFx1YmEJE6S0Sjunu9lUjvyQrXNZbAuK1MTrXRIMyETKLB4VHyg9rKVVbjmlK0pYzZ80mJ-nl7X5lq1GriV76K6ykvxG8Crm8sQ_W-G_4xOD9Kg0L5kdG41zdudpfN-VShjzecPVcx3svDwIF4_VFMPcNOfhkPMcPQJwFeWmyWgHi9LaOwQ3QVXUy4XWu8DIS3Gh9cGBAieZ9g-5XDUqnqOque2fAXQ",
  workshop: "https://metroplastic.in/uploads/2025/12/which-country-is-the-largest-producer-of-furniture-india-leads-global-output.webp",
};

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    getProducts()
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]));
  }, []);

  const filters = ['All', 'Living', 'Kitchen', 'Electronics'];
  const filtered = activeFilter === 'All'
    ? products.slice(0, 4)
    : products.filter(p => p.category === activeFilter).slice(0, 4);

  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter' }}>
      <Navbar />

      <main className="pt-20">
        {/* ── Hero Section ── */}
        <section className="relative h-[921px] w-full overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
            {/* Furniture Panel */}
            <div className="relative group overflow-hidden">
              <img
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={HERO_IMAGES.furniture}
                alt="Luxurious Sri Lankan teak sofa"
              />
              <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-12">
                <span
                  className="text-white/80 uppercase tracking-[0.3em] text-xs mb-4"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  The Heritage Collection
                </span>
                <h1
                  className="text-white text-5xl font-extrabold mb-6 leading-tight"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Authentic Teak Artistry
                </h1>
                <button
                  onClick={() => navigate('/catalog')}
                  className="w-fit primary-gradient text-white px-8 py-3 rounded-lg font-bold text-sm tracking-wide shadow-xl"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Explore Furniture
                </button>
              </div>
            </div>

            {/* Electronics Panel */}
            <div className="relative group overflow-hidden border-l border-white/10">
              <img
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={HERO_IMAGES.electronics}
                alt="Next-gen smart TV"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-12">
                <span
                  className="text-white/80 uppercase tracking-[0.3em] text-xs mb-4"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  The Tech Pavilion
                </span>
                <h2
                  className="text-white text-5xl font-extrabold mb-6 leading-tight"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Next-Gen Intelligence
                </h2>
                <button
                  onClick={() => navigate('/catalog?category=Electronics')}
                  className="w-fit bg-white text-[var(--color-primary)] px-8 py-3 rounded-lg font-bold text-sm tracking-wide shadow-xl"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Shop Electronics
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Product Grid Section ── */}
        <section className="max-w-screen-2xl mx-auto px-8 py-24 bg-[var(--color-surface)]">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2
                className="text-4xl font-bold text-[var(--color-on-surface)] tracking-tighter mb-4"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Curated Selections
              </h2>
              <p className="text-[var(--color-outline)] max-w-md">
                Each piece in our showroom is selected for its architectural integrity and functional excellence.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${
                    activeFilter === f
                      ? 'border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)]'
                      : 'text-[var(--color-outline)] hover:text-[var(--color-primary)]'
                  }`}
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filtered.length === 0 ? (
              <p className="col-span-4 text-center text-[var(--color-outline)] py-12">
                Loading products…
              </p>
            ) : (
              filtered.map(product => (
                <div
                  key={product.id}
                  className="group bg-[var(--color-surface-container-lowest)] transition-all hover:shadow-[0_40px_40px_-4px_rgba(0,90,7,0.05)] rounded-lg overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={product.imageUrl}
                      alt={product.name}
                    />
                    {product.stockCount === 0 && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-[var(--color-on-surface)] text-[var(--color-surface)] text-[10px] font-bold uppercase px-4 py-1">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3
                      className="font-bold text-lg mb-1"
                      style={{ fontFamily: 'Plus Jakarta Sans' }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[var(--color-outline)] text-xs mb-4 uppercase tracking-tighter">
                      {product.category} • {product.brand}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <span
                        className="font-extrabold text-[var(--color-primary)]"
                        style={{ fontFamily: 'Plus Jakarta Sans' }}
                      >
                        {formatPrice(product.price)}
                      </span>
                      {product.stockCount > 0 ? (
                        <button
                          onClick={() => navigate(`/checkout/${product.id}`)}
                          className="primary-gradient text-white p-2 rounded-lg scale-95 active:scale-100 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">shopping_bag</span>
                        </button>
                      ) : (
                        <button className="border border-[var(--color-outline)] text-[var(--color-outline)] px-3 py-1 rounded text-xs font-bold uppercase hover:bg-[var(--color-outline)] hover:text-white transition-all">
                          Notify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── The Mangala Process ── */}
        <section className="py-24 bg-[var(--color-surface-container-low)] overflow-hidden">
          <div className="max-w-screen-2xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl" />
              <h2
                className="text-5xl font-extrabold text-[var(--color-on-surface)] leading-tight mb-8"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Crafting Comfort <br />Through Generations.
              </h2>
              <div className="space-y-12 relative">
                <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-[var(--color-outline-variant)]/30" />
                {[
                  { num: '01', title: 'Sustainable Sourcing', desc: 'We exclusively use plantation-grown timber, ensuring every piece preserves Sri Lanka\'s natural beauty.' },
                  { num: '02', title: 'Precision Engineering', desc: 'Our electronics partnership with global leaders ensures you get the latest tech with local warranty support.' },
                  { num: '03', title: 'White-Glove Delivery', desc: 'Stress-free installation and setup by our specialized technicians across the island.' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-4 ${
                        i === 0
                          ? 'bg-[var(--color-primary)] border-[var(--color-surface-container-low)]'
                          : 'border-[var(--color-outline)] bg-[var(--color-surface-container-low)]'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold ${i === 0 ? 'text-white' : 'text-[var(--color-outline)]'}`}
                        style={{ fontFamily: 'Plus Jakarta Sans' }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <h4
                        className="font-bold text-lg mb-2"
                        style={{ fontFamily: 'Plus Jakarta Sans' }}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[var(--color-outline)] text-sm leading-relaxed max-w-sm">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-full object-cover"
                src={HERO_IMAGES.workshop}
                alt="Artisans hand-sanding furniture"
              />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-screen-2xl mx-auto px-8 py-24">
          <div className="primary-gradient rounded-xl p-16 text-center text-white">
            <span
              className="text-[var(--color-primary-fixed)] uppercase tracking-[0.4em] text-xs mb-6 block"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              Direct from Showroom
            </span>
            <h2
              className="text-4xl md:text-6xl font-extrabold mb-8"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              Bring Modern Elegance Home.
            </h2>
            <div className="flex justify-center gap-6 flex-wrap">
              <button
                onClick={() => navigate('/catalog')}
                className="bg-white text-[var(--color-primary)] px-10 py-4 rounded-lg font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-all"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Book a Consultation
              </button>
              <button
                className="border border-[var(--color-primary-fixed)]/30 px-10 py-4 rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-[var(--color-primary-fixed)]/10 transition-all"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Store Locator
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-12 border-t border-zinc-200 bg-zinc-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="text-lg font-bold text-zinc-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Mangala Showroom
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Defining the standard of Sri Lankan lifestyle since 1988. From masterfully crafted wood to state-of-the-art tech.
            </p>
          </div>
          {[
            { heading: 'Quick Links', items: ['New Arrivals', 'Clearance Sale', 'Warranty Info', 'Store Locator'] },
            { heading: 'Support', items: ['Contact Us', 'Privacy Policy', 'Terms of Service', 'Careers'] },
            { heading: 'Visit Us', items: ['142 Galle Road, Colombo 03', 'Mon - Sat: 9AM - 8PM', '+94 11 234 5678'] },
          ].map(col => (
            <div key={col.heading} className="space-y-4">
              <h5
                className="text-xs uppercase tracking-widest text-green-900 font-bold"
                style={{ fontFamily: 'Inter' }}
              >
                {col.heading}
              </h5>
              <ul className="space-y-3 text-xs uppercase tracking-widest text-zinc-500">
                {col.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-200/50 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            © 2024 Mangala Showroom. All Rights Reserved. Sri Lanka.
          </p>
        </div>
      </footer>

      {/* ── FAB ── */}
      <button className="fixed bottom-8 right-8 w-14 h-14 primary-gradient text-white rounded-full shadow-2xl flex items-center justify-center z-50 group hover:scale-110 transition-transform">
        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">support_agent</span>
      </button>
    </div>
  );
}
