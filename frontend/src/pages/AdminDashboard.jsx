import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, addProduct, deleteProduct, getAllOrders, updateOrderStatus, updateProduct,
  getCategories, addCategory, deleteCategory, getAllUsers, createStaffAccount } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_PERMISSIONS = [
  { key: 'manage_inventory',    label: 'Manage Inventory',      icon: 'weekend' },
  { key: 'view_orders',         label: 'View Orders',           icon: 'receipt_long' },
  { key: 'update_order_status', label: 'Update Order Status',   icon: 'published_with_changes' },
  { key: 'manage_categories',   label: 'Manage Categories',     icon: 'category' },
  { key: 'access_logiq',        label: 'Access LogiQ Brain',    icon: 'psychology' },
  { key: 'view_customers',      label: 'View Customer Database',icon: 'people' },
  { key: 'manage_roles',        label: 'Manage Roles & Access', icon: 'admin_panel_settings' },
  { key: 'view_analytics',      label: 'View Analytics',        icon: 'bar_chart' },
];

const ROLE_TEMPLATES = {
  'Super Admin':         ALL_PERMISSIONS.map(p => p.key),
  'Store Manager':       ['manage_inventory','view_orders','update_order_status','manage_categories','access_logiq','view_customers','view_analytics'],
  'Warehouse Manager':   ['manage_inventory','view_orders','access_logiq','view_analytics'],
  'Customer Service':    ['view_orders','update_order_status','view_customers'],
  'Driver Coordinator':  ['view_orders','access_logiq'],
  'Read Only':           ['view_orders','view_customers','view_analytics'],
};

const INIT_STAFF = [
  { id: 1, name: 'Admin', email: 'admin@mangala.lk', role: 'Super Admin', active: true, permissions: ROLE_TEMPLATES['Super Admin'] },
  { id: 2, name: 'Praveena Silva', email: 'praveena@mangala.lk', role: 'Store Manager', active: true, permissions: ROLE_TEMPLATES['Store Manager'] },
  { id: 3, name: 'Rohan Dias', email: 'rohan@mangala.lk', role: 'Warehouse Manager', active: true, permissions: ROLE_TEMPLATES['Warehouse Manager'] },
  { id: 4, name: 'Nirosha Perera', email: 'nirosha@mangala.lk', role: 'Customer Service', active: true, permissions: ROLE_TEMPLATES['Customer Service'] },
  { id: 5, name: 'Chamara Bandara', email: 'chamara@mangala.lk', role: 'Driver Coordinator', active: false, permissions: ROLE_TEMPLATES['Driver Coordinator'] },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffMembers, setStaffMembers] = useState(INIT_STAFF);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', stockCount: '', category: '', imageUrl: '', brand: '', material: '', warrantyPeriodMonths: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', description: '', price: '', quantity: '', category: '', warrantyPeriodMonths: '', material: ''
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [catError, setCatError] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // Role management
  const [editingStaff, setEditingStaff] = useState(null);
  const [showNewStaff, setShowNewStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Store Manager', permissions: ROLE_TEMPLATES['Store Manager'] });
  const [roleSearchFilter, setRoleSearchFilter] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [staffCreateStatus, setStaffCreateStatus] = useState(null);
  const [staffCreateError, setStaffCreateError] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [customersError, setCustomersError] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes] = await Promise.all([getCategories()]);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);

      if (activeTab === 'inventory' || activeTab === 'overview') {
        const resP = await getProducts();
        setProducts(Array.isArray(resP?.data) ? resP.data : []);
      }
      if (activeTab === 'orders' || activeTab === 'overview') {
        const resO = await getAllOrders();
        setOrders(Array.isArray(resO?.data) ? resO.data : []);
      }
      if (activeTab === 'customers') {
        setCustomersError(null);
        try {
          const resU = await getAllUsers();
          setCustomers(Array.isArray(resU?.data) ? resU.data : []);
        } catch (err) {
          setCustomersError(err.response?.data?.error || 'Could not load customer data.');
          setCustomers([]);
        }
      }
    } catch (err) {
      setError('Failed to fetch data. Check your connection.');
    }
    setLoading(false);
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    let pwd = 'Mgla@';
    for (let i = 0; i < 6; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setGeneratedPassword(pwd);
    setCopiedPassword(false);
  };

  const subCategories = (categories || []).filter(c => c?.parentId !== null);
  const rootCategories = (categories || []).filter(c => c?.parentId === null);

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
        warrantyPeriodMonths: newProduct.warrantyPeriodMonths ? parseInt(newProduct.warrantyPeriodMonths, 10) : null,
      });
      setNewProduct({ name: '', price: '', stockCount: '', category: '', imageUrl: '', brand: '', material: '', warrantyPeriodMonths: '' });
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

  // Role management helpers
  const applyTemplate = (role, target = 'edit') => {
    const perms = ROLE_TEMPLATES[role] || [];
    if (target === 'new') setNewStaff(s => ({ ...s, role, permissions: perms }));
    else setEditingStaff(s => ({ ...s, role, permissions: perms }));
  };

  const togglePerm = (key, target = 'edit') => {
    if (target === 'new') {
      setNewStaff(s => ({
        ...s,
        permissions: s.permissions.includes(key) ? s.permissions.filter(p => p !== key) : [...s.permissions, key]
      }));
    } else {
      setEditingStaff(s => ({
        ...s,
        permissions: s.permissions.includes(key) ? s.permissions.filter(p => p !== key) : [...s.permissions, key]
      }));
    }
  };

  const saveStaffEdit = () => {
    setStaffMembers(list => list.map(s => s.id === editingStaff.id ? editingStaff : s));
    setEditingStaff(null);
  };

  const addNewStaff = async () => {
    if (!newStaff.name || !newStaff.email) return;
    if (!generatedPassword) {
      setStaffCreateError('Please generate a temporary password first.');
      return;
    }
    setStaffCreateStatus('creating');
    setStaffCreateError('');
    try {
      await createStaffAccount({ name: newStaff.name, email: newStaff.email, password: generatedPassword });
      const id = staffMembers.length + 1;
      setStaffMembers(list => [...list, { ...newStaff, id, active: true }]);
      const permsKey = `mangala_permissions_${newStaff.email}`;
      localStorage.setItem(permsKey, JSON.stringify(newStaff.permissions));
      setStaffCreateStatus('success');
    } catch (err) {
      setStaffCreateError(err.response?.data?.error || 'Failed to create account.');
      setStaffCreateStatus('error');
    }
  };

  const resetNewStaffForm = () => {
    setNewStaff({ name: '', email: '', role: 'Store Manager', permissions: ROLE_TEMPLATES['Store Manager'] });
    setGeneratedPassword('');
    setStaffCreateStatus(null);
    setStaffCreateError('');
    setCopiedPassword(false);
    setShowNewStaff(false);
  };

  const toggleStaffActive = (id) => {
    setStaffMembers(list => list.map(s => s.id === id && s.email !== 'admin@mangala.lk' ? { ...s, active: !s.active } : s));
  };

  const filteredStaff = staffMembers.filter(s =>
    s.name.toLowerCase().includes(roleSearchFilter.toLowerCase()) ||
    s.email.toLowerCase().includes(roleSearchFilter.toLowerCase()) ||
    s.role.toLowerCase().includes(roleSearchFilter.toLowerCase())
  );

  const STATUS_LABELS = {
    PENDING_PAYMENT: 'Pending Payment',
    PAYMENT_VERIFICATION_IN_PROGRESS: 'Verifying Payment',
    ORDER_CONFIRMED: 'Order Confirmed',
    PROCESSING: 'Processing',
    PACKED: 'Packed',
    READY_FOR_DISPATCH: 'Ready for Dispatch',
    HANDED_OVER_TO_SHIPPING: 'Handed to Courier',
    IN_TRANSIT: 'In Transit',
    ARRIVED_AT_REGIONAL_HUB: 'At Regional Hub',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    DELIVERY_DELAYED: 'Delivery Delayed',
    CANCELLED: 'Cancelled',
  };

  const tabHeadings = {
    overview: { title: 'Executive Dashboard', sub: 'Welcome back. Here is what is happening with Mangala Luxe today.' },
    inventory: { title: 'Inventory Management', sub: 'Add, remove, and monitor stock for the global unified catalog.' },
    orders: { title: 'Global Orders Tracking', sub: 'Adjust live lifecycles and confirm slip payments dynamically.' },
    categories: { title: 'Category Management', sub: 'Manage Furniture and Electronics categories and subcategories.' },
    customers: { title: 'Customer Database', sub: 'View all registered customers, their order history and loyalty points.' },
    roles: { title: 'Role & Access Management', sub: 'Control who can access what — set permissions and role templates.' },
  };

  return (
    <div className="text-[#1b1c1c] bg-[#fbf9f8] min-h-screen flex font-body">

      {/* ── Edit Product Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#e4e2e2] overflow-hidden">
            <div className="flex justify-between items-center px-8 py-6 border-b border-[#f0eded]">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#1b1c1c]">Edit Product</h2>
                <p className="text-xs text-[#707a6b] mt-0.5">ID #{editingProduct.id} — changes save immediately</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-8 py-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Name</label>
                  <input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="Product name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm">
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
                  <input value={editForm.material} onChange={e => setEditForm({ ...editForm, material: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="e.g. Teak Wood, Velvet Fabric" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Price (LKR)</label>
                  <input type="number" step="0.01" min="0" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Quantity in Stock</label>
                  <input type="number" min="0" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Warranty (months)</label>
                  <input type="number" min="0" value={editForm.warrantyPeriodMonths} onChange={e => setEditForm({ ...editForm, warrantyPeriodMonths: e.target.value })}
                    className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="e.g. 24" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Description</label>
                <textarea rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm resize-none" placeholder="Short product description…" />
              </div>
              {editError && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSaving}
                  className="flex-1 bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {editSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><span className="material-symbols-outlined text-base">save</span> Save Changes</>}
                </button>
                <button type="button" onClick={() => setEditingProduct(null)}
                  className="px-6 py-3 border border-[#e4e2e2] rounded-xl font-bold text-sm text-[#40493c] hover:bg-[#f5f3f3] transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Staff Modal ── */}
      {editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#e4e2e2] overflow-hidden">
            <div className="flex justify-between items-center px-8 py-5 border-b border-[#f0eded]">
              <h2 className="font-headline text-lg font-bold">Edit Access — {editingStaff.name}</h2>
              <button onClick={() => setEditingStaff(null)}><span className="material-symbols-outlined text-zinc-400 hover:text-zinc-600">close</span></button>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-2">Apply Role Template</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ROLE_TEMPLATES).map(r => (
                    <button key={r} onClick={() => applyTemplate(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${editingStaff.role === r ? 'bg-[#005a07] text-white border-[#005a07]' : 'border-[#e4e2e2] text-[#40493c] hover:bg-[#f5f3f3]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-2">Individual Permissions</label>
                <div className="grid grid-cols-1 gap-2">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${editingStaff.permissions.includes(p.key) ? 'border-[#005a07]/30 bg-[#005a07]/5' : 'border-[#e4e2e2] hover:bg-[#f5f3f3]'} ${editingStaff.email === 'admin@mangala.lk' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      <input type="checkbox" checked={editingStaff.permissions.includes(p.key)}
                        onChange={() => editingStaff.email !== 'admin@mangala.lk' && togglePerm(p.key)}
                        className="accent-[#005a07]" disabled={editingStaff.email === 'admin@mangala.lk'} />
                      <span className="material-symbols-outlined text-[#005a07] text-base">{p.icon}</span>
                      <span className="text-sm font-medium text-[#1b1c1c]">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {editingStaff.email === 'admin@mangala.lk' && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Super Admin permissions cannot be modified. This account always has full access.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={saveStaffEdit}
                  className="flex-1 bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90">Save Changes</button>
                <button onClick={() => setEditingStaff(null)}
                  className="px-6 py-3 border border-[#e4e2e2] rounded-xl font-bold text-sm text-[#40493c] hover:bg-[#f5f3f3]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ── Sidebar ── */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#fbf9f8] border-r border-[#e4e2e2] flex flex-col p-6 space-y-2 font-headline text-sm z-50 overflow-y-auto">
        <div className="mb-6 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center gap-3 justify-center text-xl font-bold text-[#005a07]">MANGALA</div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2 ml-1 text-center">Showroom Management</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview',   label: 'Overview',           icon: 'dashboard' },
            { id: 'inventory',  label: 'Inventory',          icon: 'weekend' },
            { id: 'orders',     label: 'Orders',             icon: 'receipt_long' },
            { id: 'categories', label: 'Categories',         icon: 'category' },
            { id: 'customers',  label: 'Customer Database',  icon: 'people' },
            { id: 'roles',      label: 'Role Management',    icon: 'admin_panel_settings' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-transform duration-200 hover:translate-x-1 ${activeTab === t.id ? 'bg-white text-[#005a07] border border-[#e4e2e2]' : 'text-zinc-500 hover:bg-zinc-100'}`}>
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <div className="pt-2 pb-1"><div className="border-t border-[#e4e2e2]" /></div>
          <button onClick={() => navigate('/admin/logiq')}
            className="w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-lg shadow-sm transition-all duration-200 hover:translate-x-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200">
            <span className="material-symbols-outlined text-lg">psychology</span>
            <span>LogiQ Brain</span>
            <span className="ml-auto text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">New</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-[#e4e2e2]">
          <button onClick={() => { setActiveTab('inventory'); setShowAddModal(true); }}
            className="w-full bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white py-3 rounded-lg font-semibold text-xs mb-4 hover:opacity-90 transition-opacity shadow-md">
            New Collection
          </button>
          <button onClick={() => { logout(); navigate('/auth'); }}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-500 hover:bg-red-50 transition-transform duration-200 hover:translate-x-1 rounded-lg">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-64 w-full p-12 bg-[#fbf9f8]">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-headline text-4xl font-extrabold text-[#1b1c1c] tracking-tighter">
              {tabHeadings[activeTab]?.title}
            </h1>
            <p className="text-[#40493c] font-body mt-2">{tabHeadings[activeTab]?.sub}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-headline font-bold text-sm">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-[#40493c]">Super Admin</p>
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

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { icon: 'payments', color: '#005a07', badge: '+12.5%', label: 'Total Sales Matrix', value: 'Live Active' },
                { icon: 'shopping_cart', color: '#686000', badge: 'Active', label: 'Active Global Orders', value: orders.length },
                { icon: 'weekend', color: '#005463', badge: '+8%', label: 'Total Catalog Pieces', value: products.length },
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-[#e4e2e2] hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-2 rounded-lg" style={{ background: `${s.color}0d` }}>
                      <span className="material-symbols-outlined" style={{ color: s.color }}>{s.icon}</span>
                    </span>
                    <span className="text-xs font-bold font-headline" style={{ color: s.color }}>{s.badge}</span>
                  </div>
                  <p className="text-[#40493c] text-sm font-medium mb-1">{s.label}</p>
                  <h3 className="font-headline text-3xl font-extrabold">{s.value}</h3>
                </div>
              ))}
            </section>

            <section onClick={() => navigate('/admin/logiq')}
              className="cursor-pointer mb-8 rounded-xl overflow-hidden shadow-sm border border-indigo-200 bg-gradient-to-r from-[#0f1729] to-[#1e2d5a] hover:shadow-lg transition-shadow">
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

            <section className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <div className="p-8 flex justify-between items-center border-b border-[#f0eded]">
                <h4 className="font-headline text-xl font-bold tracking-tight">Priority Orders Board</h4>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#005a07] hover:underline">View All Pipelines</button>
              </div>
              <div className="overflow-x-auto">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center justify-between px-8 py-4 border-b border-[#f5f3f3] hover:bg-[#f5f3f3] transition-colors">
                    <div>
                      <p className="font-headline font-bold text-sm text-[#1b1c1c]">#MD-{o.id.toString().padStart(6, '0')}</p>
                      <p className="text-xs text-[#707a6b]">{o.customerName}</p>
                    </div>
                    <p className="font-bold text-[#005a07] text-sm">Rs. {o.total?.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-sm text-zinc-500 italic p-8 text-center">No orders yet. Navigate to Orders tab for full pipeline.</p>}
              </div>
            </section>
          </div>
        )}

        {/* ─── INVENTORY ─── */}
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
                  <input required type="number" placeholder="Physical Stock (units)" value={newProduct.stockCount} onChange={(e) => setNewProduct({...newProduct, stockCount: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
                  <input type="number" min="0" placeholder="Warranty (months, e.g. 24)" value={newProduct.warrantyPeriodMonths} onChange={(e) => setNewProduct({...newProduct, warrantyPeriodMonths: e.target.value})} className="bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 border-transparent focus:ring-[#005a07] text-sm" />
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
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Warranty</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center">Controls</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {loading && <tr><td colSpan="6" className="p-8 text-center text-zinc-400">Syncing Matrix...</td></tr>}
                  {!loading && products.map(p => (
                    <tr key={p.id} className="hover:bg-[#f5f3f3] border-b border-[#f5f3f3] transition-colors group">
                      <td className="px-8 py-4 flex items-center space-x-4">
                        <img src={p.imageUrl} className="w-12 h-12 rounded object-cover border border-[#e4e2e2]" alt="Product" />
                        <div>
                          <p className="font-bold text-[#1b1c1c] font-headline">{p.name}</p>
                          <p className="text-xs text-[#707a6b]">{p.brand}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#40493c] text-xs">{p.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${p.stockCount > 0 ? 'bg-[#1d741b]/10 text-[#005a07]' : 'bg-red-100 text-red-800'}`}>
                          {p.stockCount > 0 ? `${p.stockCount} units` : 'Depleted'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.warrantyPeriodMonths ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            {p.warrantyPeriodMonths}m
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-headline font-bold text-[#005a07] text-sm">Rs. {p.price?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
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

        {/* ─── ORDERS ─── */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <div className="p-8 flex justify-between items-center border-b border-[#f0eded]">
                <h4 className="font-headline text-xl font-bold tracking-tight">Active Fulfillment Pipelines</h4>
                <span className="text-xs text-[#707a6b] bg-[#f5f3f3] px-3 py-1.5 rounded-lg font-semibold">Click dropdown to change status</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9f8] text-[#40493c] text-[10px] uppercase tracking-widest font-bold border-b border-[#f0eded]">
                    <th className="px-8 py-4">Trace ID</th>
                    <th className="px-8 py-4">Client Detail</th>
                    <th className="px-8 py-4">Total</th>
                    <th className="px-8 py-4">Receipt</th>
                    <th className="px-8 py-4">State Engine</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {loading && <tr><td colSpan="5" className="p-8 text-center text-zinc-400">Reading LEDGER...</td></tr>}
                  {!loading && orders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[#707a6b]">No orders yet.</td></tr>}
                  {!loading && orders.map(o => (
                    <tr key={o.id} className="hover:bg-[#f5f3f3] border-b border-[#f5f3f3] transition-colors">
                      <td className="px-8 py-6 font-medium font-headline">#MD-{o.id.toString().padStart(6, '0')}</td>
                      <td className="px-8 py-6">
                        <p className="text-[#40493c] font-medium">{o.customerName}</p>
                        <p className="text-[10px] text-zinc-400">{Object.keys(o.items || {}).length} Unique Pieces</p>
                      </td>
                      <td className="px-8 py-6 font-headline font-bold text-[#005a07]">Rs. {o.total?.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        {o.receiptFilePath ? (
                          <a href={`/api/orders/${o.id}`} target="_blank" rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded">
                            <span className="material-symbols-outlined text-[14px]">receipt_long</span> Extract
                          </a>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">Missing</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="relative inline-block">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`pr-8 pl-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer outline-none focus:ring-2 focus:ring-[#005a07] appearance-none border-none shadow-sm
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
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm opacity-50">expand_more</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── CATEGORIES ─── */}
        {activeTab === 'categories' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#005a07]/20 border-t-4 border-t-[#005a07]">
              <h2 className="text-lg font-bold text-[#005a07] font-headline mb-6">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Category Name</label>
                  <input required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Office Furniture, Speakers"
                    className="w-full bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b]">Parent Category (leave blank for root)</label>
                  <select value={newCatParentId} onChange={e => setNewCatParentId(e.target.value)}
                    className="w-full bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm">
                    <option value="">-- Root Category --</option>
                    {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {catError && <p className="text-red-600 text-sm">{catError}</p>}
                <button type="submit" disabled={catSaving}
                  className="bg-[#005a07] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
                  {catSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm">add</span>}
                  Add
                </button>
              </form>
            </div>

            {rootCategories.map(root => (
              <div key={root.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
                <div className="px-8 py-5 border-b border-[#f0eded] flex items-center justify-between">
                  <h3 className="font-headline font-bold text-lg">{root.name}</h3>
                  <button onClick={() => handleDeleteCategory(root.id)} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">delete</span> Delete Root
                  </button>
                </div>
                <div className="p-6 flex flex-wrap gap-3">
                  {categories.filter(c => c.parentId === root.id).map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 bg-[#f5f3f3] px-4 py-2 rounded-lg text-sm font-semibold">
                      {sub.name}
                      <button onClick={() => handleDeleteCategory(sub.id)} className="text-red-400 hover:text-red-600 ml-1">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  {categories.filter(c => c.parentId === root.id).length === 0 && (
                    <p className="text-sm text-zinc-400 italic">No subcategories yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── CUSTOMERS ─── */}
        {activeTab === 'customers' && (
          <div>
            {customersError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm text-red-700">
                <span className="material-symbols-outlined text-red-500">error</span>
                <span>{customersError}</span>
                <button onClick={fetchData} className="ml-auto text-xs font-bold underline">Retry</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-[#e4e2e2] shadow-sm">
                <span className="material-symbols-outlined text-[#005a07] text-2xl mb-2 block">people</span>
                <p className="text-3xl font-extrabold font-headline">{customers.length}</p>
                <p className="text-sm text-[#707a6b] mt-1">Total Registered Users</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#e4e2e2] shadow-sm">
                <span className="material-symbols-outlined text-amber-500 text-2xl mb-2 block">star</span>
                <p className="text-3xl font-extrabold font-headline">{customers.filter(c => (c?.points || 0) > 10000).length}</p>
                <p className="text-sm text-[#707a6b] mt-1">Premium Loyalty Members</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#e4e2e2] shadow-sm">
                <span className="material-symbols-outlined text-blue-500 text-2xl mb-2 block">local_shipping</span>
                <p className="text-3xl font-extrabold font-headline">{customers.reduce((s, c) => s + (c?.totalOrders || 0), 0)}</p>
                <p className="text-sm text-[#707a6b] mt-1">Total Orders (All Time)</p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e4e2e2]">
              <div className="p-6 border-b border-[#f0eded] flex items-center justify-between">
                <h4 className="font-headline text-xl font-bold">Registered Members</h4>
                {loading && <span className="text-xs text-zinc-400 animate-pulse">Loading…</span>}
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbf9f8] text-[#40493c] text-[10px] uppercase tracking-widest font-bold border-b border-[#f0eded]">
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-8 py-4">Contact</th>
                    <th className="px-8 py-4">Address</th>
                    <th className="px-8 py-4">Loyalty Points</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4">Orders</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {customers.length === 0 && !loading && (
                    <tr><td colSpan="6" className="p-8 text-center text-zinc-400 italic">
                      {customersError ? 'Could not load customers.' : 'No registered users found.'}
                    </td></tr>
                  )}
                  {customers.map((c, idx) => {
                    const displayName = c?.fullName || c?.name || 'Unknown';
                    const displayInitial = displayName.charAt(0).toUpperCase() || '?';
                    const displayId = c?.id != null ? String(c.id).padStart(5, '0') : String(idx + 1).padStart(5, '0');
                    const displayRole = c?.role || 'CUSTOMER';
                    const displayPoints = c?.points ?? 0;
                    const displayOrders = c?.totalOrders ?? 0;
                    return (
                      <tr key={c?.id ?? idx} className="hover:bg-[#f5f3f3] border-b border-[#f5f3f3] transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#005a07]/10 flex items-center justify-center font-bold text-[#005a07] text-sm font-headline">
                              {displayInitial}
                            </div>
                            <div>
                              <p className="font-bold text-[#1b1c1c]">{displayName}</p>
                              <p className="text-xs text-[#707a6b]">#{displayId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm">{c?.email || '—'}</p>
                          <p className="text-xs text-zinc-400">{c?.phoneNumber || '—'}</p>
                        </td>
                        <td className="px-8 py-4 text-xs text-[#40493c] max-w-[180px] truncate">{c?.address || '—'}</td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${displayPoints > 10000 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {displayPoints.toLocaleString()} pts
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${displayRole === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {displayRole}
                          </span>
                        </td>
                        <td className="px-8 py-4 font-bold text-[#005a07]">{displayOrders}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ROLES ─── */}
        {activeTab === 'roles' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">info</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">How Role Management Works</p>
                <p className="text-amber-700 text-xs mt-1">
                  Each staff member is assigned a role template (e.g. Store Manager) which pre-fills permissions. You can then fine-tune individual permissions per person.
                  The Super Admin (<strong>admin@mangala.lk</strong>) always has full access and cannot be restricted.
                  Changes here control what each team member can see and do in this dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-5">
              <input value={roleSearchFilter} onChange={e => setRoleSearchFilter(e.target.value)}
                placeholder="Search by name, email, or role…"
                className="bg-white border border-[#e4e2e2] px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#005a07] w-72" />
              <button onClick={() => setShowNewStaff(!showNewStaff)}
                className="flex items-center gap-2 bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">person_add</span>Add Staff Member
              </button>
            </div>

            {showNewStaff && (
              <div className="bg-white rounded-2xl border border-[#005a07]/20 border-t-4 border-t-[#005a07] p-6 mb-6 shadow-sm">
                {staffCreateStatus === 'success' ? (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-[#005a07] text-5xl block mb-3">check_circle</span>
                    <p className="font-headline font-bold text-[#1b1c1c] text-lg mb-1">Account Created!</p>
                    <p className="text-sm text-[#707a6b] mb-4">Share these credentials securely with <strong>{newStaff.name}</strong>:</p>
                    <div className="bg-[#f5f3f3] rounded-xl p-4 text-left max-w-sm mx-auto space-y-2 mb-5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#707a6b]">Email</span>
                        <span className="font-bold text-[#1b1c1c]">{newStaff.email}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-[#707a6b]">Temp Password</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#005a07] font-mono">{generatedPassword}</span>
                          <button onClick={() => { navigator.clipboard.writeText(generatedPassword); setCopiedPassword(true); }}
                            className="text-xs text-[#005a07] border border-[#005a07]/30 px-2 py-0.5 rounded-lg hover:bg-[#005a07]/5">
                            {copiedPassword ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block mb-5">
                      They will be prompted to change this password on first login.
                    </p>
                    <br />
                    <button onClick={resetNewStaffForm}
                      className="bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:opacity-90">
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-headline font-bold text-[#005a07] mb-4">New Staff Member</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-1">Full Name</label>
                        <input value={newStaff.name} onChange={e => setNewStaff(s => ({...s, name: e.target.value}))}
                          className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="e.g. Kamal Perera" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-1">Email</label>
                        <input type="email" value={newStaff.email} onChange={e => setNewStaff(s => ({...s, email: e.target.value}))}
                          className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm" placeholder="name@mangala.lk" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-1">Role Template</label>
                        <select value={newStaff.role} onChange={e => applyTemplate(e.target.value, 'new')}
                          className="w-full bg-[#f5f3f3] px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm">
                          {Object.keys(ROLE_TEMPLATES).filter(r => r !== 'Super Admin').map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-2">Permissions</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_PERMISSIONS.map(p => (
                          <label key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${newStaff.permissions.includes(p.key) ? 'border-[#005a07]/30 bg-[#005a07]/5' : 'border-[#e4e2e2] hover:bg-[#f5f3f3]'}`}>
                            <input type="checkbox" checked={newStaff.permissions.includes(p.key)} onChange={() => togglePerm(p.key, 'new')} className="accent-[#005a07]" />
                            <span className="material-symbols-outlined text-[#005a07] text-sm">{p.icon}</span>
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 p-4 bg-[#f5f3f3] rounded-xl">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-2">Temporary Password</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white border border-[#e4e2e2] rounded-xl px-4 py-2.5 font-mono text-sm text-[#005a07] font-bold tracking-wider min-h-[42px] flex items-center">
                          {generatedPassword || <span className="text-zinc-300 font-normal font-body">Click Generate to create a secure password</span>}
                        </div>
                        {generatedPassword && (
                          <button type="button" onClick={() => { navigator.clipboard.writeText(generatedPassword); setCopiedPassword(true); }}
                            className="text-xs font-bold text-[#005a07] border border-[#005a07]/30 px-3 py-2 rounded-xl hover:bg-[#005a07]/5 whitespace-nowrap">
                            {copiedPassword ? '✓ Copied!' : 'Copy'}
                          </button>
                        )}
                        <button type="button" onClick={generateTempPassword}
                          className="flex items-center gap-1.5 bg-[#005a07] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 whitespace-nowrap">
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          {generatedPassword ? 'Regenerate' : 'Generate'}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#707a6b] mt-2">
                        Share this with the staff member — they must change it on first login.
                      </p>
                    </div>

                    {staffCreateError && (
                      <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {staffCreateError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={addNewStaff} disabled={staffCreateStatus === 'creating'}
                        className="bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
                        {staffCreateStatus === 'creating'
                          ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
                          : <><span className="material-symbols-outlined text-sm">person_add</span>Create Account</>
                        }
                      </button>
                      <button onClick={resetNewStaffForm}
                        className="px-6 py-2.5 border border-[#e4e2e2] rounded-xl font-bold text-sm text-[#40493c] hover:bg-[#f5f3f3]">Cancel</button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-3">
              {filteredStaff.map(s => (
                <div key={s.id} className={`bg-white rounded-xl border shadow-sm p-5 ${!s.active ? 'opacity-60' : 'border-[#e4e2e2]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s.email === 'admin@mangala.lk' ? 'bg-amber-100 text-amber-700' : 'bg-[#005a07]/10 text-[#005a07]'}`}>
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1b1c1c] font-headline">{s.name}</p>
                          {s.email === 'admin@mangala.lk' && (
                            <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Super Admin</span>
                          )}
                          {!s.active && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">Deactivated</span>}
                        </div>
                        <p className="text-xs text-[#707a6b]">{s.email} · {s.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {s.permissions.slice(0, 4).map(pk => {
                          const p = ALL_PERMISSIONS.find(x => x.key === pk);
                          return p ? (
                            <span key={pk} className="text-[9px] font-bold bg-[#005a07]/8 text-[#005a07] px-2 py-0.5 rounded-full border border-[#005a07]/20">
                              {p.label}
                            </span>
                          ) : null;
                        })}
                        {s.permissions.length > 4 && (
                          <span className="text-[9px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">+{s.permissions.length - 4} more</span>
                        )}
                      </div>
                      <button onClick={() => setEditingStaff({...s})}
                        className="text-[#005a07] hover:text-[#1d741b] bg-green-50 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      {s.email !== 'admin@mangala.lk' && (
                        <button onClick={() => toggleStaffActive(s.id)}
                          className={`p-2 rounded-lg text-sm ${s.active ? 'bg-red-50 text-red-400 hover:text-red-600' : 'bg-green-50 text-green-600'}`}>
                          <span className="material-symbols-outlined text-sm">{s.active ? 'person_off' : 'person_check'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white rounded-xl border border-[#e4e2e2] p-6 shadow-sm">
              <h4 className="font-headline font-bold text-[#1b1c1c] mb-4">Role Templates Reference</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(ROLE_TEMPLATES).map(([role, perms]) => (
                  <div key={role} className="bg-[#fbf9f8] rounded-xl p-4 border border-[#e4e2e2]">
                    <p className="font-bold text-sm text-[#1b1c1c] mb-2">{role}</p>
                    <div className="space-y-1">
                      {perms.map(pk => {
                        const p = ALL_PERMISSIONS.find(x => x.key === pk);
                        return p ? (
                          <div key={pk} className="flex items-center gap-1.5 text-xs text-[#40493c]">
                            <span className="material-symbols-outlined text-[#005a07] text-sm">{p.icon}</span>
                            {p.label}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
