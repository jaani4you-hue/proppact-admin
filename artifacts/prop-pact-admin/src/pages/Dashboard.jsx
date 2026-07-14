import {
  Building2,
  FolderOpen,
  ShieldCheck,
  Scale,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  DatabaseZap,
  Loader2,
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import { useActivityLog }    from '../hooks/useActivityLog.js';

// ── Formatters ────────────────────────────────────────────────────────────────

/**
 * Returns a display-ready string or null (null → show "--").
 * null input = still loading, undefined = error/no data → both show "--".
 */
function formatCount(value) {
  if (value === null || value === undefined) return null;
  return value.toLocaleString('en-IN');
}

function formatRevenue(amount) {
  if (amount === null || amount === undefined) return null;
  if (amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ── Stat Card metadata (no values — values come from Firestore) ───────────────

const STAT_META = [
  {
    id: 'properties',
    label: 'Total Properties',
    icon: Building2,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    accent: 'border-orange-200',
  },
  {
    id: 'projects',
    label: 'Total Projects',
    icon: FolderOpen,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'border-violet-200',
  },
  {
    id: 'verification',
    label: 'Pending Verification',
    icon: ShieldCheck,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'border-amber-200',
  },
  {
    id: 'legal',
    label: 'Pending Legal Requests',
    icon: Scale,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    accent: 'border-red-200',
  },
  {
    id: 'users',
    label: 'Total Users',
    icon: Users,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accent: 'border-teal-200',
  },
  {
    id: 'revenue',
    label: 'Total Revenue',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'border-emerald-200',
  },
];

// ── StatCard ──────────────────────────────────────────────────────────────────

/**
 * value = null  → "--" in muted gray  (loading)
 * value = string → shown in bold dark  (live data, could be "0")
 */
function StatCard({ label, value, icon: Icon, iconBg, iconColor, accent }) {
  const isEmpty = value === null;
  return (
    <div
      className={[
        'relative bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
        accent,
      ].join(' ')}
    >
      {/* Decorative blob */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gray-50 opacity-60" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
            {label}
          </p>
          <p
            className={[
              'mt-1.5 text-2xl font-bold leading-none transition-colors duration-300',
              isEmpty ? 'text-gray-300' : 'text-gray-800',
            ].join(' ')}
          >
            {isEmpty ? '--' : value}
          </p>
          <p
            className={[
              'mt-2 text-xs font-medium transition-colors duration-300',
              isEmpty ? 'text-gray-300' : 'text-gray-400',
            ].join(' ')}
          >
            {isEmpty ? 'Awaiting Firestore' : 'Live from Firestore'}
          </p>
        </div>
        <div
          className={[
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
            iconBg,
          ].join(' ')}
        >
          <Icon className={['h-5 w-5', iconColor].join(' ')} />
        </div>
      </div>
    </div>
  );
}

// ── Activity Table helpers ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Pending:     { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  pending:     { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  'In Review': { label: 'In Review', dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  'in review': { label: 'In Review', dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  Approved:    { label: 'Approved',  dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  approved:    { label: 'Approved',  dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected:    { label: 'Rejected',  dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
  rejected:    { label: 'Rejected',  dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
};

const MODULE_BADGE = {
  Properties:    'bg-orange-50 text-orange-700 border-orange-200',
  Verification:  'bg-amber-50 text-amber-700 border-amber-200',
  Legal:         'bg-red-50 text-red-700 border-red-200',
  Dealers:       'bg-violet-50 text-violet-700 border-violet-200',
  Rent:          'bg-teal-50 text-teal-700 border-teal-200',
  Projects:      'bg-blue-50 text-blue-700 border-blue-200',
  Users:         'bg-gray-100 text-gray-600 border-gray-200',
  Notifications: 'bg-pink-50 text-pink-700 border-pink-200',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending'];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        cfg.bg, cfg.text, cfg.border,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
      {cfg.label}
    </span>
  );
}

function ModuleBadge({ module: mod }) {
  const cls = MODULE_BADGE[mod] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span
      className={[
        'inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium',
        cls,
      ].join(' ')}
    >
      {mod}
    </span>
  );
}

function getInitials(name) {
  if (!name || name === 'System') return 'SY';
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ── Quick Stats (banner) ───────────────────────────────────────────────────────

function QuickStat({ icon: Icon, label, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={['flex h-9 w-9 items-center justify-center rounded-lg', color].join(' ')}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        {/* No Firestore source defined for quick-stats yet */}
        <p className="text-lg font-bold text-white/40 leading-none">--</p>
        <p className="text-xs text-orange-100 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Activity empty / loading states ───────────────────────────────────────────

function ActivityEmptyState({ loading }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
        {loading ? (
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
        ) : (
          <DatabaseZap className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <p className="text-sm font-semibold text-gray-500">
        {loading ? 'Loading activity…' : 'No activity available'}
      </p>
      {!loading && (
        <p className="mt-1 text-xs text-gray-400 max-w-xs">
          Activity will appear here once records are added to adminLogs.
        </p>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const statsData  = useDashboardStats();
  const activities = useActivityLog(); // null = loading | Row[]

  // Map stat-card IDs → formatted display values (null = still loading → "--")
  const cardValues = {
    properties:   formatCount(statsData.properties),
    projects:     formatCount(statsData.projects),
    verification: formatCount(statsData.pendingVerification),
    legal:        formatCount(statsData.pendingLegal),
    users:        formatCount(statsData.users),
    revenue:      formatRevenue(statsData.revenue),
  };

  const activityLoading = activities === null;
  const activityRows    = activities ?? [];

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white shadow-md shadow-orange-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold">Welcome back, Admin 👋</h2>
            <p className="mt-0.5 text-sm text-orange-100">
              Here's what's happening across PropPact today.
            </p>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <QuickStat icon={CheckCircle2} label="Resolved today"  color="bg-white/20" />
            <QuickStat icon={Clock}        label="Awaiting action" color="bg-white/20" />
            <QuickStat icon={AlertCircle}  label="Urgent items"    color="bg-red-400/70" />
          </div>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_META.map((s) => (
          <StatCard
            key={s.id}
            label={s.label}
            value={cardValues[s.id]}
            icon={s.icon}
            iconBg={s.iconBg}
            iconColor={s.iconColor}
            accent={s.accent}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest actions across all modules</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-medium text-orange-600">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live
            </span>
            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200 transition-colors">
              View All
            </button>
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="py-3 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-8">#</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Activity</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">User</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Module</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Date & Time</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="py-3 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {(activityLoading || activityRows.length === 0) ? (
                <tr>
                  <td colSpan={7}>
                    <ActivityEmptyState loading={activityLoading} />
                  </td>
                </tr>
              ) : (
                activityRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-orange-50/40 transition-colors duration-100 border-b border-gray-50"
                  >
                    <td className="py-3.5 pl-5 pr-3 text-xs text-gray-400 font-mono">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <span className="text-sm text-gray-700 font-medium leading-snug line-clamp-2">
                        {row.activity}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[9px] font-bold">
                          {getInitials(row.user)}
                        </div>
                        <span className="text-sm text-gray-700 whitespace-nowrap">{row.user}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <ModuleBadge module={row.module} />
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <p className="text-xs text-gray-700">{row.date}</p>
                      <p className="text-[11px] text-gray-400">{row.time}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3.5 pl-3 pr-5">
                      <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition-colors opacity-0 group-hover:opacity-100">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card list — mobile */}
        <div className="sm:hidden">
          {(activityLoading || activityRows.length === 0) ? (
            <ActivityEmptyState loading={activityLoading} />
          ) : (
            <div className="divide-y divide-gray-100">
              {activityRows.map((row) => (
                <div key={row.id} className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700 leading-snug flex-1">
                      {row.activity}
                    </p>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-500">{row.user}</span>
                    <ModuleBadge module={row.module} />
                    <span className="text-xs text-gray-400">
                      {row.date}, {row.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-wrap gap-2">
          <p className="text-xs text-gray-400">
            {activityLoading
              ? 'Loading activity…'
              : activityRows.length === 0
                ? 'No activity available'
                : `Showing ${activityRows.length} recent ${activityRows.length === 1 ? 'activity' : 'activities'}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40"
              disabled
            >
              Previous
            </button>
            <button
              className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
