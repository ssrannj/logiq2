import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrder, trackGuestOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { key: 'PENDING_PAYMENT',                 label: 'Awaiting Payment',     icon: 'payments',         desc: 'Order placed and awaiting payment confirmation.' },
  { key: 'PAYMENT_VERIFICATION_IN_PROGRESS',label: 'Verifying Payment',    icon: 'verified_user',    desc: 'Your bank slip is being reviewed by our team.' },
  { key: 'ORDER_CONFIRMED',                 label: 'Order Confirmed',       icon: 'task_alt',         desc: 'Payment verified and your order is confirmed.' },
  { key: 'PROCESSING',                      label: 'Processing',            icon: 'manufacturing',    desc: 'Your items are being prepared and sourced.' },
  { key: 'PACKED',                          label: 'Packed',                icon: 'package_2',        desc: 'Securely packaged and ready for handover.' },
  { key: 'READY_FOR_DISPATCH',              label: 'Ready for Dispatch',    icon: 'deployed_code',    desc: 'Package is staged and awaiting courier pickup.' },
  { key: 'HANDED_OVER_TO_SHIPPING',         label: 'Handed to Courier',     icon: 'handshake',        desc: 'Package handed over to the shipping partner.' },
  { key: 'IN_TRANSIT',                      label: 'In Transit',            icon: 'local_shipping',   desc: 'Your items are on their way to the regional hub.' },
  { key: 'ARRIVED_AT_REGIONAL_HUB',         label: 'At Regional Hub',       icon: 'warehouse',        desc: 'Package has arrived at the nearest hub.' },
  { key: 'OUT_FOR_DELIVERY',                label: 'Out for Delivery',      icon: 'delivery_truck_speed', desc: 'Your delivery is on the way to your address.' },
  { key: 'DELIVERED',                       label: 'Delivered',             icon: 'home_pin',         desc: 'Package successfully delivered to your door.' },
];

const STATUS_ORDER = [
  'PENDING_PAYMENT', 'PAYMENT_VERIFICATION_IN_PROGRESS', 'ORDER_CONFIRMED',
  'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'HANDED_OVER_TO_SHIPPING',
  'IN_TRANSIT', 'ARRIVED_AT_REGIONAL_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-LK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatPrice = (n) =>
  `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const statusLabel = {
  PENDING_PAYMENT:                  'Awaiting Payment',
  PAYMENT_VERIFICATION_IN_PROGRESS: 'Verifying Payment',
  ORDER_CONFIRMED:                  'Order Confirmed',
  PROCESSING:                       'Processing',
  PACKED:                           'Packed',
  READY_FOR_DISPATCH:               'Ready for Dispatch',
  HANDED_OVER_TO_SHIPPING:          'Handed to Courier',
  IN_TRANSIT:                       'In Transit',
  ARRIVED_AT_REGIONAL_HUB:          'At Regional Hub',
  OUT_FOR_DELIVERY:                 'Out for Delivery',
  DELIVERED:                        'Delivered',
  DELIVERY_DELAYED:                 'Delivery Delayed',
  CANCELLED:                        'Cancelled',
};

// ── Shared Tracking View ─────────────────────────────────────────────────────
function TrackingView({ order, onBack, navigate }) {
  const isCancelled = order.status === 'CANCELLED';
  const isDelayed = order.status === 'DELIVERY_DELAYED';
  const effectiveStatus = isDelayed ? 'OUT_FOR_DELIVERY' : order.status;
  const currentStepIndex = isCancelled ? -1 : STATUS_ORDER.indexOf(effectiveStatus);

  return (
    <>
      {/* Header Card */}
      <section className="mb-10">
        <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl border border-[var(--color-outline-variant)]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Order Status
            </p>
            <h1 className="font-extrabold text-3xl text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {statusLabel[order.status] || order.status}
            </h1>
            {order.customerName && (
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">For {order.customerName}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-[var(--color-outline)] uppercase text-[10px] tracking-widest mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>Order ID</p>
              <p className="font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>#MS-{String(order.orderId ?? order.id).padStart(5, '0')}</p>
            </div>
            <div>
              <p className="text-[var(--color-outline)] uppercase text-[10px] tracking-widest mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>Order Date</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-[var(--color-outline)] uppercase text-[10px] tracking-widest mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>Total</p>
              <p className="font-bold text-[var(--color-primary)]">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Special status banners */}
      {isDelayed && (
        <div className="mb-8 flex items-start gap-4 p-5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800">
          <span className="material-symbols-outlined text-2xl shrink-0 text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
          <div>
            <p className="font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans' }}>Delivery Delayed</p>
            <p className="text-sm mt-0.5">Your package is experiencing a delay. Our team is working to resolve this. We apologise for the inconvenience.</p>
          </div>
        </div>
      )}
      {isCancelled && (
        <div className="mb-8 flex items-start gap-4 p-5 rounded-xl bg-red-50 border border-red-200 text-red-800">
          <span className="material-symbols-outlined text-2xl shrink-0 text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
          <div>
            <p className="font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans' }}>Order Cancelled</p>
            <p className="text-sm mt-0.5">This order has been cancelled. If you believe this is an error, please contact support.</p>
          </div>
        </div>
      )}

      {/* Progress Bar (horizontal on mobile, then vertical stepper) */}
      {!isCancelled && (
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Vertical Milestone Stepper */}
        <div className="lg:col-span-7 bg-[var(--color-surface-container-low)] p-10 rounded-xl">
          <h3 className="text-xl font-bold mb-10" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Tracking Journey
          </h3>

          {/* Horizontal progress bar */}
          <div className="relative flex items-center justify-between mb-12">
            {STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {i < STEPS.length - 1 && (
                    <div className={`absolute left-1/2 top-5 h-[2px] w-full z-0 transition-colors ${i < currentStepIndex ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-outline-variant)]/30'}`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-container-low)] border-[var(--color-outline-variant)] text-[var(--color-outline)]'}`}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
                      {step.icon}
                    </span>
                  </div>
                  <p className={`text-[10px] font-bold mt-2 text-center uppercase tracking-wide ${done ? 'text-[var(--color-primary)]' : 'text-[var(--color-outline)]'}`} style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Vertical steps detail */}
          <div className="flex flex-col gap-0">
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isPending = i > currentStepIndex;
              const isLast = i === STEPS.length - 1;

              return (
                <div key={step.key} className="flex gap-6 pb-10 relative fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  {!isLast && (
                    <div className={`absolute left-[19px] top-10 bottom-0 w-[1px] ${isCompleted || isCurrent ? 'bg-[var(--color-primary)]/40' : 'bg-[var(--color-outline-variant)]/20'}`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted || isCurrent ? 'bg-[var(--color-primary)] text-white' : 'border-2 border-[var(--color-outline-variant)]/40 text-[var(--color-outline)]'}`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: (isCompleted || isCurrent) ? "'FILL' 1" : "'FILL' 0" }}>
                      {step.icon}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className={`font-bold text-base ${isPending ? 'text-[var(--color-outline)]' : 'text-[var(--color-on-surface)]'}`} style={{ fontFamily: 'Plus Jakarta Sans' }}>
                      {step.label}
                    </p>
                    <p className={`text-sm mt-0.5 ${isPending ? 'text-[var(--color-outline-variant)]' : 'text-[var(--color-on-surface-variant)]'}`}>
                      {step.desc}
                    </p>
                    {isCurrent && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] inline-block animate-pulse" />
                        Current Stage
                      </span>
                    )}
                    {isCompleted && (
                      <span className="mt-1.5 text-xs font-medium text-[var(--color-primary)]">✓ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Delivery Details */}
          <div className="bg-[var(--color-surface-container-lowest)] p-7 rounded-xl border border-[var(--color-outline-variant)]/20">
            <h4 className="font-bold text-base mb-5 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">person</span>
              Customer Details
            </h4>
            <div className="space-y-2 text-sm text-[var(--color-on-surface-variant)]">
              <p className="font-bold text-[var(--color-on-surface)] text-base">{order.customerName || 'N/A'}</p>
              {order.address && <p className="leading-relaxed">{order.address}</p>}
              <p className="pt-2 font-semibold text-[var(--color-primary)]">{statusLabel[order.status] || order.status}</p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-[var(--color-surface-container-lowest)] p-7 rounded-xl border border-[var(--color-outline-variant)]/20">
            <h4 className="font-bold text-base mb-5 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">receipt_long</span>
              Payment Summary
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-on-surface-variant)]">Total Paid</span>
              <span className="font-extrabold text-xl text-[var(--color-primary)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/catalog')}
              className="w-full px-6 py-3 primary-gradient text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              <span className="material-symbols-outlined text-lg">storefront</span>
              Continue Shopping
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="w-full px-6 py-3 border border-[var(--color-outline-variant)]/40 text-[var(--color-on-surface)] font-bold text-sm rounded-xl hover:bg-[var(--color-surface-container-low)] transition-all"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Track Another Order
              </button>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Help */}
      <section className="mt-14 text-center">
        <p className="text-sm text-[var(--color-outline)] mb-4">Need help with your order?</p>
        <button
          className="px-6 py-3 border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] font-bold text-sm rounded-xl hover:bg-[var(--color-surface-container-low)] transition-all flex items-center gap-2 mx-auto"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          <span className="material-symbols-outlined text-lg">support_agent</span>
          Contact Support
        </button>
      </section>
    </>
  );
}

// ── Guest Lookup Form ────────────────────────────────────────────────────────
function GuestLookupForm({ initialOrderId = '', initialEmail = '', onResult }) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderId && initialEmail) {
      handleSubmit(null, initialOrderId, initialEmail);
    }
  }, []);

  const handleSubmit = async (e, oid = orderIdInput, em = emailInput) => {
    if (e) e.preventDefault();
    if (!oid || !em) {
      setError('Please enter both your order ID and email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await trackGuestOrder(Number(oid), em);
      onResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not find your order. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Icon + heading */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 mb-5">
          <span className="material-symbols-outlined text-4xl text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_shipping
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Track Your Order
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-3 text-sm">
          Enter your order ID and the email used at checkout to see your delivery status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--color-surface-container-lowest)] p-8 rounded-2xl border border-[var(--color-outline-variant)]/20 space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1">
            Order ID
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--color-outline)] text-xl">tag</span>
            <input
              type="number"
              value={orderIdInput}
              onChange={e => setOrderIdInput(e.target.value)}
              placeholder="e.g. 1042"
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--color-outline)] text-xl">mail</span>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-error-container)] text-[var(--color-on-error-container)] text-sm">
            <span className="material-symbols-outlined text-lg shrink-0">error_outline</span>
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 primary-gradient text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">search</span>
              Find My Order
            </>
          )}
        </button>
      </form>

      {/* Divider + alternate paths */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-xs text-[var(--color-outline)]">Have an account?</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a href="/auth" className="text-sm font-semibold text-[var(--color-primary)] hover:underline" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Sign in to view all orders
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  // Email passed via navigation state (from guest checkout redirect)
  const guestEmail = location.state?.guestEmail || '';

  useEffect(() => {
    if (!orderId) {
      if (user) {
        // Logged-in users: redirect to dashboard which already shows all orders
        navigate('/dashboard', { replace: true });
      } else {
        setShowGuestForm(true);
      }
      return;
    }

    setLoading(true);
    getOrder(orderId)
      .then(res => {
        setOrder(res.data);
        setError('');
        setShowGuestForm(false);
      })
      .catch(() => {
        if (user) {
          // Logged-in user but order load failed — redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          setShowGuestForm(true);
        }
      })
      .finally(() => setLoading(false));
  }, [orderId, user, navigate]);

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)] min-h-screen" style={{ fontFamily: 'Inter' }}>
      <Navbar />

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
            <p className="text-[var(--color-outline)] text-sm">Loading your order…</p>
          </div>
        )}

        {/* Guest lookup form */}
        {!loading && showGuestForm && (
          <GuestLookupForm
            initialOrderId={orderId || ''}
            initialEmail={guestEmail}
            onResult={(data) => {
              setOrder(data);
              setShowGuestForm(false);
            }}
          />
        )}

        {/* Tracking view */}
        {!loading && !showGuestForm && order && (
          <TrackingView
            order={order}
            navigate={navigate}
            onBack={user ? null : () => {
              setOrder(null);
              setShowGuestForm(true);
            }}
          />
        )}
      </main>
    </div>
  );
}
