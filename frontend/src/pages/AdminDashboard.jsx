import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, addProduct, deleteProduct, getAllOrders, updateOrderStatus, updateProduct,
  getCategories, addCategory, deleteCategory } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, inventory, orders, categories
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', stockCount: '', category: '', imageUrl: '', brand: '', material: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', description: '', price: '', quantity: '', category: '', warrantyPeriodMonths: '', material: ''
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Category Management State
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [catError, setCatError] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes] = await Promise.all([getCategories()]);
      setCategories(catRes.data);

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

  const subCategories = categories.filter(c => c.parentId !== null);
  const rootCategories = categories.filter(c => c.parentId === null);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatSaving(true);
    setCatError('');
    try {
      const parentId = newCatParentId ? parseInt(newCatParentId) : null;
      await addCategory({ name: newCatName.trim(), parentId });
      setNewCatName('');
      setNewCatParentId('');
      const catRes = await getCategories();
      setCategories(catRes.data);
    } catch (err) {
      setCatError(err.response?.data?.error || 'Failed to add category.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      const catRes = await getCategories();
      setCategories(catRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stockCount: parseInt(newProduct.stockCount, 10),
        material: newProduct.material || null,
      });
      setNewProduct({ name: '', price: '', stockCount: '', category: '', imageUrl: '', brand: '', material: '' });
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

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price !== undefined ? String(product.price) : '',
      quantity: product.stockCount !== undefined ? String(product.stockCount) : '',
      category: product.category || '',
      warrantyPeriodMonths: product.warrantyPeriodMonths !== undefined && product.warrantyPeriodMonths !== null
        ? String(product.warrantyPeriodMonths) : '',
      material: product.material || '',
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      await updateProduct(editingProduct.id, {
        name: editForm.name,
        description: editForm.description,
        price: editForm.price !== '' ? parseFloat(editForm.price) : null,
        quantity: editForm.quantity !== '' ? parseInt(editForm.quantity, 10) : null,
        category: editForm.category,
        warrantyPeriodMonths: editForm.warrantyPeriodMonths !== '' ? parseInt(editForm.warrantyPeriodMonths, 10) : null,
        material: editForm.material || '',
      });
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setEditSaving(false);
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

      {/* ── Edit Product Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#e4e2e2] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-[#f0eded]">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#1b1c1c]">Edit Product</h2>
                <p className="text-xs text-[#707a6b] mt-0.5">ID #{editingProduct.id} — changes save immediately</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="px-8 py-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Name</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                    placeholder="Product name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Category</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                  >
                    <option value="">-- Select Category --</option>
                    {rootCategories.map(root => (
                      <optgroup key={root.id} label={root.name}>
                        {categories.filter(c => c.parentId === root.id).map(sub => (
                          <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Material</label>
                  <input
                    value={editForm.material}
                    onChange={e => setEditForm({ ...editForm, material: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                    placeholder="e.g. Teak Wood, Velvet Fabric"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Price (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Quantity in Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Warranty (months)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.warrantyPeriodMonths}
                    onChange={e => setEditForm({ ...editForm, warrantyPeriodMonths: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                    placeholder="e.g. 24"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm resize-none"
                  placeholder="Short product description…"
                />
              </div>

              {editError && (
                <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{editError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {editSaving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">save</span> Save Changes</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-6 py-3 border border-[#e4e2e2] rounded-xl font-bold text-sm text-[#40493c] hover:bg-[#f5f3f3] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform duration-200 hover:translate-x-1 ${activeTab === 'categories' ? 'bg-white text-[#005a07] border border-[#e4e2e2]' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <span className="material-symbols-outlined text-lg">category</span>
            <span>Categories</span>
          </button>
          <div className="pt-2 pb-1"><div className="border-t border-[#e4e2e2]" /></div>
          <button
            onClick={() => navigate('/admin/logiq')}
            className="w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-all duration-200 hover:translate-x-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            <span>LogiQ Brain</span>
            <span className="ml-auto text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">New</span>
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
              {activeTab === 'categories' && 'Category Management'}
            </h1>
            <p className="text-[#40493c] font-body mt-2">
              {activeTab === 'overview' && 'Welcome back. Here is what is happening with Mangala Luxe today.'}
              {activeTab === 'inventory' && 'Add, remove, and monitor stock for the global unified catalog.'}
              {activeTab === 'orders' && 'Adjust live lifecycles and confirm slip payments dynamically.'}
              {activeTab === 'categories' && 'Manage Furniture and Electronics categories and subcategories.'}
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

            {/* LogiQ Brain CTA */}
            <section
              onClick={() => navigate('/admin/logiq')}
              className="cursor-pointer mb-8 rounded-xl overflow-hidden shadow-sm border border-indigo-200 bg-gradient-to-r from-[#0f1729] to-[#1e2d5a] hover:shadow-lg transition-shadow"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-indigo-300">psychology</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-headline text-white font-bold text-lg tracking-tight">LogiQ Brain</h4>
                      <span className="text-[9px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>
                    </div>
                    <p className="text-indigo-300 text-sm">Smart Delivery Tracker — Routes, Fleet, Drivers, QR Dispatch, Reconciliation & more</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Active Deliveries</p>
                    <p className="text-white font-extrabold text-xl">14</p>
                  </div>
                  <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">arrow_forward</span>
                  </div>
                </div>
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
                  <select required value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm">
                    <option value="">-- Select Category --</option>
                    {rootCategories.map(root => (
                      <optgroup key={root.id} label={root.name}>
                        {categories.filter(c => c.parentId === root.id).map(sub => (
                          <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input placeholder="Material (e.g. Teak Wood)" value={newProduct.material} onChange={(e) => setNewProduct({...newProduct, material: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
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
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(p)} className="text-[#005a07] hover:text-[#1d741b] bg-green-50 p-2 rounded-lg" title="Edit">
                            <span className="material-symbols-outlined text-sm block">edit</span>
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg" title="Delete">
                            <span className="material-symbols-outlined text-sm block">delete</span>
                          </button>
                        </div>
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

        {/* ─── CATEGORIES TAB ─────────────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Add Category Form */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#005a07]/20 border-t-4 border-t-[#005a07]">
              <h2 className="text-lg font-bold text-[#005a07] font-headline mb-6">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Category Name</label>
                  <input
                    required
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="e.g. Office Furniture, Speakers"
                    className="w-full bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Parent Category (optional)</label>
                  <select
                    value={newCatParentId}
                    onChange={e => setNewCatParentId(e.target.value)}
                    className="w-full bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm"
                  >
                    <option value="">— Root Category —</option>
                    {rootCategories.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="bg-[#005a07] hover:bg-[#1d741b] text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow disabled:opacity-60 flex items-center gap-2 shrink-0"
                >
                  {catSaving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding…</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">add</span> Add Category</>
                  )}
                </button>
              </form>
              {catError && <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{catError}</p>}
            </div>

            {/* Category Tree */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <div className="p-6 border-b border-[#f0eded]">
                <h4 className="font-headline text-lg font-bold tracking-tight">Category Hierarchy</h4>
                <p className="text-xs text-[#707a6b] mt-1">Products are assigned to sub-categories. Main categories group them for browsing.</p>
              </div>
              <div className="p-6 space-y-6">
                {rootCategories.map(root => {
                  const children = categories.filter(c => c.parentId === root.id);
                  return (
                    <div key={root.id} className="border border-[#e4e2e2] rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 bg-[#f5f3f3]">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#005a07] text-xl">
                            {root.name === 'Furniture' ? 'weekend' : 'devices'}
                          </span>
                          <div>
                            <p className="font-bold font-headline text-[#1b1c1c]">{root.name}</p>
                            <p className="text-[10px] text-[#707a6b] uppercase tracking-widest">Root Category · {children.length} subcategories</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(root.id)}
                          className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete root (only if no subcategories)"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      {children.length > 0 && (
                        <div className="divide-y divide-[#f0eded]">
                          {children.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between px-8 py-3 hover:bg-[#fafafa] group transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#c4c8c0] text-base">subdirectory_arrow_right</span>
                                <p className="text-sm font-medium text-[#40493c]">{sub.name}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteCategory(sub.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg transition-all"
                                title="Delete subcategory"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
