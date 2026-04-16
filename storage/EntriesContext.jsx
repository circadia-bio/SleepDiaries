/**
 * storage/EntriesContext.jsx — Centralised entry state
 *
 * Provides a single shared cache of diary entries, today's completion status,
 * and the participant's name. All tab screens consume this context instead of
 * independently calling AsyncStorage on every focus event.
 *
 * Usage:
 *   1. Wrap your root navigator with <EntriesProvider> (done in app/_layout.jsx).
 *   2. In any screen, call useEntries() to get the cached data and a refresh()
 *      function. Call refresh() via useFocusEffect if the screen can be reached
 *      after data-mutating actions (e.g. saving an entry, changing name).
 *
 * Example:
 *   const { entries, todayStatus, userName, loading, refresh } = useEntries();
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loadEntries, loadTodayStatus, loadName } from './storage';

const EntriesContext = createContext(null);

export function EntriesProvider({ children }) {
  const [entries,     setEntries]     = useState([]);
  const [todayStatus, setTodayStatus] = useState({ morningCompleted: false, eveningCompleted: false });
  const [userName,    setUserName]    = useState('');
  const [loading,     setLoading]     = useState(true);

  const refresh = useCallback(async () => {
    const [allEntries, status, name] = await Promise.all([
      loadEntries(),
      loadTodayStatus(),
      loadName(),
    ]);
    setEntries(allEntries);
    setTodayStatus(status);
    setUserName(name ?? '');
    setLoading(false);
  }, []);

  // Load once on mount so data is ready before any screen renders.
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <EntriesContext.Provider value={{ entries, todayStatus, userName, loading, refresh }}>
      {children}
    </EntriesContext.Provider>
  );
}

/**
 * Hook to consume the shared entries cache.
 * Must be called inside a component wrapped by EntriesProvider.
 */
export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries() must be used inside <EntriesProvider>');
  return ctx;
}
