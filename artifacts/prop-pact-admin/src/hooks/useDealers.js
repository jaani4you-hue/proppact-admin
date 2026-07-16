import { useState, useEffect, useMemo } from 'react';
import { subscribeToDealers } from '../services/dealerService.js';

const PAGE_SIZE = 10;

/**
 * Real-time dealers hook with client-side search, status filter and pagination.
 *
 * @param {object} options
 * @param {string} options.statusFilter  – 'all' | 'Active' | 'Inactive' | 'Suspended'
 * @param {string} options.searchQuery   – free-text search
 * @param {number} options.page          – 1-based current page
 * @param {number} options.pageSize      – rows per page (default 10)
 */
export function useDealers({
  statusFilter = 'all',
  searchQuery = '',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const [allDealers, setAllDealers] = useState(null); // null = loading
  const [error, setError]           = useState(null);

  useEffect(() => {
    setAllDealers(null); // reset to loading when filter changes
    const unsub = subscribeToDealers(
      ({ dealers, error: err }) => {
        if (err) {
          setError(err);
          setAllDealers([]);
        } else {
          setAllDealers(dealers);
          setError(null);
        }
      },
      { statusFilter },
    );
    return unsub;
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!allDealers) return null;
    if (!searchQuery.trim()) return allDealers;
    const q = searchQuery.toLowerCase();
    return allDealers.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.mobile?.includes(q) ||
        d.agencyName?.toLowerCase().includes(q) ||
        d.reraNumber?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q),
    );
  }, [allDealers, searchQuery]);

  const totalCount   = filtered?.length ?? 0;
  const totalPages   = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage     = Math.min(page, totalPages);
  const startIndex   = (safePage - 1) * pageSize;
  const paginated    = filtered?.slice(startIndex, startIndex + pageSize) ?? null;

  return {
    dealers: paginated,      // null = loading
    totalCount,
    totalPages,
    currentPage: safePage,
    loading: allDealers === null,
    error,
  };
}
