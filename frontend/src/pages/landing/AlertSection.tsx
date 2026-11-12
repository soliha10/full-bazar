import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatSum } from '../../utils/productMapper';
import type { Product } from '../../components/ProductCard';
import { StoreLogo } from '../../components/StoreLogo';
import { reveal, PLACEHOLDER, priceSpread } from './shared';

/**
 * Narx kuzatuvi taklifi. O'ng tomondagi namuna — o'ylab topilgan emas,
 * eng katta farqli haqiqiy mahsulot va uning do'konlardagi narxlari.
 */
export function AlertSection({ sample }: { sample: Product | undefined }) {
  const { t } = useLanguage();
  const h = t.home;
  const { user, openLogin } = useAuth();
  const spread = priceSpread(sample?.markets);

  const button = 'inline-flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-3 text-sm font-medium text-white transition-colors';

  return (
    <m.section {...reveal} aria-labelledby="alert-title" className="mt-14 md:mt-24 px-4 max-w-7xl mx-auto">
      <div className="glass rounded-[2rem] p-6 md:p-12 grid md:grid-cols-2 gap-8 md:gap-12 items-center overflow-hidden">
        <div>
          <h2 id="alert-title" className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
            {h.alertTitle}
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">{h.alertDesc}</p>
          <div className="mt-6">
            {user
              ? <Link to="/watchlist" className={button}>{h.alertButton}</Link>
              : <button type="button" onClick={openLogin} className={button}>{h.alertButtonGuest}</button>}
          </div>
        </div>

        {sample && spread.low && spread.high && (
          <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
            {/* Orqadagi ikki "qog'oz" — ustma-ust turgan bildirishnomalar dastasi */}
            <div className="absolute inset-x-6 -bottom-3 h-full rounded-3xl glass opacity-50" />
            <div className="absolute inset-x-3 -bottom-1.5 h-full rounded-3xl glass opacity-75" />
            <div className="relative glass glass-solid rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <span className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <img src={sample.image || PLACEHOLDER} alt="" className="w-full h-full object-contain p-1.5" />
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{sample.name}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
                  <StoreLogo name={spread.low.source} size="sm" />{spread.low.source}
                </span>
                <span className="text-right">
                  <span className="block text-xs text-gray-400 line-through tabular-nums">{formatSum(spread.high.price)}</span>
                  <span className="block text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatSum(spread.low.price)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </m.section>
  );
}
