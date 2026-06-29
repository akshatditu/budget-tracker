import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useDashboard } from "../api/hooks";
import { money, moneyCompact, pct, sectionColor } from "../lib/format";
import { StatusChip } from "../components/ui";
import RegenerateBudget from "../components/RegenerateBudget";

const card = "rounded-[var(--radius)] border border-line bg-surface p-[18px] shadow-[var(--shadow)]";

export default function Dashboard() {
  const { year } = useApp();
  const { data, isLoading, isError } = useDashboard(year);

  if (isLoading) return <p className="text-sm text-dim">Loading…</p>;
  if (isError || !data) return <p className="text-sm text-dim">No budget data found for {year}.</p>;
  const k = data.kpis;

  // "Left to spend" ignores retained wealth — investments don't drain the pool.
  const plan = k.annual_plan;
  const left = plan - k.spent;
  const usedPct = plan > 0 ? Math.min(Math.max(k.spent / plan, 0), 1) : 0;

  const bars = data.section_split.filter((s) => s.kind !== "investment" && s.spent > 0);
  const maxBar = Math.max(...bars.map((b) => b.spent), 1);

  const trend = data.monthly_trend.slice(-6);
  const maxTrend = Math.max(...trend.map((m) => Math.max(m.budget, m.spent)), 1);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="hidden lg:block">
          <h1 className="text-[26px] font-extrabold tracking-tight">Overview</h1>
          <p className="mt-1 text-[13.5px] font-medium text-dim">Your {year} budget at a glance</p>
        </div>
        <Link to="/month" className="hidden items-center gap-1 text-sm font-bold sm:flex" style={{ color: "var(--accent)" }}>
          Month view <ArrowRight size={16} />
        </Link>
      </div>

      <RegenerateBudget banner />

      {/* Hero — left to spend this year */}
      <div className={card}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-dim">Left to spend this year</span>
          <span className="rounded-full px-2.5 py-[3px] text-[11px] font-bold" style={{ background: "var(--accentSoft)", color: "var(--accent)" }}>
            {pct(usedPct)} used
          </span>
        </div>
        <div className="num my-1.5 text-[40px] font-extrabold tracking-tight">{moneyCompact(left)}</div>
        <div className="text-[12.5px] font-medium text-dim">of {moneyCompact(plan)} planned · {moneyCompact(k.spent)} spent</div>
        <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full" style={{ width: pct(usedPct), background: "var(--accent)" }} />
        </div>
      </div>

      {/* Three quick stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Income", value: moneyCompact(k.income), color: "var(--text)" },
          { label: "Invested", value: moneyCompact(k.invested), color: "#8b5cf6" },
          { label: "In bank", value: moneyCompact(k.remaining_in_bank), color: "var(--pos)" },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--radiusSm)] border border-line bg-surface p-3 shadow-[var(--shadow)]">
            <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-dim">{s.label}</div>
            <div className="num mt-1 text-[19px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Where your money goes */}
        <div className={card}>
          <div className="mb-3.5 text-[15px] font-extrabold tracking-tight">Where your money goes</div>
          {bars.length === 0 ? (
            <p className="py-6 text-center text-sm text-dim">No spend recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {bars.map((b) => (
                <div key={b.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-semibold">
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: sectionColor(b.name) }} />
                      {b.name}
                    </span>
                    <span className="num text-[13px] font-bold">{moneyCompact(b.spent)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full" style={{ width: `${(b.spent / maxBar) * 100}%`, background: sectionColor(b.name) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* On track? — plan vs actual */}
        <div className={card}>
          <div className="mb-3 text-[15px] font-extrabold tracking-tight">On track?</div>
          <div className="flex flex-col gap-2.5">
            {data.plan_vs_actual.map((r) => (
              <div key={r.section} className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[13.5px] font-semibold">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: sectionColor(r.section) }} />
                  {r.section}
                </span>
                <span className="flex items-center gap-2">
                  <span className="num text-xs font-semibold text-dim">{pct(r.pct_of_ytd_budget)}</span>
                  {r.kind === "investment" ? <span className="pill pill-accent">Invested</span> : <StatusChip status={r.status} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last 6 months — spent vs plan */}
      <div className={card}>
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[15px] font-extrabold tracking-tight">Last 6 months</span>
          <span className="text-[11.5px] font-semibold text-dim">spent vs plan</span>
        </div>
        <div className="flex h-28 items-end justify-between gap-2">
          {trend.map((m) => {
            const over = m.spent > m.budget;
            return (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex h-20 w-full items-end justify-center">
                  <div className="absolute bottom-0 w-[70%] rounded-t-md bg-surface2" style={{ height: `${(m.budget / maxTrend) * 100}%` }} />
                  <div className="absolute bottom-0 w-[70%] rounded-t-md" style={{ height: `${(m.spent / maxTrend) * 100}%`, background: over ? "var(--neg)" : "var(--accent)" }} title={`${m.month}: ${money(m.spent)} / ${money(m.budget)}`} />
                </div>
                <span className="text-[10.5px] font-semibold text-dim">{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-dim">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--accent)" }} /> Spent</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-surface2" /> Plan</span>
          <span className="ml-auto num">{moneyCompact(k.spent)} spent YTD</span>
        </div>
      </div>
    </div>
  );
}
