import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyOrders, getWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

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
      setWishlist(wRes.data.map(w => w.product));
    } catch {
      setWishlist([]);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const currentPoints = user?.points || 15550;
  const maxPoints = 16000;
  const pointsPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

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

        {/* Recent Orders Tracking Stepper */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tight">Active Transits</h2>
              <p className="text-[#40493c] text-sm mt-1">Real-time artisan production and logistics tracing.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loadingOrders && <div className="p-8 text-sm italic text-zinc-500">Decrypting Ledgers...</div>}
            {!loadingOrders && orders.length === 0 && <div className="p-8 text-sm italic text-zinc-500">No active pipelines found. Visit the <a href="/catalog" className="underline text-green-900 font-bold">Showroom</a>.</div>}
            
            {!loadingOrders && orders.map(o => {
               // Stepper Logic calculations
               const STATUS_STEPS = [
                 'PENDING_PAYMENT', 'PAYMENT_VERIFICATION_IN_PROGRESS', 'ORDER_CONFIRMED',
                 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'HANDED_OVER_TO_SHIPPING',
                 'IN_TRANSIT', 'ARRIVED_AT_REGIONAL_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED',
               ];
               const isCancelled = o.status === 'CANCELLED';
               const isDelayed = o.status === 'DELIVERY_DELAYED';
               const effectiveSt = isDelayed ? 'OUT_FOR_DELIVERY' : o.status;
               const statusIdx = STATUS_STEPS.indexOf(effectiveSt);
               const step1Done = !isCancelled && statusIdx >= 0;
               const step2Done = !isCancelled && statusIdx >= 2;
               const step3Done = !isCancelled && statusIdx >= 6;
               const isDelivered = o.status === 'DELIVERED';

               return (
                  <div key={o.id} className="bg-white p-8 rounded-lg shadow-sm border border-[#e4e2e2]">
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 bg-[#f5f3f3] rounded-sm overflow-hidden flex-shrink-0 border border-[#e4e2e2] flex items-center justify-center">
                           <span className="material-symbols-outlined text-4xl text-[#bfcab8]">inventory_2</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-headline font-bold text-zinc-400 uppercase tracking-widest mb-1 block">
                            Trace #{o.id.toString().padStart(6, '0')}
                          </span>
                          <h4 className="text-xl font-headline font-bold mb-1">
                            Pieces Ordered: {Object.values(o.items || {}).reduce((a,b)=>a+b, 0)}
                          </h4>
                          <p className="text-[#005a07] font-bold">Rs. {o.total.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className={`text-[10px] px-3 py-1 rounded-full font-headline font-bold uppercase tracking-tighter
                        ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                        ${o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : ''}
                        ${o.status === 'DELIVERY_DELAYED' ? 'bg-orange-100 text-orange-700' : ''}
                        ${!['DELIVERED','CANCELLED','DELIVERY_DELAYED'].includes(o.status) ? 'bg-[#f6e63e]/20 text-[#686000]' : ''}
                      `}>
                        {o.status.replace(/_/g, ' ')}
                      </div>
                    </div>

                    {/* Milestone Stepper */}
                    <div className="relative pt-4">
                      {/* Background Bar */}
                      <div className="absolute top-7 left-0 w-full h-[1px] bg-[#bfcab8]/30 z-0"></div>
                      
                      <div className="relative z-10 flex justify-between">
                        
                        {/* Step 1: Payment */}
                        <div className="text-center group">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-3 text-white ${step1Done ? 'bg-[#005a07]' : isCancelled ? 'bg-red-500' : 'bg-[#e4e2e2]'}`}>
                            {isCancelled ? <span className="material-symbols-outlined text-[12px]">close</span> : <span className="material-symbols-outlined text-[12px]">check</span>}
                          </div>
                          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-[#1b1c1c]">Payment</span>
                        </div>

                        {/* Step 2: Preparing */}
                        <div className={`text-center group ${!step2Done ? 'opacity-30' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-3 text-white ${step2Done ? 'bg-[#005a07]' : 'bg-[#f5f3f3] border border-[#bfcab8]'}`}>
                             {step2Done ? <span className="material-symbols-outlined text-[12px]">check</span> : <span className="material-symbols-outlined text-[#707a6b] text-[12px]">package_2</span>}
                          </div>
                          <span className={`text-[10px] font-headline font-bold uppercase tracking-widest ${step2Done ? 'text-[#1b1c1c]' : 'text-[#707a6b]'}`}>Preparing</span>
                        </div>

                        {/* Step 3: Shipping */}
                        <div className={`text-center group ${!step3Done ? 'opacity-30' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-3 text-white ${step3Done ? isDelayed ? 'bg-orange-500' : 'bg-[#005a07]' : 'bg-[#f5f3f3] border border-[#bfcab8]'}`}>
                            {step3Done ? <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span> : <span className="material-symbols-outlined text-[#707a6b] text-[12px]">local_shipping</span>}
                          </div>
                          <span className={`text-[10px] font-headline font-bold uppercase tracking-widest ${step3Done ? isDelayed ? 'text-orange-600' : 'text-[#005a07]' : 'text-[#707a6b]'}`}>
                            {isDelayed ? 'Delayed' : 'Shipping'}
                          </span>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className={`text-center group ${!isDelivered ? 'opacity-30' : ''}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-3 text-white ${isDelivered ? 'bg-[#005a07]' : 'bg-[#f5f3f3] border border-[#bfcab8]'}`}>
                            {isDelivered ? <span className="material-symbols-outlined text-[12px]">check</span> : <span className="material-symbols-outlined text-[#707a6b] text-[12px]">home</span>}
                          </div>
                          <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Delivered</span>
                        </div>

                      </div>
                    </div>
                  </div>
               );
            })}
          </div>
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
