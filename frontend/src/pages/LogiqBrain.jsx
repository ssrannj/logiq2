import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders } from '../services/api';

/* ─── Distance Tiers & Bonus Rates ────────────────────────────── */
const DIST_TIERS = { local: { label: 'Local (<20km)', rate: 50 }, regional: { label: 'Regional (20-100km)', rate: 150 }, outstation: { label: 'Outstation (>100km)', rate: 300 } };
const DAMAGE_PENALTY = 500;
const ONTIME_BONUS_PCT = 0.10;
const MAX_DAILY_BONUS = 500;

function distTier(km) {
  if (km < 20) return 'local';
  if (km < 100) return 'regional';
  return 'outstation';
}

function calcPriorityScore(order) {
  const urgentBonus   = order.urgentFlag ? 50 : 0;
  const deadlineScore = Math.max(0, (5 - order.deadlineDays) * 15);
  const ageScore      = Math.min(order.orderAge * 2, 20);
  return urgentBonus + deadlineScore + ageScore;
}

function calcBonus(driver, completedDispatches, damageTickets, ratings) {
  const driverDispatches = completedDispatches.filter(d => d.driverName === driver.name);
  const basePay = driverDispatches.reduce((s, d) => s + DIST_TIERS[distTier(d.distanceKm || 10)].rate, 0);
  const onTimeBonus = driver.onTime >= 95 ? basePay * ONTIME_BONUS_PCT : 0;
  const maxDailyBonus = driverDispatches.length >= 8 ? MAX_DAILY_BONUS : 0;
  const driverRatings = ratings.filter(r => r.driver === driver.name);
  const avgRating = driverRatings.length > 0
    ? driverRatings.reduce((s, r) => s + r.rating, 0) / driverRatings.length
    : driver.rating;
  const ratingMult = 0.8 + (avgRating / 5.0) * 0.4;
  const penalties = damageTickets.filter(t => t.driver === driver.name && t.status !== 'Resolved').length * DAMAGE_PENALTY;
  return Math.max(0, Math.round((basePay + onTimeBonus + maxDailyBonus) * ratingMult - penalties));
}

/* ─── Damage Type Categories ──────────────────────────────────── */
const DAMAGE_TYPES = [
  'Glass Shattered', 'Surface Scratched', 'Screen Cracked', 'Structural Damage',
  'Water Damage', 'Parts Missing', 'Bent / Dented', 'Hinge Broken',
  'Leg Snapped', 'Upholstery Torn', 'Electronics Malfunctioned', 'Packaging Only'
];

/* ─── Master Data ─────────────────────────────────────────────── */
const VEHICLES = [
  { id: 'WP CAB-1234', type: 'Lorry',    maxKg: 3000, loadKg: 2400, driver: 'Kamal Perera',    fuel: 72, status: 'On Route' },
  { id: 'WP CB-5678',  type: 'Van',      maxKg: 1200, loadKg: 0,    driver: 'Nimal Silva',     fuel: 88, status: 'Available' },
  { id: 'CP KA-9012',  type: 'Van',      maxKg: 1200, loadKg: 950,  driver: 'Suresh Kumar',    fuel: 45, status: 'On Route' },
  { id: 'WP LA-3456',  type: 'Lorry',    maxKg: 3000, loadKg: 0,    driver: 'Roshan Fernando', fuel: 61, status: 'Idle' },
  { id: 'SP PA-7890',  type: 'Motorbike',maxKg: 80,   loadKg: 0,    driver: 'Amara Bandara',   fuel: 95, status: 'Available' },
  { id: 'WP MA-2211',  type: 'Van',      maxKg: 1200, loadKg: 0,    driver: '—',               fuel: 20, status: 'Maintenance' },
];

const DRIVERS = [
  { id: 'D001', name: 'Kamal Perera',    vehicle: 'WP CAB-1234', rating: 4.8, deliveries: 312, onTime: 96, status: 'On Route' },
  { id: 'D002', name: 'Nimal Silva',     vehicle: 'WP CB-5678',  rating: 4.5, deliveries: 278, onTime: 91, status: 'Available' },
  { id: 'D003', name: 'Suresh Kumar',    vehicle: 'CP KA-9012',  rating: 4.2, deliveries: 195, onTime: 87, status: 'On Route' },
  { id: 'D004', name: 'Roshan Fernando', vehicle: 'WP LA-3456',  rating: 4.9, deliveries: 401, onTime: 98, status: 'Off Duty' },
  { id: 'D005', name: 'Amara Bandara',   vehicle: 'SP PA-7890',  rating: 4.0, deliveries: 143, onTime: 83, status: 'Available' },
];

/* ─── Shared Pending Delivery Orders ─────────────────────────── */
/* In production, these come from ORDER_CONFIRMED/PROCESSING orders in the main DB */
const INIT_PENDING_ORDERS = [
  { id: '#ORD-1042', customer: 'Dr. Priya Nair',      phone: '0771234567', address: '45 Galle Rd, Colombo 3',      items: [{ name: 'Teak Dining Set', qty: 1, price: 128000 }, { name: 'Dining Chairs x4', qty: 4, price: 12500 }], total: 178000, weightKg: 185, distanceKm: 8,   urgentFlag: true,  deadlineDays: 0, orderAge: 3, urgency: 'Critical', driver: 'Unassigned', status: 'Pending', route: null },
  { id: '#ORD-1039', customer: 'Ravi Wickramasinghe', phone: '0712345678', address: '12 Kandy Rd, Nugegoda',        items: [{ name: 'Royal Velvet Sofa', qty: 1, price: 89500 }], total: 89500, weightKg: 42, distanceKm: 14,  urgentFlag: true,  deadlineDays: 1, orderAge: 2, urgency: 'High',     driver: 'Kamal Perera',  status: 'Assigned', route: 'RT-01' },
  { id: '#ORD-1051', customer: 'Sunitha Mendis',      phone: '0756789012', address: '8 Temple Rd, Dehiwala',        items: [{ name: 'LG 55" OLED TV', qty: 1, price: 189000 }, { name: 'Samsung Soundbar', qty: 1, price: 45000 }], total: 234000, weightKg: 120, distanceKm: 18,  urgentFlag: true,  deadlineDays: 1, orderAge: 4, urgency: 'High',     driver: 'Unassigned',    status: 'Pending', route: null },
  { id: '#ORD-1067', customer: 'Fathima Ismail',      phone: '0773456789', address: '23 Main St, Pettah',           items: [{ name: 'Office Workstation', qty: 1, price: 45000 }], total: 45000, weightKg: 28, distanceKm: 5,   urgentFlag: false, deadlineDays: 3, orderAge: 1, urgency: 'Medium',   driver: 'Suresh Kumar',  status: 'On-Route',  route: 'RT-01' },
  { id: '#ORD-1070', customer: 'Mr. Gayan Dias',      phone: '0785678901', address: '77 Sea View Ave, Mt. Lavinia', items: [{ name: 'Mahogany King Bed', qty: 1, price: 156000 }, { name: 'Bedside Tables x2', qty: 2, price: 18000 }, { name: 'Wardrobe', qty: 1, price: 89000 }, { name: 'Dressing Mirror', qty: 1, price: 24500 }], total: 305500, weightKg: 310, distanceKm: 22,  urgentFlag: false, deadlineDays: 3, orderAge: 2, urgency: 'Medium',   driver: 'Unassigned',    status: 'Pending', route: null },
  { id: '#ORD-1074', customer: 'Amali Senanayake',    phone: '0792345678', address: '15 Lake Rd, Nawala',           items: [{ name: 'Rattan Lounge Chair', qty: 2, price: 28000 }], total: 56000, weightKg: 35, distanceKm: 12,  urgentFlag: false, deadlineDays: 5, orderAge: 1, urgency: 'Low',      driver: 'Unassigned',    status: 'Pending', route: null },
  { id: '#ORD-1078', customer: 'Chamara Bandara',     phone: '0761234567', address: '90 Hill St, Kandy',            items: [{ name: 'Teak Dining Set', qty: 1, price: 128000 }, { name: 'Buffet Cabinet', qty: 1, price: 56000 }], total: 184000, weightKg: 195, distanceKm: 115, urgentFlag: false, deadlineDays: 2, orderAge: 3, urgency: 'High',     driver: 'Unassigned',    status: 'Pending', route: null },
];

/* ─── Route Planner with Per-Stop Orders ─────────────────────── */
const INIT_ROUTES = [
  {
    id: 'RT-01', name: 'Colombo South Loop', driver: 'Kamal Perera', vehicle: 'WP CAB-1234', status: 'In Progress', date: 'Apr 28',
    stops: [
      { addr: 'Bambalapitiya', km: 3.2, min: 12, orderId: '#ORD-1067', customer: 'Fathima Ismail',      done: true },
      { addr: 'Dehiwala',      km: 4.5, min: 18, orderId: '#ORD-1039', customer: 'Ravi Wickramasinghe', done: true },
      { addr: 'Mt. Lavinia',   km: 3.0, min: 14, orderId: '#ORD-1070', customer: 'Mr. Gayan Dias',      done: false },
      { addr: 'Ratmalana',     km: 3.8, min: 16, orderId: null,         customer: null,                 done: false },
      { addr: 'Moratuwa',      km: 4.2, min: 17, orderId: null,         customer: null,                 done: false },
    ]
  },
  {
    id: 'RT-02', name: 'Kandy Corridor', driver: 'Suresh Kumar', vehicle: 'CP KA-9012', status: 'In Progress', date: 'Apr 28',
    stops: [
      { addr: 'Kadawatha',     km: 8.5, min: 28, orderId: '#ORD-1078', customer: 'Chamara Bandara',     done: true },
      { addr: 'Gampaha',       km: 9.5, min: 32, orderId: null,         customer: null,                 done: false },
      { addr: 'Kandy',         km: 72,  min: 135, orderId: null,         customer: null,                 done: false },
    ]
  },
  {
    id: 'RT-03', name: 'Nugegoda Cluster', driver: 'Nimal Silva', vehicle: 'WP CB-5678', status: 'Planned', date: 'Apr 29',
    stops: [
      { addr: 'Nugegoda',      km: 1.8, min: 8,  orderId: '#ORD-1074', customer: 'Amali Senanayake',    done: false },
      { addr: 'Maharagama',    km: 3.5, min: 14, orderId: null,         customer: null,                 done: false },
      { addr: 'Kottawa',       km: 4.0, min: 16, orderId: null,         customer: null,                 done: false },
    ]
  },
];

/* ─── Branch Inventory (product-level, per location) ─────────── */
const INIT_BRANCH_INVENTORY = {
  'Colombo HQ':    [
    { sku:'FRN-001', name:'Teak Dining Set (6-Seater)',  category:'Furniture',    qty:12, unitPrice:128000 },
    { sku:'FRN-002', name:'Royal Velvet Sofa',           category:'Furniture',    qty:4,  unitPrice:89500  },
    { sku:'FRN-003', name:'Mahogany King Bed',           category:'Furniture',    qty:6,  unitPrice:156000 },
    { sku:'FRN-004', name:'Office Workstation',          category:'Furniture',    qty:18, unitPrice:45000  },
    { sku:'ELC-001', name:'Samsung 65" QLED TV',         category:'Electronics',  qty:7,  unitPrice:245000 },
    { sku:'ELC-002', name:'LG 55" OLED TV',              category:'Electronics',  qty:3,  unitPrice:189000 },
    { sku:'ELC-003', name:'Sony Soundbar HT-A7000',      category:'Electronics',  qty:9,  unitPrice:68000  },
    { sku:'ELC-004', name:'Philips Air Purifier AC3858', category:'Electronics',  qty:11, unitPrice:42000  },
  ],
  'Kandy Branch':  [
    { sku:'FRN-001', name:'Teak Dining Set (6-Seater)',  category:'Furniture',    qty:2,  unitPrice:128000 },
    { sku:'FRN-002', name:'Royal Velvet Sofa',           category:'Furniture',    qty:1,  unitPrice:89500  },
    { sku:'FRN-003', name:'Mahogany King Bed',           category:'Furniture',    qty:3,  unitPrice:156000 },
    { sku:'FRN-005', name:'Rattan Lounge Chair',         category:'Furniture',    qty:8,  unitPrice:28000  },
    { sku:'ELC-001', name:'Samsung 65" QLED TV',         category:'Electronics',  qty:0,  unitPrice:245000 },
    { sku:'ELC-004', name:'Philips Air Purifier AC3858', category:'Electronics',  qty:2,  unitPrice:42000  },
  ],
  'Galle Branch':  [
    { sku:'FRN-002', name:'Royal Velvet Sofa',           category:'Furniture',    qty:3,  unitPrice:89500  },
    { sku:'FRN-004', name:'Office Workstation',          category:'Furniture',    qty:5,  unitPrice:45000  },
    { sku:'ELC-002', name:'LG 55" OLED TV',              category:'Electronics',  qty:2,  unitPrice:189000 },
    { sku:'ELC-003', name:'Sony Soundbar HT-A7000',      category:'Electronics',  qty:6,  unitPrice:68000  },
  ],
  'Jaffna Outlet': [
    { sku:'FRN-001', name:'Teak Dining Set (6-Seater)',  category:'Furniture',    qty:1,  unitPrice:128000 },
    { sku:'FRN-005', name:'Rattan Lounge Chair',         category:'Furniture',    qty:0,  unitPrice:28000  },
    { sku:'ELC-001', name:'Samsung 65" QLED TV',         category:'Electronics',  qty:0,  unitPrice:245000 },
    { sku:'ELC-004', name:'Philips Air Purifier AC3858', category:'Electronics',  qty:3,  unitPrice:42000  },
  ],
  'Negombo Store': [
    { sku:'FRN-003', name:'Mahogany King Bed',           category:'Furniture',    qty:4,  unitPrice:156000 },
    { sku:'FRN-004', name:'Office Workstation',          category:'Furniture',    qty:10, unitPrice:45000  },
    { sku:'ELC-003', name:'Sony Soundbar HT-A7000',      category:'Electronics',  qty:4,  unitPrice:68000  },
    { sku:'ELC-004', name:'Philips Air Purifier AC3858', category:'Electronics',  qty:7,  unitPrice:42000  },
  ],
};

const BRANCHES = Object.keys(INIT_BRANCH_INVENTORY).map(name => ({
  name,
  status: name === 'Jaffna Outlet' ? 'Critical' : name === 'Kandy Branch' ? 'Warning' : 'Healthy',
  lowStock: INIT_BRANCH_INVENTORY[name].filter(p => p.qty === 0).length,
}));

const INIT_BRANCH_REQUESTS = [
  { id: 'IBR-001', from: 'Kandy Branch',   to: 'Colombo HQ',    items: [{ sku:'FRN-001', name:'Teak Dining Set', qty:2 }], status: 'PENDING_APPROVAL', date: 'Apr 25' },
  { id: 'IBR-002', from: 'Jaffna Outlet',  to: 'Colombo HQ',    items: [{ sku:'ELC-001', name:'Samsung 65" QLED TV', qty:3 }], status: 'IN_TRANSIT', date: 'Apr 24' },
  { id: 'IBR-003', from: 'Colombo HQ',     to: 'Galle Branch',  items: [{ sku:'FRN-002', name:'Royal Velvet Sofa', qty:1 }], status: 'DELIVERED', date: 'Apr 24' },
  { id: 'IBR-004', from: 'Negombo Store',  to: 'Kandy Branch',  items: [{ sku:'FRN-004', name:'Office Workstation', qty:6 }], status: 'DELIVERED', date: 'Apr 23' },
  { id: 'IBR-005', from: 'Jaffna Outlet',  to: 'Negombo Store', items: [{ sku:'FRN-005', name:'Rattan Lounge Chair', qty:4 }, { sku:'ELC-004', name:'Philips Air Purifier', qty:2 }], status: 'PENDING_APPROVAL', date: 'Apr 25' },
];

const INIT_DAMAGE = [
  { id: 'DT-101', order: '#ORD-0987', driver: 'Suresh Kumar',    item: 'Glass Coffee Table',  type: 'Glass Shattered',          severity: 'High',    claim: 28500, status: 'OPEN',        imageUrl: null },
  { id: 'DT-102', order: '#ORD-1012', driver: 'Nimal Silva',     item: 'Leather Sofa Corner', type: 'Surface Scratched',         severity: 'Low',     claim: 4200,  status: 'Resolved',    imageUrl: null },
  { id: 'DT-103', order: '#ORD-1034', driver: 'Amara Bandara',   item: 'LG 55" OLED TV',      type: 'Screen Cracked',            severity: 'Critical',claim: 87000, status: 'QUARANTINED', imageUrl: null },
  { id: 'DT-104', order: '#ORD-1038', driver: 'Kamal Perera',    item: 'Teak Wardrobe Door',  type: 'Hinge Broken',              severity: 'Medium',  claim: 6500,  status: 'OPEN',        imageUrl: null },
  { id: 'DT-105', order: '#ORD-1055', driver: 'Roshan Fernando', item: 'Dining Chair x2',     type: 'Leg Snapped',               severity: 'Medium',  claim: 9800,  status: 'Resolved',    imageUrl: null },
];

const INIT_COD = [
  { driver: 'Kamal Perera',    orders: 8, collected: 124500, deposited: 124500, pending: 0,     status: 'Reconciled', signature: null },
  { driver: 'Nimal Silva',     orders: 5, collected: 67200,  deposited: 50000,  pending: 17200, status: 'Pending',    signature: null },
  { driver: 'Suresh Kumar',    orders: 6, collected: 89400,  deposited: 0,      pending: 89400, status: 'Overdue',    signature: null },
  { driver: 'Roshan Fernando', orders: 9, collected: 210000, deposited: 210000, pending: 0,     status: 'Reconciled', signature: null },
  { driver: 'Amara Bandara',   orders: 3, collected: 14700,  deposited: 14700,  pending: 0,     status: 'Reconciled', signature: null },
];

/* Completed dispatches used by Driver Bonus module */
const INIT_DISPATCH_LOG = [
  { orderId:'#ORD-1035', driverName:'Roshan Fernando', time:'10:14 AM', distanceKm: 6,   status:'Delivered', token:'TKN-A7F2E' },
  { orderId:'#ORD-1031', driverName:'Nimal Silva',     time:'09:52 AM', distanceKm: 14,  status:'Dispatched', token:'TKN-B3C9D' },
  { orderId:'#ORD-1028', driverName:'Kamal Perera',    time:'09:30 AM', distanceKm: 18,  status:'Delivered', token:'TKN-C1G8H' },
  { orderId:'#ORD-1024', driverName:'Kamal Perera',    time:'08:55 AM', distanceKm: 8,   status:'Delivered', token:'TKN-D4J2K' },
  { orderId:'#ORD-1019', driverName:'Suresh Kumar',    time:'08:20 AM', distanceKm: 115, status:'Delivered', token:'TKN-E9M5P' },
  { orderId:'#ORD-1017', driverName:'Nimal Silva',     time:'07:45 AM', distanceKm: 12,  status:'Delivered', token:'TKN-F3N7Q' },
  { orderId:'#ORD-1013', driverName:'Amara Bandara',   time:'07:10 AM', distanceKm: 9,   status:'Delivered', token:'TKN-G6R8S' },
  { orderId:'#ORD-1009', driverName:'Kamal Perera',    time:'06:50 AM', distanceKm: 22,  status:'Delivered', token:'TKN-H1T2U' },
];

const INIT_RATINGS = [
  { order:'#ORD-1028', customer:'Priya Nair',          driver:'Kamal Perera',    rating:5, comment:'Arrived on time, very careful with the furniture.', date:'Apr 25', replied:true },
  { order:'#ORD-1031', customer:'Ravi Wickramasinghe', driver:'Nimal Silva',     rating:3, comment:'Late by 2 hours, no call.', date:'Apr 25', replied:false },
  { order:'#ORD-1019', customer:'Sunitha Mendis',      driver:'Suresh Kumar',    rating:4, comment:'Good service, minor damage on packaging.', date:'Apr 24', replied:true },
  { order:'#ORD-1044', customer:'Fathima Ismail',      driver:'Roshan Fernando', rating:5, comment:'Excellent! Professional and fast.', date:'Apr 24', replied:false },
  { order:'#ORD-1052', customer:'Gayan Dias',          driver:'Amara Bandara',   rating:2, comment:'Item wrong, had to wait 3 days for replacement.', date:'Apr 23', replied:false },
];

/* ─── Reusable UI Components ──────────────────────────────────── */
const Badge = ({ label, color }) => {
  const c = { green:'bg-green-100 text-green-700', red:'bg-red-100 text-red-700', yellow:'bg-yellow-100 text-yellow-700', blue:'bg-blue-100 text-blue-700', purple:'bg-purple-100 text-purple-700', gray:'bg-gray-100 text-gray-600', indigo:'bg-indigo-100 text-indigo-700', orange:'bg-orange-100 text-orange-700' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${c[color]||c.gray}`}>{label}</span>;
};
const StatCard = ({ icon, label, value, sub, color='indigo' }) => {
  const bg  = { indigo:'bg-indigo-50', sky:'bg-sky-50', green:'bg-green-50', orange:'bg-orange-50', purple:'bg-purple-50', red:'bg-red-50' };
  const txt = { indigo:'text-indigo-600', sky:'text-sky-600', green:'text-green-600', orange:'text-orange-600', purple:'text-purple-600', red:'text-red-600' };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <span className={`p-3 rounded-xl ${bg[color]}`}><span className={`material-symbols-outlined text-2xl ${txt[color]}`}>{icon}</span></span>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};
const Th = ({ ch }) => <th className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3 bg-gray-50 border-b border-gray-100">{ch}</th>;
const Td = ({ children, className='' }) => <td className={`px-4 py-3.5 text-sm text-gray-700 border-b border-gray-50 ${className}`}>{children}</td>;
const Stars = ({ n }) => (
  <span className="flex gap-0.5">
    {[1,2,3,4,5].map(i => <span key={i} className={`material-symbols-outlined text-base ${i<=n?'text-yellow-400':'text-gray-200'}`} style={{fontVariationSettings:"'FILL' 1"}}>star</span>)}
  </span>
);
const Btn = ({ children, onClick, variant='primary', small, disabled }) => {
  const base = `inline-flex items-center gap-1 font-semibold rounded-lg transition-all ${small?'px-2.5 py-1 text-xs':'px-4 py-2 text-sm'} ${disabled?'opacity-40 cursor-not-allowed':''}`;
  const v = { primary:'bg-indigo-600 text-white hover:bg-indigo-700', outline:'border border-indigo-300 text-indigo-600 hover:bg-indigo-50', danger:'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200', success:'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200', ghost:'text-gray-500 hover:bg-gray-100 border border-gray-200', warning:'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100' };
  return <button onClick={disabled?undefined:onClick} className={`${base} ${v[variant]}`}>{children}</button>;
};
const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div><h2 className="text-xl font-extrabold text-gray-800 tracking-tight">{title}</h2>{subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}</div>
    {action && <div className="flex gap-2">{action}</div>}
  </div>
);
const Alert = ({ type, children }) => {
  const s = { warning:'bg-orange-50 border-orange-300 text-orange-800', error:'bg-red-50 border-red-300 text-red-800', success:'bg-green-50 border-green-300 text-green-700', info:'bg-indigo-50 border-indigo-300 text-indigo-800' };
  const icons = { warning:'warning', error:'error', success:'check_circle', info:'info' };
  return <div className={`flex items-start gap-2 border rounded-lg px-4 py-3 text-sm font-medium ${s[type]}`}><span className="material-symbols-outlined text-base mt-0.5">{icons[type]}</span><span>{children}</span></div>;
};
const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.round((score / 90) * 100));
  const color = pct > 75 ? 'bg-red-500' : pct > 45 ? 'bg-orange-400' : 'bg-yellow-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{width:`${pct}%`}} /></div>
      <span className="text-xs font-bold text-gray-600 w-5">{score}</span>
    </div>
  );
};

/* ═══════ SECTION VIEWS ═══════════════════════════════════════════ */

/* 1. Dashboard */
function DashboardView({ routes, pendingOrders, damageTickets, codList }) {
  const overdueCount = pendingOrders.filter(o => o.urgency === 'Critical').length;
  const pendingCod   = codList.filter(c => c.status !== 'Reconciled').length;
  const sorted = [...pendingOrders].map(o=>({...o,score:calcPriorityScore(o)})).sort((a,b)=>b.score-a.score);
  return (
    <div>
      <SectionHeader title="LogiQ Brain Overview" subtitle={`Live logistics intelligence · ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="local_shipping"    label="Pending Deliveries" value={pendingOrders.filter(o=>o.status!=='Delivered').length} sub={`${overdueCount} critical`} color="indigo" />
        <StatCard icon="directions_car"    label="Vehicles On Road"   value={VEHICLES.filter(v=>v.status==='On Route').length} sub="6 total fleet" color="sky" />
        <StatCard icon="person_pin_circle" label="Drivers Active"     value={DRIVERS.filter(d=>d.status==='On Route').length} sub={`${DRIVERS.filter(d=>d.status==='Available').length} available`} color="green" />
        <StatCard icon="payments"          label="Today's COD"        value="Rs. 506,300" sub={`${pendingCod} undeposited`} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Top Priority Orders</h3>
            <Badge label="Live" color="green" />
          </div>
          <table className="w-full">
            <thead><tr>{['Order','Customer','Score','Urgency','Status'].map(h=><Th key={h} ch={h} />)}</tr></thead>
            <tbody>
              {sorted.slice(0,5).map(o=>(
                <tr key={o.id} className="hover:bg-gray-50">
                  <Td><span className="font-mono font-bold text-indigo-600">{o.id}</span></Td>
                  <Td>{o.customer}</Td>
                  <Td><ScoreBar score={o.score} /></Td>
                  <Td><Badge label={o.urgency} color={o.urgency==='Critical'?'red':o.urgency==='High'?'orange':o.urgency==='Medium'?'yellow':'gray'} /></Td>
                  <Td><Badge label={o.status} color={o.status==='Delivered'?'green':o.status==='On-Route'?'blue':o.status==='Assigned'?'indigo':'gray'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Fleet Health</h3>
            {VEHICLES.slice(0,4).map(v=>(
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-semibold text-gray-700">{v.id}</p><p className="text-xs text-gray-400">{v.type}</p></div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v.fuel>60?'bg-green-500':v.fuel>30?'bg-yellow-400':'bg-red-500'}`} style={{width:`${v.fuel}%`}} /></div>
                  <span className="text-xs text-gray-400 w-8">{v.fuel}%</span>
                  <Badge label={v.status} color={v.status==='On Route'?'blue':v.status==='Available'?'green':v.status==='Maintenance'?'red':'gray'} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-indigo-600 rounded-xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Urge Queue Alerts</p>
            <p className="text-3xl font-extrabold mb-1">{pendingOrders.filter(o=>o.urgentFlag).length}</p>
            <p className="text-sm opacity-80">Critical/High orders needing action</p>
            <div className="mt-3 flex gap-2">
              <Badge label={`${pendingOrders.filter(o=>o.urgency==='Critical').length} Critical`} color="red" />
              <Badge label={`${pendingOrders.filter(o=>o.urgency==='High').length} High`} color="orange" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 2. Urge Queue */
function UrgeQueueView({ pendingOrders, setPendingOrders }) {
  const queue = [...pendingOrders].map(o => ({ ...o, score: calcPriorityScore(o) })).sort((a,b)=>b.score-a.score);
  const [assignModal, setAssignModal] = useState(null);
  const [pickedDriver, setPickedDriver] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  function assign() {
    if (!pickedDriver) return;
    setPendingOrders(qs => qs.map(o => o.id === assignModal ? { ...o, driver: pickedDriver, status: 'Assigned' } : o));
    setAssignModal(null); setPickedDriver('');
  }
  function dispatch(id) {
    setPendingOrders(qs => qs.map(o => o.id === id ? { ...o, status: 'On-Route', urgency: 'Dispatched' } : o));
  }

  return (
    <div>
      <SectionHeader title="Urge Queue"
        subtitle="Orders in CONFIRMED/PROCESSING state — auto-sorted by priority score"
        action={
          <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100">
            <span className="material-symbols-outlined text-sm">help_outline</span>How assignment works
          </button>
        }
      />

      {/* Live data indicator */}
      {pendingOrders.some(o => o.isReal) && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span><strong>{pendingOrders.filter(o => o.isReal).length} live order(s)</strong> pulled from your database are shown at the top. Demo orders below show how the queue behaves with more volume.</span>
        </div>
      )}
      {!pendingOrders.some(o => o.isReal) && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span className="material-symbols-outlined text-amber-600 text-base">info</span>
          <span>No live orders found in the database with a dispatchable status (ORDER_CONFIRMED / PROCESSING / PACKED). <strong>Demo orders below</strong> show how the Urge Queue looks when orders are flowing.</span>
        </div>
      )}

      {showInfo && (
        <div className="mb-5">
          <Alert type="info">
            <strong>How the Urge Queue works:</strong> When a customer places an order and it reaches ORDER_CONFIRMED or PROCESSING status in the admin Orders tab, it automatically appears here — pulled live from your database. The priority score is: Urgent flag (+50) + deadline urgency (0–75) + order age (0–20). The admin assigns a driver from the dropdown; once dispatched, the order moves out of the queue. Demo orders supplement the view when there are few live orders — they do not affect the real database.
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-red-600">{queue.filter(o=>o.urgency==='Critical').length}</p><p className="text-xs text-red-500 font-semibold mt-1">Critical</p></div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-orange-500">{queue.filter(o=>o.urgency==='High').length}</p><p className="text-xs text-orange-500 font-semibold mt-1">High</p></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-yellow-600">{queue.filter(o=>o.urgency==='Medium').length}</p><p className="text-xs text-yellow-600 font-semibold mt-1">Medium</p></div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-gray-500">{queue.filter(o=>o.urgency==='Low'||o.urgency==='Dispatched').length}</p><p className="text-xs text-gray-500 font-semibold mt-1">Low / Done</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['Order','Customer','Priority Score','Urgency','Driver','Distance','Actions'].map(h=><Th key={h} ch={h} />)}</tr></thead>
          <tbody>
            {queue.map(o => (
              <tr key={o.id} className={`hover:bg-gray-50 ${o.urgency==='Critical'?'bg-red-50/30':o.isReal?'bg-green-50/20':''}`}>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setViewOrder(o)} className="font-mono font-bold text-indigo-600 hover:underline text-left">{o.id}</button>
                    {o.isReal && <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-green-100 text-green-700 rounded-full border border-green-300">LIVE</span>}
                  </div>
                </Td>
                <Td>
                  <div><p className="font-semibold text-gray-800">{o.customer}</p><p className="text-xs text-gray-400 truncate max-w-[150px]">{o.address}</p></div>
                </Td>
                <Td><ScoreBar score={o.score} /></Td>
                <Td><Badge label={o.urgency} color={o.urgency==='Critical'?'red':o.urgency==='High'?'orange':o.urgency==='Medium'?'yellow':o.urgency==='Dispatched'?'green':'gray'} /></Td>
                <Td><span className={o.driver==='Unassigned'?'text-red-500 font-semibold':o.status==='Assigned'?'text-indigo-600 font-semibold':'text-gray-700'}>{o.driver}</span></Td>
                <Td>
                  <span className={`text-xs font-semibold ${distTier(o.distanceKm)==='outstation'?'text-purple-600':distTier(o.distanceKm)==='regional'?'text-blue-600':'text-gray-600'}`}>
                    {o.distanceKm} km · {DIST_TIERS[distTier(o.distanceKm)].label.split(' ')[0]}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-1 flex-wrap">
                    <Btn variant="ghost" small onClick={() => setViewOrder(o)}><span className="material-symbols-outlined text-sm">visibility</span></Btn>
                    {o.driver==='Unassigned' && <Btn variant="success" small onClick={()=>setAssignModal(o.id)}>Assign</Btn>}
                    {o.status!=='On-Route' && o.status!=='Delivered' && o.driver!=='Unassigned' && (
                      <Btn variant="outline" small onClick={()=>dispatch(o.id)}>Dispatch</Btn>
                    )}
                    {o.urgency==='Critical' && <Btn variant="danger" small>Escalate</Btn>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Order Detail</p>
                <h3 className="text-white font-extrabold text-lg">{viewOrder.id}</h3>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-white/70 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Customer</p><p className="font-bold text-gray-800">{viewOrder.customer}</p></div>
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Phone</p><p className="font-semibold text-gray-700">{viewOrder.phone}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400 font-semibold uppercase">Delivery Address</p><p className="font-semibold text-gray-700">{viewOrder.address}</p></div>
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Total</p><p className="font-extrabold text-indigo-600">Rs. {viewOrder.total?.toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Weight</p><p className="font-bold text-gray-700">{viewOrder.weightKg} kg</p></div>
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Distance</p><p className="font-bold text-gray-700">{viewOrder.distanceKm} km</p></div>
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Driver</p><p className={`font-bold ${viewOrder.driver==='Unassigned'?'text-red-500':'text-green-600'}`}>{viewOrder.driver}</p></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Order Items</p>
                <div className="space-y-2">
                  {viewOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-sm font-semibold text-gray-700">{item.name} <span className="text-gray-400">×{item.qty}</span></span>
                      <span className="text-sm font-bold text-indigo-600">Rs. {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Assign Driver to {assignModal}</h3>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" value={pickedDriver} onChange={e=>setPickedDriver(e.target.value)}>
              <option value="">Select available driver…</option>
              {DRIVERS.filter(d=>d.status==='Available').map(d=><option key={d.id} value={d.name}>{d.name} — {d.vehicle}</option>)}
            </select>
            <div className="flex gap-2">
              <Btn onClick={assign} disabled={!pickedDriver}>Confirm Assignment</Btn>
              <Btn variant="ghost" onClick={()=>{setAssignModal(null);setPickedDriver('');}}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 3. Route Planner */
function RoutePlannerView({ routes, setRoutes, pendingOrders, setPendingOrders }) {
  const [expanded, setExpanded] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [viewStopOrder, setViewStopOrder] = useState(null);
  const [newRoute, setNewRoute] = useState({ name:'', driver:'', vehicle:'', date:'' });
  const [addingStop, setAddingStop] = useState(null);
  const [stopForm, setStopForm] = useState({ addr:'', km:'', min:'', orderId:'' });

  const unassignedOrders = pendingOrders.filter(o => !o.route && o.status !== 'Delivered');

  function createRoute() {
    if (!newRoute.name || !newRoute.driver) return;
    const id = `RT-0${routes.length+1}`;
    setRoutes(rs => [...rs, { id, ...newRoute, status:'Planned', stops:[] }]);
    setShowNew(false); setNewRoute({ name:'', driver:'', vehicle:'', date:'' });
  }

  function addStop(routeId) {
    if (!stopForm.addr) return;
    setRoutes(rs => rs.map(r => r.id !== routeId ? r : {
      ...r,
      stops: [...r.stops, { addr:stopForm.addr, km:Number(stopForm.km)||0, min:Number(stopForm.min)||0, orderId:stopForm.orderId||null,
        customer: stopForm.orderId ? pendingOrders.find(o=>o.id===stopForm.orderId)?.customer || null : null, done:false }]
    }));
    if (stopForm.orderId) {
      setPendingOrders(os => os.map(o => o.id===stopForm.orderId ? {...o, route:routeId, status:'On-Route'} : o));
    }
    setStopForm({ addr:'', km:'', min:'', orderId:'' });
    setAddingStop(null);
  }

  function markStopDone(routeId, stopIdx) {
    setRoutes(rs => rs.map(r => {
      if (r.id !== routeId) return r;
      const stops = r.stops.map((s,i) => i===stopIdx ? {...s, done:true} : s);
      const allDone = stops.every(s=>s.done);
      return {...r, stops, status: allDone ? 'Completed' : 'In Progress'};
    }));
  }

  function deleteRoute(id) {
    setRoutes(rs => rs.filter(r => r.id !== id));
  }

  const stColor = { 'In Progress':'blue', Planned:'indigo', Completed:'green' };

  return (
    <div>
      <SectionHeader title="Route Planner"
        subtitle="Create routes, add delivery stops, assign pending orders per stop"
        action={<Btn onClick={()=>setShowNew(!showNew)}><span className="material-symbols-outlined text-sm">add_road</span>Create Route</Btn>}
      />

      {showNew && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-indigo-800 mb-3">New Delivery Route</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Route Name</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Colombo South Run" value={newRoute.name} onChange={e=>setNewRoute(n=>({...n,name:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Delivery Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newRoute.date} onChange={e=>setNewRoute(n=>({...n,date:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Assign Driver</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newRoute.driver} onChange={e=>setNewRoute(n=>({...n,driver:e.target.value}))}>
                <option value="">Select driver…</option>
                {DRIVERS.map(d=><option key={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Assign Vehicle</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newRoute.vehicle} onChange={e=>setNewRoute(n=>({...n,vehicle:e.target.value}))}>
                <option value="">Select vehicle…</option>
                {VEHICLES.filter(v=>v.status!=='Maintenance').map(v=><option key={v.id}>{v.id} ({v.type})</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2"><Btn onClick={createRoute}>Save Route</Btn><Btn variant="ghost" onClick={()=>setShowNew(false)}>Cancel</Btn></div>
        </div>
      )}

      <div className="space-y-3">
        {routes.map(r => {
          const stops = r.stops || [];
          const done  = stops.filter(s=>s.done).length;
          const totalKm  = stops.reduce((s,st)=>s+st.km,0).toFixed(1);
          const totalMin = stops.reduce((s,st)=>s+st.min,0);
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"><span className="material-symbols-outlined text-indigo-600 text-lg">route</span></span>
                    <div>
                      <p className="font-bold text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.id} · {r.vehicle || 'No vehicle'} · {r.date || 'No date'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={r.status} color={stColor[r.status]||'gray'} />
                    <Btn variant="ghost" small onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                      <span className="material-symbols-outlined text-sm">{expanded===r.id?'expand_less':'expand_more'}</span>Stops ({stops.length})
                    </Btn>
                    <Btn variant="ghost" small onClick={()=>setAddingStop(addingStop===r.id?null:r.id)}>
                      <span className="material-symbols-outlined text-sm">add_location</span>Add Stop
                    </Btn>
                    {r.status==='Planned' && <Btn variant="danger" small onClick={()=>deleteRoute(r.id)}><span className="material-symbols-outlined text-sm">delete</span></Btn>}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3 text-center bg-gray-50 rounded-lg p-3">
                  <div><p className="text-xs text-gray-400 font-semibold">Driver</p><p className="text-sm font-bold text-gray-700 mt-0.5">{r.driver||'—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Stops</p><p className="text-sm font-bold text-gray-700 mt-0.5">{stops.length}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Completed</p><p className="text-sm font-bold text-green-600 mt-0.5">{done}/{stops.length}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Distance</p><p className="text-sm font-bold text-gray-700 mt-0.5">{totalKm} km</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Est. Time</p><p className="text-sm font-bold text-gray-700 mt-0.5">{totalMin?`${Math.floor(totalMin/60)}h ${totalMin%60}m`:'—'}</p></div>
                </div>

                {stops.length > 0 && <div className="mt-3"><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${(done/stops.length)*100}%`}} /></div></div>}
              </div>

              {/* Add Stop Form */}
              {addingStop===r.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-blue-50">
                  <p className="text-xs font-bold text-blue-800 uppercase mb-3">Add New Stop to {r.name}</p>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Address / Area</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="e.g. Dehiwala" value={stopForm.addr} onChange={e=>setStopForm(s=>({...s,addr:e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Distance (km)</label>
                      <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="5.0" value={stopForm.km} onChange={e=>setStopForm(s=>({...s,km:e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Est. Time (min)</label>
                      <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="20" value={stopForm.min} onChange={e=>setStopForm(s=>({...s,min:e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Assign Pending Order</label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={stopForm.orderId} onChange={e=>setStopForm(s=>({...s,orderId:e.target.value}))}>
                        <option value="">No order (waypoint)</option>
                        {unassignedOrders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.customer}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn small onClick={()=>addStop(r.id)}>Add Stop</Btn>
                    <Btn variant="ghost" small onClick={()=>setAddingStop(null)}>Cancel</Btn>
                  </div>
                </div>
              )}

              {/* Stops Table */}
              {expanded===r.id && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  <table className="w-full mt-3">
                    <thead><tr>{['#','Stop','Distance','Est. Time','Order','Status','Action'].map(h=><Th key={h} ch={h} />)}</tr></thead>
                    <tbody>
                      {stops.map((s,i)=>(
                        <tr key={i} className="hover:bg-gray-50">
                          <Td>{i+1}</Td>
                          <Td className="font-semibold">{s.addr}</Td>
                          <Td>{s.km} km</Td>
                          <Td>{s.min} min</Td>
                          <Td>
                            {s.orderId ? (
                              <button onClick={() => setViewStopOrder(pendingOrders.find(o=>o.id===s.orderId))} className="font-mono text-indigo-600 font-bold text-xs hover:underline flex items-center gap-1">
                                {s.orderId} <span className="material-symbols-outlined text-xs">open_in_new</span>
                              </button>
                            ) : <span className="text-gray-400 text-xs italic">Waypoint</span>}
                          </Td>
                          <Td><Badge label={s.done?'Done':i===stops.findIndex(x=>!x.done)&&r.status!=='Completed'?'Current':'Pending'} color={s.done?'green':i===stops.findIndex(x=>!x.done)?'blue':'gray'} /></Td>
                          <Td>
                            {!s.done && <Btn variant="success" small onClick={()=>markStopDone(r.id,i)}><span className="material-symbols-outlined text-sm">check</span>Done</Btn>}
                          </Td>
                        </tr>
                      ))}
                      {stops.length===0 && <tr><td colSpan="7" className="px-4 py-4 text-sm text-gray-400 italic text-center">No stops added yet. Click "Add Stop" to build this route.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewStopOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-extrabold">{viewStopOrder.id}</h3>
              <button onClick={() => setViewStopOrder(null)} className="text-white/70 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-3">
              <div><p className="text-xs text-gray-400 font-semibold uppercase">Customer</p><p className="font-bold">{viewStopOrder.customer}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold uppercase">Address</p><p className="font-semibold text-gray-700">{viewStopOrder.address}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold uppercase">Items</p>
                {viewStopOrder.items?.map((item, i) => (
                  <p key={i} className="text-sm text-gray-600">• {item.name} ×{item.qty} — Rs. {(item.price*item.qty).toLocaleString()}</p>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Total</p><p className="font-extrabold text-indigo-600">Rs. {viewStopOrder.total?.toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-400 font-semibold uppercase">Weight</p><p className="font-bold">{viewStopOrder.weightKg} kg</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 4. Vehicle Capacity */
function VehicleCapacityView({ pendingOrders }) {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedOrders, setSelectedOrders]   = useState([]);
  const vehicle = VEHICLES.find(v=>v.id===selectedVehicle);
  const totalSelected = selectedOrders.reduce((s,id)=>{ const o=pendingOrders.find(p=>p.id===id); return s+(o?.weightKg||0); },0);
  const capacityUsed  = vehicle ? vehicle.loadKg + totalSelected : 0;
  const maxCap = vehicle?.maxKg || 0;
  const exceeded = capacityUsed > maxCap;
  const pct = maxCap ? Math.min(100, Math.round((capacityUsed/maxCap)*100)) : 0;
  function toggle(id) { setSelectedOrders(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]); }

  return (
    <div>
      <SectionHeader title="Vehicle Capacity Planner" subtitle="Select a vehicle then tick the orders to load — get instant weight analysis" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">1. Select Vehicle</h3>
          <div className="space-y-2">
            {VEHICLES.filter(v=>v.status!=='Maintenance').map(v=>(
              <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedVehicle===v.id?'border-indigo-400 bg-indigo-50':'border-gray-100 hover:border-gray-300'}`}>
                <input type="radio" name="vehicle" checked={selectedVehicle===v.id} onChange={()=>{setSelectedVehicle(v.id);setSelectedOrders([]);}} className="accent-indigo-600" />
                <span className="material-symbols-outlined text-indigo-500">local_shipping</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{v.id} <span className="text-xs text-gray-400">({v.type})</span></p>
                  <p className="text-xs text-gray-400">Cap: {v.maxKg.toLocaleString()} kg · Loaded: {v.loadKg} kg · Driver: {v.driver}</p>
                </div>
                <Badge label={v.status} color={v.status==='Available'?'green':v.status==='On Route'?'blue':'gray'} />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">2. Select Orders to Load</h3>
            <div className="space-y-2">
              {pendingOrders.filter(o=>o.status!=='Delivered').map(o=>(
                <label key={o.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedOrders.includes(o.id)?'border-indigo-400 bg-indigo-50':'border-gray-100 hover:border-gray-200'}`}>
                  <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={()=>toggle(o.id)} className="accent-indigo-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{o.id} — {o.customer}</p>
                    <p className="text-xs text-gray-400">{o.weightKg} kg · {o.distanceKm} km · Rs. {o.total?.toLocaleString()}</p>
                  </div>
                  <Badge label={distTier(o.distanceKm)} color={distTier(o.distanceKm)==='outstation'?'purple':distTier(o.distanceKm)==='regional'?'blue':'green'} />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">3. Capacity Check</h3>
            {!vehicle ? <Alert type="info">Select a vehicle to see load analysis.</Alert> : (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Total load (existing + selected)</span>
                  <span className={`font-bold ${exceeded?'text-red-600':'text-gray-800'}`}>{capacityUsed.toLocaleString()} / {maxCap.toLocaleString()} kg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${exceeded?'bg-red-500':pct>80?'bg-orange-400':'bg-green-500'}`} style={{width:`${pct}%`}} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg p-2"><p className="text-xs text-gray-400 font-semibold">Existing</p><p className="font-bold">{vehicle.loadKg} kg</p></div>
                  <div className="bg-indigo-50 rounded-lg p-2"><p className="text-xs text-gray-400 font-semibold">New</p><p className="font-bold text-indigo-600">{totalSelected} kg</p></div>
                  <div className={`rounded-lg p-2 ${exceeded?'bg-red-50':'bg-green-50'}`}><p className="text-xs text-gray-400 font-semibold">Remaining</p><p className={`font-bold ${exceeded?'text-red-600':'text-green-600'}`}>{exceeded?`−${capacityUsed-maxCap}`:`${maxCap-capacityUsed}`} kg</p></div>
                </div>
                {exceeded ? <Alert type="error">Overloaded by {(capacityUsed-maxCap).toLocaleString()} kg. Remove orders or switch to a larger vehicle.</Alert>
                          : <Alert type="success">{pct}% utilisation — safe to dispatch.</Alert>}
                {selectedOrders.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Delivery Earnings for this load</p>
                    <p className="text-sm font-bold text-indigo-600">Rs. {selectedOrders.reduce((s,id)=>{const o=pendingOrders.find(p=>p.id===id);return s+DIST_TIERS[distTier(o?.distanceKm||10)].rate;},0).toLocaleString()} for driver</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. Stock Distribution (product-level) */
function StockDistributionView({ branchInventory, setBranchInventory }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [availableQty,    setAvailableQty]    = useState(0);
  const [allocations,     setAllocations]     = useState({});
  const [saved,           setSaved]           = useState(false);
  const [viewBranch,      setViewBranch]      = useState(null);

  const allSkus = [...new Set(Object.values(branchInventory).flat().map(p=>p.sku))];
  const productOptions = Object.values(branchInventory).flat().filter((p,i,arr)=>arr.findIndex(x=>x.sku===p.sku)===i);

  function selectProduct(sku) {
    setSelectedProduct(sku);
    const init = {};
    Object.keys(branchInventory).forEach(b => { init[b] = 0; });
    setAllocations(init);
    setAvailableQty(20);
    setSaved(false);
  }

  function updateAlloc(branch, val) {
    setAllocations(a => ({...a, [branch]: Math.max(0, Number(val)||0)}));
    setSaved(false);
  }

  const totalAlloc = Object.values(allocations).reduce((s,v)=>s+v, 0);
  const remaining  = availableQty - totalAlloc;
  const isValid    = totalAlloc <= availableQty && totalAlloc > 0;

  function applyDistribution() {
    if (!isValid || !selectedProduct) return;
    setBranchInventory(inv => {
      const next = {...inv};
      Object.entries(allocations).forEach(([branch, qty]) => {
        if (qty <= 0) return;
        next[branch] = next[branch].map(p => p.sku === selectedProduct ? {...p, qty: p.qty + qty} : p);
      });
      return next;
    });
    setSaved(true);
  }

  const selProduct = productOptions.find(p=>p.sku===selectedProduct);
  const statusColor = { Healthy:'bg-green-100 text-green-700', Warning:'bg-yellow-100 text-yellow-700', Critical:'bg-red-100 text-red-700' };

  return (
    <div>
      <SectionHeader title="Stock Distribution" subtitle="Select a product and allocate incoming units to each branch based on demand"
        action={<Btn onClick={applyDistribution} disabled={!isValid || !selectedProduct}>Apply Distribution</Btn>}
      />

      {saved && <div className="mb-4"><Alert type="success">Stock distributed! Each branch's inventory has been updated.</Alert></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — select product and set qty */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">1. Select Product to Distribute</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={selectedProduct} onChange={e=>selectProduct(e.target.value)}>
              <option value="">Choose a product…</option>
              {productOptions.map(p=><option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>)}
            </select>
            {selProduct && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm">
                <p className="font-semibold text-indigo-800">{selProduct.name}</p>
                <p className="text-indigo-600 text-xs">{selProduct.category} · Rs. {selProduct.unitPrice.toLocaleString()} per unit</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">2. Incoming Shipment Qty</label>
            <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={availableQty}
              onChange={e=>{ setAvailableQty(Number(e.target.value)||0); setSaved(false); }} />
          </div>
          {selectedProduct && (
            <div className={`p-3 rounded-lg border ${remaining<0?'bg-red-50 border-red-300':'bg-green-50 border-green-200'}`}>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Allocation Status</p>
              <p className={`text-xl font-extrabold ${remaining<0?'text-red-600':'text-green-600'}`}>{totalAlloc} / {availableQty} units</p>
              <p className={`text-xs font-semibold ${remaining<0?'text-red-500':'text-green-500'}`}>{remaining>=0?`${remaining} remaining`:`${Math.abs(remaining)} over-allocated`}</p>
            </div>
          )}
        </div>

        {/* Right — per-branch allocation */}
        <div className="lg:col-span-2 space-y-3">
          {Object.keys(branchInventory).map(branch => {
            const bStatus = BRANCHES.find(b=>b.name===branch)?.status || 'Healthy';
            const currentQty = (branchInventory[branch].find(p=>p.sku===selectedProduct)?.qty) ?? '—';
            return (
              <div key={branch} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500">store</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{branch}</p>
                      <p className="text-xs text-gray-400">Currently in stock: <strong>{currentQty === '—' ? 'Not stocked' : `${currentQty} units`}</strong></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[bStatus]}`}>{bStatus}</span>
                    <button onClick={()=>setViewBranch(viewBranch===branch?null:branch)} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>View Inventory
                    </button>
                  </div>
                </div>
                {selectedProduct && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-500">Allocate units:</label>
                    <input type="number" min="0" max={availableQty}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24 text-center font-bold"
                      value={allocations[branch]||0} onChange={e=>updateAlloc(branch, e.target.value)} />
                    {(allocations[branch]||0) > 0 && (
                      <span className="text-xs text-indigo-600 font-semibold">+{allocations[branch]} units · New total: {(typeof currentQty==='number' ? currentQty : 0) + (allocations[branch]||0)}</span>
                    )}
                  </div>
                )}
                {viewBranch===branch && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Current Branch Inventory</p>
                    <div className="grid grid-cols-2 gap-2">
                      {branchInventory[branch].map(p=>(
                        <div key={p.sku} className={`flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 ${p.qty===0?'opacity-50':''}`}>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.sku}</p>
                          </div>
                          <span className={`text-sm font-extrabold ${p.qty===0?'text-red-500':p.qty<=2?'text-orange-500':'text-green-600'}`}>{p.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 6. Inter-Branch Requests */
const STATUS_FLOW   = { 'PENDING_APPROVAL': 'IN_TRANSIT', 'IN_TRANSIT': 'DELIVERED' };
const STATUS_LABELS = { 'PENDING_APPROVAL':'Pending Approval', 'IN_TRANSIT':'In Transit', 'DELIVERED':'Delivered' };
const STATUS_COLORS = { 'PENDING_APPROVAL':'yellow', 'IN_TRANSIT':'blue', 'DELIVERED':'green' };

function InterBranchView({ requests, setRequests, branchInventory, setBranchInventory }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from:'', to:'' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [note, setNote] = useState('');
  const [viewBranchInv, setViewBranchInv] = useState(null);

  const branchNames = Object.keys(branchInventory);

  function toggleItem(sku, name, availableQty) {
    setSelectedItems(items => {
      const exists = items.find(i=>i.sku===sku);
      if (exists) return items.filter(i=>i.sku!==sku);
      return [...items, { sku, name, qty: 1, maxQty: availableQty }];
    });
  }

  function setItemQty(sku, qty) {
    setSelectedItems(items => items.map(i => i.sku===sku ? {...i, qty:Math.max(1, Math.min(i.maxQty, Number(qty)||1))} : i));
  }

  function create() {
    if (!form.from || !form.to || selectedItems.length === 0) return;
    if (form.from === form.to) { setNote('Source and destination branches must be different.'); return; }
    const id = `IBR-${String(requests.length+1).padStart(3,'0')}`;
    const today = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    setRequests(rs => [{ id, from:form.from, to:form.to, items:selectedItems.map(i=>({sku:i.sku,name:i.name,qty:i.qty})), status:'PENDING_APPROVAL', date:today }, ...rs]);
    setBranchInventory(inv => {
      const next = {...inv};
      selectedItems.forEach(({sku, qty}) => {
        next[form.from] = next[form.from].map(p => p.sku===sku ? {...p, qty: Math.max(0, p.qty-qty)} : p);
      });
      return next;
    });
    setForm({ from:'', to:'' }); setSelectedItems([]); setShowForm(false);
    setNote(`${id} created — awaiting approval.`);
    setTimeout(()=>setNote(''),4000);
  }

  function advance(id) {
    const req = requests.find(r=>r.id===id);
    if (req && STATUS_FLOW[req.status] === 'DELIVERED') {
      setBranchInventory(inv => {
        const next = {...inv};
        req.items.forEach(({sku, qty}) => {
          if (next[req.to]) next[req.to] = next[req.to].map(p => p.sku===sku ? {...p, qty: p.qty+qty} : p);
        });
        return next;
      });
    }
    setRequests(rs => rs.map(r => r.id===id && STATUS_FLOW[r.status] ? {...r, status:STATUS_FLOW[r.status]} : r));
  }

  function reject(id) {
    const req = requests.find(r=>r.id===id);
    if (req?.status === 'PENDING_APPROVAL') {
      setBranchInventory(inv => {
        const next = {...inv};
        req.items.forEach(({sku, qty}) => {
          next[req.from] = next[req.from].map(p => p.sku===sku ? {...p, qty: p.qty+qty} : p);
        });
        return next;
      });
    }
    setRequests(rs => rs.filter(r=>r.id!==id));
    setNote(`Request ${id} rejected — stock returned.`);
    setTimeout(()=>setNote(''),4000);
  }

  const fromInv = form.from ? branchInventory[form.from] || [] : [];

  return (
    <div>
      <SectionHeader title="Inter-Branch Requests" subtitle="Transfer specific products between locations — multi-item selection supported"
        action={<Btn onClick={()=>setShowForm(!showForm)}><span className="material-symbols-outlined text-sm">swap_horiz</span>New Request</Btn>}
      />
      {note && <div className="mb-4"><Alert type="info">{note}</Alert></div>}

      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-indigo-800 mb-4">Create Inter-Branch Transfer</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">From Branch</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.from} onChange={e=>{setForm(f=>({...f,from:e.target.value}));setSelectedItems([]);}}>
                <option value="">Select source branch…</option>
                {branchNames.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">To Branch</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.to} onChange={e=>setForm(f=>({...f,to:e.target.value}))}>
                <option value="">Select destination branch…</option>
                {branchNames.filter(b=>b!==form.from).map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {form.from && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">Available at {form.from} — select items to transfer:</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {fromInv.map(p=>{
                  const sel = selectedItems.find(i=>i.sku===p.sku);
                  return (
                    <div key={p.sku} className={`rounded-lg border p-3 transition-all ${sel?'border-indigo-400 bg-indigo-50':p.qty===0?'border-gray-100 opacity-40':'border-gray-200 hover:border-indigo-200 cursor-pointer'}`}
                      onClick={()=>p.qty>0&&toggleItem(p.sku, p.name, p.qty)}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-700">{p.name}</p>
                        <span className={`text-xs font-extrabold ${p.qty===0?'text-red-500':p.qty<=2?'text-orange-500':'text-green-600'}`}>{p.qty} avail.</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{p.sku} · Rs. {p.unitPrice.toLocaleString()}</p>
                      {sel && (
                        <div className="mt-2 flex items-center gap-2" onClick={e=>e.stopPropagation()}>
                          <label className="text-[10px] text-gray-500 font-semibold">Qty:</label>
                          <input type="number" min="1" max={p.qty} className="border border-indigo-200 rounded px-2 py-0.5 text-xs w-14 text-center font-bold"
                            value={sel.qty} onChange={e=>setItemQty(p.sku, e.target.value)} />
                        </div>
                      )}
                      {p.qty === 0 && <p className="text-[10px] text-red-500 font-semibold mt-1">Out of stock</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="mb-4 bg-white rounded-lg p-3 border border-indigo-200">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Selected: {selectedItems.length} item(s)</p>
              {selectedItems.map(i=>(
                <div key={i.sku} className="flex items-center justify-between text-sm py-0.5">
                  <span className="text-gray-700 font-semibold">{i.name}</span>
                  <span className="text-indigo-600 font-bold">×{i.qty}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Btn onClick={create} disabled={!form.from||!form.to||selectedItems.length===0}>Submit Transfer Request</Btn>
            <Btn variant="ghost" onClick={()=>{setShowForm(false);setSelectedItems([]);}}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Branch Inventory Quick View */}
      <div className="flex gap-2 flex-wrap mb-5">
        {branchNames.map(b=>(
          <button key={b} onClick={()=>setViewBranchInv(viewBranchInv===b?null:b)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${viewBranchInv===b?'bg-indigo-600 text-white border-indigo-600':'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            <span className="material-symbols-outlined text-sm">store</span>{b}
          </button>
        ))}
      </div>
      {viewBranchInv && (
        <div className="mb-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Inventory at {viewBranchInv}</h3>
            <button onClick={()=>setViewBranchInv(null)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined text-sm">close</span></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(branchInventory[viewBranchInv]||[]).map(p=>(
              <div key={p.sku} className={`flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 ${p.qty===0?'opacity-50':''}`}>
                <div><p className="text-xs font-bold text-gray-700">{p.name}</p><p className="text-[10px] text-gray-400">{p.sku}</p></div>
                <div className="text-right">
                  <p className={`text-lg font-extrabold ${p.qty===0?'text-red-500':p.qty<=2?'text-orange-500':'text-green-600'}`}>{p.qty}</p>
                  <p className="text-[10px] text-gray-400">units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['ID','From','To','Items','Date','Status','Actions'].map(h=><Th key={h} ch={h} />)}</tr></thead>
          <tbody>
            {requests.map(r=>(
              <tr key={r.id} className="hover:bg-gray-50">
                <Td><span className="font-mono text-indigo-600 font-bold">{r.id}</span></Td>
                <Td>{r.from}</Td>
                <Td>{r.to}</Td>
                <Td>
                  <div className="space-y-0.5">
                    {(r.items||[]).map((item,i)=>(
                      <p key={i} className="text-xs text-gray-600">{item.name} <span className="font-bold text-gray-800">×{item.qty}</span></p>
                    ))}
                  </div>
                </Td>
                <Td className="text-gray-500">{r.date}</Td>
                <Td><Badge label={STATUS_LABELS[r.status]||r.status} color={STATUS_COLORS[r.status]||'gray'} /></Td>
                <Td>
                  <div className="flex gap-1">
                    {STATUS_FLOW[r.status] && <Btn small onClick={()=>advance(r.id)}>{r.status==='PENDING_APPROVAL'?'Approve & Send':'Mark Delivered'}</Btn>}
                    {r.status==='PENDING_APPROVAL' && <Btn variant="danger" small onClick={()=>reject(r.id)}>Reject</Btn>}
                    {r.status==='DELIVERED' && <span className="text-green-500 text-xs font-bold">✓ Done</span>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 7. QR Dispatch */
function QRDispatchView({ pendingOrders, setPendingOrders, dispatchLog, setDispatchLog }) {
  const [token,          setToken]         = useState(null);
  const [selectedOrder,  setSelectedOrder] = useState('');
  const [confirmed,      setConfirmed]     = useState(false);
  const [showInfo,       setShowInfo]      = useState(false);

  const dispatchable = pendingOrders.filter(o => o.driver !== 'Unassigned' && o.status !== 'Delivered');

  function generateToken() {
    const t = 'TKN-' + Math.random().toString(36).toUpperCase().slice(2,8);
    setToken(t); setConfirmed(false);
  }

  function confirmDispatch() {
    const o = pendingOrders.find(x=>x.id===selectedOrder);
    if (!o) return;
    const entry = {
      orderId: selectedOrder, driverName: o.driver,
      time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
      distanceKm: o.distanceKm, status: 'Dispatched', token
    };
    setDispatchLog(l => [entry, ...l]);
    setPendingOrders(os => os.map(x => x.id===selectedOrder ? {...x, status:'On-Route'} : x));
    setConfirmed(true);
  }

  const qrUrl = token && selectedOrder
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`MANGALA-LOGIQ|${selectedOrder}|${token}`)}`
    : null;

  return (
    <div>
      <SectionHeader title="QR Dispatch"
        subtitle="Generate a signed dispatch token and QR code for each delivery handoff"
        action={<button onClick={()=>setShowInfo(!showInfo)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100"><span className="material-symbols-outlined text-sm">help_outline</span>How it works</button>}
      />

      {showInfo && (
        <div className="mb-5">
          <Alert type="info">
            <strong>How QR Dispatch works:</strong> When an order is ready for handoff to the driver at the warehouse, the admin clicks Generate Token. This creates a unique dispatch code (e.g. TKN-A7F2E) embedded in a QR code. The driver scans the QR with their phone at the warehouse gate — this confirms they physically received the correct package. The token is logged with a timestamp and linked to the order. If the QR doesn't scan or the order ID doesn't match, the handoff is rejected. This creates an audit trail: every delivery starts with a verified, time-stamped scan, eliminating disputes over when/if a package was handed over.
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 block mb-1">Select Order to Dispatch</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={selectedOrder}
              onChange={e=>{setSelectedOrder(e.target.value);setToken(null);setConfirmed(false);}}>
              <option value="">Choose order with assigned driver…</option>
              {dispatchable.map(o=><option key={o.id} value={o.id}>{o.id} — {o.customer} → {o.driver}</option>)}
            </select>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 border-4 border-indigo-200 rounded-2xl flex items-center justify-center mb-4 bg-gray-50 relative overflow-hidden">
              {confirmed ? (
                <div className="text-center"><span className="material-symbols-outlined text-5xl text-green-500">check_circle</span><p className="text-sm font-bold text-green-600 mt-1">Dispatched!</p></div>
              ) : qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-44 h-44 object-contain" onError={e=>{e.target.style.display='none';}} />
              ) : (
                <div className="text-center opacity-40"><span className="material-symbols-outlined text-6xl text-gray-300">qr_code_2</span><p className="text-xs text-gray-400 mt-1">Select order then Generate</p></div>
              )}
              {!confirmed && <><div className="absolute top-1 left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" /><div className="absolute top-1 right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" /><div className="absolute bottom-1 left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" /><div className="absolute bottom-1 right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" /></>}
            </div>
            {token && !confirmed && <p className="font-mono text-indigo-600 font-bold text-sm mb-3 bg-indigo-50 px-4 py-2 rounded-lg">{token}</p>}
            <div className="flex gap-2">
              <Btn onClick={generateToken} disabled={!selectedOrder}><span className="material-symbols-outlined text-sm">qr_code_2</span>Generate Token</Btn>
              {token && !confirmed && <Btn variant="success" onClick={confirmDispatch}><span className="material-symbols-outlined text-sm">check_circle</span>Confirm Dispatch</Btn>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Dispatch Log</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dispatchLog.map((d,i)=>(
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <p className="font-mono text-indigo-600 font-bold text-sm">{d.orderId}</p>
                  <p className="text-xs text-gray-500">{d.driverName} · {d.distanceKm}km · {d.time}</p>
                  <p className="font-mono text-[10px] text-gray-400">{d.token}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge label={d.status} color={d.status==='Delivered'?'green':'blue'} />
                  <span className="text-[10px] text-gray-400">{DIST_TIERS[distTier(d.distanceKm)].label.split(' ')[0]} · Rs.{DIST_TIERS[distTier(d.distanceKm)].rate}</span>
                </div>
              </div>
            ))}
            {dispatchLog.length===0 && <p className="text-sm text-gray-400 italic text-center py-4">No dispatches logged yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 8. Damage Tickets */
function DamageTicketsView({ tickets, setTickets }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order:'', driver:'', item:'', type:DAMAGE_TYPES[0], severity:'Medium', claim:0, status:'OPEN', imageUrl:null });
  const [preview, setPreview] = useState(null);

  function handleImg(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setForm(f=>({...f,imageUrl:ev.target.result})); };
    reader.readAsDataURL(file);
  }
  function create() {
    if (!form.order || !form.item || !form.driver) return;
    const id = `DT-${100+tickets.length+1}`;
    setTickets(ts => [{ id, ...form }, ...ts]);
    setForm({ order:'', driver:'', item:'', type:DAMAGE_TYPES[0], severity:'Medium', claim:0, status:'OPEN', imageUrl:null });
    setPreview(null); setShowForm(false);
  }
  function quarantine(id) { setTickets(ts=>ts.map(t=>t.id===id?{...t,status:'QUARANTINED'}:t)); }
  function resolve(id)    { setTickets(ts=>ts.map(t=>t.id===id?{...t,status:'Resolved'}:t)); }

  const sv = { Critical:'red', High:'orange', Medium:'yellow', Low:'gray' };
  const ss = { OPEN:'blue', QUARANTINED:'red', Resolved:'green' };
  const damageImpact = { 'Glass Shattered':'High', 'Screen Cracked':'Critical', 'Structural Damage':'High', 'Water Damage':'High', 'Upholstery Torn':'Medium', 'Surface Scratched':'Low', 'Hinge Broken':'Medium', 'Leg Snapped':'Medium', 'Parts Missing':'High', 'Electronics Malfunctioned':'Critical', 'Bent / Dented':'Low', 'Packaging Only':'Low' };

  return (
    <div>
      <SectionHeader title="Damage Tickets" subtitle="Standardised damage categories — each open ticket deducts Rs.500 from driver bonus"
        action={<Btn onClick={()=>setShowForm(!showForm)}><span className="material-symbols-outlined text-sm">add</span>New Ticket</Btn>}
      />
      <div className="mb-4">
        <Alert type="warning">Each unresolved damage ticket deducts Rs.500 from the assigned driver's monthly bonus. Resolved tickets have no impact. Quarantined items are held for insurance assessment.</Alert>
      </div>

      {showForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-red-800 mb-3">Report Damage Incident</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Order ID</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="#ORD-XXXX" value={form.order} onChange={e=>setForm(f=>({...f,order:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Responsible Driver</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.driver} onChange={e=>setForm(f=>({...f,driver:e.target.value}))}>
                <option value="">Select driver…</option>{DRIVERS.map(d=><option key={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Item Damaged</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="e.g. Glass Coffee Table" value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Damage Type <span className="text-red-500 font-bold">*</span></label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value,severity:damageImpact[e.target.value]||'Medium'}))}>
                {DAMAGE_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <p className="text-[10px] text-orange-600 font-semibold mt-1">Auto-severity: {damageImpact[form.type]}</p>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Severity Override</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))}>
                {['Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Claim Amount (Rs.)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.claim} onChange={e=>setForm(f=>({...f,claim:Number(e.target.value)}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Initial Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="OPEN">OPEN</option><option value="QUARANTINED">QUARANTINED</option>
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Photo Evidence</label>
              <input type="file" accept="image/*" onChange={handleImg} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
          </div>
          {preview && <img src={preview} alt="preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200 mb-3" />}
          <div className="flex gap-2"><Btn onClick={create}>Submit Ticket</Btn><Btn variant="ghost" onClick={()=>{setShowForm(false);setPreview(null);}}>Cancel</Btn></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['Ticket','Order','Driver','Item','Damage Type','Severity','Claim','Status','Photo','Actions'].map(h=><Th key={h} ch={h} />)}</tr></thead>
          <tbody>
            {tickets.map(t=>(
              <tr key={t.id} className={`hover:bg-gray-50 ${t.status==='OPEN'&&t.severity==='Critical'?'bg-red-50/40':''}`}>
                <Td><span className="font-mono text-indigo-600 font-bold text-xs">{t.id}</span></Td>
                <Td><span className="font-mono text-xs">{t.order}</span></Td>
                <Td className="font-semibold">{t.driver}</Td>
                <Td className="max-w-[120px] truncate">{t.item}</Td>
                <Td><span className="text-xs font-semibold">{t.type}</span></Td>
                <Td><Badge label={t.severity} color={sv[t.severity]} /></Td>
                <Td className="font-semibold">Rs. {Number(t.claim).toLocaleString()}</Td>
                <Td><Badge label={t.status} color={ss[t.status]||'gray'} /></Td>
                <Td>{t.imageUrl?<img src={t.imageUrl} alt="dmg" className="w-10 h-8 object-cover rounded border" />:<span className="text-gray-300 text-xs">—</span>}</Td>
                <Td>
                  <div className="flex gap-1">
                    {t.status==='OPEN' && <Btn variant="warning" small onClick={()=>quarantine(t.id)}>Quarantine</Btn>}
                    {t.status!=='Resolved' && <Btn variant="success" small onClick={()=>resolve(t.id)}>Resolve</Btn>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 9. Driver Cash Collection */
function CashCollectionView({ codList, setCodList, damageTickets }) {
  const [submitTarget, setSubmitTarget] = useState(null);
  const [amount,  setAmount]  = useState('');
  const [sigText, setSigText] = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  function submit(driver) {
    const amt = Number(amount);
    const row = codList.find(c=>c.driver===driver);
    if (!row) return;
    if (amt < row.pending) { setError(`Amount Rs. ${amt.toLocaleString()} is less than pending Rs. ${row.pending.toLocaleString()}.`); return; }
    setCodList(cs=>cs.map(c=>c.driver===driver?{...c,deposited:c.collected,pending:0,status:'Reconciled',signature:sigText||'Digital Approval'}:c));
    setSubmitTarget(null); setAmount(''); setSigText(''); setError('');
    setSuccess(`${driver} reconciled ✓`); setTimeout(()=>setSuccess(''),3000);
  }

  const sc = { Reconciled:'green', Pending:'yellow', Overdue:'red' };
  const total   = codList.reduce((a,c)=>a+c.collected,0);
  const pending = codList.reduce((a,c)=>a+c.pending,0);

  return (
    <div>
      <SectionHeader title="Driver Cash Collection" subtitle="Record COD deposits — amount must meet or exceed the pending balance" />
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="payments"        label="Total Collected" value={`Rs. ${total.toLocaleString()}`}   color="indigo" />
        <StatCard icon="pending_actions" label="Undeposited"     value={`Rs. ${pending.toLocaleString()}`} color="orange" />
        <StatCard icon="check_circle"    label="Reconciled"      value={`${codList.filter(c=>c.status==='Reconciled').length}/${codList.length}`} color="green" />
      </div>
      <div className="space-y-3">
        {codList.map(c=>(
          <div key={c.driver} className={`bg-white rounded-xl border shadow-sm p-5 ${c.status==='Overdue'?'border-red-200':c.status==='Pending'?'border-yellow-200':'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">{c.driver[0]}</div>
                <div>
                  <p className="font-bold text-gray-800">{c.driver}</p>
                  <p className="text-xs text-gray-400">{c.orders} orders · Signature: {c.signature||'—'}</p>
                  {damageTickets.filter(t=>t.driver===c.driver&&t.status!=='Resolved').length>0 && (
                    <p className="text-xs text-red-500 font-semibold">⚠ {damageTickets.filter(t=>t.driver===c.driver&&t.status!=='Resolved').length} open damage ticket(s)</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div><p className="text-xs text-gray-400 font-semibold">Collected</p><p className="font-bold">Rs. {c.collected.toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-400 font-semibold">Deposited</p><p className="font-bold text-green-600">Rs. {c.deposited.toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-400 font-semibold">Pending</p><p className={`font-bold ${c.pending>0?'text-red-600':'text-gray-400'}`}>{c.pending>0?`Rs. ${c.pending.toLocaleString()}`:'—'}</p></div>
                <Badge label={c.status} color={sc[c.status]} />
                {c.status!=='Reconciled' && <Btn small onClick={()=>{setSubmitTarget(c.driver);setAmount(c.pending);setError('');}}>Submit Deposit</Btn>}
                {c.status==='Reconciled' && <span className="text-green-500 text-sm font-bold">✓ Done</span>}
              </div>
            </div>
            {submitTarget===c.driver && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {error && <Alert type="error">{error}</Alert>}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">Amount Depositing (Rs.) — min: {c.pending.toLocaleString()}</label>
                    <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={amount} onChange={e=>{setAmount(e.target.value);setError('');}} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">Signature / Approval Note</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Driver signature or note" value={sigText} onChange={e=>setSigText(e.target.value)} /></div>
                </div>
                <div className="flex gap-2"><Btn onClick={()=>submit(c.driver)}>Confirm & Reconcile</Btn><Btn variant="ghost" onClick={()=>{setSubmitTarget(null);setError('');}}>Cancel</Btn></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* 10. Accountant Reconciliation */
function ReconciliationView({ codList, setCodList }) {
  const [ledger, setLedger] = useState([
    { date:'Apr 28', sales:487200, cod:184600, bank:302600, discrepancy:0,    status:'Balanced', settled:false },
    { date:'Apr 27', sales:391500, cod:210000, bank:181500, discrepancy:0,    status:'Balanced', settled:false },
    { date:'Apr 26', sales:544800, cod:97200,  bank:430400, discrepancy:17200,status:'Mismatch', settled:false },
    { date:'Apr 25', sales:312000, cod:67000,  bank:245000, discrepancy:0,    status:'Balanced', settled:false },
    { date:'Apr 24', sales:628900, cod:148000, bank:480900, discrepancy:0,    status:'Balanced', settled:false },
  ]);
  const [showInfo, setShowInfo] = useState(false);

  function settle(date) { setLedger(l=>l.map(r=>r.date===date?{...r,status:'Balanced',discrepancy:0,settled:true}:r)); }

  const pendingByDriver = codList.filter(c=>c.status!=='Reconciled');
  const expectedCash    = codList.reduce((s,c)=>s+c.pending,0);

  return (
    <div>
      <SectionHeader title="Accountant Reconciliation"
        subtitle="Daily ledger balancing: Sales = COD collected + Bank transfers"
        action={
          <>
            <button onClick={()=>setShowInfo(!showInfo)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100"><span className="material-symbols-outlined text-sm">help_outline</span>How it works</button>
            <Btn variant="outline"><span className="material-symbols-outlined text-sm">download</span>Export CSV</Btn>
          </>
        }
      />

      {showInfo && (
        <div className="mb-5"><Alert type="info">
          <strong>How Reconciliation works:</strong> Every day, total sales are split into two payment channels — COD (cash collected by drivers at delivery) and bank transfers (online payments at checkout). The accountant verifies that COD collected + bank transfers = total sales for the day. If there is a mismatch (e.g. a driver collected Rs.17,200 but hasn't deposited it yet), it shows as a discrepancy. The accountant uses the Driver Wallets panel to chase pending deposits and settle them. Once all wallets are reconciled and numbers match, the day is marked Balanced.
        </Alert></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Daily Ledger</h3></div>
          <table className="w-full">
            <thead><tr>{['Date','Total Sales','COD Collected','Bank Transfer','Discrepancy','Status','Action'].map(h=><Th key={h} ch={h} />)}</tr></thead>
            <tbody>
              {ledger.map(r=>(
                <tr key={r.date} className="hover:bg-gray-50">
                  <Td className="font-semibold">{r.date}</Td>
                  <Td>Rs. {r.sales.toLocaleString()}</Td>
                  <Td>Rs. {r.cod.toLocaleString()}</Td>
                  <Td>Rs. {r.bank.toLocaleString()}</Td>
                  <Td className={r.discrepancy>0?'text-red-600 font-bold':'text-green-500 font-semibold'}>
                    {r.discrepancy>0?`−Rs. ${r.discrepancy.toLocaleString()}`:'✓ Balanced'}
                  </Td>
                  <Td><Badge label={r.status} color={r.status==='Balanced'?'green':'red'} /></Td>
                  <Td>{r.status==='Mismatch'?<Btn variant="danger" small onClick={()=>settle(r.date)}>Settle Mismatch</Btn>:<Btn variant="ghost" small>View</Btn>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Pending Driver Wallets</h3>
            <div className="mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Expected Undeposited Cash</p>
              <p className="text-2xl font-extrabold text-orange-700">Rs. {expectedCash.toLocaleString()}</p>
            </div>
            {pendingByDriver.length===0 ? <Alert type="success">All drivers reconciled!</Alert> : (
              pendingByDriver.map(c=>(
                <div key={c.driver} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm font-semibold">{c.driver}</p><p className="text-xs text-gray-400">{c.orders} orders · {c.status}</p></div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">Rs. {c.pending.toLocaleString()}</p>
                    <Btn variant="success" small onClick={()=>setCodList(cs=>cs.map(x=>x.driver===c.driver?{...x,deposited:x.collected,pending:0,status:'Reconciled',signature:'Accountant Settled'}:x))}>Settle</Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 11. Driver Bonus */
function DriverBonusView({ damageTickets, dispatchLog, ratings }) {
  const [approved, setApproved] = useState({});
  const [showFormula, setShowFormula] = useState(false);

  const bonuses = DRIVERS.map(d => {
    const driverDispatches = dispatchLog.filter(dl => dl.driverName === d.name);
    const b = calcBonus(d, dispatchLog, damageTickets, ratings);
    const penalties = damageTickets.filter(t=>t.driver===d.name&&t.status!=='Resolved').length;
    const driverRatings = ratings.filter(r=>r.driver===d.name);
    const avgRating = driverRatings.length>0 ? (driverRatings.reduce((s,r)=>s+r.rating,0)/driverRatings.length).toFixed(1) : d.rating.toFixed(1);
    const basePay   = driverDispatches.reduce((s,dl)=>s+DIST_TIERS[distTier(dl.distanceKm||10)].rate, 0);
    const onTimeBonus = d.onTime >= 95 ? Math.round(basePay * ONTIME_BONUS_PCT) : 0;
    const maxDailyBonus = driverDispatches.length >= 8 ? MAX_DAILY_BONUS : 0;
    const tier = b >= 15000 ? 'Gold' : b >= 8000 ? 'Silver' : 'Bronze';
    return { ...d, computedBonus:b, penalties, avgRating, deliveriesThisPeriod:driverDispatches.length, basePay, onTimeBonus, maxDailyBonus, tier };
  }).sort((a,b)=>b.computedBonus-a.computedBonus);

  const tierIcon  = { Gold:'emoji_events', Silver:'military_tech', Bronze:'workspace_premium' };
  const tierColor = { Gold:'yellow', Silver:'gray', Bronze:'orange' };

  return (
    <div>
      <SectionHeader title="Driver Bonus"
        subtitle="Calculated from completed deliveries, distance tiers, on-time %, rating & damage penalties"
        action={
          <>
            <button onClick={()=>setShowFormula(!showFormula)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-100"><span className="material-symbols-outlined text-sm">functions</span>Formula</button>
            <Btn onClick={()=>setApproved(Object.fromEntries(bonuses.map(d=>[d.id,true])))}><span className="material-symbols-outlined text-sm">send</span>Approve All</Btn>
          </>
        }
      />

      {showFormula && (
        <div className="mb-5"><Alert type="info">
          <strong>Bonus Formula:</strong><br/>
          1. <strong>Base Pay</strong> = Σ deliveries × distance rate (Local &lt;20km = Rs.50 | Regional 20-100km = Rs.150 | Outstation &gt;100km = Rs.300)<br/>
          2. <strong>On-Time Bonus</strong> = +10% of base pay if on-time percentage ≥ 95%<br/>
          3. <strong>Max Daily Bonus</strong> = +Rs.500 if 8+ deliveries completed in this period<br/>
          4. <strong>Rating Multiplier</strong> = 0.8 to 1.2 (based on average customer rating 0–5 stars)<br/>
          5. <strong>Damage Penalty</strong> = −Rs.500 per unresolved damage ticket<br/>
          Final = (Base Pay + On-Time Bonus + Max Daily Bonus) × Rating Multiplier − Penalties
        </Alert></div>
      )}

      <div className="space-y-3">
        {bonuses.map((d,i)=>(
          <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{i+1}</div>
              <div className="w-36">
                <p className="font-bold text-gray-800">{d.name}</p>
                <p className="text-xs text-gray-400">{d.vehicle}</p>
              </div>
              <div className="flex-1 grid grid-cols-6 gap-4 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Deliveries</p>
                  <p className="font-extrabold mt-0.5">{d.deliveriesThisPeriod}</p>
                  <p className="text-[10px] text-gray-400">this period</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Base Pay</p>
                  <p className="font-extrabold mt-0.5 text-gray-700">Rs.{d.basePay.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">On-Time</p>
                  <p className={`font-extrabold mt-0.5 ${d.onTime>=95?'text-green-600':d.onTime>=88?'text-yellow-500':'text-red-500'}`}>{d.onTime}%{d.onTimeBonus>0&&<span className="text-[10px] text-green-600"> +Rs.{d.onTimeBonus}</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Rating</p>
                  <p className={`font-extrabold mt-0.5 ${Number(d.avgRating)>=4.5?'text-green-600':Number(d.avgRating)>=4.0?'text-yellow-500':'text-red-500'}`}>⭐ {d.avgRating}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Penalties</p>
                  <p className={`font-extrabold mt-0.5 ${d.penalties>0?'text-red-500':'text-gray-400'}`}>{d.penalties>0?`−${d.penalties}×Rs.500`:'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Bonus</p>
                  <p className="font-extrabold text-indigo-600 mt-0.5 text-base">Rs.{d.computedBonus.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`material-symbols-outlined text-2xl ${d.tier==='Gold'?'text-yellow-400':d.tier==='Silver'?'text-gray-400':'text-orange-400'}`} style={{fontVariationSettings:"'FILL' 1"}}>{tierIcon[d.tier]}</span>
                <Badge label={d.tier} color={tierColor[d.tier]} />
              </div>
              {approved[d.id]
                ? <span className="text-green-600 text-xs font-bold flex items-center gap-1"><span className="material-symbols-outlined text-base">check_circle</span>Approved</span>
                : <Btn variant="outline" small onClick={()=>setApproved(a=>({...a,[d.id]:true}))}><span className="material-symbols-outlined text-sm">payments</span>Approve</Btn>
              }
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-indigo-50 rounded-xl border border-indigo-100 p-4 flex items-center gap-4">
        <span className="material-symbols-outlined text-indigo-500">account_balance_wallet</span>
        <p className="text-sm font-semibold text-gray-700">Total bonus payout: <span className="font-extrabold text-indigo-700">Rs. {bonuses.reduce((s,d)=>s+d.computedBonus,0).toLocaleString()}</span></p>
        <p className="text-sm text-gray-400">Approved: {Object.keys(approved).length} / {bonuses.length} drivers</p>
      </div>
    </div>
  );
}

/* 12. Customer Rating */
function CustomerRatingView({ ratings, setRatings }) {
  const avg = ratings.length ? (ratings.reduce((a,r)=>a+r.rating,0)/ratings.length).toFixed(1) : '0.0';

  function reply(order) { setRatings(rs=>rs.map(r=>r.order===order?{...r,replied:true}:r)); }

  return (
    <div>
      <SectionHeader title="Customer Ratings" subtitle="Post-delivery feedback — average rating feeds into Driver Bonus multiplier" />
      <div className="mb-5">
        <Alert type="info">Customer ratings directly affect the driver bonus multiplier (0.8× to 1.2×). A driver with an average rating of 5.0 earns 20% more; a 1.0-rated driver earns 20% less. Managers can reply to reviews or escalate serious complaints.</Alert>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="star"               label="Avg. Rating"     value={`${avg} / 5`} sub={`${ratings.length} reviews`} color="indigo" />
        <StatCard icon="sentiment_satisfied" label="5-Star Reviews"  value={ratings.filter(r=>r.rating===5).length}   color="green" />
        <StatCard icon="reply"              label="Awaiting Reply"  value={ratings.filter(r=>!r.replied).length}      color="orange" />
      </div>
      <div className="space-y-3">
        {ratings.map(r=>(
          <div key={r.order} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{r.customer[0]}</div>
                <div>
                  <p className="font-bold text-gray-800">{r.customer}</p>
                  <p className="text-xs text-gray-400">{r.order} · Driver: <span className="font-semibold text-gray-600">{r.driver}</span> · {r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Stars n={r.rating} />
                {!r.replied ? <Badge label="No Reply" color="orange" /> : <Badge label="Replied" color="green" />}
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 italic">"{r.comment}"</p>
            {!r.replied && (
              <div className="mt-3 flex gap-2">
                <Btn variant="outline" small onClick={()=>reply(r.order)}><span className="material-symbols-outlined text-sm">reply</span>Reply</Btn>
                {r.rating<=2 && <Btn variant="danger" small><span className="material-symbols-outlined text-sm">flag</span>Escalate</Btn>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Navigation Config ───────────────────────────────────────── */
const NAV = [
  { id:'dashboard',      label:'Dashboard',               icon:'dashboard' },
  { id:'urge',           label:'Urge Queue',               icon:'priority_high' },
  { id:'routes',         label:'Route Planner',            icon:'route' },
  { id:'vehicles',       label:'Vehicle Capacity',         icon:'local_shipping' },
  { id:'stock',          label:'Stock Distribution',       icon:'inventory_2' },
  { id:'interbranch',    label:'Inter-Branch Requests',    icon:'swap_horiz' },
  { id:'qrdispatch',     label:'QR Dispatch',              icon:'qr_code_scanner' },
  { id:'damage',         label:'Damage Tickets',           icon:'report_problem' },
  { id:'cashcollection', label:'Driver Cash Collection',   icon:'payments' },
  { id:'reconciliation', label:'Accountant Reconciliation',icon:'account_balance' },
  { id:'bonus',          label:'Driver Bonus',             icon:'emoji_events' },
  { id:'ratings',        label:'Customer Rating',          icon:'star_rate' },
];

/* ─── Main Layout ─────────────────────────────────────────────── */
export default function LogiqBrain() {
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');

  /* Shared state — interconnected across all modules */
  const [pendingOrders,    setPendingOrders]   = useState(INIT_PENDING_ORDERS);
  const [routes,           setRoutes]          = useState(INIT_ROUTES);
  const [branchInventory,  setBranchInventory] = useState(INIT_BRANCH_INVENTORY);
  const [branchRequests,   setBranchRequests]  = useState(INIT_BRANCH_REQUESTS);
  const [damageTickets,    setDamageTickets]   = useState(INIT_DAMAGE);
  const [codList,          setCodList]         = useState(INIT_COD);
  const [dispatchLog,      setDispatchLog]     = useState(INIT_DISPATCH_LOG);
  const [ratings,          setRatings]         = useState(INIT_RATINGS);

  /* Fetch real orders from database and merge into the Urge Queue */
  useEffect(() => {
    const LIVE_STATUSES = ['ORDER_CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH'];
    getAllOrders()
      .then(res => {
        const data = Array.isArray(res?.data) ? res.data : [];
        const liveOrders = data
          .filter(o => LIVE_STATUSES.includes(o.status))
          .map(o => {
            const itemCount = Object.values(o.items || {}).reduce((s, q) => s + q, 0);
            const createdAt = o.createdAt ? new Date(o.createdAt) : new Date();
            const ageInDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
            const urgency = ageInDays >= 3 ? 'Critical' : ageInDays >= 2 ? 'High' : ageInDays >= 1 ? 'Medium' : 'Low';
            const itemList = Object.entries(o.items || {}).map(([productId, qty]) => ({
              name: `Product #${productId}`, qty, price: Math.round((o.total || 0) / Math.max(1, itemCount)),
            }));
            return {
              id: `#ORD-${String(o.id).padStart(4, '0')}`,
              orderId: o.id,
              customer: o.customerName || 'Customer',
              phone: o.phoneNumber || '—',
              address: o.address || '—',
              items: itemList,
              total: Number(o.total) || 0,
              weightKg: Math.max(5, itemCount * 12),
              distanceKm: 10,
              urgentFlag: ageInDays >= 2,
              deadlineDays: Math.max(0, 3 - ageInDays),
              orderAge: ageInDays,
              urgency,
              driver: 'Unassigned',
              status: 'Pending',
              route: null,
              isReal: true,
            };
          });

        if (liveOrders.length > 0) {
          setPendingOrders(prev => {
            const realIds = new Set(liveOrders.map(o => o.id));
            const demoOrders = prev.filter(o => !o.isReal && !realIds.has(o.id));
            return [...liveOrders, ...demoOrders];
          });
        }
      })
      .catch(() => {});
  }, []);

  const sharedProps = {
    pendingOrders, setPendingOrders,
    routes, setRoutes,
    branchInventory, setBranchInventory,
    branchRequests, setBranchRequests,
    damageTickets, setDamageTickets,
    codList, setCodList,
    dispatchLog, setDispatchLog,
    ratings, setRatings,
  };

  const VIEWS = {
    dashboard:      () => <DashboardView routes={routes} pendingOrders={pendingOrders} damageTickets={damageTickets} codList={codList} />,
    urge:           () => <UrgeQueueView pendingOrders={pendingOrders} setPendingOrders={setPendingOrders} />,
    routes:         () => <RoutePlannerView routes={routes} setRoutes={setRoutes} pendingOrders={pendingOrders} setPendingOrders={setPendingOrders} />,
    vehicles:       () => <VehicleCapacityView pendingOrders={pendingOrders} />,
    stock:          () => <StockDistributionView branchInventory={branchInventory} setBranchInventory={setBranchInventory} />,
    interbranch:    () => <InterBranchView requests={branchRequests} setRequests={setBranchRequests} branchInventory={branchInventory} setBranchInventory={setBranchInventory} />,
    qrdispatch:     () => <QRDispatchView pendingOrders={pendingOrders} setPendingOrders={setPendingOrders} dispatchLog={dispatchLog} setDispatchLog={setDispatchLog} />,
    damage:         () => <DamageTicketsView tickets={damageTickets} setTickets={setDamageTickets} />,
    cashcollection: () => <CashCollectionView codList={codList} setCodList={setCodList} damageTickets={damageTickets} />,
    reconciliation: () => <ReconciliationView codList={codList} setCodList={setCodList} />,
    bonus:          () => <DriverBonusView damageTickets={damageTickets} dispatchLog={dispatchLog} ratings={ratings} />,
    ratings:        () => <CustomerRatingView ratings={ratings} setRatings={setRatings} />,
  };

  const ActiveView = VIEWS[active];

  return (
    <div className="flex h-screen bg-[#f0f4ff] overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-[#0f1729] flex flex-col overflow-y-auto">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base">psychology</span>
            </div>
            <span className="text-white font-extrabold text-base tracking-tight">LogiQ Brain</span>
          </div>
          <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-widest">Smart Delivery Tracker</p>
        </div>
        <div className="px-4 pt-4">
          <button onClick={()=>navigate('/admin')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Admin Portal
          </button>
        </div>
        <nav className="flex-1 px-4 py-3 space-y-0.5">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setActive(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${active===n.id?'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-900/50':'text-white/55 hover:text-white/90 hover:bg-white/[0.08]'}`}>
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">{n.icon}</span>
              <span className="truncate">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] text-white/30 text-center">Mangala Showroom · LogiQ v2.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <ActiveView />
        </div>
      </main>
    </div>
  );
}
