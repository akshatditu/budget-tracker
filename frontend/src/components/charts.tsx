/** Themed Recharts wrappers — colors come from the app's CSS variables so all
 *  four palettes (calm/bold × light/dark) work without chart-specific code. */
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashTrajectoryPoint, MonthlyTrendPoint } from "../types/api";
import { moneyChart, pct } from "../lib/format";
import type { ChartValue } from "../lib/format";

const TICK = { fill: "var(--dim)", fontSize: 11, fontFamily: "var(--font-num)" };
const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radiusSm)",
  boxShadow: "var(--shadow)",
  fontSize: 12,
};
const TOOLTIP_LABEL = { color: "var(--text)", fontWeight: 700 };

/** Always-compact INR for Y-axis ticks — moneyCompact is viewport-dependent and
 *  renders full ₹1,23,456 on desktop, too wide for an axis. */
const tickINR = (v: number): string => {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const unit = (x: number, suffix: string) =>
    `${sign}₹${(Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, "")}${suffix}`;
  if (abs >= 1e7) return unit(abs / 1e7, "Cr");
  if (abs >= 1e5) return unit(abs / 1e5, "L");
  if (abs >= 1e3) return unit(abs / 1e3, "K");
  return `${sign}₹${Math.round(abs)}`;
};

/** Liquid bank balance: solid area through elapsed months, dashed projection to Dec. */
export function CashTrajectoryChart({ data }: { data: CashTrajectoryPoint[] }) {
  const hasNegative = data.some((p) => (p.actual ?? 0) < 0 || (p.projected ?? 0) < 0);
  return (
    <ResponsiveContainer width="100%" height={224}>
      <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={TICK} interval="preserveStartEnd" />
        <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={tickINR} width={52} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL}
          formatter={(v: ChartValue, name: string) => [moneyChart(v), name === "actual" ? "In bank" : "Projected"]}
        />
        {hasNegative && <ReferenceLine y={0} stroke="var(--neg)" strokeDasharray="4 4" />}
        <Area type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2.5} fill="url(#cashFill)" dot={false} connectNulls={false} />
        <Line type="monotone" dataKey="projected" stroke="var(--dim)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Spent vs invested per month. */
export function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={176}>
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }} barGap={2}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={TICK} />
        <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={tickINR} width={52} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL}
          cursor={{ fill: "var(--surface2)" }}
          formatter={(v: ChartValue, name: string) => [moneyChart(v), name === "spent" ? "Spent" : "Invested"]}
        />
        <Bar dataKey="spent" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="invested" fill="var(--violet)" radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface SavingsRatePoint {
  month: string;
  /** invested / income for the month; null when there was no income. */
  rate: number | null;
}

/** Tiny per-month savings-rate line. */
export function SavingsRateSparkline({ data }: { data: SavingsRatePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={TICK} interval="preserveStartEnd" />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL}
          formatter={(v: ChartValue) => [pct(Array.isArray(v) ? v[0] : v), "Saved"]}
        />
        <Line type="monotone" dataKey="rate" stroke="var(--violet)" strokeWidth={2.5} dot={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
