/**
 * GlobalSearchDropdown — renders grouped search results under the header search bar.
 *
 * Props:
 *  groups   : returned from useGlobalSearch
 *  loading  : bool
 *  query    : string
 *  onClose  : () => void
 *  onNavigate: (href: string) => void
 */
import { useEffect, useRef } from 'react';
import { Loader2, Search, ArrowRight } from 'lucide-react';

export default function GlobalSearchDropdown({ groups, loading, query, onClose, onNavigate }) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const hasResults = groups.length > 0;

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 overflow-hidden max-h-[70vh] overflow-y-auto"
      style={{ minWidth: '20rem' }}
    >
      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />
          Searching…
        </div>
      )}

      {/* No results */}
      {!loading && !hasResults && query.trim().length >= 2 && (
        <div className="flex flex-col items-center py-8 text-center">
          <Search className="h-8 w-8 text-gray-200 mb-2" />
          <p className="text-sm font-medium text-gray-600">No results for "{query}"</p>
          <p className="text-xs text-gray-400 mt-0.5">Try a different name, number, or address</p>
        </div>
      )}

      {/* Result groups */}
      {!loading && hasResults && (
        <div className="py-1">
          {groups.map((group) => (
            <div key={group.type}>
              {/* Group header */}
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${group.color}`}>
                  {group.label}
                </span>
              </div>

              {/* Result rows */}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onNavigate(item.href); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors group border-t border-gray-50 first:border-0"
                >
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${group.color}`}>
                    {item.title[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    {item.sub && (
                      <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          ))}

          {/* Footer hint */}
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-[10px] text-gray-400">Press Esc to close · Click to open record</p>
          </div>
        </div>
      )}
    </div>
  );
}
