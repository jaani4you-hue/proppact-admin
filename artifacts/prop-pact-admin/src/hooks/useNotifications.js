import { useState, useEffect } from 'react';
import { subscribeToNotifications, subscribeToUnreadCount } from '../services/notificationService.js';

export function useNotifications({ typeFilter = 'all', readFilter = 'all' } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToNotifications(
      ({ notifications: n, error: err }) => {
        setNotifications(n);
        setError(err);
        setLoading(false);
      },
      { typeFilter, readFilter },
    );
    return unsub;
  }, [typeFilter, readFilter]);

  return { notifications, loading, error };
}

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeToUnreadCount(setCount);
    return unsub;
  }, []);

  return count;
}
