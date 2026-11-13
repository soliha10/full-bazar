import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { BrandFacet } from '../../../hooks/useBrands';
import { formatSum } from '../../../utils/productMapper';
import { Card } from '../../../components/Card';
import { fmt } from '../shared';

// Yelpig'ichdagi o'rinlar: chap, o'rta, o'ng. Hover da chetdagilar yoyiladi.
const FAN = [
  'z-0 -translate-x-[58%] -rotate-[10deg] group-hover:-translate-x-[78%] group-hover:-rotate-[14deg]',
  'z-20 group-hover:-translate-y-1.5 group-hover:scale-[1.04]',
  'z-10 translate-x-[58%] rotate-[10deg] group-hover:translate-x-[78%] group-hover:rotate-[14deg]',
];
// Rasmlar soni kam bo'lsa — o'rtadan boshlab joylashadi
const ORDER: Record<number, number[]> = { 1: [1], 2: [0, 2], 3: [0, 1, 2] };

/** Brendning mashhur modellari — ustma-ust yelpig'ich (haqiqiy mahsulot rasmlari) */
function PhoneFan({ images, size }: { images: string[]; size: 'lg' | 'md' }) {
  const frame = size === 'lg' ? 'w-28 h-40 sm:w-32 sm:h-44' : 'w-16 h-24 sm:w-20 sm:h-28';
  const slots = ORDER[images.length] ?? [];
  return (
    <div aria-hidden="true" className="relative flex items-center justify-center">
      {images.map((src, i) => (
        <span key={src}
          className={`absolute ${frame} ${FAN[slots[i]]} overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 dark:ring-white/10 shadow-xl shadow-black/10 dark:shadow-black/50 transition-transform duration-500 ease-out`}>
          {/* Do'kon rasmlari oq fonli — ramka ham oq: rasm kartochkaga yaxlit qo'shiladi */}
          <img src={src} alt="" loading="lazy" className="w-full h-full object-contain p-2" />
        </span>
      ))}
      {/* Joy egallashi uchun — absolyut rasmlar balandlik bermaydi */}
      <span className={`${frame} invisible`} />
    </div>
  );
}

/** Katalogdagi ulushi — modellar sonining barcha modellarga nisbati */
function ShareMeter({ pct }: { pct: number }) {
  const { t } = useLanguage();
  return (
    <div className="mt-3 max-w-[220px]">
      <div className="h-1.5 overflow-hidden rounded-full glass-soft">
        <div className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{t.home.brandShare.replace('{{pct}}', String(pct))}</p>
    </div>
  );
}

/**
 * Yirik brend kartasi (eng ko'p modelli 3 brend). hero — chapdagi katta karta,
 * aks holda — o'ngdagi gorizontal karta (telefonda vertikal).
 */
export function FeaturedBrand({ b, rank, share, hero, className = '' }: {
  b: BrandFacet; rank: number; share: number; hero?: boolean; className?: string;
}) {
  const { t } = useLanguage();
  const h = t.home;
  const images = (b.images?.length ? b.images : b.image ? [b.image] : []).slice(0, 3);

  return (
    <Card as={Link} interactive padding="none" to={`/products?brand=${encodeURIComponent(b.key)}`}
      className={`group relative isolate overflow-hidden flex ${hero ? 'flex-col md:flex-row md:items-center lg:flex-col lg:items-stretch' : 'flex-col lg:flex-row lg:items-center'} gap-4 p-4 sm:p-5 ${className}`}>
      {/* Bezak: binafsha nur — brend rangi qo'lda yozilmaydi, sayt aksenti */}
      <span aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl opacity-70 transition-opacity duration-500 group-hover:opacity-100 dark:bg-violet-500/20" />

      <div className={`min-w-0 ${hero ? '' : 'lg:flex-1'} order-2 ${hero ? '' : 'lg:order-1'}`}>
        <span className="inline-flex h-6 items-center rounded-full bg-violet-600/10 px-2 text-[11px] font-semibold text-violet-700 dark:text-violet-300 tabular-nums">
          №{rank}
        </span>
        <h3 className={`mt-2 font-semibold tracking-tight text-gray-900 dark:text-white ${hero ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
          {b.name}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {h.brandModels.replace('{{count}}', fmt(b.count))}
          {b.min_price ? <> · <span className="font-medium tabular-nums text-gray-900 dark:text-white">{h.brandFrom.replace('{{price}}', formatSum(b.min_price))}</span></> : null}
        </p>
        <ShareMeter pct={share} />
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
          {h.brandCta}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>

      {images.length > 0 && (
        <div className={`order-1 ${hero ? 'flex-1 flex items-center justify-center py-4 md:py-6 lg:py-8' : 'lg:order-2 flex justify-center py-2 lg:w-[45%] lg:py-0'}`}>
          <PhoneFan images={images} size={hero ? 'lg' : 'md'} />
        </div>
      )}
    </Card>
  );
}
