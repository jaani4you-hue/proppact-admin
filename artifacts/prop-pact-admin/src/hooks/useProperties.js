import { useState, useEffect, useMemo } from 'react';
import { subscribeToProperties } from '../services/propertyService.js';

const PAGE_SIZE = 10;

export function useProperties({
  statusFilter = 'all',
  typeFilter = 'all',
  searchQuery = '',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const [allProperties, setAllProperties] = useState(null); // null = loading
  const [error, setError]                 = useState(null);

  useEffect(() => {
    setAllProperties(null);
    const unsub = subscribeToProperties(
      ({ properties, error: err }) => {
        if (err) { setError(err); setAllProperties([]); }
        else { setAllProperties(properties); setError(null); }
      },
      { statusFilter, typeFilter },
    );
    return unsub;
  }, [statusFilter, typeFilter]);

  const filtered = useMemo(() => {
    if (!allProperties) return null;
    if (!searchQuery.trim()) return allProperties;
    const q = searchQuery.toLowerCase();
    return allProperties.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q),
    );
  }, [allProperties, searchQuery]);

  const totalCount = filtered?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const paginated  = filtered?.slice(start, start + pageSize) ?? null;

  return {
    properties: paginated,
    totalCount,
    totalPages,
    currentPage: safePage,
    loading: allProperties === null,
    error,
  };
}
