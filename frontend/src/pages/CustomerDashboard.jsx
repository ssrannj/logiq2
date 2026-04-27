import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OrderTrackingView, { STATUS_LABEL, formatPrice as fmtPrice } from '../components/OrderTrackingView';
import { getMyOrders, getWishlist, getWarranties } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [loadingWarranties, setLoadingWarranties] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const oRes = await getMyOrders();
      setOrders(oRes.data);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }

    try {
      const wRes = await getWishlist();
      setWishlist(wRes.data.map(w => w.product).filter(Boolean));
    } catch {
      setWishlist([]);
    } finally {
      setLoadingWishlist(false);
    }

    try {
      const warRes = await getWarranties();
      setWarranties(warRes.data);
    } catch {
      setWarranties([]);
    } finally {
      setLoadingWarranties(false);
    }
  };

  const currentPoints = user?.points || 15550;
  const maxPoints = 16000;
  const pointsPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] selection:bg-[#1d741b] selection:text-white min-h-screen font-body">
      <Navbar />

      <main className="pt-28 pb-20 px-8 max-w-7xl mx-auto animate-in fade-in duration-700">
        
        {/* Welcome Header */}
        <header className="mb-16">
          <span className="text-[#005a07] font-headline font-bold tracking-widest text-xs uppercase mb-3 block">
            Member Exclusive Access
          </span>
          <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-[#1b1c1c] mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Member'}.
          </h1>
          <p className="text-[#40493c] text-lg max-w-2xl leading-relaxed">
            Your curated selection of artisan furniture and bespoke electronics is ready for review. Monitor your global deliveries in real-time.
          </p>
        </header>

        {/* Bento Layout for Loyalty & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          
          {/* Loyalty Card */}
          <div className="md:col-span-3 bg-white p-8 rounded-lg relative overflow-hidden group shadow border border-[#e4e2e2]">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[#686000]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  <span className="font-headline font-bold text-sm tracking-widest uppercase">The Obsidian Circle</span>
                </div>
                <h3 className="text-3xl font-headline font-bold mb-2">Mangala Rewards</h3>
                <p className="text-[#40493c] mb-8 max-w-md">
                  You are {maxPoints - currentPoints} points away from unlocking the "Artisan Concierge" tier and early access to the Summer Collection.
                </p>
              </div>
              <div className="flex items-end justify-between">
                <div className="w-2/3">
                  <div className="flex justify-between text-xs font-headline font-bold mb-2">
                    <span>{currentPoints.toLocaleString()} PTS</span>
                    <span>{maxPoints.toLocaleString()} PTS</span>
                  </div>
                  <div className="h-1 bg-[#eae8e7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#005a07]" style={{ width: `${pointsPercentage}%` }}></div>
                  </div>
                </div>
                <button className="bg-[#005a07] text-white px-6 py-3 text-xs font-headline font-bold tracking-widest uppercase rounded-sm hover:bg-[#1d741b] transition-colors shadow">
                  Redeem Points
                </button>
              </div>
            </div>
            
            {/* Decorative Element */}
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <span className="material-symbols-outlined text-[200px]">diamond</span>
            </div>
          </div>

          {/* Stats Column */}
          <div className="bg-[#f5f3f3] p-8 rounded-lg flex flex-col justify-center text-center shadow-inner border border-[#e4e2e2]">
            <span className="text-[#40493c] text-xs font-headline font-bold uppercase tracking-widest mb-2">Active Pipelines</span>
            <span className="text-5xl font-headline font-extrabold text-[#005a07] mb-1">
              {orders.length.toString().padStart(2, '0')}
            </span>
            <div className="w-8 h-0.5 bg-[#686000] mx-auto mb-6"></div>
            <p className="text-xs text-[#40493c] leading-tight flex flex-col items-center">
               <span className="material-symbols-outlined text-sm mb-1">flight_takeoff</span>
               Manage Shipments
            </p>
          </div>
        </div>

        {/* Order History — full tracking view */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tight">Active Transits</h2>
              <p className="text-[#40493c] text-sm mt-1">Real-time artisan production and logistics tracing.</p>
            </div>
          </div>

          {loadingOrders && (
            <div className="p-8 text-sm italic text-zinc-500">Decrypting Ledgers…</div>
          )}
          {!loadingOrders && orders.length === 0 && (
            <div className="p-8 bg-white border border-[#e4e2e2] rounded-lg text-sm italic text-zinc-500">
              No active pipelines found. Visit the <a href="/catalog" className="underline text-green-900 font-bold">Showroom</a>.
            </div>
          )}

          <div className="flex flex-col gap-6">
            {!loadingOrders && orders.map(o => {
              const isExpanded = expandedOrderId === o.id;

              const badgeClass =
                o.status === 'DELIVERED'      ? 'bg-green-100 text-green-800' :
                o.status === 'CANCELLED'      ? 'bg-red-100 text-red-700' :
                o.status === 'DELIVERY_DELAYED' ? 'bg-orange-100 text-orange-700' :
                'bg-[#f6e63e]/20 text-[#686000]';

              return (
                <div key={o.id} className="bg-white rounded-xl border border-[#e4e2e2] shadow-sm overflow-hidden">
                  {/* Collapsed summary row — always visible */}
                  <button
                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-[#fbf9f8] transition-colors"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-12 h-12 bg-[#f5f3f3] rounded-lg border border-[#e4e2e2] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-[#bfcab8]">inventory_2</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-headline font-bold text-zinc-400 uppercase tracking-widest mb-0.5">
                          Order #MS-{String(o.id).padStart(5, '0')}
                        </p>
                        <p className="font-headline font-bold text-base truncate">
                          {Object.values(o.items || {}).reduce((a, b) => a + b, 0)} piece{Object.values(o.items || {}).reduce((a, b) => a + b, 0) !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[#005a07] font-bold text-sm">{fmtPrice(o.total)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-headline font-bold uppercase tracking-tighter ${badgeClass}`}>
                        {STATUS_LABEL[o.status] || o.status.replace(/_/g, ' ')}
                      </span>
                      <span className="material-symbols-outlined text-[#40493c] text-xl transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    </div>
                  </button>

                  {/* Expanded full tracking view */}
                  {isExpanded && (
                    <div
                      className="border-t border-[#e4e2e2] px-6 py-8"
                      style={{ background: 'var(--color-surface, #fbf9f8)', fontFamily: 'Inter' }}
                    >
                      <OrderTrackingView
                        order={{ ...o, orderId: o.id }}
                        navigate={navigate}
                        onBack={() => setExpandedOrderId(null)}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Warranties Section */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tight">Warranty Vault</h2>
              <p className="text-[#40493c] text-sm mt-1">Active and expired product guarantees from your delivered orders.</p>
            </div>
            <span className="text-[#005a07] font-headline font-bold text-xs uppercase tracking-widest border-b border-[#005a07]/20 pb-1">
              {warranties.filter(w => w.active).length} Active
            </span>
          </div>

          {loadingWarranties && (
            <div className="text-sm italic text-zinc-500">Loading warranties...</div>
          )}

          {!loadingWarranties && warranties.length === 0 && (
            <div className="p-8 bg-white border border-[#e4e2e2] rounded-lg text-sm italic text-[#707a6b]">
              No warranties found. Warranties appear once your orders are delivered and the product has a warranty period set.
            </div>
          )}

          {!loadingWarranties && warranties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warranties.map((w, idx) => {
                const totalDays = w.warrantyMonths * 30;
                const elapsed = totalDays - Math.max(w.remainingDays, 0);
                const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
                const years = Math.floor(w.remainingDays / 365);
                const months = Math.floor((w.remainingDays % 365) / 30);
                const days = w.remainingDays % 30;

                let timeLabel = '';
                if (w.remainingDays <= 0) {
                  timeLabel = 'Expired';
                } else if (years > 0) {
                  timeLabel = `${years}y ${months}m remaining`;
                } else if (months > 0) {
                  timeLabel = `${months}m ${days}d remaining`;
                } else {
                  timeLabel = `${w.remainingDays}d remaining`;
                }

                return (
                  <div key={idx} className={`bg-white rounded-lg border p-6 shadow-sm relative overflow-hidden ${w.active ? 'border-[#e4e2e2]' : 'border-[#e4e2e2] opacity-60'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-[#40493c] mb-1">
                          {w.warrantyMonths} Month Warranty
                        </p>
                        <h4 className="font-headline font-bold text-base leading-tight truncate">{w.productName}</h4>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] px-3 py-1 rounded-full font-headline font-bold uppercase tracking-tighter ${w.active ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-500'}`}>
                        {w.active ? 'Active' : 'Expired'}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4 text-xs text-[#40493c]">
                      <div className="flex justify-between">
                        <span>Delivered</span>
                        <span className="font-semibold">{new Date(w.deliveredDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires</span>
                        <span className={`font-semibold ${w.active ? 'text-[#1b1c1c]' : 'text-red-500'}`}>
                          {new Date(w.expiryDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="mb-1">
                      <div className="h-1 bg-[#eae8e7] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${w.active ? (pct > 80 ? 'bg-orange-400' : 'bg-[#005a07]') : 'bg-zinc-300'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <p className={`text-[10px] font-headline font-bold uppercase tracking-widest mt-2 ${w.active ? (w.remainingDays < 30 ? 'text-orange-600' : 'text-[#005a07]') : 'text-zinc-400'}`}>
                      {timeLabel}
                    </p>

                    <div className="absolute -right-6 -bottom-6 opacity-[0.04] pointer-events-none">
                      <span className="material-symbols-outlined text-[120px]">verified_user</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Wishlist Grid */}
        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tight">Curated Vision</h2>
              <p className="text-[#40493c] text-sm mt-1">Pieces currently locked in your personal archive.</p>
            </div>
            <button onClick={() => navigate('/catalog')} className="text-[#005a07] font-headline font-bold text-xs uppercase tracking-widest border-b border-[#005a07]/20 pb-1 hover:border-[#005a07] transition-all">
              Return to Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingWishlist && <div className="col-span-4 text-sm italic text-zinc-500">Decrypting Archive...</div>}
            {!loadingWishlist && wishlist.length === 0 && <div className="col-span-4 text-sm italic text-[#707a6b]">Your vision board is empty.</div>}

            {!loadingWishlist && wishlist.map(item => {
              const inStock = item.stockCount > 0;
              return (
                <div key={item.id} className="group">
                  <div className={`relative aspect-[3/4] bg-white overflow-hidden mb-4 border border-[#e4e2e2] ${!inStock ? 'grayscale-[0.8]' : ''}`}>
                    <img 
                       src={item.imageUrl} 
                       alt={item.name} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {!inStock && (
                       <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                         <span className="bg-white/90 backdrop-blur-md text-[#1b1c1c] text-[10px] font-headline font-extrabold uppercase tracking-widest px-4 py-2 shadow-xl">
                            Queue Full
                         </span>
                       </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-headline font-semibold text-lg truncate pr-2">{item.name}</h4>
                    <p className={`font-bold ${inStock ? 'text-[#005a07]' : 'text-zinc-400 line-through'}`}>
                      {formatPrice(item.price)}
                    </p>
                    
                    {inStock ? (
                      <button 
                        onClick={() => navigate(`/checkout/${item.id}`)}
                        className="w-full mt-4 bg-[#005a07] text-white py-3 text-[10px] font-headline font-bold tracking-widest uppercase rounded-sm flex items-center justify-center gap-2 active:scale-95 duration-200 shadow-md hover:bg-[#1d741b]"
                      >
                        Secure Instantly <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    ) : (
                      <button className="w-full mt-4 border border-[#bfcab8]/50 text-[#40493c] py-3 text-[10px] font-headline font-bold tracking-widest uppercase rounded-sm hover:bg-[#1b1c1c] hover:text-white transition-all">
                        Alert Availability
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
