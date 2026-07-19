import { useState, useEffect } from 'react';
import { subscribeToSettings } from '../services/settingsService.js';
import { DEFAULT_SETTINGS } from '../services/settingsService.js';

export function useSettings() {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToSettings(({ settings: s, error: err }) => {
      setSettings(s);
      setError(err);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { settings, loading, error };
}
