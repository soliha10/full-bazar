import { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { StoreLogo } from "../../components/StoreLogo";
import type { PricePoint } from "./useProductDetail";
import type { DetailTab } from "./SpecsSection";
import { buildSeries } from "./priceHistorySeries";
import { HistoryPlot, STORE_COLORS } from "./HistoryPlot";
import { historyFormatters } from "./historyFormat";

// Tarix 90 kunlik yuklanadi (useProductDetail), davr mijozda kesiladi
const PERIODS = [7, 30, 90] as const;
const MAX_STORES = 5;

const seg = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
  on ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`;

/** ── Price History ── */
export function PriceHistoryChart({ history, markets, activeTab }: {
  /** null — hali yuklanmoqda */
  history: PricePoint[] | null;
  markets: { source: string; price: number }[];
  activeTab: DetailTab;
}) {
  const { t, language } = useLanguage();
  const d = t.detailPage;
  const fmt = useMemo(() => historyFormatters(d, language === 'en' ? '.' : ','), [d, language]);
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [mode, setMode] = useState<'overview' | 'stores'>('overview');
  const [selected, setSelected] = useState<string[] | null>(null);

  const { rows, sources, summary } = useMemo(
    () => buildSeries(history ?? [], markets, days), [history, markets, days]);
  // Standart holatda hozir eng arzon 3 ta do'kon
  const picked = (selected ?? sources.slice(0, 3)).filter(s => sources.includes(s));
  const toggle = (src: string) => setSelected(
    picked.includes(src) ? picked.filter(s => s !== src) : picked.length < MAX_STORES ? [...picked, src] : picked);

  const fmtDate = fmt.short;
  const change = summary.changePct;
  const flat = change === null || Math.abs(change) < 0.05;

  const tiles = [
    { label: d.historyNow, value: summary.current ? formatSum(summary.current.price) : '—', sub: summary.current?.source, logo: true },
    { label: d.historyLow, value: summary.low ? formatSum(summary.low.price) : '—', sub: summary.low && fmtDate(summary.low.date) },
    { label: d.historyHigh, value: summary.high ? formatSum(summary.high.price) : '—', sub: summary.high && fmtDate(summary.high.date) },
    {
      label: d.historyChange,
      value: change === null ? '—' : flat ? d.historyNoChange : `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}%`,
      // Arzonlashish — xaridor uchun yaxshi xabar (yashil), qimmatlashish — qizil
      tone: flat ? undefined : change! < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
    },
  ];

  return (
    <section aria-labelledby="history-title" className={`${activeTab !== 'priceHistory' && 'hidden lg:block'} mt-10`}>
      <div className="glass rounded-3xl p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 id="history-title" className="text-lg font-semibold text-gray-900 dark:text-white">{d.priceHistoryTitle}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" className="flex rounded-xl bg-gray-900/5 dark:bg-white/5 p-1">
              {(['overview', 'stores'] as const).map(m => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={seg(mode === m)}>
                  {m === 'overview' ? d.historyOverview : d.historyByStore}
                </button>
              ))}
            </div>
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
          <div className="h-[300px] rounded-2xl bg-gray-900/5 dark:bg-white/5 animate-pulse" aria-hidden="true" />
        ) : rows.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{d.collectingData}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{d.noPriceHistory}</p>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
              {tiles.map(tile => (
                <div key={tile.label} className="rounded-2xl bg-gray-900/[0.03] dark:bg-white/[0.04] px-4 py-3">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{tile.label}</dt>
                  <dd className={`mt-1 text-base md:text-lg font-semibold tracking-tight tabular-nums ${tile.tone ?? 'text-gray-900 dark:text-white'}`}>
                    {tile.value}
                  </dd>
                  {tile.sub && (
                    <dd className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {tile.logo && <StoreLogo name={tile.sub} size="xs" />}{tile.sub}
                    </dd>
                  )}
                </div>
              ))}
            </dl>

            {mode === 'stores' && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{d.historyPickHint}</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map(src => {
                    const i = picked.indexOf(src);
                    const now = rows[rows.length - 1].stores[src];
                    return (
                      <button key={src} type="button" aria-pressed={i >= 0} onClick={() => toggle(src)}
                        disabled={i < 0 && picked.length >= MAX_STORES}
                        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors disabled:opacity-40 ${
                          i >= 0 ? 'border-transparent bg-gray-900/5 dark:bg-white/10 text-gray-900 dark:text-white'
                                 : 'border-gray-900/10 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}>
                        <StoreLogo name={src} size="sm" className="!rounded-full" />
                        {src}
                        {now !== undefined && <span className="tabular-nums text-gray-500 dark:text-gray-400">{formatSum(now)}</span>}
                        {i >= 0 && <span className="w-2 h-2 rounded-full" style={{ background: STORE_COLORS[i] }} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grafik ko'rinmaydigan foydalanuvchi uchun bitta jumlada xulosa */}
            <p className="sr-only">
              {d.historySummary.replace('{{n}}', String(days)).replace('{{low}}', formatSum(summary.low?.price ?? 0))
                .replace('{{high}}', formatSum(Math.max(...rows.map(r => r.min)))).replace('{{now}}', formatSum(summary.current?.price ?? 0))}
            </p>
            <div className="h-[240px] md:h-[320px] -ml-2" aria-hidden="true">
              <HistoryPlot rows={rows} mode={mode} selected={picked} fmt={fmt}
                labels={{ lowest: d.historyLowest, median: d.historyMedian, range: d.historyRange, stores: d.historyStores }} />
            </div>

            {mode === 'overview' && (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2"><span className="w-4 h-0.5 rounded bg-violet-600" />{d.historyLowest}</span>
                <span className="flex items-center gap-2"><span className="w-4 border-t-[1.5px] border-dashed border-gray-400" />{d.historyMedian}</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
