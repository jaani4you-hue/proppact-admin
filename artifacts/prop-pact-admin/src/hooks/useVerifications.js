import { useState, useEffect, useMemo } from 'react';
import { subscribeToVerifications } from '../services/verificationService.js';

/**
 * Real-time hook for the verifications list.
 * Server-filters by status; applies client-side search across property/owner fields.
 */
export function useVerifications({
  statusFilter = 'all',
  searchQuery = '',
  page = 1,
  pageSize = 10,
} = {}) {
  const [all, setAll]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToVerifications(
      ({ items, error: err }) => {
        setAll(items);
        setError(err);
        setLoading(false);
      },
      { statusFilter },
    );
    return () => unsub();
  }, [statusFilter]);

  // Client-side search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return all;
    const q = searchQuery.trim().toLowerCase();
    return all.filter(
      (v) =>
        (v.propertyName    ?? '').toLowerCase().includes(q) ||
        (v.ownerName       ?? '').toLowerCase().includes(q) ||
        (v.propertyAddress ?? '').toLowerCase().includes(q) ||
        (v.assignedOfficer ?? '').toLowerCase().includes(q) ||
        (v.propertyType    ?? '').toLowerCase().includes(q),
    );
  }, [all, searchQuery]);

  const totalCount  = filtered.length;
  const totalPages  = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage    = Math.min(Math.max(1, page), totalPages);

  const verifications = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return {
    verifications,
    totalCount,
    totalPages,
    currentPage: safePage,
    loading,
    error,
  };
}
