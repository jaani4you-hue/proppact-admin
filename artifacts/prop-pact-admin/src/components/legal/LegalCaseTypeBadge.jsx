const TYPE_STYLES = {
  'Legal Notice'  : 'bg-amber-50    text-amber-700   border-amber-200',
  'Rent Agreement': 'bg-sky-50      text-sky-700     border-sky-200',
  'Eviction'      : 'bg-rose-50     text-rose-700    border-rose-200',
  'Court Case'    : 'bg-violet-50   text-violet-700  border-violet-200',
  'Other'         : 'bg-gray-50     text-gray-600    border-gray-200',
};

const TYPE_ICONS = {
  'Legal Notice'  : '📋',
  'Rent Agreement': '📝',
  'Eviction'      : '🔑',
  'Court Case'    : '⚖️',
  'Other'         : '📁',
};

export default function LegalCaseTypeBadge({ type, showIcon = false }) {
  const cls  = TYPE_STYLES[type] ?? TYPE_STYLES.Other;
  const icon = TYPE_ICONS[type]  ?? '📁';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {showIcon && <span className="text-[10px]">{icon}</span>}
      {type ?? 'Unknown'}
    </span>
  );
}
