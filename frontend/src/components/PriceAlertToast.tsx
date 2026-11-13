import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePriceAlerts, type PriceAlert } from '../hooks/usePriceAlerts';
import { formatSum } from '../utils/productMapper';
import { productPath } from '../utils/slug';
import { Card } from './Card';
import { PRODUCT_PLACEHOLDER } from './product-card/ProductTile';

// Ro'yxatda shuncha mahsulot; qolgani — "Yana N ta" (to'liq ro'yxat kuzatuv sahifasida)
const SHOWN = 3;
// Sahifa chizilib bo'lgach chiqsin — kirish paytidagi harakat bilan to'qnashmasin
const SHOW_DELAY_MS = 1200;

function AlertRow({ a, onOpen }: { a: PriceAlert; onOpen: () => void }) {
  const down = a.pct < 0;
  return (
    <li>
      <Link to={productPath({ id: a.id, slug: a.slug })} onClick={onOpen}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.06] transition-colors">
        <span className="w-10 h-10 shrink-0 overflow-hidden rounded-lg glass-soft">
          <img src={a.image || PRODUCT_PLACEHOLDER} alt="" loading="lazy"
            className="w-full h-full object-contain p-0.5 mix-blend-multiply dark:mix-blend-normal" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-900 dark:text-white">{a.name}</span>
          <span className="block truncate whitespace-nowrap text-xs tabular-nums text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{formatSum(a.new_price)}</span>
            {' · '}
            <span className="line-through">{formatSum(a.old_price)}</span>
          </span>
        </span>
        {/* Holat rangi doim ikonka va belgi bilan — faqat rangga tayanilmaydi */}
        <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
          down ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-600 dark:text-red-300'}`}>
          {down ? <TrendingDown className="w-3 h-3" aria-hidden="true" /> : <TrendingUp className="w-3 h-3" aria-hidden="true" />}
          {down ? '−' : '+'}{Math.abs(a.pct).toFixed(1)}%
        </span>
      </Link>
    </li>
  );
}

/**
 * Narx xabari — tizimga kirgan foydalanuvchi saytni ochganda pastki burchakda.
 * Ishni to'xtatmaydi (modal emas), ekran o'quvchiga muloyim e'lon qilinadi.
 * Kuzatuv sahifasining o'zida ko'rsatilmaydi — u yerda o'zgarishlar ko'rildi deb belgilanadi.
 */
export function PriceAlertToast() {
  const { t } = useLanguage();
  const p = t.priceAlerts;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state, markSeen, dismiss } = usePriceAlerts();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!state) return;
    const id = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [state]);

  // Foydalanuvchi kuzatuv sahifasiga o'zi kirdi — o'zgarishlarni ko'rdi
  useEffect(() => {
    if (pathname === '/watchlist' && state?.kind === 'changes') markSeen();
  }, [pathname, state, markSeen]);

  const visible = ready && !!state && pathname !== '/watchlist';
  const changes = state?.kind === 'changes' ? state.items : [];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div role="status" aria-live="polite" aria-label={p.region}
          initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.15 } }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed z-50 left-3 right-3 bottom-[76px] md:left-auto md:right-6 md:bottom-6 md:w-[400px]">
          <Card solid className="shadow-2xl shadow-black/10 dark:shadow-black/40">
            <div className="flex items-start gap-3">
              <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {state?.kind === 'intro' ? p.introTitle : p.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {state?.kind === 'intro' ? p.introText : p.summary.replace('{{count}}', String(changes.length))}
                </p>
              </div>
              <button type="button" onClick={() => dismiss(true)} data-tip={p.close} aria-label={p.close}
                className="-mr-1 -mt-1 flex w-7 h-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {changes.length > 0 && (
              <ul className="mt-3 space-y-0.5">
                {changes.slice(0, SHOWN).map(a => <AlertRow key={a.id} a={a} onOpen={markSeen} />)}
              </ul>
            )}
            {changes.length > SHOWN && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{p.more.replace('{{count}}', String(changes.length - SHOWN))}</p>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button type="button" onClick={() => dismiss()}
                className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-900/5 dark:hover:bg-white/10 transition-colors">
                {p.later}
              </button>
              <button type="button"
                onClick={() => {
                  if (state?.kind === 'intro') { dismiss(true); navigate('/products'); }
                  else { markSeen(); navigate('/watchlist'); }
                }}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
                {state?.kind === 'intro' ? p.introCta : p.open}
              </button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
