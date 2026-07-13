import {
  Building2,
  FolderOpen,
  ShieldCheck,
  Scale,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

// ── Stat Cards ────────────────────────────────────────────────────────────────

const stats = [
  {
    id: 'properties',
    label: 'Total Properties',
    value: '1,284',
    sub: '+12 this month',
    trend: 'up',
    icon: Building2,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    accent: 'border-orange-200',
  },
  {
    id: 'projects',
    label: 'Total Projects',
    value: '47',
    sub: '+3 this month',
    trend: 'up',
    icon: FolderOpen,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'border-violet-200',
  },
  {
    id: 'verification',
    label: 'Pending Verification',
    value: '23',
    sub: '5 marked urgent',
    trend: 'neutral',
    icon: ShieldCheck,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'border-amber-200',
  },
  {
    id: 'legal',
    label: 'Pending Legal Requests',
    value: '8',
    sub: '2 marked urgent',
    trend: 'down',
    icon: Scale,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    accent: 'border-red-200',
  },
  {
    id: 'users',
    label: 'Total Users',
    value: '5,612',
    sub: '+148 this month',
    trend: 'up',
    icon: Users,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accent: 'border-teal-200',
  },
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '₹4.2 Cr',
    sub: '+8.3% this month',
    trend: 'up',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'border-emerald-200',
  },
];

function StatCard({ label, value, sub, trend, icon: Icon, iconBg, iconColor, accent }) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

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
          <p className="mt-1.5 text-2xl font-bold text-gray-800 leading-none">{value}</p>
          <div className={['mt-2 flex items-center gap-1 text-xs font-medium', trendColor].join(' ')}>
            {TrendIcon && <TrendIcon className="h-3.5 w-3.5" />}
            <span>{sub}</span>
          </div>
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
  Pending:   { label: 'Pending',   dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  'In Review': { label: 'In Review', dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  Approved:  { label: 'Approved',  dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected:  { label: 'Rejected',  dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
};

const MODULE_BADGE = {
  Properties:   'bg-orange-50 text-orange-700 border-orange-200',
  Verification: 'bg-amber-50 text-amber-700 border-amber-200',
  Legal:        'bg-red-50 text-red-700 border-red-200',
  Dealers:      'bg-violet-50 text-violet-700 border-violet-200',
  Rent:         'bg-teal-50 text-teal-700 border-teal-200',
  Projects:     'bg-blue-50 text-blue-700 border-blue-200',
  Users:        'bg-gray-100 text-gray-600 border-gray-200',
  Notifications:'bg-pink-50 text-pink-700 border-pink-200',
};

const activities = [
  {
    id: 1,
    activity: 'New property listing submitted for review',
    user: 'Rajesh Kumar',
    module: 'Properties',
    date: 'Jul 13, 2026',
    time: '9:42 AM',
    status: 'Pending',
  },
  {
    id: 2,
    activity: 'KYC verification document uploaded',
    user: 'Priya Sharma',
    module: 'Verification',
    date: 'Jul 13, 2026',
    time: '9:15 AM',
    status: 'In Review',
  },
  {
    id: 3,
    activity: 'Legal agreement draft requested',
    user: 'Amit Patel',
    module: 'Legal',
    date: 'Jul 13, 2026',
    time: '8:58 AM',
    status: 'Pending',
  },
  {
    id: 4,
    activity: 'Dealer account registration approved',
    user: 'Sunita Reddy',
    module: 'Dealers',
    date: 'Jul 13, 2026',
    time: '8:30 AM',
    status: 'Approved',
  },
  {
    id: 5,
    activity: 'Rent agreement created and sent to tenant',
    user: 'Vikram Singh',
    module: 'Rent',
    date: 'Jul 12, 2026',
    time: '6:20 PM',
    status: 'Approved',
  },
  {
    id: 6,
    activity: 'Property ownership verification completed',
    user: 'Meena Nair',
    module: 'Verification',
    date: 'Jul 12, 2026',
    time: '5:45 PM',
    status: 'Approved',
  },
  {
    id: 7,
    activity: 'Property boundary dispute filed',
    user: 'Arjun Desai',
    module: 'Legal',
    date: 'Jul 12, 2026',
    time: '4:10 PM',
    status: 'In Review',
  },
  {
    id: 8,
    activity: 'New residential project registered',
    user: 'Kavya Menon',
    module: 'Projects',
    date: 'Jul 12, 2026',
    time: '3:00 PM',
    status: 'Pending',
  },
  {
    id: 9,
    activity: 'Suspicious activity flagged on account',
    user: 'Rohit Verma',
    module: 'Users',
    date: 'Jul 12, 2026',
    time: '1:30 PM',
    status: 'Rejected',
  },
  {
    id: 10,
    activity: 'Rent renewal reminder dispatched',
    user: 'Divya Iyer',
    module: 'Rent',
    date: 'Jul 12, 2026',
    time: '11:00 AM',
    status: 'Approved',
  },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending'];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        cfg.bg,
        cfg.text,
        cfg.border,
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

function QuickStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={['flex h-9 w-9 items-center justify-center rounded-lg', color].join(' ')}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
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
            <QuickStat icon={CheckCircle2} label="Resolved today" value="14" color="bg-white/20" />
            <QuickStat icon={Clock}        label="Awaiting action" value="31" color="bg-white/20" />
            <QuickStat icon={AlertCircle}  label="Urgent items"    value="7"  color="bg-red-400/70" />
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
            <tbody className="divide-y divide-gray-50">
              {activities.map((row, i) => (
                <tr
                  key={row.id}
                  className="group hover:bg-orange-50/40 transition-colors duration-100"
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Card list — mobile */}
        <div className="sm:hidden divide-y divide-gray-100">
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

        {/* Table footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60 flex-wrap gap-2">
          <p className="text-xs text-gray-400">Showing 10 of 10 recent activities</p>
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
