import { useState, useEffect, useMemo } from 'react';
import { subscribeToVendors } from '../services/vendorService.js';

const PAGE_SIZE = 10;

export function useVendors({ statusFilter = 'all', categoryFilter = 'all', search = '' } = {}) {
  const [allVendors, setAllVendors] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToVendors(
      ({ vendors, error: err }) => {
        setAllVendors(vendors);
        setError(err);
        setLoading(false);
      },
      { statusFilter, categoryFilter },
    );
    return unsub;
  }, [statusFilter, categoryFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allVendors;
    const q = search.toLowerCase();
    return allVendors.filter(
      (v) =>
        (v.name       || '').toLowerCase().includes(q) ||
        (v.vendorCode || '').toLowerCase().includes(q) ||
        (v.phone      || '').toLowerCase().includes(q) ||
        (v.email      || '').toLowerCase().includes(q) ||
        (v.category   || '').toLowerCase().includes(q),
    );
  }, [allVendors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total     = allVendors.length;
    const pending   = allVendors.filter((v) => v.status === 'Pending').length;
    const approved  = allVendors.filter((v) => v.status === 'Approved').length;
    const rejected  = allVendors.filter((v) => v.status === 'Rejected').length;
    const suspended = allVendors.filter((v) => v.status === 'Suspended').length;
    const byCategory = allVendors.reduce((acc, v) => {
      const cat = v.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const avgRating = allVendors.length
      ? (allVendors.reduce((s, v) => s + (Number(v.rating) || 0), 0) / allVendors.length).toFixed(1)
      : '0.0';
    return { total, pending, approved, rejected, suspended, byCategory, avgRating };
  }, [allVendors]);

  return {
    vendors: paged,
    allVendors,
    loading,
    error,
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    stats,
  };
}
