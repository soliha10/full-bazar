import { Heart, Bell, Scale, TrendingDown, HardDrive, MemoryStick } from 'lucide-react';
import { memoryFromName, nameWithoutMemory } from '../../utils/memoryFromName';
import { formatSum } from '../../utils/productMapper';
import { StoreLogo } from '../StoreLogo';
import type { Product } from './types';
import type { ProductCardState } from './useProductCard';
import { ProductTile, TileAction } from './ProductTile';

// Stopkada shuncha logo, qolgani — "+N"
const STACK = 3;

/** Do'konlar stopkasi: narx bo'yicha birinchi do'konlar logosi ustma-ust; nomi va narxi — data-tip */
function StoreStack({ markets }: { markets: { source: string; price: number }[] }) {
  const shown = markets.slice(0, STACK);
  const extra = markets.length - shown.length;
  return (
    <span className="relative z-10 flex shrink-0 items-center -space-x-1.5">
      {shown.map((m, i) => (
        <span key={`${m.source}-${i}`} data-tip={`${m.source} — ${formatSum(m.price)}`}
          className="rounded-md ring-2 ring-white dark:ring-gray-900" style={{ zIndex: STACK - i }}>
          <StoreLogo name={m.source} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-md glass-soft px-1 text-[10px] font-semibold text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900">
          +{extra}
        </span>
      )}
    </span>
  );
}

/** Narx ostidagi qator: do'konlar stopkasi, eng arzon do'kon nomi va do'konlar soni */
export function CatalogMeta({ card }: { card: ProductCardState }) {
  const { t, sortedMarkets, bestMarket } = card;
  const stores = sortedMarkets.length;
  if (!bestMarket) return null;
  // Stopka narx bo'yicha (filtrdagi do'kon birinchi turgan tartibdan qat'i nazar)
  const byPrice = [...sortedMarkets].sort((a, b) => a.price - b.price);
  return (
    <>
      <StoreStack markets={byPrice} />
      <span className="truncate">
        {bestMarket.source}
        {stores > 1 && <span className="text-gray-400 dark:text-gray-500"> · {t.home.storesTag.replace('{{count}}', String(stores))}</span>}
      </span>
    </>
  );
}

/** Tejash belgisi: do'konlar orasidagi farq foizi; to'liq izoh — data-tip */
export function SavingsBadge({ card }: { card: ProductCardState }) {
  const { t, savings, savingsPct } = card;
  if (savingsPct < 1) return null;
  const tip = t.common.savingsTip.replace('{{amount}}', formatSum(savings)).replace('{{pct}}', String(savingsPct));
  return (
    <span data-tip={tip} aria-label={tip}
      className="relative z-10 inline-flex cursor-default items-center gap-0.5 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-sm shadow-emerald-500/30">
      <TrendingDown className="w-3 h-3" aria-hidden="true" />
      {savingsPct}%
    </span>
  );
}

/** Xotira chiplari — nomdan (memoryFromName); nomi (RAM / Xotira) — data-tip */
export function MemoryChips({ name, card }: { name: string; card: ProductCardState }) {
  const { ram, storage } = memoryFromName(name);
  const labels = card.t.detailPage.specRows;
  const chip = (Icon: typeof HardDrive, label: string, value: string) => (
    <span data-tip={label} aria-label={`${label}: ${value}`}
      className="relative z-10 inline-flex cursor-default items-center gap-1 rounded-md glass-soft px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-gray-700 dark:text-gray-200">
      <Icon className="w-3 h-3 text-violet-500" aria-hidden="true" />{value}
    </span>
  );
  if (!ram && !storage) return null;
  return (
    <>
      {ram && chip(MemoryStick, labels.ram, ram)}
      {storage && chip(HardDrive, labels.storage, storage)}
    </>
  );
}

/** Katalog kartasi amallari: solishtirish, sevimli, (kirgan bo'lsa) narx kuzatuvi */
export function CatalogActions({ card, withWatch = true }: { card: ProductCardState; withWatch?: boolean }) {
  const { t, user, liked, watching, comparing, compareDisabled, compareTitle } = card;
  return (
    <>
      <TileAction on={comparing} label={compareTitle} onClick={card.toggleCompare} disabled={compareDisabled}>
        <Scale className="w-4 h-4" />
      </TileAction>
      <TileAction on={liked} label={t.footer.wishlist} onClick={card.toggleLike}>
        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      </TileAction>
      {withWatch && user && (
        <TileAction on={watching} label={watching ? t.common.watchRemove : t.common.watchAdd} onClick={card.toggleWatch}>
          <Bell className="w-4 h-4" />
        </TileAction>
      )}
    </>
  );
}

// ── Grid view ──────────────────────────────────────────────────────────────
// Loyihadagi yagona mahsulot kartasi (katalog, bosh sahifa, sevimlilar):
// rasm + amallar, tejash belgisi, nom, eng arzon narx, do'kon va do'konlar soni.
export function ProductCardGrid({ product, card, className, style }: {
  product: Product; card: ProductCardState; className?: string; style?: React.CSSProperties;
}) {
  return (
    <ProductTile to={card.href} name={product.name} shortName={memoryFromName(product.name).storage ? nameWithoutMemory(product.name) : undefined} image={product.image} className={className} style={style}
      badge={<SavingsBadge card={card} />} price={formatSum(card.bestPrice)} meta={<CatalogMeta card={card} />}
      chips={<MemoryChips name={product.name} card={card} />} actions={<CatalogActions card={card} />} />
  );
}
