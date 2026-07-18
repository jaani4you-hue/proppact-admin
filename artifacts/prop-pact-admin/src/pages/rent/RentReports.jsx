import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, IndianRupee, Users, Building2, UserCheck } from 'lucide-react';
import { fetchAllRents, fetchAllPayments } from '../../services/rentService.js';
import RentStatusBadge from '../../components/rent/RentStatusBadge.jsx';

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

function Shimmer({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

function SummaryCard({ label, value, sub, color = 'orange' }) {
  const cols = {
    orange: 'border-orange-100 bg-orange-50 text-orange-600',
    green : 'border-green-100  bg-green-50  text-green-700',
    red   : 'border-red-100    bg-red-50    text-red-600',
    blue  : 'border-blue-100   bg-blue-50   text-blue-700',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${cols[color]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      {sub && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'Unknown';
    if (!acc[k]) acc[k] = { label: k, totalRent: 0, collected: 0, count: 0 };
    acc[k].totalRent += Number(item.monthlyRent) || 0;
    acc[k].collected += Number(item.paidAmount)  || 0;
    acc[k].count     += 1;
    return acc;
  }, {});
}

function TableSection({ title, icon: Icon, rows, cols }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Icon className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="ml-auto text-xs text-gray-400">{rows.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              {cols.map((c) => (
                <th key={c.key} className="py-2.5 px-4 text-left text-xs font-semibold text-gray-400">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="py-10 text-center text-sm text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  {cols.map((c) => (
                    <td key={c.key} className={`py-3 px-4 ${c.className || ''}`}>
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CollectionBar({ collected, total }) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function RentReports() {
  const navigate   = useNavigate();
  const [rents,    setRents]    = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('monthly');

  useEffect(() => {
    Promise.all([fetchAllRents(), fetchAllPayments()]).then(([r, p]) => {
      setRents(r);
      setPayments(p);
      setLoading(false);
    });
  }, []);

  // Monthly collection from payments (by paidDate)
  const monthlyData = useMemo(() => {
    const now   = new Date();
    const year  = now.getFullYear();
    const data  = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS[i], collected: 0, count: 0,
    }));
    payments.forEach((p) => {
      const d = p.paidDate ? new Date(p.paidDate) : null;
      if (d && d.getFullYear() === year) {
        data[d.getMonth()].collected += Number(p.amount) || 0;
        data[d.getMonth()].count     += 1;
      }
    });
    return data;
  }, [payments]);

  // Yearly summary (last 3 years)
  const yearlyData = useMemo(() => {
    const byYear = {};
    payments.forEach((p) => {
      const d = p.paidDate ? new Date(p.paidDate) : null;
      if (!d) return;
      const y = d.getFullYear();
      if (!byYear[y]) byYear[y] = { year: y, collected: 0, count: 0 };
      byYear[y].collected += Number(p.amount) || 0;
      byYear[y].count     += 1;
    });
    return Object.values(byYear).sort((a, b) => b.year - a.year).slice(0, 5);
  }, [payments]);

  // Owner-wise
  const ownerData = useMemo(() =>
    Object.values(groupBy(rents, 'ownerName')).sort((a, b) => b.totalRent - a.totalRent),
  [rents]);

  // Property-wise
  const propertyData = useMemo(() =>
    Object.values(groupBy(rents, 'propertyName')).sort((a, b) => b.totalRent - a.totalRent),
  [rents]);

  // Tenant-wise
  const tenantData = useMemo(() =>
    rents.map((r) => ({
      label    : r.tenantName || '—',
      property : r.propertyName || '—',
      totalRent: Number(r.monthlyRent) || 0,
      collected: Number(r.paidAmount)  || 0,
      status   : r.status,
    })).sort((a, b) => b.totalRent - a.totalRent),
  [rents]);

  // Summary stats
  const totalMonthlyRent = rents.reduce((s, r) => s + (Number(r.monthlyRent) || 0), 0);
  const totalCollected   = rents.reduce((s, r) => s + (Number(r.paidAmount)  || 0), 0);
  const totalOverdue     = rents.filter(r => r.status === 'Overdue').reduce((s, r) => s + (Number(r.outstandingBalance) || 0), 0);
  const collectionRate   = totalMonthlyRent > 0 ? Math.round((totalCollected / totalMonthlyRent) * 100) : 0;

  const TABS = [
    { key: 'monthly',  label: 'Monthly' },
    { key: 'yearly',   label: 'Yearly'  },
    { key: 'owner',    label: 'Owner'   },
    { key: 'property', label: 'Property'},
    { key: 'tenant',   label: 'Tenant'  },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/rent')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rent Reports</h1>
          <p className="text-sm text-gray-500">Monthly, yearly, owner, property and tenant-wise collection analysis</p>
        </div>
      </div>

      {/* Summary */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Shimmer key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total Monthly"    value={fmt(totalMonthlyRent)} color="orange" />
          <SummaryCard label="Total Collected"  value={fmt(totalCollected)}   color="green"  />
          <SummaryCard label="Overdue"          value={fmt(totalOverdue)}     color="red"    />
          <SummaryCard label="Collection Rate"  value={`${collectionRate}%`}  color="blue"   />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === t.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Shimmer key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Monthly */}
          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Monthly Collection — {new Date().getFullYear()}
                  </h3>
                </div>
                {/* Bar chart */}
                <div className="px-5 py-4">
                  <div className="flex items-end gap-1.5 h-32">
                    {monthlyData.map((m, i) => {
                      const maxVal = Math.max(...monthlyData.map(x => x.collected), 1);
                      const height = Math.round((m.collected / maxVal) * 100);
                      return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1 group">
                          <div className="relative w-full flex items-end" style={{ height: '100px' }}>
                            <div
                              className="w-full rounded-t-sm bg-orange-400 group-hover:bg-orange-500 transition-colors cursor-default"
                              style={{ height: `${Math.max(height, m.collected > 0 ? 4 : 0)}%` }}
                              title={`${m.month}: ${fmt(m.collected)}`}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 font-medium">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Table */}
                <table className="w-full text-sm border-t border-gray-100">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-400">Month</th>
                      <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-400">Collected</th>
                      <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-400">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-4 text-sm text-gray-700">{m.month}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-gray-800">{fmt(m.collected)}</td>
                        <td className="py-2.5 px-4 text-right text-gray-500">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Yearly */}
          {activeTab === 'yearly' && (
            <TableSection
              title="Yearly Collection"
              icon={TrendingUp}
              rows={yearlyData}
              cols={[
                { key: 'year',      label: 'Year',         render: r => <span className="font-semibold">{r.year}</span> },
                { key: 'collected', label: 'Collected',     render: r => <span className="font-semibold text-green-700">{fmt(r.collected)}</span> },
                { key: 'count',     label: 'Transactions',  render: r => r.count },
              ]}
            />
          )}

          {/* Owner-wise */}
          {activeTab === 'owner' && (
            <TableSection
              title="Owner-wise Collection"
              icon={UserCheck}
              rows={ownerData}
              cols={[
                { key: 'label',      label: 'Owner',       render: r => <span className="font-medium">{r.label}</span> },
                { key: 'count',      label: 'Properties',  render: r => r.count },
                { key: 'totalRent',  label: 'Total Rent',  render: r => fmt(r.totalRent) },
                { key: 'collected',  label: 'Collected',   render: r => <span className="font-semibold text-green-700">{fmt(r.collected)}</span> },
                { key: 'rate',       label: 'Rate',        render: r => <CollectionBar collected={r.collected} total={r.totalRent} /> },
              ]}
            />
          )}

          {/* Property-wise */}
          {activeTab === 'property' && (
            <TableSection
              title="Property-wise Collection"
              icon={Building2}
              rows={propertyData}
              cols={[
                { key: 'label',     label: 'Property',   render: r => <span className="font-medium">{r.label}</span> },
                { key: 'count',     label: 'Tenants',    render: r => r.count },
                { key: 'totalRent', label: 'Total Rent', render: r => fmt(r.totalRent) },
                { key: 'collected', label: 'Collected',  render: r => <span className="font-semibold text-green-700">{fmt(r.collected)}</span> },
                { key: 'rate',      label: 'Rate',       render: r => <CollectionBar collected={r.collected} total={r.totalRent} /> },
              ]}
            />
          )}

          {/* Tenant-wise */}
          {activeTab === 'tenant' && (
            <TableSection
              title="Tenant-wise Collection"
              icon={Users}
              rows={tenantData}
              cols={[
                { key: 'label',     label: 'Tenant',    render: r => <span className="font-medium">{r.label}</span> },
                { key: 'property',  label: 'Property',  render: r => <span className="text-gray-500">{r.property}</span> },
                { key: 'totalRent', label: 'Rent',      render: r => fmt(r.totalRent) },
                { key: 'collected', label: 'Paid',      render: r => <span className="font-semibold text-green-700">{fmt(r.collected)}</span> },
                { key: 'status',    label: 'Status',    render: r => <RentStatusBadge status={r.status} /> },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
