import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Scale, CheckCircle2, XCircle, Clock, AlertCircle, FolderOpen,
  Calendar, BarChart3, TrendingUp,
} from 'lucide-react';
import { useLegalCases } from '../../hooks/useLegalCases.js';
import LegalStatusBadge from '../../components/legal/LegalStatusBadge.jsx';
import LegalCaseTypeBadge from '../../components/legal/LegalCaseTypeBadge.jsx';
import { LegalSkeletonTable } from '../../components/legal/LegalSkeletonTable.jsx';
import LegalDeleteDialog from '../../components/legal/LegalDeleteDialog.jsx';

const STATUS_FILTERS = ['all', 'Active', 'Pending', 'Won', 'Lost', 'On Hold', 'Closed'];
const TYPE_FILTERS   = ['all', 'Legal Notice', 'Rent Agreement', 'Eviction', 'Court Case', 'Other'];

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}
function fmtDate(v) {
  if (!v) return '—';
  if (v?.toDate) return v.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ icon: Icon, label, value, sub, color = 'orange' }) {
  const colors = {
    orange : 'bg-orange-50  text-orange-500  border-orange-100',
    green  : 'bg-green-50   text-green-600   border-green-100',
    yellow : 'bg-yellow-50  text-yellow-600  border-yellow-100',
    red    : 'bg-red-50     text-red-500     border-red-100',
    blue   : 'bg-blue-50    text-blue-600    border-blue-100',
    violet : 'bg-violet-50  text-violet-600  border-violet-100',
    gray   : 'bg-gray-50    text-gray-500    border-gray-100',
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${colors[color] ?? colors.gray}`}>
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

export default function LegalList() {
  const navigate = useNavigate();
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const { cases, loading, error, page, setPage, totalPages, totalCount, stats } =
    useLegalCases({ statusFilter, typeFilter, search });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Legal Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track legal cases, notices, agreements, evictions and court hearings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/legal/new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Case
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard icon={Scale}        label="Total Cases"    value={stats.total}     color="orange" />
        <StatCard icon={AlertCircle}  label="Active"         value={stats.active}    color="green"  />
        <StatCard icon={Clock}        label="Pending"        value={stats.pending}   color="yellow" />
        <StatCard icon={CheckCircle2} label="Won"            value={stats.won}       color="blue"   />
        <StatCard icon={XCircle}      label="Lost"           value={stats.lost}      color="red"    />
        <StatCard icon={Calendar}     label="Hearings (7d)"  value={stats.upcoming7} color="violet" />
        <StatCard icon={FolderOpen}   label="Closed"         value={stats.closed}    color="gray"   />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Search + type toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search case, client, advocate…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            onClick={() => setShowTypeFilter((v) => !v)}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              typeFilter !== 'all'
                ? 'border-orange-300 bg-orange-50 text-orange-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600',
            ].join(' ')}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {typeFilter === 'all' ? 'Filter by Type' : typeFilter}
          </button>
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

        {/* Type chips (collapsible) */}
        {showTypeFilter && (
          <div className="flex gap-1 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  typeFilter === t
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600',
                ].join(' ')}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load legal cases: {error.message}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LegalSkeletonTable rows={6} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Case', 'Type', 'Client', 'Advocate', 'Property', 'Status', 'Next Hearing', ''].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                      No legal cases found.
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => (
                    <tr
                      key={c.id}
                      className="group border-b border-gray-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/legal/${c.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{c.title || '—'}</p>
                        <p className="text-[11px] text-orange-500 font-mono mt-0.5">{c.caseNumber}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <LegalCaseTypeBadge type={c.caseType} showIcon />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex-shrink-0">
                            {(c.clientName || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">{c.clientName || '—'}</p>
                            {c.clientType && (
                              <p className="text-[10px] text-gray-400">{c.clientType}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-600">{c.advocateName || '—'}</p>
                        {c.advocatePhone && (
                          <p className="text-[11px] text-gray-400">{c.advocatePhone}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-gray-600 truncate max-w-[130px]">{c.propertyName || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <LegalStatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {c.nextHearingDate ? (
                          <span className={`text-xs font-medium ${
                            c.nextHearingDate <= new Date().toISOString().slice(0, 10)
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {fmtDate(c.nextHearingDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/legal/${c.id}`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/legal/${c.id}/edit`)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
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
            {cases.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
                No legal cases found.
              </div>
            ) : (
              cases.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                  onClick={() => navigate(`/admin/legal/${c.id}`)}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.title || '—'}</p>
                      <p className="text-[11px] text-orange-500 font-mono">{c.caseNumber}</p>
                    </div>
                    <LegalStatusBadge status={c.status} />
                  </div>
                  <div className="mb-2.5">
                    <LegalCaseTypeBadge type={c.caseType} showIcon />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Client</p>
                      <p className="font-medium text-gray-700">{c.clientName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Advocate</p>
                      <p className="font-medium text-gray-700">{c.advocateName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Property</p>
                      <p className="font-medium text-gray-700 truncate">{c.propertyName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Next Hearing</p>
                      <p className={`font-medium ${c.nextHearingDate && c.nextHearingDate <= new Date().toISOString().slice(0,10) ? 'text-red-600' : 'text-gray-700'}`}>
                        {fmtDate(c.nextHearingDate)}
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
                {totalCount} case{totalCount !== 1 ? 's' : ''}
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

      {deleteTarget && (
        <LegalDeleteDialog
          legalCase={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
