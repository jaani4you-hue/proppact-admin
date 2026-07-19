import { useState, useEffect } from 'react';
import { subscribeToVendorPayments } from '../services/vendorService.js';

export function useVendorPayments(vendorId) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToVendorPayments(vendorId, ({ payments: p, error: err }) => {
      setPayments(p);
      setError(err);
      setLoading(false);
    });
    return unsub;
  }, [vendorId]);

  return { payments, loading, error };
}
