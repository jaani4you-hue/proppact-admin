import { useState, useEffect } from 'react';
import { subscribeToProperties } from '../services/tenantService.js';

export function useProperties() {
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const unsub = subscribeToProperties((list) => {
      setProperties(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { properties, loading };
}
