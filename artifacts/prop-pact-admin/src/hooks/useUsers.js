import { useState, useEffect, useMemo } from 'react';
import { subscribeToUsers } from '../services/userService.js';

export function useUsers({
  statusFilter = 'all',
  roleFilter   = 'all',
  searchQuery  = '',
  page         = 1,
  pageSize     = 10,
} = {}) {
  const [all,   setAll]   = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    setAll(null);
    return subscribeToUsers(({ users, error: err }) => {
      if (err) { setError(err); setAll([]); }
      else      { setAll(users); setError(null); }
    });
  }, []);

  const filtered = useMemo(() => {
    if (!all) return null;
    let list = all;

    if (statusFilter !== 'all') list = list.filter((u) => u.status === statusFilter);
    if (roleFilter   !== 'all') list = list.filter((u) => u.role   === roleFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)    ||
          u.mobile?.includes(q)                 ||
          u.role?.toLowerCase().includes(q)     ||
          u.city?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [all, statusFilter, roleFilter, searchQuery]);

  const totalCount = filtered?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;

  return {
    users:       filtered?.slice(start, start + pageSize) ?? null,
    totalCount,
    totalPages,
    currentPage: safePage,
    loading:     all === null,
    error,
  };
}
