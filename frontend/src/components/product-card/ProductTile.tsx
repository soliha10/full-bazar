import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../Card';

export const PRODUCT_PLACEHOLDER = 'https://placehold.co/400x400/f9fafb/9ca3af?text=📱';

const RATIO = { square: 'aspect-square', wide: 'aspect-[4/3]' } as const;

/**
 * Mahsulot kartasining umumiy qobig'i — loyihadagi barcha mahsulot kartalari
 * (katalog, takliflar, o'xshash modellar, saqlanganlar, mashhurlar) shu orqali.
 * Glass karta, glass rasm foni, bir xil nom/narx tipografiyasi. Butun karta —
 * bitta haqiqiy havola (nomdagi <a> kartani qoplaydi: qidiruv robotlari ham
 * ko'radi), tugmalar (actions) havoladan yuqorida turadi.
 */
export interface ProductTileProps {
  to: string;
  name: string;
  /** Kartada ko'rinadigan qisqa nom (masalan, xotirasiz — xotira chipda); to'liq nom alt va aria-label da */
  shortName?: string;
  image?: string | null;
  /** Asosiy narx — formatlangan matn */
  price: ReactNode;
  /** Narx ustidagi kichik yorliq ("Eng arzoni") */
  priceLabel?: ReactNode;
  /** Narx ostidagi bitta qator: do'kon, farq, do'konlar soni */
  meta?: ReactNode;
  /** Nom ostidagi kichik chiplar (xotira va h.k.) */
  chips?: ReactNode;
  /** Karta pastidagi chiziq bilan ajratilgan qator */
  footer?: ReactNode;
  /** Rasm ustida, chap burchakda (chegirma, o'rin) */
  badge?: ReactNode;
  /** Rasm ustida, o'ng burchakda — TileAction tugmalari */
  actions?: ReactNode;
  /** grid — setka kartasi, row — ro'yxat qatori */
  layout?: 'grid' | 'row';
  /** sm — tor qatorlar (o'xshash modellar, mashhurlar) uchun ixcham */
  size?: 'sm' | 'md';
  ratio?: keyof typeof RATIO;
  as?: 'article' | 'li' | 'div';
  className?: string;
  style?: CSSProperties;
}

function TileImage({ src, alt, className }: { src?: string | null; alt: string; className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl glass-soft ${className}`}>
      {/* Doimiy yumshoq binafsha gradient; hover da mahsulot ortidagi nur kuchayadi */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-violet-500/[0.08] via-transparent to-fuchsia-500/[0.05]" />
      <span aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(139,92,246,0.28),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <img src={src || PRODUCT_PLACEHOLDER} alt={alt} loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = PRODUCT_PLACEHOLDER; }}
        className="relative w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]" />
    </div>
  );
}

// Havola butun kartani qoplaydi (::after), karta esa `relative`
const STRETCHED = "after:absolute after:inset-0 after:content-[''] hover:text-violet-700 dark:hover:text-violet-300 transition-colors";

export function ProductTile({
  to, name, shortName, image, price, priceLabel, meta, chips, footer, badge, actions,
  layout = 'grid', size = 'md', ratio = 'square', as = 'article', className = '', style,
}: ProductTileProps) {
  const sm = size === 'sm';

  if (layout === 'row') {
    return (
      <Card as={as} interactive padding="sm" style={style} className={`group relative flex items-center gap-4 ${className}`}>
        <TileImage src={image} alt={name} className="w-20 h-20 shrink-0 [&_img]:p-2" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
            <Link to={to} aria-label={shortName ? name : undefined} className={STRETCHED}>{shortName ?? name}</Link>
          </h3>
          {chips && <div className="mt-1 flex flex-wrap gap-1">{chips}</div>}
          {meta && <div className="mt-1 flex items-center gap-1.5 min-w-0 text-xs text-gray-500 dark:text-gray-400">{meta}</div>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
        <p className="text-base font-semibold tracking-tight tabular-nums whitespace-nowrap text-gray-900 dark:text-white">{price}</p>
        {actions && <div className="relative z-10 flex flex-col gap-1 shrink-0">{actions}</div>}
      </Card>
    );
  }

  return (
    <Card as={as} interactive padding="none" style={style} className={`group relative flex flex-col h-full overflow-hidden ${className}`}>
      <div className="relative m-1.5">
        <TileImage src={image} alt={name} className={`${RATIO[ratio]} ${sm ? '[&_img]:p-2' : '[&_img]:p-4 md:[&_img]:p-5'}`} />
        {badge && <div className="absolute top-2 left-2 z-10">{badge}</div>}
        {actions && <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">{actions}</div>}
      </div>
      <div className={`flex flex-col flex-1 gap-1 ${sm ? 'px-2.5 pb-2.5 pt-1' : 'px-3 pb-3 pt-1.5 md:px-4 md:pb-4'}`}>
        <h3 className={`font-medium text-gray-900 dark:text-white leading-snug line-clamp-2 ${sm ? 'text-xs min-h-[2rem]' : 'text-sm md:text-[15px] min-h-[2.5rem]'}`}>
          <Link to={to} aria-label={shortName ? name : undefined} className={STRETCHED}>{shortName ?? name}</Link>
        </h3>
        {chips && !sm && <div className="flex flex-wrap gap-1">{chips}</div>}
        {/* Narx bloki — chiziq bilan ajratilgan; o'ngda "o'tish" doirasi (bezak: butun karta havola) */}
        <div className={`mt-auto min-w-0 flex items-end gap-2 ${sm ? 'pt-1' : 'pt-2.5 border-t border-gray-900/5 dark:border-white/10'}`}>
          <div className="min-w-0 flex-1">
            {priceLabel && <p className="text-[11px] text-gray-500 dark:text-gray-400">{priceLabel}</p>}
            <p className={`font-semibold tracking-tight tabular-nums whitespace-nowrap text-gray-900 dark:text-white ${sm ? 'text-sm' : 'text-base md:text-lg'}`}>
              {price}
            </p>
            {meta && <div className="mt-0.5 flex items-center gap-1.5 min-w-0 text-[11px] md:text-xs text-gray-500 dark:text-gray-400">{meta}</div>}
          </div>
          {!sm && (
            <span aria-hidden="true"
              className="hidden sm:flex w-8 h-8 shrink-0 items-center justify-center rounded-full glass-soft text-gray-500 dark:text-gray-400 transition-all duration-300 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 group-hover:rotate-45">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          )}
        </div>
        {footer && (
          <div className="mt-1.5 pt-2 border-t border-gray-900/5 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">{footer}</div>
        )}
      </div>
    </Card>
  );
}

/** Karta ustidagi kichik amal tugmasi (solishtirish, sevimli, kuzatuv). Nomi — data-tip. */
export function TileAction({ on, label, onClick, disabled, children }: {
  on: boolean; label: string; onClick: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <button type="button" data-tip={label} aria-label={label} aria-pressed={on}
      onClick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
        on ? 'bg-violet-600 text-white' : 'glass-soft text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
      } ${disabled ? 'opacity-40' : ''}`}>
      {children}
    </button>
  );
}

/** Yuklanish holati — kartaning o'zi kabi glass, o'lchamlari bir xil. */
export function ProductTileSkeleton({ size = 'md', ratio = 'square', className = '' }: {
  size?: 'sm' | 'md'; ratio?: keyof typeof RATIO; className?: string;
}) {
  const sm = size === 'sm';
  return (
    <Card padding="none" aria-hidden="true" className={`animate-pulse overflow-hidden ${className}`}>
      <div className={`m-1.5 rounded-xl glass-soft ${RATIO[ratio]}`} />
      <div className={`space-y-2 ${sm ? 'px-2.5 pb-3 pt-1' : 'px-3 pb-4 pt-2'}`}>
        <div className="h-3 w-4/5 rounded-full glass-soft" />
        <div className="h-4 w-2/5 rounded-full glass-soft" />
      </div>
    </Card>
  );
}
