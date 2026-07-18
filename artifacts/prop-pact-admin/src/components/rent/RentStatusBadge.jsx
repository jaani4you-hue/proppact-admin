const STATUS_MAP = {
  Paid    : 'bg-green-50  text-green-700  border-green-200',
  Pending : 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Partial : 'bg-blue-50   text-blue-700   border-blue-200',
  Overdue : 'bg-red-50    text-red-700    border-red-200',
};

export default function RentStatusBadge({ status }) {
  const cls = STATUS_MAP[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status ?? 'Unknown'}
    </span>
  );
}
