const PRIORITY_STYLES = {
  Low       : 'bg-gray-50    text-gray-600   border-gray-200',
  Medium    : 'bg-blue-50    text-blue-700   border-blue-200',
  High      : 'bg-orange-50  text-orange-700 border-orange-200',
  Emergency : 'bg-red-50     text-red-700    border-red-200',
};

export default function MaintenancePriorityBadge({ priority }) {
  const cls = PRIORITY_STYLES[priority] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {priority === 'Emergency' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
      {priority !== 'Emergency' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {priority ?? 'Unknown'}
    </span>
  );
}
