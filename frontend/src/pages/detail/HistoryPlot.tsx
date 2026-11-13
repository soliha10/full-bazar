import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { formatSum } from "../../utils/productMapper";
import { StoreLogo } from "../../components/StoreLogo";
import type { DayRow } from "./priceHistorySeries";

/** Do'konlar rejimidagi chiziqlar — bir-biridan va fondan aniq ajraladigan 5 rang */
export const STORE_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

export interface PlotLabels { lowest: string; median: string; range: string; stores: string }
export interface PlotFormat { short: (iso: string) => string; long: (iso: string) => string; axis: (v: number) => string }

function HistoryTooltip({ active, payload, label, mode, selected, fmtDate, labels }: {
  active?: boolean; payload?: { payload: DayRow }[]; label?: string;
  mode: 'overview' | 'stores'; selected: string[]; fmtDate: (d: string) => string; labels: PlotLabels;
}) {
  if (!active || !payload?.length || !label) return null;
  const row = payload[0].payload;
  const picked = selected.filter(s => row.stores[s] !== undefined).sort((a, b) => row.stores[a] - row.stores[b]);
  return (
    <div className="glass glass-solid rounded-xl px-3.5 py-3 text-xs min-w-[200px]">
      <p className="text-gray-500 dark:text-gray-400 mb-2">{fmtDate(label)}</p>
      {mode === 'overview' ? (
        <>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{labels.lowest}</p>
          <p className="flex items-center gap-1.5 mt-0.5">
            <StoreLogo name={row.minSource} size="xs" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatSum(row.min)}</span>
            <span className="text-gray-500 dark:text-gray-400">· {row.minSource}</span>
          </p>
          {row.count > 1 && (
            <div className="mt-2 pt-2 border-t border-gray-900/5 dark:border-white/10 space-y-1 text-gray-600 dark:text-gray-300 tabular-nums">
              <p className="flex justify-between gap-4"><span>{labels.median}</span><span>{formatSum(row.median)}</span></p>
              <p className="flex justify-between gap-4"><span>{labels.range}</span><span>{formatSum(row.min)} – {formatSum(row.max)}</span></p>
              <p className="text-gray-400">{labels.stores.replace('{{count}}', String(row.count))}</p>
            </div>
          )}
        </>
      ) : (
        <ul className="space-y-1.5">
          {picked.map(s => (
            <li key={s} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STORE_COLORS[selected.indexOf(s)] }} />
              <StoreLogo name={s} size="xs" />
              <span className="text-gray-600 dark:text-gray-300">{s}</span>
              <span className="ml-auto pl-3 font-semibold text-gray-900 dark:text-white tabular-nums">{formatSum(row.stores[s])}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Pog'onali chiziqlar (type="stepAfter"): narx keyingi o'zgarishgacha
 * o'zgarmaydi — egri chiziq oradagi kunlarda hech qachon bo'lmagan narxni
 * ko'rsatardi. Umumiy rejimda: eng arzon narx, o'rtacha (mediana) narx va ular orasidagi soha.
 */
export function HistoryPlot({ rows, mode, selected, fmt, labels }: {
  rows: DayRow[];
  mode: 'overview' | 'stores';
  selected: string[];
  fmt: PlotFormat;
  labels: PlotLabels;
}) {
  const dark = useTheme().resolvedTheme === 'dark';
  const axis = dark ? '#9ca3af' : '#6b7280';
  const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';

  // Y o'qi ma'lumotga yaqin: 0 dan boshlansa 3% lik o'zgarish tekis chiziq bo'lib ko'rinardi
  const values = mode === 'overview'
    ? rows.flatMap(r => [r.min, r.median])
    : rows.flatMap(r => selected.map(s => r.stores[s]).filter((v): v is number => v !== undefined));
  const lo = Math.min(...values), hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.12, hi * 0.01);
  const last = rows[rows.length - 1];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="history-range" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={dark ? 0.28 : 0.18} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="date" tickFormatter={fmt.short} tick={{ fontSize: 11, fill: axis }}
          axisLine={false} tickLine={false} minTickGap={28} tickMargin={8} />
        <YAxis domain={[Math.max(0, lo - pad), hi + pad]} tickFormatter={(v) => fmt.axis(Number(v))}
          tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} width={56} tickCount={5} />
        <Tooltip cursor={{ stroke: axis, strokeOpacity: 0.35, strokeDasharray: '4 4' }}
          content={<HistoryTooltip mode={mode} selected={selected} fmtDate={fmt.long} labels={labels} />} />
        {mode === 'overview' ? (
          <>
            {/* Eng arzon va o'rtacha narx orasidagi soha — "qancha tejash mumkin" */}
            <Area dataKey="band" type="stepAfter" stroke="none" fill="url(#history-range)"
              isAnimationActive animationDuration={600} />
            <Line dataKey="median" type="stepAfter" stroke={axis} strokeOpacity={0.7} strokeWidth={1.5}
              strokeDasharray="4 4" dot={false} activeDot={false} animationDuration={600} />
            <Line dataKey="min" type="stepAfter" stroke="#7c3aed" strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: dark ? '#111827' : '#fff' }} animationDuration={600} />
            {last && <ReferenceDot x={last.date} y={last.min} r={5} fill="#7c3aed" stroke={dark ? '#111827' : '#fff'} strokeWidth={2} />}
          </>
        ) : (
          selected.map((src, i) => (
            <Line key={src} dataKey={(r: DayRow) => r.stores[src]} name={src} type="stepAfter"
              stroke={STORE_COLORS[i]} strokeWidth={2} dot={false} connectNulls={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: dark ? '#111827' : '#fff' }} animationDuration={500} />
          ))
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
