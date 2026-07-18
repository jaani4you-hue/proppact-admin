import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  MessageSquareWarning, CheckCircle2, Clock, XCircle, AlertTriangle, Link2, Zap,
} from 'lucide-react';
import { useComplaints } from '../../hooks/useComplaints.js';
import ComplaintStatusBadge from '../../components/complaints/ComplaintStatusBadge.jsx';
import ComplaintPriorityBadge from '../../components/complaints/ComplaintPriorityBadge.jsx';
import { ComplaintSkeletonTable } from '../../components/complaints/ComplaintSkeletonTable.jsx';
import ComplaintDeleteDialog from '../../components/complaints/ComplaintDeleteDialog.jsx';

const STATUS_FILTERS   = ['all', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const PRIORITY_FILTERS = ['all', 'Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = [
  'all', 'Water/Plumbing', 'Electrical', 'Structural/Civil', 'Noise/Disturbance',
  'Cleaning/Hygiene', 'Security', 'Lift/Elevator', 'Parking', 'Common Area', 'Other',
];

function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ icon: Icon, label, value, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-50  text-orange-500  border-orange-100',
    red   : 'bg-red-50     text-red-500     border-red-100',
    yellow: 'bg-yellow-50  text-yellow-600  border-yellow-100',
    green : 'bg-green-50   text-green-600   border-green-100',
    gray  : 'bg-gray-50    text-gray-500    border-gray-100',
    blue  : 'bg-blue-50    text-blue-600    border-blue-100',
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

export default function ComplaintList() {
  const navigate = useNavigate();
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [priorityFilter,  setPriorityFilter]  = useState('all');
  const [categoryFilter,  setCategoryFilter]  = useState('all');
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [showPriFilter,   setShowPriFilter]   = useState(false);
  const [showCatFilter,   setShowCatFilter]   = useState(false);

  const { complaints, loading, error, page, setPage, totalPages, totalCount, stats } =
    useComplaints({ statusFilter, priorityFilter, categoryFilter, search });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Complaint Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Log, track and resolve property complaints — linked to maintenance & vendors
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/complaints/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={MessageSquareWarning} label="Total"       value={stats.total}      color="orange" />
        <StatCard icon={AlertTriangle}        label="Open"        value={stats.open}       color="red"    />
        <StatCard icon={Clock}                label="In Progress" value={stats.inProgress} color="yellow" />
        <StatCard icon={CheckCircle2}         label="Resolved"    value={stats.resolved}   color="green"  />
        <StatCard icon={Zap}                  label="Critical"    value={stats.critical}   color="red"    />
        <StatCard icon={Link2}                label="Linked"      value={stats.linked}     color="blue"   />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaint, property, complainant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPriFilter((v) => !v)}
              className={['inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                priorityFilter !== 'all' ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600'].join(' ')}
            >
              {priorityFilter === 'all' ? 'Priority' : priorityFilter}
            </button>
            <button
              onClick={() => setShowCatFilter((v) => !v)}
              className={['inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                categoryFilter !== 'all' ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'].join(' ')}
            >
              {categoryFilter === 'all' ? 'Category' : categoryFilter}
            </button>
          </div>
        </div>

        {/* Status chips */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={['rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                statusFilter === s ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'].join(' ')}>
              {s === 'all' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        {showPriFilter && (
          <div className="flex gap-1 flex-wrap">
            {PRIORITY_FILTERS.map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={['rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  priorityFilter === p ? 'bg-red-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'].join(' ')}>
                {p === 'all' ? 'All Priorities' : p}
              </button>
            ))}
          </div>
        )}

        {showCatFilter && (
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={['rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  categoryFilter === c ? 'bg-blue-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'].join(' ')}>
                {c === 'all' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load complaints: {error.message}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <ComplaintSkeletonTable rows={6} />
      ) : (
        <>
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Complaint', 'Category', 'Complainant', 'Property', 'Priority', 'Status', 'Filed', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-gray-400">No complaints found.</td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id}
                      className="group border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/complaints/${c.id}`)}>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-800 text-sm">{c.title || '—'}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-orange-500 font-mono">{c.complaintNumber}</p>
                          {c.maintenanceId && <Link2 className="h-3 w-3 text-blue-400" title="Linked to maintenance" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{c.category || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex-shrink-0">
                            {(c.complainantName || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">{c.complainantName || '—'}</p>
                            {c.complainantType && <p className="text-[10px] text-gray-400">{c.complainantType}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-600 truncate max-w-[120px]">{c.propertyName || '—'}</p>
                        {c.unitNumber && <p className="text-[11px] text-gray-400">Unit {c.unitNumber}</p>}
                      </td>
                      <td className="py-3.5 px-4"><ComplaintPriorityBadge priority={c.priority} /></td>
                      <td className="py-3.5 px-4"><ComplaintStatusBadge status={c.status} /></td>
                      <td className="py-3.5 px-4"><p className="text-xs text-gray-500">{fmtDate(c.createdAt)}</p></td>
                      <td className="py-3.5 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/admin/complaints/${c.id}`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigate(`/admin/complaints/${c.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(c)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
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
            {complaints.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">No complaints found.</div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                  onClick={() => navigate(`/admin/complaints/${c.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{c.title || '—'}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-orange-500 font-mono">{c.complaintNumber}</p>
                        {c.maintenanceId && <Link2 className="h-3 w-3 text-blue-400" />}
                      </div>
                    </div>
                    <ComplaintStatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium">{c.category}</span>
                    <ComplaintPriorityBadge priority={c.priority} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100 text-xs">
                    <div><p className="text-gray-400 mb-0.5">Complainant</p><p className="font-medium text-gray-700">{c.complainantName || '—'}</p></div>
                    <div><p className="text-gray-400 mb-0.5">Property</p><p className="font-medium text-gray-700 truncate">{c.propertyName || '—'}</p></div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500">{totalCount} complaint{totalCount !== 1 ? 's' : ''}</p>
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
        <ComplaintDeleteDialog complaint={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
