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
} from 'lucide-react';

// ── Stat Cards ────────────────────────────────────────────────────────────────
// Values are intentionally "--" until Firestore is connected.

const stats = [
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

function StatCard({ label, icon: Icon, iconBg, iconColor, accent }) {
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
          <p className="mt-1.5 text-2xl font-bold text-gray-300 leading-none">--</p>
          <p className="mt-2 text-xs font-medium text-gray-300">Awaiting Firestore</p>
        </div>
        <div className={['flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', iconBg].join(' ')}>
          <Icon className={['h-5 w-5', iconColor].join(' ')} />
        </div>
      </div>
    </div>
  );
}

// ── Activity Table ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Pending:     { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  'In Review': { label: 'In Review', dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  Approved:    { label: 'Approved',  dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected:    { label: 'Rejected',  dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
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

// No activity rows until Firestore is connected.
const activities = [];

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

function ModuleBadge({ module }) {
  const cls = MODULE_BADGE[module] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={['inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium', cls].join(' ')}>
      {module}
    </span>
  );
}

// ── Quick Stats Row ────────────────────────────────────────────────────────────

function QuickStat({ icon: Icon, label, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={['flex h-9 w-9 items-center justify-center rounded-lg', color].join(' ')}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-white/40 leading-none">--</p>
        <p className="text-xs text-orange-100 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function ActivityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
        <DatabaseZap className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-500">No activity data</p>
      <p className="mt-1 text-xs text-gray-400 max-w-xs">
        Activity will appear here once Firestore is connected and data is available.
      </p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
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
        {stats.map((s) => (
          <StatCard key={s.id} {...s} />
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
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <ActivityEmptyState />
                  </td>
                </tr>
              ) : (
                activities.map((row, i) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-orange-50/40 transition-colors duration-100 border-b border-gray-50"
                  >
                    <td className="py-3.5 pl-5 pr-3 text-xs text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <span className="text-sm text-gray-700 font-medium leading-snug line-clamp-2">
                        {row.activity}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[9px] font-bold">
                          {row.user.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
          {activities.length === 0 ? (
            <ActivityEmptyState />
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((row) => (
                <div key={row.id} className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700 leading-snug flex-1">{row.activity}</p>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-500">{row.user}</span>
                    <ModuleBadge module={row.module} />
                    <span className="text-xs text-gray-400">{row.date}, {row.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-wrap gap-2">
          <p className="text-xs text-gray-400">
            {activities.length === 0
              ? 'No records — connect Firestore to load activity'
              : `Showing ${activities.length} recent activities`}
          </p>
          <div className="flex items-center gap-1">
            <button className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40" disabled>
              Previous
            </button>
            <button className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors disabled:opacity-40" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
