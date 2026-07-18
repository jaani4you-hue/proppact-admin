import { useState, useEffect, useMemo } from 'react';
import { subscribeToProjects } from '../services/projectService.js';

const PAGE_SIZE = 10;

export function useProjects({ statusFilter = 'all', typeFilter = 'all', search = '' } = {}) {
  const [allProjects, setAllProjects] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToProjects(
      ({ projects, error: err }) => {
        setAllProjects(projects);
        setError(err);
        setLoading(false);
      },
      { statusFilter, typeFilter },
    );
    return unsub;
  }, [statusFilter, typeFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allProjects;
    const q = search.toLowerCase();
    return allProjects.filter(
      (p) =>
        (p.projectName  || '').toLowerCase().includes(q) ||
        (p.projectCode  || '').toLowerCase().includes(q) ||
        (p.builderName  || '').toLowerCase().includes(q) ||
        (p.city         || '').toLowerCase().includes(q) ||
        (p.societyName  || '').toLowerCase().includes(q),
    );
  }, [allProjects, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total       = allProjects.length;
    const upcoming    = allProjects.filter((p) => p.status === 'Upcoming').length;
    const underConstr = allProjects.filter((p) => p.status === 'Under Construction').length;
    const ready       = allProjects.filter((p) => p.status === 'Ready to Move').length;
    const completed   = allProjects.filter((p) => p.status === 'Completed').length;
    const onHold      = allProjects.filter((p) => p.status === 'On Hold').length;

    const totalUnits     = allProjects.reduce((s, p) => s + (Number(p.totalUnits)     || 0), 0);
    const availableUnits = allProjects.reduce((s, p) => s + (Number(p.availableUnits) || 0), 0);
    const soldUnits      = allProjects.reduce((s, p) => s + (Number(p.soldUnits)      || 0), 0);
    const reservedUnits  = allProjects.reduce((s, p) => s + (Number(p.reservedUnits)  || 0), 0);

    const byType = allProjects.reduce((acc, p) => {
      const t = p.projectType || 'Other';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    return { total, upcoming, underConstr, ready, completed, onHold, totalUnits, availableUnits, soldUnits, reservedUnits, byType };
  }, [allProjects]);

  return {
    projects: paged,
    allProjects,
    loading,
    error,
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    stats,
  };
}
