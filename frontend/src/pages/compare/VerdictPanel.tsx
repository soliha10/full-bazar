import { ExternalLink, Store, Trophy, Award } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { trackStoreClick } from '../../services/tracking';
import { useLanguage } from '../../contexts/LanguageContext';
import type { CompareItem, Verdict } from './types';

/**
 * Solishtirishdan keyingi xulosa.
 *
 * Jadvalning o'zi javob bermaydi — foydalanuvchi 12 ta qatorni o'qib chiqib
 * ham "qaysinisini olay, qayerdan olay?" degan savol bilan qoladi. Bu panel
 * shu ikki savolga aniq javob beradi: tavsiya etilgan model va eng arzon
 * variant qaysi do'konlarda bor.
 */
export function VerdictPanel({ verdict, items, onOpen }: {
  verdict: Verdict;
  items: CompareItem[];
  onOpen: (item: CompareItem) => void;
}) {
  const { t } = useLanguage();
  const byId = new Map(items.map((it) => [it.product.id, it]));
  const recommended = byId.get(verdict.recommended.productId);
  const score = verdict.scores.find((s) => s.productId === verdict.recommended.productId);
  const cheapest = verdict.cheapest;
  if (!recommended) return null;

  // Sabablar server qaytargan tuzilgan ma'lumotdan shu yerda yig'iladi:
  // verdict.recommended.reasons serverda o'zbekcha matn, tanlangan tilga mos
  // kelmaydi. Mantiq backenddagi _compare_verdict bilan bir xil.
  const metricLabels = t.compare.metrics as Record<string, string>;
  const reasons: string[] = [];
  const won = Object.entries(verdict.winners)
    .filter(([, w]) => w.productId === recommended.product.id)
    .map(([metric, w]) => metricLabels[metric] ?? w.label);
  if (won.length) reasons.push(t.compare.reasonBestAt.replace('{{metrics}}', won.slice(0, 3).join(', ')));
  const validPrices = items.map((it) => it.product.price).filter((p) => p > 0);
  const loPrice = validPrices.length ? Math.min(...validPrices) : 0;
  if (cheapest && cheapest.productId === recommended.product.id) {
    reasons.push(t.compare.reasonCheapest);
  } else if (loPrice > 0 && recommended.product.price > loPrice) {
    reasons.push(t.compare.reasonPricier.replace('{{amount}}', formatSum(recommended.product.price - loPrice)));
  }
  if (!reasons.length) reasons.push(t.compare.reasonBalance);

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {/* ── Tavsiya ── */}
      <div className="bg-violet-50/70 dark:bg-violet-950/25 border border-violet-100 dark:border-violet-900/40 rounded-2xl p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-3">
          <Award className="w-3.5 h-3.5" /> {t.compare.recommend}
        </p>
        <button
          onClick={() => onOpen(recommended)}
          className="flex items-center gap-3 text-left w-full group"
        >
          <img
            src={recommended.product.image || 'https://placehold.co/80x80/f5f3ff/7c3aed?text=📱'}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/f5f3ff/7c3aed?text=📱'; }}
            alt={recommended.product.name}
            className="w-12 h-12 object-contain shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-violet-600">
              {recommended.product.name}
            </span>
            <span className="block text-sm font-black text-violet-600">{formatSum(recommended.product.price)}</span>
          </span>
        </button>

        <ul className="mt-3 space-y-1">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300">
              <span className="text-violet-500 leading-4">•</span> {reason}
            </li>
          ))}
        </ul>

        {score && (
          <div className="mt-3 space-y-1.5">
            <ScoreBar label={t.compare.scoreSpecs} value={score.specScore} />
            <ScoreBar label={t.compare.scorePrice} value={score.priceScore} />
          </div>
        )}
      </div>

      {/* ── Eng arzon va qayerda bor ── */}
      {cheapest && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3">
            <Trophy className="w-3.5 h-3.5" /> {t.compare.cheapestOption}
          </p>
          <p className="text-sm font-black text-gray-900 dark:text-white line-clamp-2">{cheapest.name}</p>
          <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{formatSum(cheapest.price)}</p>

          {cheapest.vsMostExpensive > 0 && (
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
              {t.compare.cheaperThanPriciest.replace('{{amount}}', formatSum(cheapest.vsMostExpensive))}
            </p>
          )}

          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-3 mb-1.5">
            {t.compare.availableInStores.replace('{{count}}', String(cheapest.marketCount))}
          </p>
          <div className="flex flex-col gap-1">
            {cheapest.markets.slice(0, 4).map((market, i) => (
              <a
                key={`${market.source}-${i}`}
                href={market.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackStoreClick(cheapest.productId, market.source, market.price)}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  i === 0
                    ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white/70 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-1 truncate">
                  <Store className="w-3 h-3 shrink-0" /> {market.source}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {formatSum(market.price)} <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>

          {cheapest.maxSaving > 0 && (
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">
              {t.compare.saveVsPriciestStore.replace('{{amount}}', formatSum(cheapest.maxSaving))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
      <span className="flex-1 h-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 overflow-hidden">
        <span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
      <span className="w-8 shrink-0 text-right text-[11px] font-black text-violet-600 tabular-nums">{value}</span>
    </div>
  );
}
