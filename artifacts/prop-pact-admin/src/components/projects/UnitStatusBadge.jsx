const UNIT_STATUS_STYLES = {
  'Available': 'bg-green-50   text-green-700   border-green-200',
  'Sold'     : 'bg-red-50     text-red-700     border-red-200',
  'Reserved' : 'bg-yellow-50  text-yellow-700  border-yellow-200',
  'Booked'   : 'bg-blue-50    text-blue-700    border-blue-200',
};

export default function UnitStatusBadge({ status, size = 'sm' }) {
  const cls    = UNIT_STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  const textSz = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${textSz} font-semibold ${cls}`}>
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status ?? '—'}
    </span>
  );
}
