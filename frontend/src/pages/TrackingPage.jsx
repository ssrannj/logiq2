import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrder } from '../services/api';

const STEPS = [
  {
    key: 'VERIFYING',
    label: 'Verification',
    icon: 'verified_user',
    desc: 'Order confirmed and payment check initiated.',
  },
  {
    key: 'PACKED',
    label: 'Packed',
    icon: 'package_2',
    desc: 'Securely packaged for premium shipping.',
  },
  {
    key: 'IN_TRANSIT',
    label: 'In Transit',
    icon: 'local_shipping',
    desc: 'Your items are on the way to the delivery hub.',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: 'home_pin',
    desc: 'Package successfully delivered to your door.',
  },
];

const STATUS_ORDER = ['VERIFYING', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatPrice = (n) =>
  `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function TrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(res => {
        setOrder(res.data);
        setError('');
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Order not found. Please check the order ID.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const currentStepIndex = order ? STATUS_ORDER.indexOf(order.status) : -1;

  const statusLabel = {
    VERIFYING: 'Verifying Payment',
    PACKED: 'Packed & Ready',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
  };

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter' }}>
      <Navbar />

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
            <p className="text-[var(--color-outline)] text-sm">Loading your order…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="text-center py-24 space-y-6">
            <span className="material-symbols-outlined text-5xl text-[var(--color-error)]">error_outline</span>
            <p className="text-xl font-bold text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 primary-gradient text-white rounded-lg font-bold"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              Go Home
            </button>
          </div>
        )}

        {/* ── Order Found ── */}
        {!loading && order && (
          <>
            {/* ── Header Card ── */}
            <section className="mb-12">
              <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <p
                    className="font-bold text-xs uppercase tracking-widest text-[var(--color-outline)] mb-1"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    Order Status
                  </p>
                  <h1
                    className="font-bold text-3xl text-[var(--color-on-surface)] tracking-tight"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    {statusLabel[order.status] || order.status}
                  </h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
                  <div>
                    <p
                      className="text-[var(--color-outline)] uppercase text-[10px] tracking-widest mb-1"
                      style={{ fontFamily: 'Plus Jakarta Sans' }}
                    >
                      Order ID
                    </p>
                    <p className="font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>#MS-{String(order.id).padStart(5, '0')}</p>
                  </div>
                  <div>
                    <p
                      className="text-[var(--color-outline)] uppercase text-[10px] tracking-widest mb-1"
                      style={{ fontFamily: 'Plus Jakarta Sans' }}
                    >
                      Order Date
                    </p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p
                      className="text-[var(--color-outline)] uppercase text-[10px] tracking-widest mb-1"
                      style={{ fontFamily: 'Plus Jakarta Sans' }}
                    >
                      Total Amount
                    </p>
                    <p className="font-bold text-[var(--color-primary)]">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Tracker Grid ── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Vertical Milestone Stepper */}
              <div className="lg:col-span-7 bg-[var(--color-surface-container-low)] p-10 rounded-lg">
                <h3
                  className="text-xl font-bold mb-10"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Tracking Journey
                </h3>

                <div className="relative flex flex-col gap-0">
                  {STEPS.map((step, i) => {
                    const isCompleted = i < currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    const isPending = i > currentStepIndex;
                    const isLast = i === STEPS.length - 1;

                    return (
                      <div key={step.key} className="flex gap-6 pb-12 relative fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                        {/* Connector line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[19px] top-10 bottom-0 w-[1px] ${
                              isCompleted || isCurrent
                                ? 'bg-[var(--color-primary)]'
                                : 'bg-[var(--color-outline-variant)]/30'
                            }`}
                          />
                        )}

                        {/* Step circle */}
                        <div
                          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted || isCurrent
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'border-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-outline)]'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{
                              fontVariationSettings: (isCompleted || isCurrent) ? "'FILL' 1" : "'FILL' 0",
                            }}
                          >
                            {step.icon}
                          </span>
                        </div>

                        {/* Step content */}
                        <div className="flex flex-col">
                          <p
                            className={`font-bold text-lg ${
                              isPending
                                ? 'text-[var(--color-outline)]'
                                : 'text-[var(--color-on-surface)]'
                            }`}
                            style={{ fontFamily: 'Plus Jakarta Sans' }}
                          >
                            {step.label}
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              isPending
                                ? 'text-[var(--color-outline-variant)]'
                                : 'text-[var(--color-on-surface-variant)]'
                            }`}
                          >
                            {step.desc}
                          </p>
                          {isCurrent && (
                            <p
                              className="text-xs font-bold text-[var(--color-primary)] mt-2"
                              style={{ fontFamily: 'Plus Jakarta Sans' }}
                            >
                              ● Current Stage
                            </p>
                          )}
                          {isCompleted && (
                            <p className="text-xs font-medium text-[var(--color-primary)] mt-2">
                              ✓ Completed
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details Sidebar */}
              <div className="lg:col-span-5 space-y-8">
                {/* Delivery Details */}
                <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-lg">
                  <h4
                    className="font-bold text-lg mb-6 flex items-center gap-2"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
                    Customer Details
                  </h4>
                  <div className="text-sm space-y-2 text-[var(--color-on-surface-variant)] leading-relaxed">
                    <p className="font-bold text-[var(--color-on-surface)]">{order.customerName || 'N/A'}</p>
                    <p>Order #{String(order.id).padStart(5, '0')}</p>
                    <p className="pt-2 font-medium text-[var(--color-primary)]">
                      Status: {order.status}
                    </p>
                  </div>
                </div>

                {/* Receipt Info */}
                <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-lg">
                  <h4
                    className="font-bold text-lg mb-6 flex items-center gap-2"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    <span className="material-symbols-outlined text-[var(--color-primary)]">receipt_long</span>
                    Payment Receipt
                  </h4>
                  <div className="text-sm space-y-2 text-[var(--color-on-surface-variant)]">
                    <p>Slip submitted: {order.receiptFilePath ? '✅ Received' : '—'}</p>
                    <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)]/20">
                      <div className="flex justify-between items-center">
                        <span
                          className="font-bold"
                          style={{ fontFamily: 'Plus Jakarta Sans' }}
                        >
                          Total Paid
                        </span>
                        <span
                          className="font-extrabold text-xl text-[var(--color-primary)]"
                          style={{ fontFamily: 'Plus Jakarta Sans' }}
                        >
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Help Section ── */}
            <section className="mt-16 text-center">
              <p className="text-sm text-[var(--color-outline)] mb-4">Need help with your order?</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  className="px-6 py-3 primary-gradient text-white font-bold text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  <span className="material-symbols-outlined text-lg">support_agent</span>
                  Contact Support
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] font-bold text-sm rounded-lg hover:bg-[var(--color-surface-container-low)] transition-all"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Continue Shopping
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
