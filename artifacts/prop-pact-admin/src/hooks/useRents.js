import { useState, useEffect, useMemo } from 'react';
import { subscribeToRents } from '../services/rentService.js';

const PAGE_SIZE = 10;

/**
 * Real-time rents hook with client-side search, status filter, pagination,
 * and pre-computed dashboard stats.
 */
export function useRents({ statusFilter = 'all', search = '' } = {}) {
  const [allRents, setAllRents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToRents(
      ({ rents, error: err }) => {
        setAllRents(rents);
        setError(err);
        setLoading(false);
      },
      { statusFilter },
    );
    return unsub;
  }, [statusFilter]);

  // Reset to page 1 when search or filter changes
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // Client-side search
  const filtered = useMemo(() => {
    if (!search.trim()) return allRents;
    const q = search.toLowerCase();
    return allRents.filter(
      (r) =>
        (r.tenantName     || '').toLowerCase().includes(q) ||
        (r.propertyName   || '').toLowerCase().includes(q) ||
        (r.ownerName      || '').toLowerCase().includes(q) ||
        (r.propertyAddress|| '').toLowerCase().includes(q),
    );
  }, [allRents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Dashboard statistics
  const stats = useMemo(() => {
    const totalMonthlyRent = allRents.reduce((s, r) => s + (Number(r.monthlyRent) || 0), 0);
    const collected        = allRents
      .filter((r) => r.status === 'Paid')
      .reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);
    const pending          = allRents
      .filter((r) => r.status === 'Pending')
      .reduce((s, r) => s + (Number(r.monthlyRent) || 0), 0);
    const partialPending   = allRents
      .filter((r) => r.status === 'Partial')
      .reduce((s, r) => s + (Number(r.outstandingBalance) || 0), 0);
    const overdue          = allRents
      .filter((r) => r.status === 'Overdue')
      .reduce((s, r) => s + (Number(r.outstandingBalance) || 0), 0);
    const collectionRate   = totalMonthlyRent > 0
      ? Math.round((collected / totalMonthlyRent) * 100)
      : 0;
    const today = new Date().getDate();
    const dueTodayCount = allRents.filter(
      (r) => Number(r.dueDay) === today && r.status !== 'Paid',
    ).length;

    return {
      totalMonthlyRent,
      collected,
      pending: pending + partialPending,
      overdue,
      collectionRate,
      dueTodayCount,
    };
  }, [allRents]);

  return {
    rents: paged,
    allRents,
    loading,
    error,
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    stats,
  };
}
