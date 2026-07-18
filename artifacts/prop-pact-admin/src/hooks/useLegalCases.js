import { useState, useEffect, useMemo } from 'react';
import { subscribeToLegalCases } from '../services/legalService.js';

const PAGE_SIZE = 10;

export function useLegalCases({ statusFilter = 'all', typeFilter = 'all', search = '' } = {}) {
  const [allCases, setAllCases] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToLegalCases(
      ({ cases, error: err }) => {
        setAllCases(cases);
        setError(err);
        setLoading(false);
      },
      { statusFilter, typeFilter },
    );
    return unsub;
  }, [statusFilter, typeFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  // Client-side search
  const filtered = useMemo(() => {
    if (!search.trim()) return allCases;
    const q = search.toLowerCase();
    return allCases.filter(
      (c) =>
        (c.title          || '').toLowerCase().includes(q) ||
        (c.caseNumber     || '').toLowerCase().includes(q) ||
        (c.clientName     || '').toLowerCase().includes(q) ||
        (c.advocateName   || '').toLowerCase().includes(q) ||
        (c.propertyName   || '').toLowerCase().includes(q) ||
        (c.courtName      || '').toLowerCase().includes(q),
    );
  }, [allCases, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Dashboard stats
  const stats = useMemo(() => {
    const total    = allCases.length;
    const active   = allCases.filter((c) => c.status === 'Active').length;
    const pending  = allCases.filter((c) => c.status === 'Pending').length;
    const won      = allCases.filter((c) => c.status === 'Won').length;
    const lost     = allCases.filter((c) => c.status === 'Lost').length;
    const closed   = allCases.filter((c) => ['Closed', 'Withdrawn'].includes(c.status)).length;
    const onHold   = allCases.filter((c) => c.status === 'On Hold').length;

    const today       = new Date().toISOString().slice(0, 10);
    const upcoming7   = allCases.filter((c) => {
      if (!c.nextHearingDate || c.status === 'Closed') return false;
      return c.nextHearingDate >= today;
    }).length;

    const totalClaim    = allCases.reduce((s, c) => s + (Number(c.claimAmount)   || 0), 0);
    const totalSettled  = allCases.reduce((s, c) => s + (Number(c.settledAmount) || 0), 0);
    const totalFees     = allCases.reduce((s, c) => s + (Number(c.legalFees)     || 0), 0);

    const byType = allCases.reduce((acc, c) => {
      const t = c.caseType || 'Other';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    return { total, active, pending, won, lost, closed, onHold, upcoming7, totalClaim, totalSettled, totalFees, byType };
  }, [allCases]);

  return {
    cases: paged,
    allCases,
    loading,
    error,
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    stats,
  };
}
