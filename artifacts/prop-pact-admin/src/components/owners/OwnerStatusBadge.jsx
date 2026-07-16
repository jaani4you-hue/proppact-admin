const STATUS_CONFIG = {
  Active:    { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  active:    { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Inactive:  { dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100',   border: 'border-gray-200'   },
  inactive:  { dot: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100',   border: 'border-gray-200'   },
  Suspended: { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'    },
  suspended: { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'    },
};

export default function OwnerStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Inactive'];
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : 'Unknown';
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        cfg.bg, cfg.text, cfg.border,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
      {label}
    </span>
  );
}
