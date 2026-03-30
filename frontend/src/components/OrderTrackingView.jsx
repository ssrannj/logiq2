// Shared order tracking UI — used in TrackingPage (guest + auth) and CustomerDashboard

export const STEPS = [
  { key: 'PENDING_PAYMENT',                  label: 'Awaiting Payment',   icon: 'payments',             desc: 'Order placed and awaiting payment confirmation.' },
  { key: 'PAYMENT_VERIFICATION_IN_PROGRESS', label: 'Verifying Payment',  icon: 'verified_user',        desc: 'Your bank slip is being reviewed by our team.' },
  { key: 'ORDER_CONFIRMED',                  label: 'Order Confirmed',    icon: 'task_alt',             desc: 'Payment verified and your order is confirmed.' },
  { key: 'PROCESSING',                       label: 'Processing',         icon: 'manufacturing',        desc: 'Your items are being prepared and sourced.' },
  { key: 'PACKED',                           label: 'Packed',             icon: 'package_2',            desc: 'Securely packaged and ready for handover.' },
  { key: 'READY_FOR_DISPATCH',               label: 'Ready for Dispatch', icon: 'deployed_code',        desc: 'Package is staged and awaiting courier pickup.' },
  { key: 'HANDED_OVER_TO_SHIPPING',          label: 'Handed to Courier',  icon: 'handshake',            desc: 'Package handed over to the shipping partner.' },
  { key: 'IN_TRANSIT',                       label: 'In Transit',         icon: 'local_shipping',       desc: 'Your items are on their way to the regional hub.' },
  { key: 'ARRIVED_AT_REGIONAL_HUB',          label: 'At Regional Hub',    icon: 'warehouse',            desc: 'Package has arrived at the nearest hub.' },
  { key: 'OUT_FOR_DELIVERY',                 label: 'Out for Delivery',   icon: 'delivery_truck_speed', desc: 'Your delivery is on the way to your address.' },
  { key: 'DELIVERED',                        label: 'Delivered',          icon: 'home_pin',             desc: 'Package successfully delivered to your door.' },
];

export const STATUS_ORDER = STEPS.map(s => s.key);

export const STATUS_LABEL = {
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

export const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const formatPrice = (n) =>
  `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

// ── Full tracking view (shared between TrackingPage and CustomerDashboard) ──
export default function OrderTrackingView({ order, onBack, navigate, compact = false }) {
  const isCancelled = order.status === 'CANCELLED';
  const isDelayed   = order.status === 'DELIVERY_DELAYED';
  const effectiveStatus   = isDelayed ? 'OUT_FOR_DELIVERY' : order.status;
  const currentStepIndex  = isCancelled ? -1 : STATUS_ORDER.indexOf(effectiveStatus);

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
              {STATUS_LABEL[order.status] || order.status}
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

      {/* Stepper + Sidebar */}
      {!isCancelled && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Vertical Milestone Stepper */}
          <div className="lg:col-span-7 bg-[var(--color-surface-container-low)] p-10 rounded-xl">
            <h3 className="text-xl font-bold mb-10" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Tracking Journey
            </h3>

            {/* Horizontal progress dots */}
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

            {/* Vertical detail steps */}
            <div className="flex flex-col gap-0">
              {STEPS.map((step, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent   = i === currentStepIndex;
                const isPending   = i > currentStepIndex;
                const isLast      = i === STEPS.length - 1;

                return (
                  <div key={step.key} className="flex gap-6 pb-10 relative fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
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

          {/* Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Customer Details */}
            <div className="bg-[var(--color-surface-container-lowest)] p-7 rounded-xl border border-[var(--color-outline-variant)]/20">
              <h4 className="font-bold text-base mb-5 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">person</span>
                Customer Details
              </h4>
              <div className="space-y-2 text-sm text-[var(--color-on-surface-variant)]">
                <p className="font-bold text-[var(--color-on-surface)] text-base">{order.customerName || 'N/A'}</p>
                {order.address && <p className="leading-relaxed">{order.address}</p>}
                <p className="pt-2 font-semibold text-[var(--color-primary)]">{STATUS_LABEL[order.status] || order.status}</p>
              </div>
            </div>

            {/* Payment Summary */}
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
              {navigate && (
                <button
                  onClick={() => navigate('/catalog')}
                  className="w-full px-6 py-3 primary-gradient text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  <span className="material-symbols-outlined text-lg">storefront</span>
                  Continue Shopping
                </button>
              )}
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full px-6 py-3 border border-[var(--color-outline-variant)]/40 text-[var(--color-on-surface)] font-bold text-sm rounded-xl hover:bg-[var(--color-surface-container-low)] transition-all"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  {compact ? 'Collapse' : 'Track Another Order'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Help */}
      {!compact && (
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
      )}
    </>
  );
}
