const STATUS_STYLES = {
  Pending      : 'bg-yellow-50  text-yellow-700  border-yellow-200',
  Assigned     : 'bg-blue-50    text-blue-700    border-blue-200',
  'In Progress': 'bg-orange-50  text-orange-700  border-orange-200',
  Completed    : 'bg-green-50   text-green-700   border-green-200',
  Cancelled    : 'bg-gray-50    text-gray-600    border-gray-200',
};

export default function MaintenanceStatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status ?? 'Unknown'}
    </span>
  );
}
