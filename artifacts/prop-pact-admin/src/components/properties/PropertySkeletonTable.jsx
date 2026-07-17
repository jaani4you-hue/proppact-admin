function SkeletonCell({ className = '' }) {
  return <div className={`h-3.5 rounded bg-gray-200 ${className}`} />;
}

export default function PropertySkeletonTable({ rows = 8 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-gray-50 animate-pulse">
      <td className="py-4 pl-5 pr-3"><SkeletonCell className="w-6" /></td>
      <td className="py-4 px-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gray-200 flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <SkeletonCell className="w-28" />
            <SkeletonCell className="w-20 h-3" />
          </div>
        </div>
      </td>
      <td className="py-4 px-3"><SkeletonCell className="w-20" /></td>
      <td className="py-4 px-3"><SkeletonCell className="w-16" /></td>
      <td className="py-4 px-3"><SkeletonCell className="w-20" /></td>
      <td className="py-4 px-3"><SkeletonCell className="w-16 h-5 rounded-full" /></td>
      <td className="py-4 px-3"><SkeletonCell className="w-20" /></td>
      <td className="py-4 pl-3 pr-5">
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-7 w-7 rounded-md bg-gray-200" />
          ))}
        </div>
      </td>
    </tr>
  ));
}

export function PropertySkeletonCards({ rows = 5 }) {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
                <div className="h-5 w-16 rounded-full bg-gray-200" />
              </div>
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="flex gap-2 pt-1">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-7 w-14 rounded-lg bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
