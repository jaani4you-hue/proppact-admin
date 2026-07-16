import { useState, useEffect, useMemo } from 'react';
import { subscribeToTenants } from '../services/tenantService.js';

const DEFAULT_PAGE_SIZE = 10;

export function useTenants({
  statusFilter = 'all',
  paymentFilter = 'all',
  searchQuery   = '',
  page          = 1,
  pageSize      = DEFAULT_PAGE_SIZE,
} = {}) {
  const [all,   setAll]   = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    setAll(null);
    return subscribeToTenants(({ tenants, error: err }) => {
      if (err) { setError(err); setAll([]); }
      else      { setAll(tenants); setError(null); }
    });
  }, []);

  const filtered = useMemo(() => {
    if (!all) return null;
    let list = all;

    if (statusFilter !== 'all')
      list = list.filter((t) => t.status === statusFilter);

    if (paymentFilter !== 'all')
      list = list.filter((t) => t.paymentStatus === paymentFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.fullName?.toLowerCase().includes(q)       ||
          t.email?.toLowerCase().includes(q)           ||
          t.mobile?.includes(q)                        ||
          t.assignedProperty?.toLowerCase().includes(q)||
          t.city?.toLowerCase().includes(q)            ||
          t.panNumber?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [all, statusFilter, paymentFilter, searchQuery]);

  const totalCount = filtered?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const paginated  = filtered?.slice(start, start + pageSize) ?? null;

  return {
    tenants:     paginated,
    totalCount,
    totalPages,
    currentPage: safePage,
    loading:     all === null,
    error,
  };
}
