const STATUS_MAP = {
  Active:          { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  'Notice Period': { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  Vacated:         { dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-200'    },
  Blocked:         { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200'     },
};

const PAYMENT_MAP = {
  Paid:    { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Pending: { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  Overdue: { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
};

const OCCUPANCY_MAP = {
  Occupied:        { dot: 'bg-teal-400',  text: 'text-teal-700',  bg: 'bg-teal-50',  border: 'border-teal-200'  },
  Vacant:          { dot: 'bg-gray-400',  text: 'text-gray-600',  bg: 'bg-gray-100', border: 'border-gray-200'  },
  'Notice Period': { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
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

export default function TenantStatusBadge({ status }) {
  return <Badge cfg={STATUS_MAP[status] ?? STATUS_MAP['Vacated']} label={status ?? 'Unknown'} />;
}

export function PaymentStatusBadge({ status }) {
  return <Badge cfg={PAYMENT_MAP[status] ?? PAYMENT_MAP['Pending']} label={status ?? '—'} />;
}

export function OccupancyBadge({ status }) {
  return <Badge cfg={OCCUPANCY_MAP[status] ?? OCCUPANCY_MAP['Vacant']} label={status ?? '—'} />;
}
