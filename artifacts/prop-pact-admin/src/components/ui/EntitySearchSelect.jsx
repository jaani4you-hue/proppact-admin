/**
 * EntitySearchSelect — reusable searchable dropdown for auto-fill across forms.
 *
 * Props:
 *  options   : [{ id, label, sub? }]  — list to search/select from
 *  value     : string                 — currently displayed label (controlled)
 *  onChange  : (label: string) => void — when user types manually
 *  onSelect  : (item)        => void  — when user picks an option (triggers auto-fill)
 *  placeholder: string
 *  loading   : bool
 *  disabled  : bool
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function EntitySearchSelect({
  options     = [],
  value       = '',
  onChange,
  onSelect,
  placeholder = 'Search…',
  loading     = false,
  disabled    = false,
}) {
  const [query, setQuery] = useState(value);
  const [open,  setOpen]  = useState(false);
  const ref               = useRef(null);

  // Keep display in sync when value changes from outside (edit-mode load)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!options?.length) return [];
    if (!query.trim()) return options.slice(0, 10);
    const q = query.toLowerCase();
    return options
      .filter((o) => o.label?.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [options, query]);

  function handleInput(e) {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    onChange?.(v);
  }

  function handleSelect(item) {
    setQuery(item.label);
    setOpen(false);
    onSelect?.(item);
  }

  const showDropdown = open && !loading && !disabled;

  return (
    <div ref={ref} className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Loading…' : placeholder}
          disabled={loading || disabled}
          className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-8 py-2 text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
      </div>

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-900/10">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              className="w-full flex flex-col items-start px-3 py-2.5 text-left hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-medium text-gray-800 truncate w-full">{item.label}</span>
              {item.sub && (
                <span className="text-xs text-gray-400 truncate w-full">{item.sub}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && query.trim() && filtered.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg px-3 py-4 text-center">
          <p className="text-sm text-gray-400">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}
