import { useState, useEffect } from 'react';
import { subscribeToVendorWorkHistory } from '../services/vendorService.js';

export function useVendorWorkHistory(vendorId) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToVendorWorkHistory(vendorId, ({ jobs: j, error: err }) => {
      setJobs(j);
      setError(err);
      setLoading(false);
    });
    return unsub;
  }, [vendorId]);

  return { jobs, loading, error };
}
