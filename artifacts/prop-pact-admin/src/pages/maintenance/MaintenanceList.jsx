import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Wrench, Clock, CheckCircle2, AlertTriangle, BarChart3, Zap,
} from 'lucide-react';
import { useMaintenance } from '../../hooks/useMaintenance.js';
import MaintenanceStatusBadge from '../../components/maintenance/MaintenanceStatusBadge.jsx';
import MaintenancePriorityBadge from '../../components/maintenance/MaintenancePriorityBadge.jsx';
import { MaintenanceSkeletonTable } from '../../components/maintenance/MaintenanceSkeletonTable.jsx';
import MaintenanceDeleteDialog from '../../components/maintenance/MaintenanceDeleteDialog.jsx';

const STATUS_FILTERS   = ['all', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];
const PRIORITY_FILTERS = ['all', 'Low', 'Medium', 'High', 'Emergency'];
const CATEGORIES = [
  'all', 'Plumbing', 'Electrical', 'Civil/Structural', 'Painting', 'Carpentry',
  'HVAC', 'Pest Control', 'Cleaning', 'Lift/Elevator', 'Other',
];

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ icon: Icon, label, value, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-50  text-orange-500  border-orange-100',
    yellow: 'bg-yellow-50  text-yellow-600  border-yellow-100',
    blue  : 'bg-blue-50    text-blue-600    border-blue-100',
    green : 'bg-green-50   text-green-600   border-green-100',
    red   : 'bg-red-50     text-red-500     border-red-100',
    gray  : 'bg-gray-50    text-gray-500    border-gray-100',
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${colors[color] ?? colors.gray}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function MaintenanceList() {
  const navigate = useNavigate();
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [priorityFilter,  setPriorityFilter]  = useState('all');
  const [categoryFilter,  setCategoryFilter]  = useState('all');
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [showPriFilter,   setShowPriFilter]   = useState(false);
  const [showCatFilter,   setShowCatFilter]   = useState(false);

  const { requests, loading, error, page, setPage, totalPages, totalCount, stats } =
    useMaintenance({ statusFilter, priorityFilter, categoryFilter, search });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track and manage property maintenance work orders</p>
        </div>
        <button
          onClick={() => navigate('/admin/maintenance/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Wrench}       label="Total"       value={stats.total}      color="orange" />
        <StatCard icon={Clock}        label="Pending"     value={stats.pending}    color="yellow" />
        <StatCard icon={BarChart3}    label="In Progress" value={stats.inProgress} color="blue"   />
        <StatCard icon={CheckCircle2} label="Completed"   value={stats.completed}  color="green"  />
        <StatCard icon={Zap}          label="Emergency"   value={stats.emergency}  color="red"    />
        <StatCard icon={AlertTriangle} label="Cancelled"  value={stats.cancelled}  color="gray"   />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search request, property, vendor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPriFilter((v) => !v)}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                priorityFilter !== 'all'
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600',
              ].join(' ')}
            >
              {priorityFilter === 'all' ? 'Priority' : priorityFilter}
            </button>
            <button
              onClick={() => setShowCatFilter((v) => !v)}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                categoryFilter !== 'all'
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600',
              ].join(' ')}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {categoryFilter === 'all' ? 'Category' : categoryFilter}
            </button>
          </div>
        </div>

        {/* Status chips */}
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
              {s === 'all' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        {showPriFilter && (
          <div className="flex gap-1 flex-wrap">
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  priorityFilter === p
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600',
                ].join(' ')}
              >
                {p === 'all' ? 'All Priorities' : p}
              </button>
            ))}
          </div>
        )}

        {showCatFilter && (
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  categoryFilter === c
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600',
                ].join(' ')}
              >
                {c === 'all' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load maintenance requests: {error.message}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <MaintenanceSkeletonTable rows={6} />
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Request', 'Category', 'Property', 'Vendor', 'Sched. Date', 'Priority', 'Status', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-gray-400">No maintenance requests found.</td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr
                      key={r.id}
                      className="group border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/maintenance/${r.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-800 text-sm">{r.title || '—'}</p>
                        <p className="text-[11px] text-orange-500 font-mono">{r.maintenanceNumber}</p>
                        {r.complaintNumber && (
                          <p className="text-[10px] text-blue-500 mt-0.5">← {r.complaintNumber}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{r.category || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-700 truncate max-w-[130px]">{r.propertyName || '—'}</p>
                        {r.unitNumber && <p className="text-[11px] text-gray-400">Unit {r.unitNumber}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-600">{r.assignedVendorName || <span className="text-gray-300">Unassigned</span>}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-gray-600">{fmtDate(r.scheduledDate)}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <MaintenancePriorityBadge priority={r.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <MaintenanceStatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/maintenance/${r.id}`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/maintenance/${r.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
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
            {requests.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">No requests found.</div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                  onClick={() => navigate(`/admin/maintenance/${r.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{r.title || '—'}</p>
                      <p className="text-[11px] text-orange-500 font-mono">{r.maintenanceNumber}</p>
                    </div>
                    <MaintenanceStatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{r.category}</span>
                    <MaintenancePriorityBadge priority={r.priority} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Property</p>
                      <p className="font-medium text-gray-700 truncate">{r.propertyName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Vendor</p>
                      <p className="font-medium text-gray-700">{r.assignedVendorName || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500">{totalCount} request{totalCount !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => Math.abs(n - page) <= 2).map((n) => (
                  <button key={n} onClick={() => setPage(n)}
                    className={['flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      n === page ? 'bg-orange-500 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-500'].join(' ')}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <MaintenanceDeleteDialog
          request={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
