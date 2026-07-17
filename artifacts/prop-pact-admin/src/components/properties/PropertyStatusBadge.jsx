const STATUS_CONFIG = {
  Available:         { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Occupied:          { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  'Under Maintenance':{ dot: 'bg-amber-400',  text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  Reserved:          { dot: 'bg-violet-400',  text: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200'  },
  Listed:            { dot: 'bg-orange-400',  text: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200'  },
};

export default function PropertyStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Available'];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        cfg.bg, cfg.text, cfg.border,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
      {status ?? 'Unknown'}
    </span>
  );
}
