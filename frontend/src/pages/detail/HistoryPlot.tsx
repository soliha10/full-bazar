import {
  CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { formatSum } from "../../utils/productMapper";
import type { DayRow } from "./priceHistorySeries";
import { niceTicks } from "./historyFormat";

// validate_palette.js dan o'tgan aksent (kunduzgi/tungi pog'ona), neytral setka va matn
const PALETTE = {
  light: { line: '#7c3aed', band: '#10b981', grid: '#eef0f3', muted: '#6b7280', ink: '#111827', surface: '#ffffff' },
  dark: { line: '#8b5cf6', band: '#10b981', grid: '#1f2937', muted: '#9ca3af', ink: '#f3f4f6', surface: '#111827' },
};

export interface PlotLabels { lowest: string; stores: string; typical: string }
export interface PlotFormat {
  short: (iso: string) => string; long: (iso: string) => string;
  axis: (v: number, step: number, withUnit?: boolean) => string; unit: string;
}

type Tip = { active?: boolean; payload?: { payload: DayRow }[]; label?: string };

function HistoryTooltip({ active, payload, label, fmt, labels }: Tip & { fmt: PlotFormat; labels: PlotLabels }) {
  if (!active || !payload?.length || !label) return null;
  const row = payload[0].payload;
  return (
    <div className="glass glass-solid rounded-xl px-3.5 py-3 text-xs min-w-[200px]">
      <p className="text-gray-500 dark:text-gray-400">{fmt.long(label)}</p>
      <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{formatSum(row.min)}</p>
      <p className="text-gray-500 dark:text-gray-400">{labels.lowest} · {row.minSource}</p>
      {row.count > 1 && (
        <p className="mt-2 pt-2 border-t border-gray-900/5 dark:border-white/10 text-gray-500 dark:text-gray-400">
          {labels.stores.replace('{{count}}', String(row.count))} · {formatSum(row.min)} – {formatSum(row.max)}
        </p>
      )}
    </div>
  );
}

/**
 * Bitta chiziq — kunlik eng arzon narx (pog'onali: narx keyingi o'zgarishgacha
 * saqlanadi). Ortida yashil yo'lak — "odatiy narx" (90 kunlik 25–75%).
 * Shkala ataylab keng: odatiy oraliqning kamida 3 baravari — 1–2% lik
 * tebranish "jarlik" bo'lib ko'rinmasin, haqiqiy o'zgarish esa ko'rinsin.
 */
export function HistoryPlot({ rows, typical, fmt, labels, compact }: {
  rows: DayRow[];
  typical: { low: number; high: number; point: boolean } | null;
  fmt: PlotFormat;
  labels: PlotLabels;
  compact: boolean;
}) {
  const dark = useTheme().resolvedTheme === 'dark';
  const c = PALETTE[dark ? 'dark' : 'light'];

  const mins = rows.map(r => r.min);
  let lo = Math.min(...mins, typical?.low ?? Infinity);
  let hi = Math.max(...mins, typical?.high ?? -Infinity);
  const mid = (lo + hi) / 2;
  const span = Math.max(hi - lo, (typical ? typical.high - typical.low : 0) * 3, mid * 0.06);
  lo = Math.min(lo, mid - span / 2);
  hi = Math.max(hi, mid + span / 2);
  const ticks = niceTicks(lo, hi, 4);
  const step = ticks[1] - ticks[0];
  const last = rows[rows.length - 1];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ top: 16, right: compact ? 12 : 120, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="date" tickFormatter={fmt.short} tick={{ fontSize: 11, fill: c.muted }}
          axisLine={false} tickLine={false} minTickGap={compact ? 40 : 64} tickMargin={10} />
        <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks}
          tickFormatter={(v) => fmt.axis(Number(v), step, !compact)}
          tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} width={compact ? 40 : 64} />
        {typical && (
          // Bitta qiymat bo'lsa yo'lak ko'rinadigan bo'lsin (±0.6%)
          <ReferenceArea y1={typical.point ? typical.low * 0.994 : typical.low} y2={typical.point ? typical.high * 1.006 : typical.high} fill={c.band} fillOpacity={dark ? 0.12 : 0.1} stroke="none"
            label={compact ? undefined : { value: labels.typical, position: 'insideTopLeft', fontSize: 11, fill: c.muted, offset: 8 }} />
        )}
        <Tooltip cursor={{ stroke: c.muted, strokeOpacity: 0.35 }} isAnimationActive={false}
          content={<HistoryTooltip fmt={fmt} labels={labels} />} />
        <Line dataKey="min" type="stepAfter" stroke={c.line} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round"
          dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: c.surface }} animationDuration={500}
          label={(p: { x?: number; y?: number; index?: number }) =>
            p.index === rows.length - 1 && !compact && p.x !== undefined && p.y !== undefined
              ? <text x={p.x + 10} y={p.y} dy={4} fontSize={12} fontWeight={600} fill={c.ink}>{formatSum(last.min)}</text>
              : <g />} />
        <ReferenceDot x={last.date} y={last.min} r={5} fill={c.line} stroke={c.surface} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
