function Skel({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} animate-pulse rounded bg-gray-100`} />;
}

export function MaintenanceSkeletonTable({ rows = 5 }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {['Request', 'Category', 'Property', 'Vendor', 'Priority', 'Status', ''].map((h) => (
              <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-3.5 px-4 space-y-1.5"><Skel w="w-32" /><Skel w="w-20" h="h-3" /></td>
              <td className="py-3.5 px-4"><Skel w="w-24" /></td>
              <td className="py-3.5 px-4"><Skel w="w-28" /></td>
              <td className="py-3.5 px-4"><Skel w="w-24" /></td>
              <td className="py-3.5 px-4"><Skel w="w-16" /></td>
              <td className="py-3.5 px-4"><Skel w="w-20" /></td>
              <td className="py-3.5 px-4"><Skel w="w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
