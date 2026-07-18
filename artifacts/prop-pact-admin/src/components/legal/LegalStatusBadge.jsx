const STATUS_STYLES = {
  Active    : 'bg-green-50   text-green-700   border-green-200',
  Pending   : 'bg-yellow-50  text-yellow-700  border-yellow-200',
  Won       : 'bg-blue-50    text-blue-700    border-blue-200',
  Lost      : 'bg-red-50     text-red-700     border-red-200',
  Closed    : 'bg-gray-50    text-gray-600    border-gray-200',
  Withdrawn : 'bg-purple-50  text-purple-700  border-purple-200',
  'On Hold' : 'bg-orange-50  text-orange-700  border-orange-200',
};

export default function LegalStatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status ?? 'Unknown'}
    </span>
  );
}
