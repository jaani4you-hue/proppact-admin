// ── Skeleton for list table rows ─────────────────────────────────────────────────

export function SkeletonTableRows({ rows = 8 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-gray-50 animate-pulse">
      <td className="py-4 pl-5 pr-3">
        <div className="h-3 w-6 rounded bg-gray-200" />
      </td>
      <td className="py-4 px-3">
        <div className="space-y-1.5">
          <div className="h-3.5 w-36 rounded bg-gray-200" />
          <div className="h-2.5 w-24 rounded bg-gray-100" />
        </div>
      </td>
      <td className="py-4 px-3">
        <div className="h-3 w-28 rounded bg-gray-200" />
      </td>
      <td className="py-4 px-3">
        <div className="h-3 w-20 rounded bg-gray-200" />
      </td>
      <td className="py-4 px-3">
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </td>
      <td className="py-4 px-3">
        <div className="h-3 w-24 rounded bg-gray-200" />
      </td>
      <td className="py-4 pl-3 pr-5">
        <div className="flex gap-1.5">
          <div className="h-7 w-7 rounded-md bg-gray-200" />
        </div>
      </td>
    </tr>
  ));
}

// ── Skeleton for mobile cards ─────────────────────────────────────────────────────

export function SkeletonCards({ rows = 5 }) {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-5 w-20 rounded-full bg-gray-200" />
          </div>
          <div className="h-3 w-44 rounded bg-gray-100" />
          <div className="h-3 w-28 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ── Skeleton for detail page ─────────────────────────────────────────────────────

export function SkeletonDetails() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gray-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-5 w-52 rounded bg-gray-200" />
          <div className="h-3 w-36 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-xl bg-gray-200" />
          <div className="h-9 w-20 rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* hero card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-20 bg-gray-200" />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-5 w-20 rounded-full bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-1.5">
                <div className="h-2.5 w-16 rounded bg-gray-100" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* timeline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <div className="h-4 w-36 rounded bg-gray-200" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-28 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-2.5 w-24 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
