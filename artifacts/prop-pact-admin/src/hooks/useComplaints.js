import { useState, useEffect, useMemo } from 'react';
import { subscribeToComplaints } from '../services/complaintService.js';

const PAGE_SIZE = 10;

export function useComplaints({ statusFilter = 'all', priorityFilter = 'all', categoryFilter = 'all', search = '' } = {}) {
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [page,          setPage]          = useState(1);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToComplaints(
      ({ complaints, error: err }) => {
        setAllComplaints(complaints);
        setError(err);
        setLoading(false);
      },
      { statusFilter, priorityFilter, categoryFilter },
    );
    return unsub;
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, categoryFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allComplaints;
    const q = search.toLowerCase();
    return allComplaints.filter(
      (c) =>
        (c.title           || '').toLowerCase().includes(q) ||
        (c.complaintNumber || '').toLowerCase().includes(q) ||
        (c.complainantName || '').toLowerCase().includes(q) ||
        (c.propertyName    || '').toLowerCase().includes(q) ||
        (c.category        || '').toLowerCase().includes(q) ||
        (c.unitNumber      || '').toLowerCase().includes(q),
    );
  }, [allComplaints, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total       = allComplaints.length;
    const open        = allComplaints.filter((c) => c.status === 'Open').length;
    const underReview = allComplaints.filter((c) => c.status === 'Under Review').length;
    const inProgress  = allComplaints.filter((c) => c.status === 'In Progress').length;
    const resolved    = allComplaints.filter((c) => c.status === 'Resolved').length;
    const closed      = allComplaints.filter((c) => c.status === 'Closed').length;
    const rejected    = allComplaints.filter((c) => c.status === 'Rejected').length;
    const critical    = allComplaints.filter((c) => c.priority === 'Critical').length;
    const high        = allComplaints.filter((c) => c.priority === 'High').length;
    const linked      = allComplaints.filter((c) => c.maintenanceId).length;
    return { total, open, underReview, inProgress, resolved, closed, rejected, critical, high, linked };
  }, [allComplaints]);

  return {
    complaints: paged,
    allComplaints,
    loading,
    error,
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    stats,
  };
}
