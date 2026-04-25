import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Mock Data ───────────────────────────────────────────────── */
const DRIVERS = [
  { id: 'D001', name: 'Kamal Perera',   vehicle: 'WP CAB-1234', rating: 4.8, deliveries: 312, onTime: 96, bonus: 4500, tier: 'Gold',   status: 'On Route' },
  { id: 'D002', name: 'Nimal Silva',    vehicle: 'WP CB-5678',  rating: 4.5, deliveries: 278, onTime: 91, bonus: 3200, tier: 'Silver', status: 'Available' },
  { id: 'D003', name: 'Suresh Kumar',   vehicle: 'CP KA-9012',  rating: 4.2, deliveries: 195, onTime: 87, bonus: 2100, tier: 'Bronze', status: 'On Route' },
  { id: 'D004', name: 'Roshan Fernando',vehicle: 'WP LA-3456',  rating: 4.9, deliveries: 401, onTime: 98, bonus: 5800, tier: 'Gold',   status: 'Off Duty' },
  { id: 'D005', name: 'Amara Bandara',  vehicle: 'SP PA-7890',  rating: 4.0, deliveries: 143, onTime: 83, bonus: 1400, tier: 'Bronze', status: 'Available' },
];

const VEHICLES = [
  { id: 'WP CAB-1234', type: 'Lorry',     maxKg: 3000, loadKg: 2400, driver: 'Kamal Perera',    fuel: 72, status: 'On Route' },
  { id: 'WP CB-5678',  type: 'Van',        maxKg: 1200, loadKg: 0,    driver: 'Nimal Silva',     fuel: 88, status: 'Available' },
  { id: 'CP KA-9012',  type: 'Van',        maxKg: 1200, loadKg: 950,  driver: 'Suresh Kumar',    fuel: 45, status: 'On Route' },
  { id: 'WP LA-3456',  type: 'Lorry',     maxKg: 3000, loadKg: 0,    driver: 'Roshan Fernando', fuel: 61, status: 'Idle' },
  { id: 'SP PA-7890',  type: 'Motorbike', maxKg: 80,   loadKg: 0,    driver: 'Amara Bandara',   fuel: 95, status: 'Available' },
  { id: 'WP MA-2211',  type: 'Van',        maxKg: 1200, loadKg: 0,    driver: '—',               fuel: 20, status: 'Maintenance' },
];

const URGE_QUEUE = [
  { id: '#ORD-1042', customer: 'Dr. Priya Nair',    address: '45 Galle Rd, Colombo 3',      urgency: 'Critical', driver: 'Unassigned', eta: 'Overdue',  items: 3 },
  { id: '#ORD-1039', customer: 'Ravi Wickramasinghe',address: '12 Kandy Rd, Nugegoda',      urgency: 'High',     driver: 'Kamal Perera', eta: '35 min', items: 1 },
  { id: '#ORD-1051', customer: 'Sunitha Mendis',    address: '8 Temple Rd, Dehiwala',        urgency: 'High',     driver: 'Unassigned', eta: 'Overdue',  items: 2 },
  { id: '#ORD-1067', customer: 'Fathima Ismail',    address: '23 Main St, Pettah',           urgency: 'Medium',   driver: 'Suresh Kumar', eta: '1h 20m',items: 1 },
  { id: '#ORD-1070', customer: 'Mr. Gayan Dias',    address: '77 Sea View Ave, Mt. Lavinia', urgency: 'Medium',   driver: 'Unassigned', eta: '2h',       items: 4 },
];

const ROUTES = [
  { id: 'RT-01', name: 'Colombo South Loop',    driver: 'Kamal Perera',    vehicle: 'WP CAB-1234', stops: 8, est: '4h 30m', status: 'In Progress', completed: 3 },
  { id: 'RT-02', name: 'Kandy Corridor',         driver: 'Suresh Kumar',    vehicle: 'CP KA-9012',  stops: 5, est: '6h 00m', status: 'In Progress', completed: 2 },
  { id: 'RT-03', name: 'Nugegoda Cluster',       driver: 'Nimal Silva',     vehicle: 'WP CB-5678',  stops: 6, est: '3h 15m', status: 'Planned',     completed: 0 },
  { id: 'RT-04', name: 'Mount Lavinia Express',  driver: 'Amara Bandara',   vehicle: 'SP PA-7890',  stops: 3, est: '1h 45m', status: 'Planned',     completed: 0 },
  { id: 'RT-05', name: 'Negombo North Run',      driver: 'Roshan Fernando', vehicle: 'WP LA-3456',  stops: 7, est: '5h 00m', status: 'Completed',   completed: 7 },
];

const BRANCHES = [
  { name: 'Colombo HQ',    products: 142, lowStock: 4, reorderPending: 2, lastTransfer: '2h ago',  status: 'Healthy' },
  { name: 'Kandy Branch',  products: 87,  lowStock: 11, reorderPending: 5, lastTransfer: '1d ago', status: 'Warning' },
  { name: 'Galle Branch',  products: 63,  lowStock: 2, reorderPending: 0, lastTransfer: '4h ago',  status: 'Healthy' },
  { name: 'Jaffna Outlet', products: 41,  lowStock: 18, reorderPending: 8, lastTransfer: '3d ago', status: 'Critical' },
  { name: 'Negombo Store', products: 55,  lowStock: 3, reorderPending: 1, lastTransfer: '6h ago',  status: 'Healthy' },
];

const BRANCH_REQUESTS = [
  { id: 'IBR-001', from: 'Kandy Branch',  to: 'Colombo HQ',    items: 'Teak Dining Set x2',    qty: 2,  status: 'Pending',   date: 'Apr 25' },
  { id: 'IBR-002', from: 'Jaffna Outlet', to: 'Colombo HQ',    items: 'Samsung 65" QLED x3',   qty: 3,  status: 'Approved',  date: 'Apr 24' },
  { id: 'IBR-003', from: 'Colombo HQ',   to: 'Galle Branch',   items: 'Velvet Sofa Set x1',     qty: 1,  status: 'In Transit',date: 'Apr 24' },
  { id: 'IBR-004', from: 'Negombo Store',to: 'Kandy Branch',   items: 'Office Chair x6',        qty: 6,  status: 'Completed', date: 'Apr 23' },
  { id: 'IBR-005', from: 'Jaffna Outlet', to: 'Negombo Store', items: 'Bookshelf Oak x4',       qty: 4,  status: 'Pending',   date: 'Apr 25' },
];

const DAMAGE_TICKETS = [
  { id: 'DT-101', order: '#ORD-0987', driver: 'Suresh Kumar',    item: 'Glass Coffee Table',  type: 'Shattered',  severity: 'High',   claim: 28500, status: 'Under Review' },
  { id: 'DT-102', order: '#ORD-1012', driver: 'Nimal Silva',     item: 'Leather Sofa Corner', type: 'Scratched',  severity: 'Low',    claim: 4200,  status: 'Resolved' },
  { id: 'DT-103', order: '#ORD-1034', driver: 'Amara Bandara',   item: 'LG 55" OLED TV',      type: 'Screen Crack',severity:'Critical',claim: 87000, status: 'Escalated' },
  { id: 'DT-104', order: '#ORD-1038', driver: 'Kamal Perera',    item: 'Teak Wardrobe Door',  type: 'Broken Hinge',severity:'Medium', claim: 6500,  status: 'Pending' },
  { id: 'DT-105', order: '#ORD-1055', driver: 'Roshan Fernando', item: 'Dining Chair x2',     type: 'Leg Snapped', severity:'Medium', claim: 9800,  status: 'Resolved' },
];

const COD_COLLECTIONS = [
  { driver: 'Kamal Perera',    orders: 8, collected: 124500, deposited: 124500, pending: 0,     status: 'Reconciled' },
  { driver: 'Nimal Silva',     orders: 5, collected: 67200,  deposited: 50000,  pending: 17200, status: 'Pending' },
  { driver: 'Suresh Kumar',    orders: 6, collected: 89400,  deposited: 0,      pending: 89400, status: 'Overdue' },
  { driver: 'Roshan Fernando', orders: 9, collected: 210000, deposited: 210000, pending: 0,     status: 'Reconciled' },
  { driver: 'Amara Bandara',   orders: 3, collected: 14700,  deposited: 14700,  pending: 0,     status: 'Reconciled' },
];

const RECONCILIATION = [
  { date: 'Apr 25', sales: 487200, cod: 184600, bank: 302600, discrepancy: 0,    status: 'Balanced' },
  { date: 'Apr 24', sales: 391500, cod: 210000, bank: 181500, discrepancy: 0,    status: 'Balanced' },
  { date: 'Apr 23', sales: 544800, cod: 97200,  bank: 430400, discrepancy: 17200,status: 'Mismatch' },
  { date: 'Apr 22', sales: 312000, cod: 67000,  bank: 245000, discrepancy: 0,    status: 'Balanced' },
  { date: 'Apr 21', sales: 628900, cod: 148000, bank: 480900, discrepancy: 0,    status: 'Balanced' },
];

const RATINGS = [
  { order: '#ORD-1028', customer: 'Priya Nair',       driver: 'Kamal Perera',    rating: 5, comment: 'Arrived on time, very careful with the furniture.', date: 'Apr 25', replied: true },
  { order: '#ORD-1031', customer: 'Ravi Wickramasinghe',driver: 'Nimal Silva',   rating: 3, comment: 'Late by 2 hours, no call.', date: 'Apr 25', replied: false },
  { order: '#ORD-1019', customer: 'Sunitha Mendis',   driver: 'Suresh Kumar',    rating: 4, comment: 'Good service, minor damage on packaging.', date: 'Apr 24', replied: true },
  { order: '#ORD-1044', customer: 'Fathima Ismail',   driver: 'Roshan Fernando', rating: 5, comment: 'Excellent! Professional and fast.', date: 'Apr 24', replied: false },
  { order: '#ORD-1052', customer: 'Gayan Dias',       driver: 'Amara Bandara',   rating: 2, comment: 'Item wrong, had to wait 3 days for replacement.', date: 'Apr 23', replied: false },
];

/* ─── Helper Components ───────────────────────────────────────── */
const Badge = ({ label, color }) => {
  const colors = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    gray:   'bg-gray-100 text-gray-600',
    indigo: 'bg-indigo-100 text-indigo-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${colors[color] || colors.gray}`}>{label}</span>;
};

const StatCard = ({ icon, label, value, sub, color = 'indigo' }) => {
  const bg = { indigo: 'bg-indigo-50', sky: 'bg-sky-50', green: 'bg-green-50', orange: 'bg-orange-50', purple: 'bg-purple-50' };
  const txt = { indigo: 'text-indigo-600', sky: 'text-sky-600', green: 'text-green-600', orange: 'text-orange-600', purple: 'text-purple-600' };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <span className={`p-3 rounded-xl ${bg[color]}`}>
        <span className={`material-symbols-outlined text-2xl ${txt[color]}`}>{icon}</span>
      </span>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Th = ({ children }) => <th className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3 bg-gray-50 border-b border-gray-100">{children}</th>;
const Td = ({ children, className = '' }) => <td className={`px-4 py-3.5 text-sm text-gray-700 border-b border-gray-50 ${className}`}>{children}</td>;

const Stars = ({ n }) => (
  <span className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`material-symbols-outlined text-base ${i <= n ? 'text-yellow-400' : 'text-gray-200'}`} style={{fontVariationSettings:"'FILL' 1"}}>star</span>
    ))}
  </span>
);

const Btn = ({ children, onClick, variant = 'primary', small }) => {
  const base = `inline-flex items-center gap-1 font-semibold rounded-lg transition-all ${small ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'}`;
  const v = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    outline: 'border border-indigo-300 text-indigo-600 hover:bg-indigo-50',
    danger:  'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
    success: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
    ghost:   'text-gray-500 hover:bg-gray-100 border border-gray-200',
  };
  return <button onClick={onClick} className={`${base} ${v[variant]}`}>{children}</button>;
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

/* ─── 12 Section Views ────────────────────────────────────────── */
function DashboardView() {
  return (
    <div>
      <SectionHeader title="LogiQ Brain Overview" subtitle="Live logistics intelligence for April 25, 2026" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="local_shipping" label="Active Deliveries" value="14" sub="3 overdue" color="indigo" />
        <StatCard icon="directions_car" label="Vehicles On Road" value="3" sub="6 total fleet" color="sky" />
        <StatCard icon="person_pin_circle" label="Drivers Active" value="3" sub="2 available" color="green" />
        <StatCard icon="payments" label="Today's COD" value="Rs. 184,600" sub="3 undeposited" color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Recent Delivery Activity</h3>
            <Badge label="Live" color="green" />
          </div>
          <table className="w-full">
            <thead><tr><Th>Order</Th><Th>Driver</Th><Th>Destination</Th><Th>Status</Th></tr></thead>
            <tbody>
              {[
                { ord:'#ORD-1042', drv:'Kamal Perera',   dest:'Colombo 3',  s:'Overdue',    sc:'red' },
                { ord:'#ORD-1039', drv:'Kamal Perera',   dest:'Nugegoda',   s:'On Route',   sc:'blue' },
                { ord:'#ORD-1067', drv:'Suresh Kumar',   dest:'Pettah',     s:'On Route',   sc:'blue' },
                { ord:'#ORD-1070', drv:'Unassigned',     dest:'Mt. Lavinia',s:'Pending',    sc:'yellow' },
                { ord:'#ORD-1075', drv:'Nimal Silva',    dest:'Maharagama', s:'Delivered',  sc:'green' },
              ].map(r => (
                <tr key={r.ord} className="hover:bg-gray-50">
                  <Td><span className="font-mono font-bold text-indigo-600">{r.ord}</span></Td>
                  <Td>{r.drv}</Td><Td>{r.dest}</Td>
                  <Td><Badge label={r.s} color={r.sc} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Fleet Health</h3>
            {VEHICLES.slice(0,4).map(v => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{v.id}</p>
                  <p className="text-xs text-gray-400">{v.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${v.fuel > 60 ? 'bg-green-500' : v.fuel > 30 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{width:`${v.fuel}%`}} />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{v.fuel}%</span>
                  <Badge label={v.status} color={v.status === 'On Route' ? 'blue' : v.status === 'Available' ? 'green' : v.status === 'Maintenance' ? 'red' : 'gray'} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-indigo-600 rounded-xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Urge Queue Alerts</p>
            <p className="text-3xl font-extrabold mb-1">2</p>
            <p className="text-sm opacity-80">Critical orders need immediate driver assignment</p>
            <div className="mt-3 flex gap-2">
              <Badge label="1 Critical" color="red" />
              <Badge label="1 High" color="orange" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UrgeQueueView() {
  const urgColor = { Critical:'red', High:'orange', Medium:'yellow' };
  return (
    <div>
      <SectionHeader
        title="Urge Queue"
        subtitle="Priority deliveries requiring immediate action"
        action={<><Btn variant="outline" small><span className="material-symbols-outlined text-sm">filter_list</span>Filter</Btn><Btn small><span className="material-symbols-outlined text-sm">add</span>Flag Order</Btn></>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-red-600">1</p><p className="text-xs text-red-500 font-semibold mt-1">Critical</p></div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-orange-500">2</p><p className="text-xs text-orange-500 font-semibold mt-1">High Priority</p></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center"><p className="text-2xl font-extrabold text-yellow-600">2</p><p className="text-xs text-yellow-600 font-semibold mt-1">Medium</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr><Th>Order ID</Th><Th>Customer</Th><Th>Address</Th><Th>Urgency</Th><Th>Driver</Th><Th>ETA</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {URGE_QUEUE.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <Td><span className="font-mono font-bold text-indigo-600">{o.id}</span></Td>
                <Td>{o.customer}</Td>
                <Td className="max-w-[180px] truncate">{o.address}</Td>
                <Td><Badge label={o.urgency} color={urgColor[o.urgency]} /></Td>
                <Td><span className={o.driver === 'Unassigned' ? 'text-red-500 font-semibold' : ''}>{o.driver}</span></Td>
                <Td><span className={o.eta === 'Overdue' ? 'text-red-600 font-bold' : ''}>{o.eta}</span></Td>
                <Td>
                  <div className="flex gap-1">
                    <Btn variant="success" small>Assign</Btn>
                    <Btn variant="outline" small>Dispatch</Btn>
                    {o.urgency === 'Critical' && <Btn variant="danger" small>Escalate</Btn>}
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

function RoutePlannerView() {
  const stColor = { 'In Progress':'blue', Planned:'indigo', Completed:'green' };
  return (
    <div>
      <SectionHeader
        title="Route Planner"
        subtitle="Manage delivery routes and assignments"
        action={<Btn><span className="material-symbols-outlined text-sm">add_road</span>Create Route</Btn>}
      />
      <div className="space-y-3">
        {ROUTES.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">route</span>
                </span>
                <div>
                  <p className="font-bold text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.id} · {r.vehicle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={r.status} color={stColor[r.status]} />
                <Btn variant="ghost" small><span className="material-symbols-outlined text-sm">edit</span>Edit</Btn>
                <Btn variant="outline" small><span className="material-symbols-outlined text-sm">map</span>Map</Btn>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center bg-gray-50 rounded-lg p-3">
              <div><p className="text-xs text-gray-400 font-semibold">Driver</p><p className="text-sm font-bold text-gray-700 mt-0.5">{r.driver}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Total Stops</p><p className="text-sm font-bold text-gray-700 mt-0.5">{r.stops}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Completed</p><p className="text-sm font-bold text-green-600 mt-0.5">{r.completed}/{r.stops}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Est. Duration</p><p className="text-sm font-bold text-gray-700 mt-0.5">{r.est}</p></div>
            </div>
            {r.status !== 'Completed' && (
              <div className="mt-3">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${(r.completed/r.stops)*100}%`}} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function VehicleCapacityView() {
  return (
    <div>
      <SectionHeader
        title="Vehicle Capacity"
        subtitle="Fleet utilisation and status"
        action={<Btn variant="outline"><span className="material-symbols-outlined text-sm">add</span>Add Vehicle</Btn>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr><Th>Vehicle ID</Th><Th>Type</Th><Th>Driver</Th><Th>Capacity</Th><Th>Load</Th><Th>Utilisation</Th><Th>Fuel</Th><Th>Status</Th></tr></thead>
          <tbody>
            {VEHICLES.map(v => {
              const pct = v.maxKg > 0 ? Math.round((v.loadKg / v.maxKg) * 100) : 0;
              const sColor = { 'On Route':'blue', Available:'green', Idle:'gray', Maintenance:'red' };
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <Td><span className="font-mono font-bold text-gray-700">{v.id}</span></Td>
                  <Td>{v.type}</Td>
                  <Td>{v.driver}</Td>
                  <Td>{v.maxKg.toLocaleString()} kg</Td>
                  <Td>{v.loadKg.toLocaleString()} kg</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-yellow-400' : 'bg-indigo-500'}`} style={{width:`${pct}%`}} />
                      </div>
                      <span className="text-xs font-bold text-gray-500">{pct}%</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-sm ${v.fuel < 30 ? 'text-red-500' : 'text-gray-400'}`}>local_gas_station</span>
                      <span className={`text-sm font-bold ${v.fuel < 30 ? 'text-red-500' : 'text-gray-600'}`}>{v.fuel}%</span>
                    </div>
                  </Td>
                  <Td><Badge label={v.status} color={sColor[v.status] || 'gray'} /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockDistributionView() {
  const sc = { Healthy:'green', Warning:'yellow', Critical:'red' };
  return (
    <div>
      <SectionHeader
        title="Stock Distribution"
        subtitle="Branch-wise inventory health"
        action={<Btn><span className="material-symbols-outlined text-sm">sync</span>Sync All</Btn>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {BRANCHES.map(b => (
          <div key={b.name} className={`bg-white rounded-xl border shadow-sm p-5 ${b.status === 'Critical' ? 'border-red-300' : b.status === 'Warning' ? 'border-yellow-300' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">store</span>
                <h3 className="font-bold text-gray-800">{b.name}</h3>
              </div>
              <Badge label={b.status} color={sc[b.status]} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-extrabold text-gray-800">{b.products}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Products</p>
              </div>
              <div className={`rounded-lg p-2 ${b.lowStock > 10 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className={`text-lg font-extrabold ${b.lowStock > 10 ? 'text-red-600' : 'text-gray-800'}`}>{b.lowStock}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Low Stock</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-extrabold text-gray-800">{b.reorderPending}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Reorders</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Last transfer: {b.lastTransfer}</p>
            <div className="flex gap-2 mt-3">
              <Btn variant="outline" small>View Stock</Btn>
              {b.reorderPending > 0 && <Btn small>Approve Reorder</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterBranchView() {
  const sc = { Pending:'yellow', Approved:'blue', 'In Transit':'indigo', Completed:'green' };
  return (
    <div>
      <SectionHeader
        title="Inter-Branch Requests"
        subtitle="Stock transfer requests between branches"
        action={<Btn><span className="material-symbols-outlined text-sm">swap_horiz</span>New Request</Btn>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr><Th>Request ID</Th><Th>From</Th><Th>To</Th><Th>Items</Th><Th>Qty</Th><Th>Date</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {BRANCH_REQUESTS.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <Td><span className="font-mono text-indigo-600 font-bold">{r.id}</span></Td>
                <Td>{r.from}</Td>
                <Td>{r.to}</Td>
                <Td>{r.items}</Td>
                <Td>{r.qty}</Td>
                <Td>{r.date}</Td>
                <Td><Badge label={r.status} color={sc[r.status]} /></Td>
                <Td>
                  <div className="flex gap-1">
                    {r.status === 'Pending' && <><Btn variant="success" small>Approve</Btn><Btn variant="danger" small>Reject</Btn></>}
                    {r.status === 'Approved' && <Btn small>Dispatch</Btn>}
                    {r.status !== 'Completed' && <Btn variant="ghost" small>View</Btn>}
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

function QRDispatchView() {
  const [scanned, setScanned] = useState(false);
  return (
    <div>
      <SectionHeader
        title="QR Dispatch"
        subtitle="Scan and dispatch orders with QR verification"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <div className="w-48 h-48 border-4 border-indigo-200 rounded-2xl flex items-center justify-center mb-4 relative bg-gray-50">
            {scanned ? (
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                <p className="text-sm font-bold text-green-600 mt-2">#ORD-1039 Verified</p>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-7xl text-gray-200">qr_code_2</span>
                <div className="absolute inset-0 border-4 border-transparent">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-4">{scanned ? 'Order verified. Ready to dispatch.' : 'Point camera at order QR code'}</p>
          <Btn onClick={() => setScanned(!scanned)}>
            <span className="material-symbols-outlined text-sm">{scanned ? 'qr_code_scanner' : 'qr_code_scanner'}</span>
            {scanned ? 'Scan New Order' : 'Simulate Scan'}
          </Btn>
          {scanned && (
            <div className="mt-4 w-full bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm font-bold text-green-700 mb-2">Order #ORD-1039 — Kamal Perera</p>
              <p className="text-xs text-gray-500">Destination: 12 Kandy Rd, Nugegoda</p>
              <p className="text-xs text-gray-500">Items: 1 × Velvet Lounge Chair</p>
              <Btn variant="success" small>Confirm & Dispatch</Btn>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Recent Dispatches</h3>
          </div>
          <table className="w-full">
            <thead><tr><Th>Order</Th><Th>Driver</Th><Th>Time</Th><Th>Status</Th></tr></thead>
            <tbody>
              {[
                { o:'#ORD-1035', d:'Roshan Fernando', t:'10:14 AM', s:'Dispatched' },
                { o:'#ORD-1031', d:'Nimal Silva',     t:'09:52 AM', s:'Dispatched' },
                { o:'#ORD-1028', d:'Kamal Perera',    t:'09:30 AM', s:'Delivered' },
                { o:'#ORD-1024', d:'Suresh Kumar',    t:'08:55 AM', s:'Delivered' },
                { o:'#ORD-1019', d:'Amara Bandara',   t:'08:20 AM', s:'Delivered' },
              ].map(r => (
                <tr key={r.o} className="hover:bg-gray-50">
                  <Td><span className="font-mono text-indigo-600 font-bold">{r.o}</span></Td>
                  <Td>{r.d}</Td><Td className="text-gray-400">{r.t}</Td>
                  <Td><Badge label={r.s} color={r.s === 'Delivered' ? 'green' : 'blue'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DamageTicketsView() {
  const sv = { Critical:'red', High:'orange', Medium:'yellow', Low:'gray' };
  const ss = { 'Under Review':'blue', Resolved:'green', Escalated:'red', Pending:'yellow' };
  return (
    <div>
      <SectionHeader
        title="Damage Tickets"
        subtitle="Track and resolve delivery damage reports"
        action={<Btn><span className="material-symbols-outlined text-sm">add</span>New Ticket</Btn>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr><Th>Ticket</Th><Th>Order</Th><Th>Driver</Th><Th>Item</Th><Th>Type</Th><Th>Severity</Th><Th>Claim</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {DAMAGE_TICKETS.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <Td><span className="font-mono text-indigo-600 font-bold text-xs">{t.id}</span></Td>
                <Td><span className="font-mono text-xs">{t.order}</span></Td>
                <Td>{t.driver}</Td>
                <Td className="max-w-[140px] truncate">{t.item}</Td>
                <Td>{t.type}</Td>
                <Td><Badge label={t.severity} color={sv[t.severity]} /></Td>
                <Td className="font-semibold">Rs. {t.claim.toLocaleString()}</Td>
                <Td><Badge label={t.status} color={ss[t.status]} /></Td>
                <Td><Btn variant="ghost" small>View</Btn></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashCollectionView() {
  const sc = { Reconciled:'green', Pending:'yellow', Overdue:'red' };
  const total = COD_COLLECTIONS.reduce((a,c) => a + c.collected, 0);
  const pending = COD_COLLECTIONS.reduce((a,c) => a + c.pending, 0);
  return (
    <div>
      <SectionHeader title="Driver Cash Collection" subtitle="COD collections and deposit tracking" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="payments" label="Total Collected" value={`Rs. ${total.toLocaleString()}`} color="indigo" />
        <StatCard icon="pending_actions" label="Undeposited" value={`Rs. ${pending.toLocaleString()}`} color="orange" />
        <StatCard icon="check_circle" label="Reconciled Drivers" value={`${COD_COLLECTIONS.filter(c=>c.status==='Reconciled').length}/5`} color="green" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr><Th>Driver</Th><Th>Orders</Th><Th>Collected</Th><Th>Deposited</Th><Th>Pending</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {COD_COLLECTIONS.map(c => (
              <tr key={c.driver} className="hover:bg-gray-50">
                <Td className="font-semibold">{c.driver}</Td>
                <Td>{c.orders}</Td>
                <Td>Rs. {c.collected.toLocaleString()}</Td>
                <Td className="text-green-600 font-semibold">Rs. {c.deposited.toLocaleString()}</Td>
                <Td className={c.pending > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>
                  {c.pending > 0 ? `Rs. ${c.pending.toLocaleString()}` : '—'}
                </Td>
                <Td><Badge label={c.status} color={sc[c.status]} /></Td>
                <Td>
                  {c.status !== 'Reconciled' && <Btn small>Mark Deposited</Btn>}
                  {c.status === 'Reconciled' && <span className="text-green-500 text-xs font-semibold">✓ Done</span>}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReconciliationView() {
  return (
    <div>
      <SectionHeader
        title="Accountant Reconciliation"
        subtitle="Daily financial reconciliation dashboard"
        action={<Btn><span className="material-symbols-outlined text-sm">download</span>Export Report</Btn>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr><Th>Date</Th><Th>Total Sales</Th><Th>COD Collected</Th><Th>Bank Transfer</Th><Th>Discrepancy</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {RECONCILIATION.map(r => (
              <tr key={r.date} className="hover:bg-gray-50">
                <Td className="font-semibold">{r.date}</Td>
                <Td>Rs. {r.sales.toLocaleString()}</Td>
                <Td>Rs. {r.cod.toLocaleString()}</Td>
                <Td>Rs. {r.bank.toLocaleString()}</Td>
                <Td className={r.discrepancy > 0 ? 'text-red-600 font-bold' : 'text-green-500 font-semibold'}>
                  {r.discrepancy > 0 ? `− Rs. ${r.discrepancy.toLocaleString()}` : '✓ Balanced'}
                </Td>
                <Td><Badge label={r.status} color={r.status === 'Balanced' ? 'green' : 'red'} /></Td>
                <Td>
                  {r.status === 'Mismatch' ? <Btn variant="danger" small>Investigate</Btn> : <Btn variant="ghost" small>View</Btn>}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriverBonusView() {
  const tierColor = { Gold:'yellow', Silver:'gray', Bronze:'orange' };
  const tierIcon = { Gold:'emoji_events', Silver:'military_tech', Bronze:'workspace_premium' };
  return (
    <div>
      <SectionHeader
        title="Driver Bonus"
        subtitle="Performance metrics and bonus allocation"
        action={<Btn><span className="material-symbols-outlined text-sm">send</span>Pay All Bonuses</Btn>}
      />
      <div className="space-y-3">
        {DRIVERS.map((d,i) => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-6">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
              {i+1}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{d.name}</p>
              <p className="text-xs text-gray-400">{d.vehicle}</p>
            </div>
            <div className="grid grid-cols-4 gap-6 text-center">
              <div><p className="text-xs text-gray-400 font-semibold">Deliveries</p><p className="text-base font-extrabold text-gray-800 mt-0.5">{d.deliveries}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">On-Time</p><p className={`text-base font-extrabold mt-0.5 ${d.onTime >= 95 ? 'text-green-600' : d.onTime >= 88 ? 'text-yellow-500' : 'text-red-500'}`}>{d.onTime}%</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Rating</p><p className="text-base font-extrabold text-gray-800 mt-0.5">⭐ {d.rating}</p></div>
              <div><p className="text-xs text-gray-400 font-semibold">Bonus</p><p className="text-base font-extrabold text-indigo-600 mt-0.5">Rs. {d.bonus.toLocaleString()}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-2xl ${d.tier === 'Gold' ? 'text-yellow-400' : d.tier === 'Silver' ? 'text-gray-400' : 'text-orange-400'}`} style={{fontVariationSettings:"'FILL' 1"}}>{tierIcon[d.tier]}</span>
              <Badge label={d.tier} color={tierColor[d.tier]} />
            </div>
            <Btn variant="outline" small>Pay Bonus</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerRatingView() {
  const avg = (RATINGS.reduce((a,r) => a+r.rating, 0) / RATINGS.length).toFixed(1);
  return (
    <div>
      <SectionHeader title="Customer Ratings" subtitle="Delivery experience feedback" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="star" label="Avg. Rating" value={`${avg} / 5`} sub={`${RATINGS.length} reviews`} color="indigo" />
        <StatCard icon="sentiment_satisfied" label="5-Star Reviews" value={RATINGS.filter(r=>r.rating===5).length} color="green" />
        <StatCard icon="reply" label="Awaiting Reply" value={RATINGS.filter(r=>!r.replied).length} color="orange" />
      </div>
      <div className="space-y-3">
        {RATINGS.map(r => (
          <div key={r.order} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {r.customer[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{r.customer}</p>
                  <p className="text-xs text-gray-400">{r.order} · Driver: {r.driver} · {r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Stars n={r.rating} />
                {!r.replied && <Badge label="No Reply" color="orange" />}
                {r.replied && <Badge label="Replied" color="green" />}
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 italic">"{r.comment}"</p>
            {!r.replied && (
              <div className="mt-3 flex gap-2">
                <Btn variant="outline" small><span className="material-symbols-outlined text-sm">reply</span>Reply</Btn>
                {r.rating <= 2 && <Btn variant="danger" small><span className="material-symbols-outlined text-sm">flag</span>Escalate</Btn>}
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
  { id: 'dashboard',     label: 'Dashboard',               icon: 'dashboard' },
  { id: 'urge',          label: 'Urge Queue',               icon: 'priority_high' },
  { id: 'routes',        label: 'Route Planner',            icon: 'route' },
  { id: 'vehicles',      label: 'Vehicle Capacity',         icon: 'local_shipping' },
  { id: 'stock',         label: 'Stock Distribution',       icon: 'inventory_2' },
  { id: 'interbranch',   label: 'Inter-Branch Requests',    icon: 'swap_horiz' },
  { id: 'qrdispatch',    label: 'QR Dispatch',              icon: 'qr_code_scanner' },
  { id: 'damage',        label: 'Damage Tickets',           icon: 'report_problem' },
  { id: 'cashcollection',label: 'Driver Cash Collection',   icon: 'payments' },
  { id: 'reconciliation',label: 'Accountant Reconciliation',icon: 'account_balance' },
  { id: 'bonus',         label: 'Driver Bonus',             icon: 'emoji_events' },
  { id: 'ratings',       label: 'Customer Rating',          icon: 'star_rate' },
];

const VIEWS = {
  dashboard:      DashboardView,
  urge:           UrgeQueueView,
  routes:         RoutePlannerView,
  vehicles:       VehicleCapacityView,
  stock:          StockDistributionView,
  interbranch:    InterBranchView,
  qrdispatch:     QRDispatchView,
  damage:         DamageTicketsView,
  cashcollection: CashCollectionView,
  reconciliation: ReconciliationView,
  bonus:          DriverBonusView,
  ratings:        CustomerRatingView,
};

/* ─── Main Layout ─────────────────────────────────────────────── */
export default function LogiqBrain() {
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const ActiveView = VIEWS[active];

  return (
    <div className="flex h-screen bg-[#f0f4ff] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0f1729] flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base">psychology</span>
            </div>
            <span className="text-white font-extrabold text-base tracking-tight">LogiQ Brain</span>
          </div>
          <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-widest">Smart Delivery Tracker</p>
        </div>

        {/* Back Button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Admin Portal
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-3 space-y-0.5">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                active === n.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-900/50'
                  : 'text-white/55 hover:text-white/90 hover:bg-white/8'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">{n.icon}</span>
              <span className="truncate">{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] text-white/30 text-center">Mangala Showroom · LogiQ v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <ActiveView />
        </div>
      </main>
    </div>
  );
}
