import { useState, useEffect, useMemo } from 'react';
import { subscribeToMaintenanceRequests } from '../services/maintenanceService.js';

const PAGE_SIZE = 10;

export function useMaintenance({ statusFilter = 'all', priorityFilter = 'all', categoryFilter = 'all', search = '' } = {}) {
  const [allRequests, setAllRequests] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMaintenanceRequests(
      ({ requests, error: err }) => {
        setAllRequests(requests);
        setError(err);
        setLoading(false);
      },
      { statusFilter, priorityFilter, categoryFilter },
    );
    return unsub;
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, categoryFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allRequests;
    const q = search.toLowerCase();
    return allRequests.filter(
      (r) =>
        (r.title             || '').toLowerCase().includes(q) ||
        (r.maintenanceNumber || '').toLowerCase().includes(q) ||
        (r.propertyName      || '').toLowerCase().includes(q) ||
        (r.assignedVendorName|| '').toLowerCase().includes(q) ||
        (r.category          || '').toLowerCase().includes(q),
    );
  }, [allRequests, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total       = allRequests.length;
    const pending     = allRequests.filter((r) => r.status === 'Pending').length;
    const assigned    = allRequests.filter((r) => r.status === 'Assigned').length;
    const inProgress  = allRequests.filter((r) => r.status === 'In Progress').length;
    const completed   = allRequests.filter((r) => r.status === 'Completed').length;
    const cancelled   = allRequests.filter((r) => r.status === 'Cancelled').length;
    const emergency   = allRequests.filter((r) => r.priority === 'Emergency').length;
    const totalEstimated = allRequests.reduce((s, r) => s + (Number(r.estimatedCost) || 0), 0);
    const totalActual    = allRequests.reduce((s, r) => s + (Number(r.actualCost)    || 0), 0);
    return { total, pending, assigned, inProgress, completed, cancelled, emergency, totalEstimated, totalActual };
  }, [allRequests]);

  return {
    requests: paged,
    allRequests,
    loading,
    error,
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    stats,
  };
}
