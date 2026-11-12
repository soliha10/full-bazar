import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MarketFacet } from '../../hooks/useMarkets';
import { StoreLogo } from '../../components/StoreLogo';

/**
 * Narx olinadigan do'konlar — uzluksiz aylanadigan lenta (/api/markets).
 * Ro'yxat ikki marta chiziladi, ikkinchisi ekran o'quvchidan yashirin.
 * Sichqoncha yoki fokus ustida turganda to'xtaydi; "kamroq harakat"
 * sozlamasida lenta o'rniga oddiy gorizontal ro'yxat.
 */
export function StoreMarquee({ markets }: { markets: MarketFacet[] }) {
  const { t } = useLanguage();
  if (markets.length === 0) return null;

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {markets.map(mk => (
        <li key={mk.key}>
          <Link to={`/products?market=${encodeURIComponent(mk.key)}`} tabIndex={hidden ? -1 : undefined}
            className="glass-soft flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-violet-700 dark:hover:text-violet-300 transition-colors whitespace-nowrap">
            <StoreLogo name={mk.key} size="md" className="!rounded-full" />
            {mk.name}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={t.home.marqueeTitle} className="mt-6 md:mt-10">
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4 px-4">{t.home.marqueeTitle}</p>
      <div className="marquee relative overflow-hidden motion-reduce:overflow-x-auto
        [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="marquee-track flex w-max py-1">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
