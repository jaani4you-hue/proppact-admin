import { useState, useEffect, useMemo } from 'react';
import { subscribeToOwners } from '../services/ownerService.js';

const PAGE_SIZE = 10;

/**
 * Real-time owners hook with client-side search, status filter, and pagination.
 */
export function useOwners({
  statusFilter = 'all',
  searchQuery = '',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const [allOwners, setAllOwners] = useState(null); // null = loading
  const [error, setError]         = useState(null);

  useEffect(() => {
    setAllOwners(null);
    const unsub = subscribeToOwners(
      ({ owners, error: err }) => {
        if (err) { setError(err); setAllOwners([]); }
        else { setAllOwners(owners); setError(null); }
      },
      { statusFilter },
    );
    return unsub;
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!allOwners) return null;
    if (!searchQuery.trim()) return allOwners;
    const q = searchQuery.toLowerCase();
    return allOwners.filter(
      (o) =>
        o.fullName?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.mobile?.includes(q) ||
        o.city?.toLowerCase().includes(q) ||
        o.panNumber?.toLowerCase().includes(q) ||
        o.aadhaarNumber?.includes(q),
    );
  }, [allOwners, searchQuery]);

  const totalCount = filtered?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const paginated  = filtered?.slice(start, start + pageSize) ?? null;

  return {
    owners: paginated,
    totalCount,
    totalPages,
    currentPage: safePage,
    loading: allOwners === null,
    error,
  };
}
