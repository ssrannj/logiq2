import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, addProduct, deleteProduct, getAllOrders, updateOrderStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, inventory, orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', stockCount: '', category: 'Living', imageUrl: '', brand: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'inventory' || activeTab === 'overview') {
        const resP = await getProducts();
        setProducts(resP.data);
      }
      if (activeTab === 'orders' || activeTab === 'overview') {
        const resO = await getAllOrders();
        setOrders(resO.data);
      }
    } catch (err) {
      setError('Failed to fetch data. Check your connection.');
    }
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stockCount: parseInt(newProduct.stockCount, 10)
      });
      setNewProduct({ name: '', price: '', stockCount: '', category: 'Living', imageUrl: '', brand: '' });
      setShowAddModal(false);
      fetchData(); 
    } catch (err) {
      setError('Failed to add product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete product. It may be linked to an existing order.');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      fetchData();
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  return (
    <div className="text-[#1b1c1c] bg-[#fbf9f8] min-h-screen flex font-body">
      
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#fbf9f8] border-r border-[#e4e2e2] flex flex-col p-6 space-y-2 font-headline text-sm z-50">
        <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center gap-3 justify-center text-xl font-bold text-[#005a07]">
            MANGALA
          </div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2 ml-1 text-center">Showroom Management</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform duration-200 hover:translate-x-1 ${activeTab === 'overview' ? 'bg-white text-[#005a07] border border-[#e4e2e2]' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform duration-200 hover:translate-x-1 ${activeTab === 'inventory' ? 'bg-white text-[#005a07] border border-[#e4e2e2]' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <span className="material-symbols-outlined text-lg">weekend</span>
            <span>Inventory</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform duration-200 hover:translate-x-1 ${activeTab === 'orders' ? 'bg-white text-[#005a07] border border-[#e4e2e2]' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            <span>Orders</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-[#e4e2e2]">
          <button 
            onClick={() => { setActiveTab('inventory'); setShowAddModal(true); }}
            className="w-full bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white py-3 rounded-lg font-semibold text-xs mb-4 hover:opacity-90 transition-opacity shadow-md"
          >
            New Collection
          </button>
          <div className="space-y-1">
            <button 
              onClick={() => { logout(); navigate('/auth'); }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-500 hover:bg-red-50 transition-transform duration-200 hover:translate-x-1 rounded-lg"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 w-full p-12 bg-[#fbf9f8]">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-headline text-4xl font-extrabold text-[#1b1c1c] tracking-tighter">
              {activeTab === 'overview' && 'Executive Dashboard'}
              {activeTab === 'inventory' && 'Inventory Management'}
              {activeTab === 'orders' && 'Global Orders Tracking'}
            </h1>
            <p className="text-[#40493c] font-body mt-2">
              {activeTab === 'overview' && 'Welcome back. Here is what is happening with Mangala Luxe today.'}
              {activeTab === 'inventory' && 'Add, remove, and monitor stock for the global unified catalog.'}
              {activeTab === 'orders' && 'Adjust live lifecycles and confirm slip payments dynamically.'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-headline font-bold text-sm">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-[#40493c]">General Manager</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#eae8e7] flex items-center justify-center overflow-hidden border border-[#e4e2e2]">
              <span className="material-symbols-outlined text-3xl text-[#005a07]">shield_person</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined">error</span> {error}
          </div>
        )}

        {/* ─── OVERVIEW TAB ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500">
            {/* Stats Row */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#e4e2e2] hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-[#005a07]/5 rounded-lg">
                    <span className="material-symbols-outlined text-[#005a07]">payments</span>
                  </span>
                  <span className="text-[#005a07] text-xs font-bold font-headline">+12.5%</span>
                </div>
                <p className="text-[#40493c] text-sm font-medium mb-1">Total Sales Matrix</p>
                <h3 className="font-headline text-3xl font-extrabold">Live Active</h3>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#e4e2e2] hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-[#686000]/5 rounded-lg">
                    <span className="material-symbols-outlined text-[#686000]">shopping_cart</span>
                  </span>
                  <span className="text-[#686000] text-xs font-bold font-headline">Active</span>
                </div>
                <p className="text-[#40493c] text-sm font-medium mb-1">Active Global Orders</p>
                <h3 className="font-headline text-3xl font-extrabold">{orders.length}</h3>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#e4e2e2] hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 bg-[#005463]/5 rounded-lg">
                    <span className="material-symbols-outlined text-[#005463]">weekend</span>
                  </span>
                  <span className="text-[#005a07] text-xs font-bold font-headline">+8%</span>
                </div>
                <p className="text-[#40493c] text-sm font-medium mb-1">Total Catalog Pieces</p>
                <h3 className="font-headline text-3xl font-extrabold">{products.length}</h3>
              </div>
            </section>

            {/* Recent Orders Overview */}
            <section className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <div className="p-8 flex justify-between items-center border-b border-[#f0eded]">
                <h4 className="font-headline text-xl font-bold tracking-tight">Priority Orders Board</h4>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#005a07] hover:underline transition-all">View All Pipelines</button>
              </div>
              <div className="overflow-x-auto p-4">
                <p className="text-sm text-zinc-500 italic p-4">Navigate to Orders tab to process and edit live entries.</p>
              </div>
            </section>
          </div>
        )}

        {/* ─── INVENTORY TAB ────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="animate-in fade-in duration-500">
            {showAddModal && (
              <div className="mb-8 bg-white p-8 rounded-2xl shadow-sm border border-[#005a07]/20 border-t-4 border-t-[#005a07]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#005a07] font-headline">Craft New Catalog Entry</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input required placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
                  <input required placeholder="Brand / Designer" value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
                  <input required type="number" step="0.01" placeholder="Price (LKR)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
                  <input required type="number" placeholder="Physical Stock" value={newProduct.stockCount} onChange={(e) => setNewProduct({...newProduct, stockCount: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm">
                    <option value="Living">Living Room</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                  <input required placeholder="High-Res Image URL (https://...)" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
                  
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" className="bg-[#005a07] hover:bg-[#1d741b] text-white px-8 py-3 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-colors shadow">
                      Publish to Global Catalog
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9f8] text-[#40493c] text-[10px] uppercase tracking-widest font-bold border-b border-[#f0eded]">
                    <th className="px-8 py-4">Piece</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Availability</th>
                    <th className="px-8 py-4">Listing Price</th>
                    <th className="px-8 py-4 text-center">Controls</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {loading && <tr><td colSpan="5" className="p-8 text-center text-zinc-400">Syncing Matrix...</td></tr>}
                  {!loading && products.map(p => (
                    <tr key={p.id} className="hover:bg-[#f5f3f3] border-b border-[#f5f3f3] transition-colors group">
                      <td className="px-8 py-4 flex items-center space-x-4">
                        <img src={p.imageUrl} className="w-12 h-12 rounded object-cover border border-[#e4e2e2]" alt="Product" />
                        <div>
                          <p className="font-bold text-[#1b1c1c] font-headline">{p.name}</p>
                          <p className="text-xs text-[#707a6b]">{p.brand}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-[#40493c]">{p.category}</td>
                      <td className="px-8 py-4">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${p.stockCount > 0 ? 'bg-[#1d741b]/10 text-[#005a07]' : 'bg-red-100 text-red-800'}`}>
                          {p.stockCount > 0 ? `${p.stockCount} UNITS READY` : 'DEPLETED'}
                        </span>
                      </td>
                      <td className="px-8 py-4 font-headline font-bold text-[#005a07]">Rs. {p.price.toLocaleString()}</td>
                      <td className="px-8 py-4 text-center">
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-sm block">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ORDERS TAB ────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <div className="p-8 flex justify-between items-center border-b border-[#f0eded]">
                <h4 className="font-headline text-xl font-bold tracking-tight">Active Fulfillment Pipelines</h4>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9f8] text-[#40493c] text-[10px] uppercase tracking-widest font-bold border-b border-[#f0eded]">
                    <th className="px-8 py-4">Trace ID</th>
                    <th className="px-8 py-4">Client Detail</th>
                    <th className="px-8 py-4">Total Secured</th>
                    <th className="px-8 py-4">Receipt Audit</th>
                    <th className="px-8 py-4">State Engine</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {loading && <tr><td colSpan="5" className="p-8 text-center text-zinc-400">Reading LEDGER...</td></tr>}
                  {!loading && orders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[#707a6b]">No ledgers created.</td></tr>}
                  {!loading && orders.map(o => (
                    <tr key={o.id} className="hover:bg-[#f5f3f3] border-b border-[#f5f3f3] transition-colors group">
                      <td className="px-8 py-6 font-medium font-headline">#MD-{o.id.toString().padStart(6, '0')}</td>
                      <td className="px-8 py-6">
                        <p className="text-[#40493c] font-medium">{o.customerName}</p>
                        <p className="text-[10px] text-zinc-400">{Object.keys(o.items || {}).length} Unique Pieces</p>
                      </td>
                      <td className="px-8 py-6 font-headline font-bold text-[#005a07]">Rs. {o.total.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        {o.receiptFilePath ? (
                          <a href={`http://localhost:8080/api/orders/${o.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded">
                            <span className="material-symbols-outlined text-[14px]">receipt_long</span> Extract
                          </a>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">Missing</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className={`text-xs font-bold uppercase tracking-widest py-2 px-3 rounded-lg border-none focus:ring-2 focus:ring-[#005a07] shadow-sm appearance-none cursor-pointer
                            ${['PENDING_PAYMENT','PAYMENT_VERIFICATION_IN_PROGRESS'].includes(o.status) ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${['ORDER_CONFIRMED','PROCESSING'].includes(o.status) ? 'bg-blue-100 text-blue-800' : ''}
                            ${['PACKED','READY_FOR_DISPATCH'].includes(o.status) ? 'bg-indigo-100 text-indigo-800' : ''}
                            ${['HANDED_OVER_TO_SHIPPING','IN_TRANSIT','ARRIVED_AT_REGIONAL_HUB','OUT_FOR_DELIVERY'].includes(o.status) ? 'bg-purple-100 text-purple-800' : ''}
                            ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                            ${o.status === 'DELIVERY_DELAYED' ? 'bg-orange-100 text-orange-800' : ''}
                            ${o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : ''}
                          `}
                        >
                          <option value="PENDING_PAYMENT">Pending Payment</option>
                          <option value="PAYMENT_VERIFICATION_IN_PROGRESS">Verifying Payment</option>
                          <option value="ORDER_CONFIRMED">Order Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="PACKED">Packed</option>
                          <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                          <option value="HANDED_OVER_TO_SHIPPING">Handed to Courier</option>
                          <option value="IN_TRANSIT">In Transit</option>
                          <option value="ARRIVED_AT_REGIONAL_HUB">At Regional Hub</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="DELIVERY_DELAYED">Delivery Delayed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
