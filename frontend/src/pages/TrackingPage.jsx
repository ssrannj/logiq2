import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OrderTrackingView from '../components/OrderTrackingView';
import { getOrder, trackGuestOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Guest Lookup Form ────────────────────────────────────────────────────────
function GuestLookupForm({ initialOrderId = '', initialEmail = '', onResult }) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [emailInput, setEmailInput]     = useState(initialEmail);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

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
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1">Order ID</label>
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
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1">Email Address</label>
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
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching…</>
          ) : (
            <><span className="material-symbols-outlined text-lg">search</span>Find My Order</>
          )}
        </button>
      </form>

      <div className="mt-8 text-center space-y-4">
        <p className="text-xs text-[var(--color-outline)]">Have an account?</p>
        <a href="/auth" className="text-sm font-semibold text-[var(--color-primary)] hover:underline" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Sign in to view all orders
        </a>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { orderId } = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);

  const guestEmail = location.state?.guestEmail || '';

  useEffect(() => {
    if (!orderId) {
      if (user) {
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
        setShowGuestForm(false);
      })
      .catch(() => {
        if (user) {
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
            <p className="text-[var(--color-outline)] text-sm">Loading your order…</p>
          </div>
        )}

        {!loading && showGuestForm && (
          <GuestLookupForm
            initialOrderId={orderId || ''}
            initialEmail={guestEmail}
            onResult={(data) => { setOrder(data); setShowGuestForm(false); }}
          />
        )}

        {!loading && !showGuestForm && order && (
          <OrderTrackingView
            order={order}
            navigate={navigate}
            onBack={user ? null : () => { setOrder(null); setShowGuestForm(true); }}
          />
        )}
      </main>
    </div>
  );
}
