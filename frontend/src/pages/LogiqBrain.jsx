import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Constants ───────────────────────────────────────────────── */
const BASE_DELIVERY_RATE = 50;
const PENALTY_PER_TICKET = 500;

/* ─── Priority Score Engine ───────────────────────────────────── */
function calcPriorityScore(order) {
  const urgentBonus   = order.urgentFlag ? 50 : 0;
  const deadlineScore = Math.max(0, (5 - order.deadlineDays) * 15);
  const ageScore      = Math.min(order.orderAge * 2, 20);
  return urgentBonus + deadlineScore + ageScore;
}

/* ─── Bonus Calculator ────────────────────────────────────────── */
function calcBonus(driver, damageTickets) {
  const penalties = damageTickets.filter(t => t.driver === driver.name && t.status !== 'Resolved').length * PENALTY_PER_TICKET;
  const raw = (driver.deliveries * BASE_DELIVERY_RATE) * (driver.rating / 5.0);
  return Math.max(0, Math.round(raw - penalties));
}

/* ─── Mock Data ───────────────────────────────────────────────── */
const INIT_URGE = [
  { id: '#ORD-1042', customer: 'Dr. Priya Nair',      address: '45 Galle Rd, Colombo 3',      urgentFlag: true,  deadlineDays: 0, orderAge: 3, urgency: 'Critical', driver: 'Unassigned',    eta: 'Overdue',  items: 3, weightKg: 185 },
  { id: '#ORD-1039', customer: 'Ravi Wickramasinghe', address: '12 Kandy Rd, Nugegoda',        urgentFlag: true,  deadlineDays: 1, orderAge: 2, urgency: 'High',     driver: 'Kamal Perera',  eta: '35 min',   items: 1, weightKg: 42  },
  { id: '#ORD-1051', customer: 'Sunitha Mendis',      address: '8 Temple Rd, Dehiwala',        urgentFlag: true,  deadlineDays: 1, orderAge: 4, urgency: 'High',     driver: 'Unassigned',    eta: 'Overdue',  items: 2, weightKg: 120 },
  { id: '#ORD-1067', customer: 'Fathima Ismail',      address: '23 Main St, Pettah',           urgentFlag: false, deadlineDays: 3, orderAge: 1, urgency: 'Medium',   driver: 'Suresh Kumar',  eta: '1h 20m',   items: 1, weightKg: 28  },
  { id: '#ORD-1070', customer: 'Mr. Gayan Dias',      address: '77 Sea View Ave, Mt. Lavinia', urgentFlag: false, deadlineDays: 3, orderAge: 2, urgency: 'Medium',   driver: 'Unassigned',    eta: '2h',       items: 4, weightKg: 310 },
];

const VEHICLES = [
  { id: 'WP CAB-1234', type: 'Lorry',    maxKg: 3000, loadKg: 2400, driver: 'Kamal Perera',    fuel: 72, status: 'On Route' },
  { id: 'WP CB-5678',  type: 'Van',      maxKg: 1200, loadKg: 0,    driver: 'Nimal Silva',     fuel: 88, status: 'Available' },
  { id: 'CP KA-9012',  type: 'Van',      maxKg: 1200, loadKg: 950,  driver: 'Suresh Kumar',    fuel: 45, status: 'On Route' },
  { id: 'WP LA-3456',  type: 'Lorry',   maxKg: 3000, loadKg: 0,    driver: 'Roshan Fernando', fuel: 61, status: 'Idle' },
  { id: 'SP PA-7890',  type: 'Motorbike',maxKg: 80,   loadKg: 0,    driver: 'Amara Bandara',   fuel: 95, status: 'Available' },
  { id: 'WP MA-2211',  type: 'Van',      maxKg: 1200, loadKg: 0,    driver: '—',               fuel: 20, status: 'Maintenance' },
];

const DRIVERS = [
  { id: 'D001', name: 'Kamal Perera',    vehicle: 'WP CAB-1234', rating: 4.8, deliveries: 312, onTime: 96, tier: 'Gold',   status: 'On Route' },
  { id: 'D002', name: 'Nimal Silva',     vehicle: 'WP CB-5678',  rating: 4.5, deliveries: 278, onTime: 91, tier: 'Silver', status: 'Available' },
  { id: 'D003', name: 'Suresh Kumar',    vehicle: 'CP KA-9012',  rating: 4.2, deliveries: 195, onTime: 87, tier: 'Bronze', status: 'On Route' },
  { id: 'D004', name: 'Roshan Fernando', vehicle: 'WP LA-3456',  rating: 4.9, deliveries: 401, onTime: 98, tier: 'Gold',   status: 'Off Duty' },
  { id: 'D005', name: 'Amara Bandara',   vehicle: 'SP PA-7890',  rating: 4.0, deliveries: 143, onTime: 83, tier: 'Bronze', status: 'Available' },
];

const BRANCHES = [
  { name: 'Colombo HQ',    products: 142, lowStock: 4,  waitlist: 12, velocity: 8, reorderPending: 2, lastTransfer: '2h ago',  status: 'Healthy' },
  { name: 'Kandy Branch',  products: 87,  lowStock: 11, waitlist: 30, velocity: 5, reorderPending: 5, lastTransfer: '1d ago',  status: 'Warning' },
  { name: 'Galle Branch',  products: 63,  lowStock: 2,  waitlist: 5,  velocity: 3, reorderPending: 0, lastTransfer: '4h ago',  status: 'Healthy' },
  { name: 'Jaffna Outlet', products: 41,  lowStock: 18, waitlist: 45, velocity: 4, reorderPending: 8, lastTransfer: '3d ago',  status: 'Critical' },
  { name: 'Negombo Store', products: 55,  lowStock: 3,  waitlist: 8,  velocity: 6, reorderPending: 1, lastTransfer: '6h ago',  status: 'Healthy' },
];

const INIT_BRANCH_REQUESTS = [
  { id: 'IBR-001', from: 'Kandy Branch',   to: 'Colombo HQ',    items: 'Teak Dining Set x2',  qty: 2, status: 'PENDING_APPROVAL', date: 'Apr 25' },
  { id: 'IBR-002', from: 'Jaffna Outlet',  to: 'Colombo HQ',    items: 'Samsung 65" QLED x3', qty: 3, status: 'IN_TRANSIT',       date: 'Apr 24' },
  { id: 'IBR-003', from: 'Colombo HQ',     to: 'Galle Branch',  items: 'Velvet Sofa Set x1',  qty: 1, status: 'DELIVERED',        date: 'Apr 24' },
  { id: 'IBR-004', from: 'Negombo Store',  to: 'Kandy Branch',  items: 'Office Chair x6',     qty: 6, status: 'DELIVERED',        date: 'Apr 23' },
  { id: 'IBR-005', from: 'Jaffna Outlet',  to: 'Negombo Store', items: 'Bookshelf Oak x4',    qty: 4, status: 'PENDING_APPROVAL', date: 'Apr 25' },
];

const INIT_DAMAGE = [
  { id: 'DT-101', order: '#ORD-0987', driver: 'Suresh Kumar',    item: 'Glass Coffee Table',  type: 'Shattered',   severity: 'High',    claim: 28500, status: 'OPEN',        imageUrl: null },
  { id: 'DT-102', order: '#ORD-1012', driver: 'Nimal Silva',     item: 'Leather Sofa Corner', type: 'Scratched',   severity: 'Low',     claim: 4200,  status: 'Resolved',    imageUrl: null },
  { id: 'DT-103', order: '#ORD-1034', driver: 'Amara Bandara',   item: 'LG 55" OLED TV',      type: 'Screen Crack',severity: 'Critical',claim: 87000, status: 'QUARANTINED', imageUrl: null },
  { id: 'DT-104', order: '#ORD-1038', driver: 'Kamal Perera',    item: 'Teak Wardrobe Door',  type: 'Broken Hinge',severity: 'Medium',  claim: 6500,  status: 'OPEN',        imageUrl: null },
  { id: 'DT-105', order: '#ORD-1055', driver: 'Roshan Fernando', item: 'Dining Chair x2',     type: 'Leg Snapped', severity: 'Medium',  claim: 9800,  status: 'Resolved',    imageUrl: null },
];

const INIT_COD = [
  { driver: 'Kamal Perera',    orders: 8, collected: 124500, deposited: 124500, pending: 0,     status: 'Reconciled', signature: null },
  { driver: 'Nimal Silva',     orders: 5, collected: 67200,  deposited: 50000,  pending: 17200, status: 'Pending',    signature: null },
  { driver: 'Suresh Kumar',    orders: 6, collected: 89400,  deposited: 0,      pending: 89400, status: 'Overdue',    signature: null },
  { driver: 'Roshan Fernando', orders: 9, collected: 210000, deposited: 210000, pending: 0,     status: 'Reconciled', signature: null },
  { driver: 'Amara Bandara',   orders: 3, collected: 14700,  deposited: 14700,  pending: 0,     status: 'Reconciled', signature: null },
];

const ROUTE_DETAILS = {
  'RT-01': { stops: [{ addr:'Bambalapitiya',km:3.2,min:12},{ addr:'Wellawatta',km:2.1,min:9},{ addr:'Dehiwala',km:4.5,min:18},{ addr:'Mt. Lavinia',km:3.0,min:14},{ addr:'Ratmalana',km:3.8,min:16},{ addr:'Moratuwa',km:4.2,min:17},{ addr:'Panadura',km:6.0,min:22},{ addr:'Kalutara',km:12.0,min:35}] },
  'RT-02': { stops: [{ addr:'Kadawatha',km:8.5,min:28},{ addr:'Kiribathgoda',km:5.2,min:19},{ addr:'Yakkala',km:7.0,min:24},{ addr:'Gampaha',km:9.5,min:32},{ addr:'Kandy',km:72.0,min:135}] },
  'RT-03': { stops: [{ addr:'Kohuwala',km:2.5,min:10},{ addr:'Nugegoda',km:1.8,min:8},{ addr:'Maharagama',km:3.5,min:14},{ addr:'Kottawa',km:4.0,min:16},{ addr:'Piliyandala',km:3.2,min:12},{ addr:'Kesbewa',km:2.8,min:11}] },
  'RT-04': { stops: [{ addr:'Ratmalana',km:4.5,min:18},{ addr:'Mt. Lavinia',km:2.0,min:9},{ addr:'Dehiwala',km:3.5,min:14}] },
  'RT-05': { stops: [{ addr:'Wattala',km:9.0,min:30},{ addr:'Ja-Ela',km:6.5,min:22},{ addr:'Seeduwa',km:4.5,min:17},{ addr:'Katunayake',km:5.0,min:18},{ addr:'Negombo',km:8.5,min:28},{ addr:'Marawila',km:18.0,min:42},{ addr:'Chilaw',km:14.0,min:35}] },
};

const INIT_ROUTES = [
  { id: 'RT-01', name: 'Colombo South Loop',   driver: 'Kamal Perera',    vehicle: 'WP CAB-1234', status: 'In Progress', completed: 3 },
  { id: 'RT-02', name: 'Kandy Corridor',        driver: 'Suresh Kumar',    vehicle: 'CP KA-9012',  status: 'In Progress', completed: 2 },
  { id: 'RT-03', name: 'Nugegoda Cluster',      driver: 'Nimal Silva',     vehicle: 'WP CB-5678',  status: 'Planned',     completed: 0 },
  { id: 'RT-04', name: 'Mount Lavinia Express', driver: 'Amara Bandara',   vehicle: 'SP PA-7890',  status: 'Planned',     completed: 0 },
  { id: 'RT-05', name: 'Negombo North Run',     driver: 'Roshan Fernando', vehicle: 'WP LA-3456',  status: 'Completed',   completed: 7 },
];

const RATINGS = [
  { order: '#ORD-1028', customer: 'Priya Nair',         driver: 'Kamal Perera',    rating: 5, comment: 'Arrived on time, very careful with the furniture.', date: 'Apr 25', replied: true },
  { order: '#ORD-1031', customer: 'Ravi Wickramasinghe',driver: 'Nimal Silva',     rating: 3, comment: 'Late by 2 hours, no call.', date: 'Apr 25', replied: false },
  { order: '#ORD-1019', customer: 'Sunitha Mendis',     driver: 'Suresh Kumar',    rating: 4, comment: 'Good service, minor damage on packaging.', date: 'Apr 24', replied: true },
  { order: '#ORD-1044', customer: 'Fathima Ismail',     driver: 'Roshan Fernando', rating: 5, comment: 'Excellent! Professional and fast.', date: 'Apr 24', replied: false },
  { order: '#ORD-1052', customer: 'Gayan Dias',         driver: 'Amara Bandara',   rating: 2, comment: 'Item wrong, had to wait 3 days for replacement.', date: 'Apr 23', replied: false },
];

/* ─── Helper UI Components ────────────────────────────────────── */
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
    <div>
      <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex gap-2">{action}</div>}
  </div>
);

const Alert = ({ type, children }) => {
  const s = { warning:'bg-orange-50 border-orange-300 text-orange-800', error:'bg-red-50 border-red-300 text-red-800', success:'bg-green-50 border-green-300 text-green-700', info:'bg-indigo-50 border-indigo-300 text-indigo-800' };
  const icons = { warning:'warning', error:'error', success:'check_circle', info:'info' };
  return <div className={`flex items-start gap-2 border rounded-lg px-4 py-3 text-sm font-medium ${s[type]}`}><span className="material-symbols-outlined text-base mt-0.5">{icons[type]}</span><span>{children}</span></div>;
};

/* ─── Score Bar ────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════ */
/*  SECTION VIEWS                                                  */
/* ═══════════════════════════════════════════════════════════════ */

/* 1. Dashboard ────────────────────────────────────────────────── */
function DashboardView({ routes, branchRequests, damageTickets, codList }) {
  const overdueCount = INIT_URGE.filter(o => o.eta === 'Overdue').length;
  const pendingCod   = codList.filter(c => c.status !== 'Reconciled').length;
  return (
    <div>
      <SectionHeader title="LogiQ Brain Overview" subtitle="Live logistics intelligence · April 25, 2026" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="local_shipping" label="Active Deliveries" value="14" sub={`${overdueCount} overdue`} color="indigo" />
        <StatCard icon="directions_car"  label="Vehicles On Road" value={VEHICLES.filter(v=>v.status==='On Route').length} sub="6 total fleet" color="sky" />
        <StatCard icon="person_pin_circle" label="Drivers Active"  value={DRIVERS.filter(d=>d.status==='On Route').length} sub={`${DRIVERS.filter(d=>d.status==='Available').length} available`} color="green" />
        <StatCard icon="payments"        label="Today's COD"    value="Rs. 184,600" sub={`${pendingCod} undeposited`} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Top Priority Orders</h3>
            <Badge label="Live" color="green" />
          </div>
          <table className="w-full">
            <thead><tr>{['Order','Customer','Score','Status'].map(h=><Th key={h} ch={h} />)}</tr></thead>
            <tbody>
              {[...INIT_URGE].sort((a,b)=>calcPriorityScore(b)-calcPriorityScore(a)).slice(0,5).map(o=>(
                <tr key={o.id} className="hover:bg-gray-50">
                  <Td><span className="font-mono font-bold text-indigo-600">{o.id}</span></Td>
                  <Td>{o.customer}</Td>
                  <Td><ScoreBar score={calcPriorityScore(o)} /></Td>
                  <Td><Badge label={o.urgency} color={o.urgency==='Critical'?'red':o.urgency==='High'?'orange':'yellow'} /></Td>
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
            <p className="text-3xl font-extrabold mb-1">{INIT_URGE.filter(o=>o.urgentFlag).length}</p>
            <p className="text-sm opacity-80">Critical/High orders needing immediate action</p>
            <div className="mt-3 flex gap-2">
              <Badge label="1 Critical" color="red" />
              <Badge label="2 High" color="orange" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 2. Urge Queue ────────────────────────────────────────────────── */
function UrgeQueueView() {
  const [queue, setQueue] = useState(() =>
    [...INIT_URGE].map(o => ({ ...o, score: calcPriorityScore(o) })).sort((a,b)=>b.score-a.score)
  );
  const [assignModal, setAssignModal] = useState(null);
  const [pickedDriver, setPickedDriver] = useState('');

  function assign() {
    if (!pickedDriver) return;
    setQueue(q => q.map(o => o.id === assignModal ? { ...o, driver: pickedDriver } : o));
    setAssignModal(null); setPickedDriver('');
  }
  function dispatch(id) {
    setQueue(q => q.map(o => o.id === id ? { ...o, eta: 'Dispatched ✓', urgency: 'Dispatched' } : o));
  }

  return (
    <div>
      <SectionHeader title="Urge Queue" subtitle="Sorted by priority score — highest first"
        action={<><span className="text-xs text-gray-400 font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">Score = urgent(50) + deadline(0–75) + age(0–20)</span></>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-red-600">{queue.filter(o=>o.urgency==='Critical').length}</p><p className="text-xs text-red-500 font-semibold mt-1">Critical</p></div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-orange-500">{queue.filter(o=>o.urgency==='High').length}</p><p className="text-xs text-orange-500 font-semibold mt-1">High Priority</p></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-yellow-600">{queue.filter(o=>o.urgency==='Medium').length}</p><p className="text-xs text-yellow-600 font-semibold mt-1">Medium</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['Order','Customer','Address','Priority Score','Urgency','Driver','ETA','Actions'].map(h=><Th key={h} ch={h} />)}</tr></thead>
          <tbody>
            {queue.map(o => (
              <tr key={o.id} className={`hover:bg-gray-50 ${o.urgency==='Critical'?'bg-red-50/30':''}`}>
                <Td><span className="font-mono font-bold text-indigo-600">{o.id}</span></Td>
                <Td>{o.customer}</Td>
                <Td className="max-w-[160px] truncate">{o.address}</Td>
                <Td><ScoreBar score={o.score} /></Td>
                <Td><Badge label={o.urgency} color={o.urgency==='Critical'?'red':o.urgency==='High'?'orange':o.urgency==='Medium'?'yellow':'green'} /></Td>
                <Td><span className={o.driver==='Unassigned'?'text-red-500 font-semibold':''}>{o.driver}</span></Td>
                <Td><span className={o.eta==='Overdue'?'text-red-600 font-bold':''}>{o.eta}</span></Td>
                <Td>
                  <div className="flex gap-1">
                    {o.driver==='Unassigned' && <Btn variant="success" small onClick={()=>setAssignModal(o.id)}>Assign</Btn>}
                    {o.urgency!=='Dispatched' && <Btn variant="outline" small onClick={()=>dispatch(o.id)}>Dispatch</Btn>}
                    {o.urgency==='Critical' && <Btn variant="danger" small>Escalate</Btn>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Assign Driver to {assignModal}</h3>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" value={pickedDriver} onChange={e=>setPickedDriver(e.target.value)}>
              <option value="">Select driver…</option>
              {DRIVERS.filter(d=>d.status==='Available').map(d=><option key={d.id} value={d.name}>{d.name} ({d.vehicle})</option>)}
            </select>
            <div className="flex gap-2">
              <Btn onClick={assign} disabled={!pickedDriver}>Confirm</Btn>
              <Btn variant="ghost" onClick={()=>setAssignModal(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 3. Route Planner ─────────────────────────────────────────────── */
function RoutePlannerView() {
  const [routes, setRoutes] = useState(INIT_ROUTES);
  const [expanded, setExpanded] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newRoute, setNewRoute] = useState({ name:'', driver:'', vehicle:'' });

  function advance(id) {
    setRoutes(rs => rs.map(r => {
      if (r.id !== id) return r;
      const stops = ROUTE_DETAILS[r.id]?.stops.length || 0;
      const next = r.completed + 1;
      return { ...r, completed: Math.min(next, stops), status: next >= stops ? 'Completed' : 'In Progress' };
    }));
  }

  function createRoute() {
    if (!newRoute.name || !newRoute.driver) return;
    const id = `RT-0${routes.length+1}`;
    setRoutes(rs => [...rs, { id, ...newRoute, status:'Planned', completed:0 }]);
    setShowNew(false); setNewRoute({ name:'', driver:'', vehicle:'' });
  }

  return (
    <div>
      <SectionHeader title="Route Planner" subtitle="Mock distance/time per stop — no external maps needed"
        action={<Btn onClick={()=>setShowNew(!showNew)}><span className="material-symbols-outlined text-sm">add_road</span>Create Route</Btn>}
      />
      {showNew && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-indigo-800 mb-3">New Route</h3>
          <div className="grid grid-cols-3 gap-3">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Route name" value={newRoute.name} onChange={e=>setNewRoute(n=>({...n,name:e.target.value}))} />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newRoute.driver} onChange={e=>setNewRoute(n=>({...n,driver:e.target.value}))}>
              <option value="">Assign driver…</option>
              {DRIVERS.map(d=><option key={d.id}>{d.name}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={newRoute.vehicle} onChange={e=>setNewRoute(n=>({...n,vehicle:e.target.value}))}>
              <option value="">Assign vehicle…</option>
              {VEHICLES.map(v=><option key={v.id}>{v.id}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3"><Btn onClick={createRoute}>Save Route</Btn><Btn variant="ghost" onClick={()=>setShowNew(false)}>Cancel</Btn></div>
        </div>
      )}
      <div className="space-y-3">
        {routes.map(r => {
          const detail  = ROUTE_DETAILS[r.id];
          const stops   = detail?.stops.length || 0;
          const totalKm = detail?.stops.reduce((s,st)=>s+st.km,0).toFixed(1) || '—';
          const totalMin= detail?.stops.reduce((s,st)=>s+st.min,0) || 0;
          const stColor = { 'In Progress':'blue', Planned:'indigo', Completed:'green' };
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"><span className="material-symbols-outlined text-indigo-600 text-lg">route</span></span>
                    <div><p className="font-bold text-gray-800">{r.name}</p><p className="text-xs text-gray-400">{r.id} · {r.vehicle}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={r.status} color={stColor[r.status]} />
                    {detail && <Btn variant="ghost" small onClick={()=>setExpanded(expanded===r.id?null:r.id)}><span className="material-symbols-outlined text-sm">{expanded===r.id?'expand_less':'expand_more'}</span>Stops</Btn>}
                    {r.status!=='Completed' && <Btn variant="success" small onClick={()=>advance(r.id)}><span className="material-symbols-outlined text-sm">check</span>Mark Stop Done</Btn>}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3 text-center bg-gray-50 rounded-lg p-3">
                  <div><p className="text-xs text-gray-400 font-semibold">Driver</p><p className="text-sm font-bold text-gray-700 mt-0.5">{r.driver}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Stops</p><p className="text-sm font-bold text-gray-700 mt-0.5">{stops||'—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Done</p><p className="text-sm font-bold text-green-600 mt-0.5">{r.completed}/{stops||'—'}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Distance</p><p className="text-sm font-bold text-gray-700 mt-0.5">{totalKm} km</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Est. Time</p><p className="text-sm font-bold text-gray-700 mt-0.5">{totalMin?`${Math.floor(totalMin/60)}h ${totalMin%60}m`:'—'}</p></div>
                </div>
                {stops > 0 && <div className="mt-3"><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${(r.completed/stops)*100}%`}} /></div></div>}
              </div>
              {expanded===r.id && detail && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  <table className="w-full mt-3">
                    <thead><tr>{['#','Stop','Distance','Est. Time','Status'].map(h=><Th key={h} ch={h} />)}</tr></thead>
                    <tbody>
                      {detail.stops.map((s,i)=>(
                        <tr key={i} className="hover:bg-gray-50">
                          <Td>{i+1}</Td><Td>{s.addr}</Td>
                          <Td>{s.km} km</Td><Td>{s.min} min</Td>
                          <Td><Badge label={i<r.completed?'Done':i===r.completed&&r.status!=='Completed'?'Current':'Pending'} color={i<r.completed?'green':i===r.completed&&r.status!=='Completed'?'blue':'gray'} /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 4. Vehicle Capacity ──────────────────────────────────────────── */
function VehicleCapacityView() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedOrders, setSelectedOrders]   = useState([]);

  const pendingOrders = INIT_URGE.map(o => ({ id: o.id, customer: o.customer, weightKg: o.weightKg }));
  const vehicle = VEHICLES.find(v=>v.id===selectedVehicle);
  const totalSelected = selectedOrders.reduce((s,id)=>{ const o=pendingOrders.find(p=>p.id===id); return s+(o?.weightKg||0); },0);
  const capacityUsed  = vehicle ? vehicle.loadKg + totalSelected : 0;
  const maxCap        = vehicle?.maxKg || 0;
  const exceeded      = capacityUsed > maxCap;
  const pct           = maxCap ? Math.min(100, Math.round((capacityUsed/maxCap)*100)) : 0;

  function toggle(id) {
    setSelectedOrders(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  }

  return (
    <div>
      <SectionHeader title="Vehicle Capacity Planner" subtitle="Select a vehicle and orders to check load before dispatch" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">1. Select Vehicle</h3>
          <div className="space-y-2">
            {VEHICLES.filter(v=>v.status!=='Maintenance').map(v=>(
              <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedVehicle===v.id?'border-indigo-400 bg-indigo-50':'border-gray-100 hover:border-gray-300'}`}>
                <input type="radio" name="vehicle" value={v.id} checked={selectedVehicle===v.id} onChange={()=>setSelectedVehicle(v.id)} className="accent-indigo-600" />
                <span className="material-symbols-outlined text-indigo-500">local_shipping</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{v.id} <span className="text-xs text-gray-400">({v.type})</span></p>
                  <p className="text-xs text-gray-400">Capacity: {v.maxKg.toLocaleString()} kg · Current load: {v.loadKg} kg · Driver: {v.driver}</p>
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
              {pendingOrders.map(o=>(
                <label key={o.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedOrders.includes(o.id)?'border-indigo-400 bg-indigo-50':'border-gray-100 hover:border-gray-200'}`}>
                  <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={()=>toggle(o.id)} className="accent-indigo-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{o.id} — {o.customer}</p>
                    <p className="text-xs text-gray-400">{o.weightKg} kg</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">3. Capacity Check</h3>
            {!vehicle ? (
              <Alert type="info">Select a vehicle above to see capacity analysis.</Alert>
            ) : (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Total load after adding selected orders</span>
                  <span className={`font-bold ${exceeded?'text-red-600':'text-gray-800'}`}>{capacityUsed.toLocaleString()} / {maxCap.toLocaleString()} kg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${exceeded?'bg-red-500':pct>80?'bg-orange-400':'bg-green-500'}`} style={{width:`${pct}%`}} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg p-2"><p className="text-xs text-gray-400 font-semibold">Existing load</p><p className="font-bold">{vehicle.loadKg} kg</p></div>
                  <div className="bg-indigo-50 rounded-lg p-2"><p className="text-xs text-gray-400 font-semibold">New orders</p><p className="font-bold text-indigo-600">{totalSelected} kg</p></div>
                  <div className={`rounded-lg p-2 ${exceeded?'bg-red-50':'bg-green-50'}`}><p className="text-xs text-gray-400 font-semibold">Remaining</p><p className={`font-bold ${exceeded?'text-red-600':'text-green-600'}`}>{exceeded?`−${(capacityUsed-maxCap)}`:`${(maxCap-capacityUsed)}`} kg</p></div>
                </div>
                {exceeded ? <Alert type="error">Capacity exceeded by {(capacityUsed-maxCap).toLocaleString()} kg. Remove orders or choose a larger vehicle.</Alert>
                          : <Alert type="success">{pct}% utilisation — safe to dispatch.</Alert>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. Stock Distribution ────────────────────────────────────────── */
function StockDistributionView() {
  const SHIPMENT_QTY = 100;
  function suggest() {
    const totalWeight = BRANCHES.reduce((s,b)=>s+b.waitlist+b.velocity,0);
    return BRANCHES.map(b => ({ name:b.name, value: Math.round(((b.waitlist+b.velocity)/totalWeight)*SHIPMENT_QTY) }));
  }
  const [allocs, setAllocs] = useState(suggest);
  const [saved,  setSaved]  = useState(false);
  const total = allocs.reduce((s,a)=>s+Number(a.value),0);
  const isValid = total === SHIPMENT_QTY;

  function update(name, val) {
    setAllocs(a => a.map(x => x.name===name ? { ...x, value:Math.max(0,Number(val)||0) } : x));
    setSaved(false);
  }
  function reset() { setAllocs(suggest()); setSaved(false); }

  const sc = { Healthy:'green', Warning:'yellow', Critical:'red' };
  return (
    <div>
      <SectionHeader title="Stock Distribution" subtitle={`Shipment: ${SHIPMENT_QTY} units — allocate across branches`}
        action={<><Btn variant="ghost" onClick={reset}>Reset to Suggested</Btn><Btn onClick={()=>isValid&&setSaved(true)} disabled={!isValid}>Apply Allocation</Btn></>}
      />
      {saved && <div className="mb-4"><Alert type="success">Allocation saved! {SHIPMENT_QTY} units distributed across {BRANCHES.length} branches.</Alert></div>}
      {!isValid && <div className="mb-4"><Alert type="warning">Total allocated: {total} / {SHIPMENT_QTY} — must equal exactly {SHIPMENT_QTY}. Difference: {total>SHIPMENT_QTY?`+${total-SHIPMENT_QTY}`:`−${SHIPMENT_QTY-total}`} units.</Alert></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BRANCHES.map((b,i) => {
          const a = allocs[i];
          const suggested = suggest()[i].value;
          const pct = Math.round((a.value/SHIPMENT_QTY)*100);
          return (
            <div key={b.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-indigo-500">store</span><h3 className="font-bold text-gray-800">{b.name}</h3></div>
                <Badge label={b.status} color={sc[b.status]} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mb-4">
                <div className="bg-gray-50 rounded-lg p-2"><p className="text-sm font-extrabold">{b.waitlist}</p><p className="text-[10px] text-gray-400 font-semibold uppercase">Waitlist</p></div>
                <div className="bg-gray-50 rounded-lg p-2"><p className="text-sm font-extrabold">{b.velocity}/day</p><p className="text-[10px] text-gray-400 font-semibold uppercase">Velocity</p></div>
              </div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-1">Allocate (suggested: {suggested} units)</label>
              <input type="number" min="0" max={SHIPMENT_QTY} value={a.value} onChange={e=>update(b.name,e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-lg font-bold text-center transition-colors ${!isValid&&a.value>0?'border-orange-300':'border-gray-200'}`}
              />
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{pct}% of shipment</span><span>{a.value} units</span></div>
                <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}} /></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <span className="material-symbols-outlined text-indigo-500">summarize</span>
        <p className="text-sm font-semibold text-gray-700">Total allocated: <span className={`font-extrabold ${isValid?'text-green-600':'text-red-500'}`}>{total}</span> / {SHIPMENT_QTY}</p>
        {isValid && <Badge label="Ready to dispatch" color="green" />}
      </div>
    </div>
  );
}

/* 6. Inter-Branch Requests ─────────────────────────────────────── */
const STATUS_FLOW = { 'PENDING_APPROVAL': 'IN_TRANSIT', 'IN_TRANSIT': 'DELIVERED' };
const STATUS_LABELS = { 'PENDING_APPROVAL':'Pending Approval', 'IN_TRANSIT':'In Transit', 'DELIVERED':'Delivered' };
const STATUS_COLORS = { 'PENDING_APPROVAL':'yellow', 'IN_TRANSIT':'blue', 'DELIVERED':'green' };

function InterBranchView({ requests, setRequests }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from:'', to:'', items:'', qty:1 });
  const [note, setNote] = useState('');

  function advance(id) {
    setRequests(rs => rs.map(r => r.id===id && STATUS_FLOW[r.status] ? { ...r, status: STATUS_FLOW[r.status] } : r));
  }
  function reject(id) {
    setRequests(rs => rs.filter(r => r.id!==id));
    setNote(`Request ${id} rejected.`);
    setTimeout(()=>setNote(''),3000);
  }
  function create() {
    if (!form.from || !form.to || !form.items) return;
    const id = `IBR-${String(requests.length+1).padStart(3,'0')}`;
    setRequests(rs => [{ id, ...form, status:'PENDING_APPROVAL', date:'Apr 25' }, ...rs]);
    setForm({ from:'', to:'', items:'', qty:1 }); setShowForm(false);
    setNote(`${id} created — awaiting approval.`);
    setTimeout(()=>setNote(''),3000);
  }
  const branchNames = BRANCHES.map(b=>b.name);

  return (
    <div>
      <SectionHeader title="Inter-Branch Requests" subtitle="PENDING_APPROVAL → IN_TRANSIT → DELIVERED"
        action={<Btn onClick={()=>setShowForm(!showForm)}><span className="material-symbols-outlined text-sm">swap_horiz</span>New Request</Btn>}
      />
      {note && <div className="mb-4"><Alert type="info">{note}</Alert></div>}
      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-indigo-800 mb-3">Create Inter-Branch Request</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">From Branch</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.from} onChange={e=>setForm(f=>({...f,from:e.target.value}))}>
                <option value="">Select…</option>{branchNames.map(b=><option key={b}>{b}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">To Branch</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.to} onChange={e=>setForm(f=>({...f,to:e.target.value}))}>
                <option value="">Select…</option>{branchNames.map(b=><option key={b}>{b}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Item Description</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Teak Sofa x2" value={form.items} onChange={e=>setForm(f=>({...f,items:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Quantity</label>
              <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.qty} onChange={e=>setForm(f=>({...f,qty:Number(e.target.value)}))} /></div>
          </div>
          <div className="flex gap-2"><Btn onClick={create}>Submit Request</Btn><Btn variant="ghost" onClick={()=>setShowForm(false)}>Cancel</Btn></div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['ID','From','To','Items','Qty','Date','Status','Actions'].map(h=><Th key={h} ch={h} />)}</tr></thead>
          <tbody>
            {requests.map(r=>(
              <tr key={r.id} className="hover:bg-gray-50">
                <Td><span className="font-mono text-indigo-600 font-bold">{r.id}</span></Td>
                <Td>{r.from}</Td><Td>{r.to}</Td><Td>{r.items}</Td><Td>{r.qty}</Td><Td>{r.date}</Td>
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

/* 7. QR Dispatch ───────────────────────────────────────────────── */
function QRDispatchView() {
  const [token,    setToken]    = useState(null);
  const [dispatchLog, setLog]  = useState([
    { o:'#ORD-1035', d:'Roshan Fernando', t:'10:14 AM', s:'Dispatched', token:'TKN-A7F2E' },
    { o:'#ORD-1031', d:'Nimal Silva',     t:'09:52 AM', s:'Dispatched', token:'TKN-B3C9D' },
    { o:'#ORD-1028', d:'Kamal Perera',    t:'09:30 AM', s:'Delivered',  token:'TKN-C1G8H' },
  ]);
  const [selectedOrder, setSelectedOrder] = useState(INIT_URGE[0].id);
  const [confirmed, setConfirmed] = useState(false);

  function generateToken() {
    const t = 'TKN-' + Math.random().toString(36).toUpperCase().slice(2,8);
    setToken(t); setConfirmed(false);
  }
  function confirmDispatch() {
    const o = INIT_URGE.find(x=>x.id===selectedOrder);
    setLog(l => [{ o:selectedOrder, d:o?.driver||'Unassigned', t:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), s:'Dispatched', token }, ...l]);
    setConfirmed(true);
  }
  const qrUrl = token ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`MANGALA-LOGIQ|${selectedOrder}|${token}`)}` : null;

  return (
    <div>
      <SectionHeader title="QR Dispatch" subtitle="Generate a dispatch token / QR for order verification" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 block mb-1">Select Order to Dispatch</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={selectedOrder} onChange={e=>{setSelectedOrder(e.target.value);setToken(null);setConfirmed(false);}}>
              {INIT_URGE.map(o=><option key={o.id} value={o.id}>{o.id} — {o.customer}</option>)}
            </select>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 border-4 border-indigo-200 rounded-2xl flex items-center justify-center mb-4 bg-gray-50 relative overflow-hidden">
              {confirmed ? (
                <div className="text-center"><span className="material-symbols-outlined text-5xl text-green-500">check_circle</span><p className="text-sm font-bold text-green-600 mt-1">Dispatched!</p></div>
              ) : qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-44 h-44 object-contain" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}} />
              ) : (
                <div className="text-center opacity-40"><span className="material-symbols-outlined text-6xl text-gray-300">qr_code_2</span><p className="text-xs text-gray-400 mt-1">Click Generate</p></div>
              )}
              <div className="absolute inset-0 flex-col items-center justify-center hidden text-center p-4 bg-gray-50">
                <span className="material-symbols-outlined text-4xl text-indigo-400">qr_code_2</span>
                <p className="font-mono font-bold text-indigo-600 text-xs mt-2">{token}</p>
              </div>
              {!confirmed && <><div className="absolute top-1 left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" /><div className="absolute top-1 right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" /><div className="absolute bottom-1 left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" /><div className="absolute bottom-1 right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" /></>}
            </div>
            {token && !confirmed && <p className="font-mono text-lg font-bold text-indigo-600 mb-1">{token}</p>}
            <p className="text-xs text-gray-400 mb-4">{confirmed?'Order dispatched — logged below':token?'QR ready. Confirm to log dispatch.':'Generate QR/token to start dispatch'}</p>
            <div className="flex gap-2">
              <Btn onClick={generateToken} variant={token?'outline':'primary'}><span className="material-symbols-outlined text-sm">qr_code_scanner</span>{token?'Regenerate':'Generate QR'}</Btn>
              {token && !confirmed && <Btn variant="success" onClick={confirmDispatch}><span className="material-symbols-outlined text-sm">send</span>Confirm Dispatch</Btn>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Dispatch Log</h3></div>
          <table className="w-full">
            <thead><tr>{['Order','Driver','Token','Time','Status'].map(h=><Th key={h} ch={h} />)}</tr></thead>
            <tbody>
              {dispatchLog.map((r,i)=>(
                <tr key={i} className="hover:bg-gray-50">
                  <Td><span className="font-mono text-indigo-600 font-bold">{r.o}</span></Td>
                  <Td>{r.d}</Td>
                  <Td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{r.token}</span></Td>
                  <Td className="text-gray-400">{r.t}</Td>
                  <Td><Badge label={r.s} color={r.s==='Delivered'?'green':'blue'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* 8. Damage Tickets ────────────────────────────────────────────── */
function DamageTicketsView({ tickets, setTickets }) {
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ order:'', driver:'', item:'', type:'', severity:'Medium', claim:0, status:'OPEN', imageUrl:null });
  const [preview,  setPreview]  = useState(null);

  function handleImg(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setForm(f=>({...f,imageUrl:ev.target.result})); };
    reader.readAsDataURL(file);
  }
  function create() {
    if (!form.order || !form.item) return;
    const id = `DT-${100+tickets.length+1}`;
    setTickets(ts => [{ id, ...form }, ...ts]);
    setForm({ order:'', driver:'', item:'', type:'', severity:'Medium', claim:0, status:'OPEN', imageUrl:null });
    setPreview(null); setShowForm(false);
  }
  function quarantine(id) { setTickets(ts=>ts.map(t=>t.id===id?{...t,status:'QUARANTINED'}:t)); }
  function resolve(id)    { setTickets(ts=>ts.map(t=>t.id===id?{...t,status:'Resolved'}:t)); }

  const sv = { Critical:'red', High:'orange', Medium:'yellow', Low:'gray' };
  const ss = { OPEN:'blue', QUARANTINED:'red', Resolved:'green', 'Under Review':'blue', Escalated:'red', Pending:'yellow' };

  return (
    <div>
      <SectionHeader title="Damage Tickets" subtitle="OPEN or QUARANTINED — attach image evidence"
        action={<Btn onClick={()=>setShowForm(!showForm)}><span className="material-symbols-outlined text-sm">add</span>New Ticket</Btn>}
      />
      {showForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-red-800 mb-3">Report Damage</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Order ID</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="#ORD-XXXX" value={form.order} onChange={e=>setForm(f=>({...f,order:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Driver</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.driver} onChange={e=>setForm(f=>({...f,driver:e.target.value}))}>
                <option value="">Select…</option>{DRIVERS.map(d=><option key={d.id}>{d.name}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Item Damaged</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Item name" value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Damage Type</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Shattered" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Severity</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))}>
                {['Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Claim Amount (Rs.)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.claim} onChange={e=>setForm(f=>({...f,claim:Number(e.target.value)}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Initial Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="OPEN">OPEN</option><option value="QUARANTINED">QUARANTINED</option>
              </select></div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Photo Evidence</label>
              <input type="file" accept="image/*" onChange={handleImg} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
          </div>
          {preview && <img src={preview} alt="preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200 mb-3" />}
          <div className="flex gap-2"><Btn onClick={create}>Submit Ticket</Btn><Btn variant="ghost" onClick={()=>{setShowForm(false);setPreview(null);}}>Cancel</Btn></div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['Ticket','Order','Driver','Item','Type','Severity','Claim','Status','Evidence','Actions'].map(h=><Th key={h} ch={h} />)}</tr></thead>
          <tbody>
            {tickets.map(t=>(
              <tr key={t.id} className="hover:bg-gray-50">
                <Td><span className="font-mono text-indigo-600 font-bold text-xs">{t.id}</span></Td>
                <Td><span className="font-mono text-xs">{t.order}</span></Td>
                <Td>{t.driver}</Td>
                <Td className="max-w-[130px] truncate">{t.item}</Td>
                <Td>{t.type}</Td>
                <Td><Badge label={t.severity} color={sv[t.severity]} /></Td>
                <Td className="font-semibold">Rs. {Number(t.claim).toLocaleString()}</Td>
                <Td><Badge label={t.status} color={ss[t.status]} /></Td>
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

/* 9. Driver Cash Collection ────────────────────────────────────── */
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
    if (amt < row.pending) { setError(`Amount Rs. ${amt.toLocaleString()} is less than pending balance Rs. ${row.pending.toLocaleString()}.`); return; }
    setCodList(cs=>cs.map(c=>c.driver===driver?{...c, deposited:c.collected, pending:0, status:'Reconciled', signature:sigText||'Digital Approval'}:c));
    setSubmitTarget(null); setAmount(''); setSigText(''); setError('');
    setSuccess(`${driver} reconciled ✓`); setTimeout(()=>setSuccess(''),3000);
  }

  const sc = { Reconciled:'green', Pending:'yellow', Overdue:'red' };
  const total   = codList.reduce((a,c)=>a+c.collected,0);
  const pending = codList.reduce((a,c)=>a+c.pending,0);

  return (
    <div>
      <SectionHeader title="Driver Cash Collection" subtitle="Submit COD deposits — amount must meet or exceed pending balance" />
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="payments"      label="Total Collected"  value={`Rs. ${total.toLocaleString()}`}   color="indigo" />
        <StatCard icon="pending_actions" label="Undeposited"    value={`Rs. ${pending.toLocaleString()}`} color="orange" />
        <StatCard icon="check_circle"  label="Reconciled"       value={`${codList.filter(c=>c.status==='Reconciled').length}/${codList.length}`} color="green" />
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

/* 10. Accountant Reconciliation ───────────────────────────────── */
function ReconciliationView({ codList, setCodList }) {
  const [ledger, setLedger] = useState([
    { date:'Apr 25', sales:487200, cod:184600, bank:302600, discrepancy:0,    status:'Balanced',settled:false },
    { date:'Apr 24', sales:391500, cod:210000, bank:181500, discrepancy:0,    status:'Balanced',settled:false },
    { date:'Apr 23', sales:544800, cod:97200,  bank:430400, discrepancy:17200,status:'Mismatch',settled:false },
    { date:'Apr 22', sales:312000, cod:67000,  bank:245000, discrepancy:0,    status:'Balanced',settled:false },
    { date:'Apr 21', sales:628900, cod:148000, bank:480900, discrepancy:0,    status:'Balanced',settled:false },
  ]);

  function settle(date) {
    setLedger(l=>l.map(r=>r.date===date?{...r,status:'Balanced',discrepancy:0,settled:true}:r));
  }

  const pendingByDriver = codList.filter(c=>c.status!=='Reconciled');
  const expectedCash    = codList.reduce((s,c)=>s+c.pending,0);

  return (
    <div>
      <SectionHeader title="Accountant Reconciliation" subtitle="Group transactions by driver · settle COD wallets"
        action={<Btn variant="outline"><span className="material-symbols-outlined text-sm">download</span>Export CSV</Btn>}
      />
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
                  <div><p className="text-sm font-semibold">{c.driver}</p><p className="text-xs text-gray-400">{c.orders} orders</p></div>
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

/* 11. Driver Bonus ─────────────────────────────────────────────── */
function DriverBonusView({ damageTickets }) {
  const [approved, setApproved] = useState({});
  const bonuses = DRIVERS.map(d => {
    const b = calcBonus(d, damageTickets);
    const penalties = damageTickets.filter(t=>t.driver===d.name&&t.status!=='Resolved').length;
    const tier = b>=10000?'Gold':b>=5000?'Silver':'Bronze';
    return { ...d, computedBonus:b, penalties, tier };
  }).sort((a,b)=>b.computedBonus-a.computedBonus);

  const tierIcon  = { Gold:'emoji_events', Silver:'military_tech', Bronze:'workspace_premium' };
  const tierColor = { Gold:'yellow', Silver:'gray', Bronze:'orange' };

  return (
    <div>
      <SectionHeader title="Driver Bonus" subtitle={`Formula: (deliveries × Rs.${BASE_DELIVERY_RATE}) × (rating ÷ 5.0) − (open tickets × Rs.${PENALTY_PER_TICKET})`}
        action={<Btn onClick={()=>setApproved(Object.fromEntries(bonuses.map(d=>[d.id,true])))}><span className="material-symbols-outlined text-sm">send</span>Approve All</Btn>}
      />
      <div className="space-y-3">
        {bonuses.map((d,i)=>(
          <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{i+1}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{d.name}</p>
              <p className="text-xs text-gray-400">{d.vehicle}</p>
            </div>
            <div className="grid grid-cols-5 gap-5 text-center text-sm">
              <div><p className="text-xs text-gray-400 font-semibold">Deliveries</p><p className="font-extrabold mt-0.5">{d.deliveries}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Rating</p><p className={`font-extrabold mt-0.5 ${d.rating>=4.5?'text-green-600':d.rating>=4.0?'text-yellow-500':'text-red-500'}`}>⭐ {d.rating}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">On-Time</p><p className={`font-extrabold mt-0.5 ${d.onTime>=95?'text-green-600':d.onTime>=88?'text-yellow-500':'text-red-500'}`}>{d.onTime}%</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Penalties</p><p className={`font-extrabold mt-0.5 ${d.penalties>0?'text-red-500':'text-gray-400'}`}>{d.penalties>0?`−${d.penalties} ticket`:'None'}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Bonus</p><p className="font-extrabold text-indigo-600 mt-0.5">Rs. {d.computedBonus.toLocaleString()}</p></div>
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

/* 12. Customer Rating ──────────────────────────────────────────── */
function CustomerRatingView() {
  const [ratings, setRatings] = useState(RATINGS);
  const avg = (ratings.reduce((a,r)=>a+r.rating,0)/ratings.length).toFixed(1);

  function reply(order) { setRatings(rs=>rs.map(r=>r.order===order?{...r,replied:true}:r)); }

  return (
    <div>
      <SectionHeader title="Customer Ratings" subtitle="Delivery experience feedback" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="star"              label="Avg. Rating"      value={`${avg} / 5`} sub={`${ratings.length} reviews`} color="indigo" />
        <StatCard icon="sentiment_satisfied" label="5-Star Reviews"  value={ratings.filter(r=>r.rating===5).length}  color="green" />
        <StatCard icon="reply"             label="Awaiting Reply"   value={ratings.filter(r=>!r.replied).length}    color="orange" />
      </div>
      <div className="space-y-3">
        {ratings.map(r=>(
          <div key={r.order} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{r.customer[0]}</div>
                <div><p className="font-bold text-gray-800">{r.customer}</p><p className="text-xs text-gray-400">{r.order} · Driver: {r.driver} · {r.date}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Stars n={r.rating} />
                {!r.replied?<Badge label="No Reply" color="orange" />:<Badge label="Replied" color="green" />}
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

/* ─── Nav Config ──────────────────────────────────────────────── */
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

  const [branchRequests, setBranchRequests] = useState(INIT_BRANCH_REQUESTS);
  const [damageTickets,  setDamageTickets]  = useState(INIT_DAMAGE);
  const [codList,        setCodList]        = useState(INIT_COD);
  const [routes,         setRoutes]         = useState(INIT_ROUTES);

  const props = { routes, setRoutes, branchRequests, setBranchRequests, damageTickets, setDamageTickets, codList, setCodList };

  const VIEWS = {
    dashboard:      () => <DashboardView {...props} />,
    urge:           () => <UrgeQueueView />,
    routes:         () => <RoutePlannerView />,
    vehicles:       () => <VehicleCapacityView />,
    stock:          () => <StockDistributionView />,
    interbranch:    () => <InterBranchView requests={branchRequests} setRequests={setBranchRequests} />,
    qrdispatch:     () => <QRDispatchView />,
    damage:         () => <DamageTicketsView tickets={damageTickets} setTickets={setDamageTickets} />,
    cashcollection: () => <CashCollectionView codList={codList} setCodList={setCodList} damageTickets={damageTickets} />,
    reconciliation: () => <ReconciliationView codList={codList} setCodList={setCodList} />,
    bonus:          () => <DriverBonusView damageTickets={damageTickets} />,
    ratings:        () => <CustomerRatingView />,
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
          <p className="text-[10px] text-white/30 text-center">Mangala Showroom · LogiQ v1.0</p>
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
