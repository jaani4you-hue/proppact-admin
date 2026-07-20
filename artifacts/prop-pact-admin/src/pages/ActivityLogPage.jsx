/**
 * ActivityLogPage — full paginated, filterable activity log.
 * Real-time Firestore subscription via activityLogService.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Search, Filter, Download, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Info, Clock,
} from 'lucide-react';
import { subscribeToActivityLogs } from '../services/activityLogService.js';

// ── Constants ──────────────────────────────────────────────────────────────────
const MODULES = [
  'All', 'Properties', 'Projects', 'Tenants', 'Owners', 'Dealers',
  'Vendors', 'Complaints', 'Maintenance', 'Legal', 'Rent', 'Users',
  'Notifications', 'Settings',
];

const STATUSES = ['All', 'Approved', 'Rejected', 'Info', 'Pending'];

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTimestamp(createdAt) {
  if (!createdAt) return { date: '--', time: '--', raw: null };
  let d;
  if (typeof createdAt?.toDate === 'function') d = createdAt.toDate();
  else if (createdAt instanceof Date) d = createdAt;
  else d = new Date(createdAt);
  if (isNaN(d.getTime())) return { date: '--', time: '--', raw: null };
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    raw : d,
  };
}

function statusConfig(status) {
  switch (status) {
    case 'Approved': return { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  dot: 'bg-green-500'  };
    case 'Rejected': return { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    dot: 'bg-red-500'    };
    case 'Pending':  return { icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' };
    default:         return { icon: Info,           color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-200',   dot: 'bg-blue-500'   };
  }
}

const MODULE_COLORS = {
  Properties: 'bg-blue-100 text-blue-700',
  Projects:   'bg-violet-100 text-violet-700',
  Tenants:    'bg-green-100 text-green-700',
  Owners:     'bg-purple-100 text-purple-700',
  Dealers:    'bg-pink-100 text-pink-700',
  Vendors:    'bg-yellow-100 text-yellow-700',
  Complaints: 'bg-red-100 text-red-700',
  Maintenance:'bg-orange-100 text-orange-700',
  Legal:      'bg-indigo-100 text-indigo-700',
  Rent:       'bg-teal-100 text-teal-700',
  Users:      'bg-gray-100 text-gray-700',
};

function moduleColor(mod) {
  return MODULE_COLORS[mod] ?? 'bg-gray-100 text-gray-600';
}

function exportCSV(rows) {
  const headers = ['Date', 'Time', 'Module', 'Activity', 'User', 'Status'];
  const lines   = rows.map((r) => [
    r.date, r.time, r.module,
    `"${(r.activity || '').replace(/"/g, '""')}"`,
    r.user, r.status,
  ].join(','));
  const csv  = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
  const [allLogs,    setAllLogs]    = useState(null); // null = loading
  const [error,      setError]      = useState(null);

  // Filters
  const [search,     setSearch]     = useState('');
  const [modFilter,  setModFilter]  = useState('All');
  const [statFilter, setStatFilter] = useState('All');
  const [page,       setPage]       = useState(1);

  // Subscribe to ALL logs (large limit); filter client-side for full UX
  useEffect(() => {
    setAllLogs(null);
    const unsub = subscribeToActivityLogs(
      ({ logs, error: err }) => {
        if (err) { setError(err.message); setAllLogs([]); }
        else     { setAllLogs(logs.map(mapLog)); setError(null); }
      },
      { moduleFilter: 'all', pageSize: 500 },
    );
    return unsub;
  }, []);

  // Reset page on filter change
  useEffect(() => setPage(1), [search, modFilter, statFilter]);

  const filtered = useMemo(() => {
    let rows = allLogs ?? [];
    if (modFilter  !== 'All')      rows = rows.filter((r) => r.module === modFilter);
    if (statFilter !== 'All')      rows = rows.filter((r) => r.status === statFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.activity?.toLowerCase().includes(q) ||
        r.user?.toLowerCase().includes(q)     ||
        r.module?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [allLogs, modFilter, statFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const loading = allLogs === null;

  return (
    <div className="space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <Activity className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Loading…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`}
              {!loading && allLogs?.length !== filtered.length && ` (filtered from ${allLogs.length})`}
            </p>
          </div>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          disabled={loading || filtered.length === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-52 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search activity, user, or module…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 min-w-0"
            />
          </div>

          {/* Module filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              {MODULES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statFilter}
            onChange={(e) => setStatFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Activity className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-600">No activity found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search || modFilter !== 'All' || statFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Actions you take in the admin panel will appear here'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Date / Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map((row) => {
                    const s = statusConfig(row.status);
                    const StatusIcon = s.icon;
                    return (
                      <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-medium text-gray-700">{row.date}</p>
                          <p className="text-[10px] text-gray-400">{row.time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${moduleColor(row.module)}`}>
                            {row.module}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-800">{row.activity}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{row.user}</td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {row.status}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paged.map((row) => {
                const s = statusConfig(row.status);
                const StatusIcon = s.icon;
                return (
                  <div key={row.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${moduleColor(row.module)}`}>
                        {row.module}
                      </span>
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.color}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {row.status}
                      </div>
                    </div>
                    <p className="text-sm text-gray-800">{row.activity}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{row.user}</span>
                      <span>·</span>
                      <span>{row.date}</span>
                      <span>{row.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {safePage} of {totalPages} · {filtered.length} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg;
              if (totalPages <= 7) {
                pg = i + 1;
              } else if (safePage <= 4) {
                pg = i < 6 ? i + 1 : totalPages;
              } else if (safePage >= totalPages - 3) {
                pg = i === 0 ? 1 : totalPages - 6 + i;
              } else {
                pg = i === 0 ? 1 : safePage - 2 + (i - 1);
              }
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors
                    ${safePage === pg
                      ? 'border-orange-400 bg-orange-500 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                    }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapLog(doc) {
  const d = doc;
  const { date, time } = parseTimestamp(d.createdAt ?? d.timestamp ?? d.date);
  return {
    id      : d.id,
    activity: d.activity ?? d.action ?? d.description ?? '—',
    user    : d.user     ?? d.userName ?? d.performedBy ?? 'System',
    module  : d.module   ?? d.type     ?? d.category    ?? '—',
    status  : d.status   ?? 'Info',
    date,
    time,
  };
}
