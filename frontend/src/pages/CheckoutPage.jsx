import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { checkoutOrder } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const formatPrice = (n) =>
  `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart, removeFromCart } = useCart();
  const { user } = useAuth();

  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, PNG, or JPG files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }
    setError('');
    setSlipFile(file);
    if (file.type.startsWith('image/')) {
      setSlipPreview(URL.createObjectURL(file));
    } else {
      setSlipPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const deliveryFee = cart.length > 0 ? 2500 : 0;
  const vat = Math.round(cartTotal * 0.15);
  const grandTotal = cartTotal + deliveryFee + vat;

  const handleSubmit = async () => {
    if (cart.length === 0) {
        setError('Your cart is empty.');
        return;
    }
    if (!slipFile) {
      setError('Please attach your bank transfer slip before confirming.');
      return;
    }
    if (!customerName.trim() || !phoneNumber.trim() || !address.trim()) {
      setError('Detailed customer name, phone number, and delivery address are mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('slip', slipFile);
    formData.append('total', grandTotal);
    formData.append('customerName', customerName.trim());
    formData.append('phoneNumber', phoneNumber.trim());
    formData.append('address', address.trim());
    formData.append('note', note.trim());
    
    // Convert cart to productId:quantity Map
    const itemsMap = {};
    cart.forEach(item => {
        itemsMap[item.id] = item.quantity;
    });
    formData.append('items', JSON.stringify(itemsMap));

    try {
      const res = await checkoutOrder(formData);
      const orderId = res.data.id;
      clearCart();
      navigate(`/track/${orderId}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Checkout failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)]" style={{ fontFamily: 'Inter' }}>
      <Navbar />

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* ── Left Column: Shipping & Payment ── */}
          <div className="lg:col-span-7 space-y-12">
            <section>
              <h1
                className="text-4xl font-extrabold tracking-tight mb-2 text-[var(--color-on-surface)]"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Secure Checkout
              </h1>
              <p className="text-[var(--color-on-surface-variant)]">
                Provide your delivery details and upload your payment slip for artisan processing.
              </p>
            </section>

            {/* Delivery Details */}
            <section className="bg-[var(--color-surface-container-low)] p-8 rounded-xl space-y-6">
              <h2
                className="text-xl font-bold flex items-center gap-3"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">local_shipping</span>
                Delivery Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--color-outline)] ml-1">Full Name</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Recipient Name"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--color-outline)] ml-1">Mobile Number</label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+94"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
                    />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[var(--color-outline)] ml-1">Delivery Address</label>
                <textarea
                    rows="3"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Provide full street address/landmark..."
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm resize-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[var(--color-outline)] ml-1">Order Notes (Optional)</label>
                <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Doorbell code, delivery timing, etc."
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
                />
              </div>
            </section>

            {/* Bank Transfer Details */}
            <section className="bg-[var(--color-surface-container-low)] p-8 rounded-xl space-y-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">account_balance</span>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Bank Transfer Instructions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Bank Name', value: 'Bank of Ceylon' },
                  { label: 'Account Number', value: '001157537' },
                  { label: 'Account Holder', value: 'Mangala Showroom (PVT) Ltd' },
                  { label: 'Branch', value: 'Jaffna Main' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-lg"
                  >
                    <p className="text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
                      {label}
                    </p>
                    <p className="font-semibold text-lg">{value}</p>
                  </div>
                ))}
              </div>

              {/* File Drop Zone */}
              <div className="space-y-4">
                <label
                  className="font-bold text-sm block"
                  style={{ fontFamily: 'Plus Jakarta Sans' }}
                >
                  Upload Transaction Proof
                </label>
                <div
                  id="drop-zone"
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${
                    isDragging
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : slipFile
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/3'
                      : 'border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="slip-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                  />
                  {slipPreview ? (
                    <img src={slipPreview} alt="Slip preview" className="max-h-48 rounded-lg mb-4 shadow" />
                  ) : (
                    <span className="material-symbols-outlined text-[var(--color-outline)] text-4xl mb-4 group-hover:scale-110 transition-transform">
                      cloud_upload
                    </span>
                  )}
                  {slipFile ? (
                    <>
                      <p className="text-[var(--color-primary)] font-bold">{slipFile.name}</p>
                      <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
                        {(slipFile.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[var(--color-on-surface)] font-medium">Drag and drop your slip here</p>
                      <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">PNG, JPG or PDF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm font-medium">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <button
                id="confirm-order-btn"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
                className="w-full md:w-auto px-10 py-5 primary-gradient text-white font-bold text-lg rounded-lg shadow-xl shadow-[var(--color-primary)]/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {isSubmitting ? 'hourglass_empty' : 'send'}
                </span>
                {isSubmitting ? 'Placing Order…' : 'Secure and Fulfill Order'}
              </button>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <aside className="lg:col-span-5 sticky top-32">
            <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-xl shadow-2xl shadow-[var(--color-on-surface)]/5 space-y-8">
              <h3
                className="text-2xl font-bold border-b border-[var(--color-surface-container-high)] pb-4"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              >
                Your Bag ({cart.reduce((a,b)=>a+b.quantity,0)})
              </h3>

              {/* Items */}
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {cart.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-zinc-400 italic">Your bag is currently empty.</p>
                        <button onClick={()=>navigate('/catalog')} className="text-[var(--color-primary)] font-bold text-sm mt-4 hover:underline">Return to Furniture Gallery</button>
                    </div>
                )}
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="h-20 w-20 bg-[var(--color-surface-container)] rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        className="h-full w-full object-cover"
                        src={item.imageUrl}
                        alt={item.name}
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <p
                            className="font-bold text-[var(--color-on-surface)]"
                            style={{ fontFamily: 'Plus Jakarta Sans' }}
                        >
                            {item.name}
                        </p>
                        <button onClick={()=>removeFromCart(item.id)} className="text-zinc-400 hover:text-red-600 transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                      <p className="text-sm text-[var(--color-on-surface-variant)]">{item.brand} | Qty: {item.quantity}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-semibold text-[var(--color-primary)]">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-6 border-t border-[var(--color-surface-container-high)] space-y-4">
                <div className="flex justify-between items-center text-[var(--color-on-surface-variant)]">
                  <span>Subtotal Matrix</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-on-surface-variant)]">
                  <span>Express Logistic Delivery</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-on-surface-variant)]">
                  <span>Taxes (VAT 15%) Secured</span>
                  <span>{formatPrice(vat)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 text-[var(--color-on-surface)]">
                  <span
                    className="font-extrabold text-xl"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    Total
                  </span>
                  <span
                    className="font-extrabold text-2xl text-[var(--color-primary)]"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-[var(--color-surface-container-low)] p-4 rounded-lg flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--color-primary)]">verified_user</span>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest text-[var(--color-on-surface)]"
                    style={{ fontFamily: 'Plus Jakarta Sans' }}
                  >
                    Secure Transaction
                  </p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)]">
                    Your logistics and billing is handled according to artisan vault protocols.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
