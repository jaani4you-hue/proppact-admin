function Shimmer({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}

export function LegalSkeletonTable({ rows = 6 }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {['Case', 'Type', 'Client', 'Advocate', 'Property', 'Status', 'Next Hearing', ''].map((h) => (
              <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-3.5 px-4">
                <Shimmer className="h-3.5 w-32 mb-1" />
                <Shimmer className="h-2.5 w-20" />
              </td>
              <td className="py-3.5 px-4"><Shimmer className="h-5 w-24 rounded-md" /></td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-7 w-7 rounded-full flex-shrink-0" />
                  <Shimmer className="h-3.5 w-24" />
                </div>
              </td>
              <td className="py-3.5 px-4"><Shimmer className="h-3.5 w-24" /></td>
              <td className="py-3.5 px-4"><Shimmer className="h-3.5 w-28" /></td>
              <td className="py-3.5 px-4"><Shimmer className="h-5 w-16 rounded-full" /></td>
              <td className="py-3.5 px-4"><Shimmer className="h-3.5 w-20" /></td>
              <td className="py-3.5 px-4"><Shimmer className="h-6 w-14 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalSkeletonCards({ cards = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Shimmer className="h-4 w-3/4 mb-1.5" />
              <Shimmer className="h-3 w-1/2" />
            </div>
            <Shimmer className="h-5 w-16 rounded-full ml-2" />
          </div>
          <Shimmer className="h-5 w-24 rounded-md" />
          <div className="pt-2 border-t border-gray-50 flex justify-between">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
