const STATUS_CONFIG = {
  Pending: {
    label:  'Pending',
    dot:    'bg-amber-400',
    text:   'text-amber-700',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
  },
  'In Review': {
    label:  'In Review',
    dot:    'bg-blue-400',
    text:   'text-blue-700',
    bg:     'bg-blue-50',
    border: 'border-blue-200',
  },
  Approved: {
    label:  'Approved',
    dot:    'bg-emerald-400',
    text:   'text-emerald-700',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
  },
  Rejected: {
    label:  'Rejected',
    dot:    'bg-red-400',
    text:   'text-red-700',
    bg:     'bg-red-50',
    border: 'border-red-200',
  },
};

/**
 * @param {{ status: string, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function VerificationStatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending'];
  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1 text-xs'
      : size === 'md'
      ? 'px-2.5 py-0.5 text-xs'
      : 'px-2.5 py-0.5 text-[11px]';
  const dotSize = size === 'lg' ? 'h-2 w-2' : 'h-1.5 w-1.5';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
        sizeClasses,
        cfg.bg,
        cfg.text,
        cfg.border,
      ].join(' ')}
    >
      <span className={['rounded-full flex-shrink-0', dotSize, cfg.dot].join(' ')} />
      {cfg.label}
    </span>
  );
}
