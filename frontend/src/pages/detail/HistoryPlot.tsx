import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { formatSum } from "../../utils/productMapper";
import type { DayRow } from "./priceHistorySeries";
import { niceTicks } from "./historyFormat";

/*
 * Ranglar validate_palette.js dan o'tgan (dataviz): asosiy chiziq — bitta
 * aksent; do'konlar — uchta toifaviy slot (barcha juftliklar CVD ΔE ≥ 9).
 * Tungi rejim — o'sha ranglarning qorong'i sirt uchun tanlangan pog'onalari.
 */
const PALETTE = {
  light: { accent: '#7c3aed', slots: ['#2a78d6', '#eb6834', '#1baf7a'], context: '#d1d5db', grid: '#eceef2', ink: '#111827', muted: '#6b7280', surface: '#ffffff' },
  dark: { accent: '#8b5cf6', slots: ['#3987e5', '#d95926', '#199e70'], context: '#374151', grid: '#1f2937', ink: '#f3f4f6', muted: '#9ca3af', surface: '#111827' },
};
export const slotColor = (dark: boolean, slot: number) => PALETTE[dark ? 'dark' : 'light'].slots[slot];

export interface PlotLabels { lowest: string; median: string; range: string; stores: string; low: string }
export interface PlotFormat {
  short: (iso: string) => string; long: (iso: string) => string;
  axis: (v: number, step: number, withUnit?: boolean) => string; unit: string;
}

type Tip = { active?: boolean; payload?: { payload: DayRow }[]; label?: string };

/** Qiymat oldinda (qalin), nom keyin; seriya kaliti — qisqa chiziq (dataviz: line keys). */
function HistoryTooltip({ active, payload, label, mode, picks, fmt, labels, dark }: Tip & {
  mode: 'overview' | 'stores'; picks: [string, number][]; fmt: PlotFormat; labels: PlotLabels; dark: boolean;
}) {
  if (!active || !payload?.length || !label) return null;
  const row = payload[0].payload;
  const key = (color: string) => <span className="w-3 h-0.5 rounded-full shrink-0" style={{ background: color }} />;
  return (
    <div className="glass glass-solid rounded-xl px-3.5 py-3 text-xs min-w-[210px]">
      <p className="text-gray-500 dark:text-gray-400 mb-2">{fmt.long(label)}</p>
      {mode === 'overview' ? (
        <>
          <p className="flex items-center gap-2">
            {key(PALETTE[dark ? 'dark' : 'light'].accent)}
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatSum(row.min)}</span>
            <span className="text-gray-500 dark:text-gray-400 truncate">{labels.lowest} · {row.minSource}</span>
          </p>
          {row.count > 1 && (
            <dl className="mt-2 pt-2 border-t border-gray-900/5 dark:border-white/10 space-y-1 text-gray-600 dark:text-gray-300">
              <div className="flex justify-between gap-4"><dt>{labels.median}</dt><dd className="tabular-nums">{formatSum(row.median)}</dd></div>
              <div className="flex justify-between gap-4"><dt>{labels.range}</dt><dd className="tabular-nums">{formatSum(row.min)} – {formatSum(row.max)}</dd></div>
              <div className="text-gray-400">{labels.stores.replace('{{count}}', String(row.count))}</div>
            </dl>
          )}
        </>
      ) : (
        <ul className="space-y-1.5">
          {picks.filter(([s]) => row.stores[s] !== undefined).sort((a, b) => row.stores[a[0]] - row.stores[b[0]]).map(([s, slot]) => (
            <li key={s} className="flex items-center gap-2">
              {key(slotColor(dark, slot))}
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatSum(row.stores[s])}</span>
              <span className="text-gray-500 dark:text-gray-400">{s}</span>
            </li>
          ))}
          <li className="pt-1.5 border-t border-gray-900/5 dark:border-white/10 text-gray-500 dark:text-gray-400">
            {labels.lowest}: <span className="text-gray-900 dark:text-white font-medium">{formatSum(row.min)}</span> · {row.minSource}
          </li>
        </ul>
      )}
    </div>
  );
}

/**
 * Umumiy rejim — bitta chiziq (eng arzon narx) va ostida yengil yuvinish;
 * tanlab yozilgan ikki qiymat: hozirgi narx (oxirida) va davrdagi eng past.
 * Do'konlar rejimi — ajratib ko'rsatish: hamma do'kon kulrang fon chizig'i,
 * tanlanganlari (≤3) rangli va oxirida nomi. Chiziqlar pog'onali: narx
 * keyingi o'zgarishgacha bir xil turadi.
 */
export function HistoryPlot({ rows, mode, sources, picks, fmt, labels, compact, height }: {
  rows: DayRow[];
  mode: 'overview' | 'stores';
  sources: string[];
  /** [do'kon, rang sloti] — rang do'konga biriktiriladi, tartibga emas */
  picks: [string, number][];
  fmt: PlotFormat;
  labels: PlotLabels;
  compact: boolean;
  /** Konteyner balandligi (px) — oxirgi yozuvlar to'qnashuvini hisoblash uchun */
  height: number;
}) {
  const dark = useTheme().resolvedTheme === 'dark';
  const c = PALETTE[dark ? 'dark' : 'light'];
  const picked = new Set(picks.map(([s]) => s));

  // Shkala — faqat ko'rsatilayotgan narsaga: do'konlar rejimida TANLANGAN
  // do'konlarga. Kulrang fon chiziqlari chetdan chiqsa kesiladi — bitta qimmat
  // do'kon solishtirilayotgan chiziqlarni tor yo'lakka siqib qo'ymasin
  const shown = mode === 'overview'
    ? rows.map(r => r.min)
    : rows.flatMap(r => picks.map(([s]) => r.stores[s]).filter((v): v is number => v !== undefined));
  const values = shown.length ? shown : rows.map(r => r.min);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const last = rows[rows.length - 1];
  const low = rows.reduce((a, r) => (r.min < a.min ? r : a), rows[0]);
  // Oxirgi nomlar bir-biriga 16px dan yaqin bo'lsa — pastdagisi yozilmaydi
  // (siljitilmaydi: siljigan yozuv chizig'idan uzilib qoladi); identifikatsiyani
  // chiplar (legenda) va tooltip ko'taradi
  const pxPerUnit = (height - 46) / Math.max(1, ticks[ticks.length - 1] - ticks[0]);
  const labeled = new Set<string>();
  const placed: number[] = [];
  for (const [s] of [...picks].sort((a, b) => (last.stores[a[0]] ?? 0) - (last.stores[b[0]] ?? 0))) {
    const v = last.stores[s];
    if (v === undefined) continue;
    const y = v * pxPerUnit;
    if (placed.every(p => Math.abs(p - y) >= 16)) { labeled.add(s); placed.push(y); }
  }
  const endLabel = (text: string, color: string, show = true) => (props: { x?: number; y?: number; index?: number }) =>
    show && props.index === rows.length - 1 && !compact && props.x !== undefined && props.y !== undefined
      ? <text x={props.x + 10} y={props.y} dy={4} fontSize={12} fontWeight={600} fill={color}>{text}</text>
      : <g />;
  const ring = { r: 5, strokeWidth: 2, stroke: c.surface };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ top: 16, right: compact ? 12 : 124, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="history-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.accent} stopOpacity={0.14} />
            <stop offset="100%" stopColor={c.accent} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={c.grid} strokeWidth={1} />
        <XAxis dataKey="date" tickFormatter={fmt.short} tick={{ fontSize: 11, fill: c.muted }}
          axisLine={{ stroke: c.grid }} tickLine={false} minTickGap={compact ? 36 : 48} tickMargin={10} />
        <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tickFormatter={(v) => fmt.axis(Number(v), ticks[1] - ticks[0], !compact)}
          tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} width={compact ? 40 : 64} allowDataOverflow />
        <Tooltip cursor={{ stroke: c.muted, strokeOpacity: 0.4, strokeWidth: 1 }} isAnimationActive={false}
          content={<HistoryTooltip mode={mode} picks={picks} fmt={fmt} labels={labels} dark={dark} />} />

        {mode === 'overview' ? (
          <>
            <Area dataKey="min" type="stepAfter" stroke="none" fill="url(#history-wash)" baseValue={ticks[0]}
              isAnimationActive={false} activeDot={false} />
            <Line dataKey="min" type="stepAfter" stroke={c.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              dot={false} activeDot={ring} animationDuration={500}
              label={endLabel(formatSum(last.min), c.ink)} />
            {low.date !== last.date && (
              <ReferenceDot x={low.date} y={low.min} r={4} fill={c.accent} stroke={c.surface} strokeWidth={2}
                label={{ value: labels.low, position: 'bottom', offset: 8, fontSize: 11, fill: c.muted }} />
            )}
            <ReferenceDot x={last.date} y={last.min} r={4} fill={c.accent} stroke={c.surface} strokeWidth={2} />
          </>
        ) : (
          <>
            {/* Kontekst: tanlanmagan do'konlar — bir xil kulrang, ingichka */}
            {sources.filter(s => !picked.has(s)).map(s => (
              <Line key={`ctx-${s}`} dataKey={(r: DayRow) => r.stores[s]} type="stepAfter" stroke={c.context}
                strokeWidth={1} dot={false} activeDot={false} isAnimationActive={false} />
            ))}
            {picks.map(([s, slot]) => (
              <Line key={s} dataKey={(r: DayRow) => r.stores[s]} type="stepAfter" stroke={slotColor(dark, slot)}
                strokeWidth={2} strokeLinecap="round" dot={false} activeDot={ring} animationDuration={400}
                label={endLabel(s, c.ink, labeled.has(s))} />
            ))}
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
