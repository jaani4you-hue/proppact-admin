/** Animated skeleton rows for the dealer table. */
export default function SkeletonTable({ rows = 8, cols = 7 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {/* row # */}
          <td className="py-3.5 pl-5 pr-3">
            <div className="h-3 w-5 rounded bg-gray-200 animate-pulse" />
          </td>
          {/* dealer avatar + name */}
          <td className="py-3.5 px-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
          </td>
          {/* agency */}
          <td className="py-3.5 px-3">
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
          </td>
          {/* mobile */}
          <td className="py-3.5 px-3">
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
          </td>
          {/* rera */}
          <td className="py-3.5 px-3">
            <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
          </td>
          {/* status */}
          <td className="py-3.5 px-3">
            <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
          </td>
          {/* date */}
          <td className="py-3.5 px-3">
            <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
          </td>
          {/* actions */}
          <td className="py-3.5 pl-3 pr-5">
            <div className="flex gap-1.5">
              <div className="h-7 w-7 rounded-md bg-gray-200 animate-pulse" />
              <div className="h-7 w-7 rounded-md bg-gray-200 animate-pulse" />
              <div className="h-7 w-7 rounded-md bg-gray-200 animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/** Skeleton for mobile dealer cards. */
export function SkeletonCards({ rows = 5 }) {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-gray-100 animate-pulse" />
            <div className="flex gap-2 mt-1">
              <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-5 w-20 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
