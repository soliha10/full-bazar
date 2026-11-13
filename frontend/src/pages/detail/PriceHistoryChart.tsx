import { useEffect, useMemo, useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import type { PricePoint } from "./useProductDetail";
import { buildSeries, typicalRange, type PriceVerdict } from "./priceHistorySeries";
import { HistoryTable } from "./HistoryTable";
import { HistoryDeviation, toBuckets } from "./HistoryDeviation";
import { historyFormatters } from "./historyFormat";

// Tarix 90 kunlik yuklanadi (useProductDetail), davr mijozda kesiladi
const PERIODS = [30, 90] as const;
const MOBILE = '(max-width: 767px)';
// Oraliq chegarasi — taxminiy qiymat: "2 542 774" emas, "2 543 000"
const round1k = (v: number) => Math.round(v / 1000) * 1000;

// Holat ranglari faqat holat ma'nosida va doim ikonka + matn bilan (dataviz: status)
export const VERDICT: Record<PriceVerdict, { icon: typeof Minus; tone: string }> = {
  low:     { icon: TrendingDown, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  typical: { icon: Minus,        tone: 'bg-gray-900/5 dark:bg-white/10 text-gray-700 dark:text-gray-200' },
  high:    { icon: TrendingUp,   tone: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
};

const seg = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
  on ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`;

/**
 * ── Narx tarixi ──
 * Xaridorning savoli "hozir olsam bo'ladimi?" — javob grafik ustida, so'z
 * bilan: narx odatdagidan past / odatiy / yuqori. Grafik uni tasdiqlaydi.
 */
export function PriceHistoryChart({ history, markets }: {
  /** null — hali yuklanmoqda */
  history: PricePoint[] | null;
  markets: { source: string; price: number }[];
}) {
  const { t, language } = useLanguage();
  const d = t.detailPage;
  const fmt = useMemo(() => historyFormatters(d, language === 'en' ? '.' : ','), [d, language]);
  const [days, setDays] = useState<(typeof PERIODS)[number]>(90);
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const on = () => setCompact(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const full = useMemo(() => buildSeries(history ?? [], markets, 90), [history, markets]);
  const { rows, summary } = useMemo(() => buildSeries(history ?? [], markets, days), [history, markets, days]);
  // "Odatiy narx" doim 90 kunlik ma'lumotdan — davr tanlovi xulosani o'zgartirmasin
  const typical = useMemo(() => typicalRange(full.rows), [full.rows]);
  // Nol chizig'i — odatiy narx; ma'lumot kam bo'lsa — davrning o'z medianasi
  const baseline = typical?.median ?? [...rows.map(r => r.min)].sort((a, b) => a - b)[rows.length >> 1] ?? 0;
  const buckets = useMemo(() => toBuckets(rows, days === 90, baseline), [rows, days, baseline]);

  const change = summary.changePct;
  const changeText = change === null ? null : Math.abs(change) < 0.05 ? d.historyNoChange
    : `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}%`;
  const changeTone = change === null || Math.abs(change) < 0.05 ? 'text-gray-900 dark:text-white'
    : change < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';

  return (
    <section aria-labelledby="history-title" className="h-full">
      <div className="h-full glass rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="history-title" className="text-base font-semibold text-gray-900 dark:text-white">{d.priceHistoryTitle}</h2>
          <div className="flex flex-wrap items-center gap-2">
          <div role="group" className="flex rounded-xl bg-gray-900/5 dark:bg-white/5 p-1">
            {PERIODS.map(p => (
              <button key={p} type="button" aria-pressed={days === p} onClick={() => setDays(p)} className={seg(days === p)}>
                {d.periodDays.replace('{{n}}', String(p))}
              </button>
            ))}
          </div>
          </div>
        </div>

        {history === null ? (
          <div className="h-[200px] rounded-2xl bg-gray-900/5 dark:bg-white/5 animate-pulse" aria-hidden="true" />
        ) : rows.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{d.collectingData}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{d.noPriceHistory}</p>
          </div>
        ) : (
          <>
            {/* Xulosa jumlasi; holat yorlig'i (past/odatiy/yuqori) sahifa tepasidagi narx kartasida */}
            <div className="mb-3">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-snug">
                {typical && (typical.point
                  ? d.verdictTextPoint.replace('{{price}}', formatSum(round1k((typical.low + typical.high) / 2)))
                  : d.verdictText.replace('{{low}}', formatSum(round1k(typical.low))).replace('{{high}}', formatSum(round1k(typical.high))))}{' '}
                {summary.current && d.verdictNow.replace('{{now}}', formatSum(summary.current.price)).replace('{{store}}', summary.current.source)}
              </p>
            </div>

            {/* Odatiy narxdan og'ish: 30 kun — kunlik, 90 kun — haftalik ustunlar */}
            <HistoryDeviation buckets={buckets} typical={baseline} fmtShort={fmt.short} fmtLong={fmt.long} compact={compact}
              labels={{ typical: d.devTypical, cheaper: d.devCheaper, pricier: d.devPricier, vsTypical: d.devVsTypical, range: d.candleRange }} />

            {/* Davr bo'yicha ikki raqam — grafik ostida, bir qatorda */}
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs md:text-sm">
              {summary.low && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 dark:text-gray-400">{d.historyLow}:</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatSum(summary.low.price)} <span className="font-normal text-gray-500 dark:text-gray-400">· {fmt.short(summary.low.date)}</span>
                  </dd>
                </div>
              )}
              {changeText && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 dark:text-gray-400">{d.historyChange}:</dt>
                  <dd className={`font-medium ${changeTone}`}>{changeText}</dd>
                </div>
              )}
            </dl>

            <HistoryTable rows={rows} fmtDate={fmt.long}
              labels={{ title: d.historyTableTitle, date: d.historyTableDate, store: d.historyTableStore, price: d.historyTablePrice, change: d.historyTableChange }} />
          </>
        )}
      </div>
    </section>
  );
}
