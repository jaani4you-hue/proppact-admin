const TYPE_STYLES = {
  'Residential'       : 'bg-sky-50      text-sky-700     border-sky-200',
  'Commercial'        : 'bg-violet-50   text-violet-700  border-violet-200',
  'Mixed Use'         : 'bg-indigo-50   text-indigo-700  border-indigo-200',
  'Society'           : 'bg-emerald-50  text-emerald-700 border-emerald-200',
  'Township'          : 'bg-rose-50     text-rose-700    border-rose-200',
  'Plotted Development':'bg-amber-50    text-amber-700   border-amber-200',
};

const TYPE_ICONS = {
  'Residential'        : '🏠',
  'Commercial'         : '🏢',
  'Mixed Use'          : '🏗️',
  'Society'            : '🏘️',
  'Township'           : '🌆',
  'Plotted Development': '📐',
};

export default function ProjectTypeBadge({ type, showIcon = false }) {
  const cls  = TYPE_STYLES[type] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  const icon = TYPE_ICONS[type]  ?? '📁';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {showIcon && <span className="text-[10px]">{icon}</span>}
      {type ?? 'Other'}
    </span>
  );
}
