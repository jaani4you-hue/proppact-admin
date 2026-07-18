import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  IndianRupee, TrendingUp, Clock, AlertCircle, CheckCircle2, Calendar, BarChart3,
} from 'lucide-react';
import { useRents } from '../../hooks/useRents.js';
import RentStatusBadge from '../../components/rent/RentStatusBadge.jsx';
import { RentSkeletonTable } from '../../components/rent/RentSkeletonTable.jsx';
import RentDeleteDialog from '../../components/rent/RentDeleteDialog.jsx';

const STATUS_FILTERS = ['all', 'Paid', 'Pending', 'Partial', 'Overdue'];

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}
function fmtDate(val) {
  if (!val) return '—';
  if (val?.toDate) return val.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    orange : 'bg-orange-50  text-orange-500  border-orange-100',
    green  : 'bg-green-50   text-green-600   border-green-100',
    yellow : 'bg-yellow-50  text-yellow-600  border-yellow-100',
    red    : 'bg-red-50     text-red-500     border-red-100',
    blue   : 'bg-blue-50    text-blue-600    border-blue-100',
    purple : 'bg-purple-50  text-purple-600  border-purple-100',
  };
  const cls = colors[color] ?? colors.orange;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function RentList() {
  const navigate = useNavigate();
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  const { rents, loading, error, page, setPage, totalPages, totalCount, stats } = useRents({
    statusFilter,
    search,
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rent Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track rent collection, payments, and outstanding balances
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/rent/reports')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Reports
          </button>
          <button
            onClick={() => navigate('/admin/rent/new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Rent Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={IndianRupee}  label="Total Monthly"    value={fmt(stats.totalMonthlyRent)} color="orange" />
        <StatCard icon={CheckCircle2} label="Collected"        value={fmt(stats.collected)}        color="green"  />
        <StatCard icon={Clock}        label="Pending"          value={fmt(stats.pending)}          color="yellow" />
        <StatCard icon={AlertCircle}  label="Overdue"          value={fmt(stats.overdue)}          color="red"    />
        <StatCard icon={TrendingUp}   label="Collection Rate"  value={`${stats.collectionRate}%`}  color="blue"   />
        <StatCard icon={Calendar}     label="Due Today"        value={stats.dueTodayCount}         sub="tenants"  color="purple" />
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenant, property, owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                statusFilter === s
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600',
              ].join(' ')}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load rent records: {error.message}
        </div>
      )}

      {/* Table — desktop */}
      {loading ? (
        <RentSkeletonTable rows={6} />
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Tenant', 'Property', 'Owner', 'Monthly Rent', 'Paid', 'Balance', 'Status', 'Due Day', ''].map(
                    (h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-sm text-gray-400">
                      No rent records found.
                    </td>
                  </tr>
                ) : (
                  rents.map((r) => (
                    <tr
                      key={r.id}
                      className="group border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/rent/${r.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-xs flex-shrink-0">
                            {(r.tenantName || 'T')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{r.tenantName || '—'}</p>
                            {r.lastPaymentDate && (
                              <p className="text-[11px] text-gray-400">
                                Last paid: {fmtDate(r.lastPaymentDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-700 truncate max-w-[140px]">{r.propertyName || '—'}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{r.propertyAddress || ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-gray-600">{r.ownerName || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800">{fmt(r.monthlyRent)}</span>
                        <span className="text-[11px] text-gray-400">/mo</span>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-medium text-green-700">{fmt(r.paidAmount)}</td>
                      <td className="py-3.5 px-4 text-sm font-medium text-red-600">
                        {Number(r.outstandingBalance) > 0 ? fmt(r.outstandingBalance) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <RentStatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-sm text-gray-500">
                        {r.dueDay ? `Day ${r.dueDay}` : '—'}
                      </td>
                      <td className="py-3.5 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/rent/${r.id}`)}
                            title="View"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/rent/${r.id}/edit`)}
                            title="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {rents.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
                No rent records found.
              </div>
            ) : (
              rents.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                  onClick={() => navigate(`/admin/rent/${r.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-sm flex-shrink-0">
                        {(r.tenantName || 'T')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.tenantName || '—'}</p>
                        <p className="text-xs text-gray-500">{r.propertyName || '—'}</p>
                      </div>
                    </div>
                    <RentStatusBadge status={r.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">Rent</p>
                      <p className="text-sm font-bold text-gray-800">{fmt(r.monthlyRent)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">Paid</p>
                      <p className="text-sm font-semibold text-green-700">{fmt(r.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">Balance</p>
                      <p className="text-sm font-semibold text-red-600">
                        {Number(r.outstandingBalance) > 0 ? fmt(r.outstandingBalance) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500">
                {totalCount} record{totalCount !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - page) <= 2)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={[
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                        n === page
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500',
                      ].join(' ')}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <RentDeleteDialog
          rent={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
