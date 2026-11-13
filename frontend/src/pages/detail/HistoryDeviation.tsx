import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { formatSum } from "../../utils/productMapper";
import type { DayRow } from "./priceHistorySeries";
import { niceTicks } from "./historyFormat";

// Diverging — index.css dagi --viz-* bilan bir xil (validate_palette dan o'tgan)
const COLORS = {
  light: { down: '#2a78d6', up: '#e34948', flat: '#9ca3af', grid: '#eef0f3', muted: '#6b7280', zero: '#9ca3af', ink: '#374151' },
  dark: { down: '#3987e5', up: '#e66767', flat: '#6b7280', grid: '#1f2937', muted: '#9ca3af', zero: '#4b5563', ink: '#e5e7eb' },
};

export interface Bucket {
  key: string;
  from: string;
  to: string;
  /** Davr oxiridagi eng arzon narx */
  price: number;
  source: string;
  low: number;
  high: number;
  /** Odatiy narxdan og'ish, %: manfiy — arzonroq, musbat — qimmatroq */
  dev: number;
}

/**
 * Kunlik qatorlarni ustunlarga: 30 kun — har kun, 90 kun — har hafta.
 * Har ustun — davr oxiridagi eng arzon narxning ODATIY narxdan (90 kunlik
 * kunlik eng arzon narxlar medianasi) og'ishi, foizda.
 */
export function toBuckets(rows: DayRow[], weekly: boolean, typical: number): Bucket[] {
  const groups = new Map<string, DayRow[]>();
  for (const r of rows) {
    let key = r.date;
    if (weekly) {
      const d = new Date(`${r.date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      key = d.toISOString().slice(0, 10);
    }
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups].map(([key, list]) => {
    const last = list[list.length - 1];
    const mins = list.map(r => r.min);
    return {
      key, from: list[0].date, to: last.date, price: last.min, source: last.minSource,
      low: Math.min(...mins), high: Math.max(...mins),
      dev: typical > 0 ? ((last.min - typical) / typical) * 100 : 0,
    };
  });
}

const pctText = (v: number) => (Math.abs(v) < 0.05 ? '0%' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`);

/**
 * Diverging ustunlar vaqt bo'yicha: nol — odatiy narx. Pastga ko'k —
 * odatdagidan arzon, yuqoriga qizil — qimmat. Ustun noldan chiqadi
 * (uzunligi aldamaydi); oxirgi ustun — hozirgi holat, qiymati yozilgan.
 */
export function HistoryDeviation({ buckets, typical, fmtShort, fmtLong, labels, compact }: {
  buckets: Bucket[];
  typical: number;
  fmtShort: (iso: string) => string;
  fmtLong: (iso: string) => string;
  labels: { typical: string; cheaper: string; pricier: string; vsTypical: string; range: string };
  compact: boolean;
}) {
  const dark = useTheme().resolvedTheme === 'dark';
  const c = COLORS[dark ? 'dark' : 'light'];
  const devs = buckets.map(b => b.dev);
  // Kamida ±3%: odatiy narx atrofidagi mayda tebranish ustunlarni bo'rttirmasin
  const m = Math.max(3, ...devs.map(Math.abs));
  const ticks = niceTicks(-m, m, 4, true);
  const color = (v: number) => (Math.abs(v) < 0.05 ? c.flat : v < 0 ? c.down : c.up);

  return (
    <>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.down }} />↓ {labels.cheaper}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.up }} />↑ {labels.pricier}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-px" style={{ background: c.zero }} />{labels.typical}: {formatSum(Math.round(typical / 1000) * 1000)}</span>
      </div>
      <div style={{ height: compact ? 220 : 280 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 20, right: 8, left: 0, bottom: 4 }} barCategoryGap={buckets.length > 20 ? '14%' : '24%'}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="from" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: c.muted }}
              axisLine={false} tickLine={false} minTickGap={compact ? 24 : 36} tickMargin={10} />
            <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks}
              tickFormatter={(v) => (Number(v) === 0 ? '0' : `${Number(v) > 0 ? '+' : '−'}${Math.abs(Number(v))}%`)}
              tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} width={44} />
            <ReferenceLine y={0} stroke={c.zero} strokeWidth={1.5} />
            <Tooltip cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }} isAnimationActive={false}
              content={({ active, payload }) => {
                const b = active ? (payload?.[0]?.payload as Bucket | undefined) : undefined;
                if (!b) return null;
                return (
                  <div className="glass glass-solid rounded-xl px-3.5 py-3 text-xs min-w-[200px]">
                    <p className="text-gray-500 dark:text-gray-400">{b.from === b.to ? fmtLong(b.from) : `${fmtShort(b.from)} – ${fmtShort(b.to)}`}</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{formatSum(b.price)}</p>
                    <p className="text-gray-500 dark:text-gray-400">{b.source}</p>
                    <div className="mt-2 pt-2 border-t border-gray-900/5 dark:border-white/10 space-y-1 text-gray-600 dark:text-gray-300">
                      <p>{labels.vsTypical}: <span className="font-semibold" style={{ color: color(b.dev) }}>
                        {b.dev < -0.05 ? '↓ ' : b.dev > 0.05 ? '↑ ' : ''}{pctText(b.dev)}</span></p>
                      {b.low !== b.high && <p>{labels.range}: {formatSum(b.low)} – {formatSum(b.high)}</p>}
                    </div>
                  </div>
                );
              }} />
            <Bar dataKey="dev" maxBarSize={compact ? 18 : 32} isAnimationActive animationDuration={500}
              shape={(props: unknown) => {
                const { x = 0, y = 0, width = 0, height = 0, payload, index } =
                  props as { x?: number; y?: number; width?: number; height?: number; payload?: Bucket; index?: number };
                if (!payload) return <g />;
                const top = Math.min(y, y + height), h = Math.abs(height);
                const v = payload.dev, flat = Math.abs(v) < 0.05, last = index === buckets.length - 1;
                // Odatiy narxga teng davr ham ko'rinsin — nol ustida kulrang chiziq
                const rect = flat
                  ? <rect x={x} y={top - 1.5} width={width} height={3} rx={1.5} fill={c.flat} />
                  : <rect x={x} y={top} width={width} height={Math.max(h, 2)} rx={Math.min(4, width / 2)} fill={color(v)} fillOpacity={last ? 1 : 0.75} />;
                return (
                  <g>
                    {rect}
                    {/* Faqat oxirgi ustun yozilgan — hozirgi holat (dataviz: tanlab yozish) */}
                    {last && (
                      <text x={x + width / 2} y={v < 0 ? top + h + 14 : top - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill={c.ink}>
                        {pctText(v)}
                      </text>
                    )}
                  </g>
                );
              }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
