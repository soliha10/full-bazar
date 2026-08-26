import { useLocation, useNavigate } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';

export function CompareBar() {
  const { compareIds, clearCompare } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();

  if (compareIds.length === 0 || location.pathname === '/compare') return null;

  const ready = compareIds.length >= 2;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl shadow-black/30 px-4 py-3">
      <Scale className="w-4 h-4 text-violet-400 shrink-0" />
      <span className="text-sm font-bold whitespace-nowrap">
        {compareIds.length} ta tanlandi{!ready && ' — yana 1 ta tanlang'}
      </span>
      <button
        onClick={() => navigate('/compare')}
        disabled={!ready}
        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:hover:bg-violet-600 text-white text-xs font-black px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
      >
        Solishtirish
      </button>
      <button onClick={clearCompare} className="text-gray-400 hover:text-white transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
