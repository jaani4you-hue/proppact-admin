const STATUS_MAP = {
  Active:    { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  Inactive:  { dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-200'    },
  Suspended: { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200'     },
};

const ROLE_MAP = {
  Admin:   { text: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',   dot: 'bg-rose-400'   },
  Manager: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400' },
  Agent:   { text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
  Viewer:  { text: 'text-gray-600',   bg: 'bg-gray-100',  border: 'border-gray-200',   dot: 'bg-gray-400'   },
};

function Badge({ cfg, label }) {
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {label}
    </span>
  );
}

export default function UserStatusBadge({ status }) {
  return <Badge cfg={STATUS_MAP[status] ?? STATUS_MAP['Inactive']} label={status ?? 'Unknown'} />;
}

export function UserRoleBadge({ role }) {
  return <Badge cfg={ROLE_MAP[role] ?? ROLE_MAP['Viewer']} label={role ?? '—'} />;
}
