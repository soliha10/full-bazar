import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'bazar_compare';
export const MAX_COMPARE = 4;

function readLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

interface CompareContextValue {
  compareIds: string[];
  toggleCompare: (id: string | number) => void;
  removeFromCompare: (id: string | number) => void;
  clearCompare: () => void;
  isComparing: (id: string | number) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(readLocal);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const toggleCompare = useCallback((id: string | number) => {
    const key = String(id);
    setCompareIds(prev => {
      if (prev.includes(key)) return prev.filter(x => x !== key);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, key];
    });
  }, []);

  const removeFromCompare = useCallback((id: string | number) => {
    const key = String(id);
    setCompareIds(prev => prev.filter(x => x !== key));
  }, []);

  const clearCompare = useCallback(() => setCompareIds([]), []);

  const isComparing = useCallback(
    (id: string | number) => compareIds.includes(String(id)),
    [compareIds],
  );

  return (
    <CompareContext.Provider value={{ compareIds, toggleCompare, removeFromCompare, clearCompare, isComparing }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be inside CompareProvider');
  return ctx;
}
