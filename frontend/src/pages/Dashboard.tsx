import { Link } from "react-router-dom";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useDashboard, useMonth, useSubscriptions, useUpcomingCharges } from "../api/hooks";
import { kindMeta, renewsSoon } from "../lib/recurring";
import { money, moneyCompact, pct, sectionColor, MONTH_NAMES, MONTH_SHORT } from "../lib/format";
import { ProgressBar, StatusChip } from "../components/ui";
import { CashTrajectoryChart, MonthlyTrendChart, SavingsRateSparkline } from "../components/charts";
import RegenerateBudget from "../components/RegenerateBudget";
import ReviseBudget from "../components/ReviseBudget";

const card = "rounded-[var(--radius)] border border-line bg-surface p-[18px] shadow-[var(--shadow)]";

export default function Dashboard() {
  const { year } = useApp();
  const { data, isLoading, isError } = useDashboard(year);

  // Hero is "right now" — calendar month, only meaningful for the current year.
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const { data: mv } = useMonth(year, isCurrentYear ? currentMonth : 0);
  const { data: upcoming = [] } = useUpcomingCharges(year, isCurrentYear ? currentMonth : 0);
  const { data: recurring = [] } = useSubscriptions();
  // Big half-yearly/yearly charges due soon, unless already listed in this month's upcoming.
  const renewals = isCurrentYear
    ? recurring.filter((s) => renewsSoon(s) && !upcoming.some((c) => c.subscription_id === s.id))
    : [];

  if (isLoading) return <p className="text-sm text-dim">Loading…</p>;
  if (isError || !data) return <p className="text-sm text-dim">No budget data found for {year}.</p>;
  const k = data.kpis;

  // "Left to spend" ignores retained wealth — investments don't drain the pool.
  const plan = k.annual_plan;
  const left = plan - k.spent;
  const usedPct = plan > 0 ? Math.min(Math.max(k.spent / plan, 0), 1) : 0;

  const bars = data.section_split.filter((s) => s.kind !== "investment" && s.spent > 0);
  const maxBar = Math.max(...bars.map((b) => b.spent), 1);

  const trend = data.monthly_trend.slice(0, k.elapsed_months);
  const savingsSpark = trend.map((m) => ({ month: m.month, rate: m.income > 0 ? m.invested / m.income : null }));

  const dec = data.cash_trajectory[11];
  const yearEnd = dec ? dec.projected ?? dec.actual : null;
  const hasCash = data.cash_trajectory.some((p) => p.actual !== null);

  // Month pace: spending-only budget vs spending-only spent (budget_total includes investments).
  const s = mv?.summary;
  const monthBudget = mv ? mv.sections.filter((x) => x.kind !== "investment").reduce((t, x) => t + x.totals.revised, 0) : 0;
  const spentPct = s && monthBudget > 0 ? s.spent / monthBudget : 0;
  const daysInMonth = new Date(year, currentMonth, 0).getDate();
  const timePct = now.getDate() / daysInMonth;
  const offPace = spentPct > timePct + 0.05;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="hidden lg:block">
          <h1 className="text-[26px] font-extrabold tracking-tight">Overview</h1>
          <p className="mt-1 text-[13.5px] font-medium text-dim">Your {year} budget at a glance</p>
        </div>
        <Link to="/dashboard/month" className="hidden items-center gap-1 text-sm font-bold sm:flex" style={{ color: "var(--accent)" }}>
          Month view <ArrowRight size={16} />
        </Link>
      </div>

      {/* Once a budget exists, offer to revise it; first-run users still get "Build with AI". */}
      {plan > 0 ? <ReviseBudget banner /> : <RegenerateBudget banner />}

      {/* Hero — safe to spend today (current year only) */}
      {isCurrentYear && (
        <div className={card}>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-dim">Safe to spend today</span>
            <Link to="/dashboard/month" className="flex items-center gap-1 text-[12px] font-bold" style={{ color: "var(--accent)" }}>
              {MONTH_NAMES[currentMonth - 1]} <ArrowRight size={13} />
            </Link>
          </div>
          {s ? (
            <>
              <div className="num my-1.5 text-[40px] font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>
                {moneyCompact(s.safe_to_spend_today)}
              </div>
              <div className="text-[12.5px] font-medium text-dim">
                {moneyCompact(s.available_cash)} in bank · {s.days_left} day{s.days_left === 1 ? "" : "s"} left in {MONTH_NAMES[currentMonth - 1]}
              </div>
              <div className="mt-3.5">
                <ProgressBar value={s.spent} max={monthBudget} />
              </div>
              <div className="mt-2 text-[12px] font-semibold" style={{ color: offPace ? "var(--warn)" : "var(--dim)" }}>
                {pct(spentPct)} of this month's budget spent · {pct(timePct)} through the month
                {offPace ? " — spending ahead of pace" : ""}
              </div>
            </>
          ) : (
            <div className="num my-1.5 text-[40px] font-extrabold tracking-tight text-dim">—</div>
          )}
        </div>
      )}

      {/* Three quick stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Income", value: moneyCompact(k.income), color: "var(--text)" },
          { label: "Invested", value: moneyCompact(k.invested), color: "var(--violet)" },
          { label: "In bank", value: moneyCompact(k.remaining_in_bank), color: "var(--pos)" },
        ].map((q) => (
          <div key={q.label} className="rounded-[var(--radiusSm)] border border-line bg-surface p-3 shadow-[var(--shadow)]">
            <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-dim">{q.label}</div>
            <div className="num mt-1 text-[19px] font-extrabold" style={{ color: q.color }}>{q.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Left to spend this year */}
        <div className={card}>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-dim">Left to spend this year</span>
            <span className="rounded-full px-2.5 py-[3px] text-[11px] font-bold" style={{ background: "var(--accentSoft)", color: "var(--accent)" }}>
              {pct(usedPct)} used
            </span>
          </div>
          <div className="num my-1.5 text-[28px] font-extrabold tracking-tight">{moneyCompact(left)}</div>
          <div className="text-[12.5px] font-medium text-dim">of {moneyCompact(plan)} planned · {moneyCompact(k.spent)} spent</div>
          <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full" style={{ width: pct(usedPct), background: "var(--accent)" }} />
          </div>
        </div>

        {/* Savings rate */}
        <div className={card}>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-dim">Savings rate</span>
            <span className="text-[11.5px] font-semibold text-dim">invested ÷ income</span>
          </div>
          <div className="num my-1.5 text-[28px] font-extrabold tracking-tight" style={{ color: "var(--violet)" }}>
            {k.savings_rate_ytd !== null ? pct(k.savings_rate_ytd) : "—"}
          </div>
          {savingsSpark.length > 1 ? (
            <SavingsRateSparkline data={savingsSpark} />
          ) : (
            <div className="py-4 text-[12.5px] font-medium text-dim">Not enough months to chart yet.</div>
          )}
        </div>
      </div>

      {/* Cash trajectory */}
      <div className={card}>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[15px] font-extrabold tracking-tight">Cash trajectory</span>
          {yearEnd !== null && (
            <span className="text-[11.5px] font-semibold text-dim">
              Projected year-end: <span className="num font-bold" style={{ color: yearEnd < 0 ? "var(--neg)" : "var(--pos)" }}>{moneyCompact(yearEnd)}</span>
            </span>
          )}
        </div>
        {hasCash ? (
          <CashTrajectoryChart data={data.cash_trajectory} />
        ) : (
          <p className="py-6 text-center text-sm text-dim">No cash activity recorded yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Top spending categories */}
        <div className={card}>
          <div className="mb-3.5 text-[15px] font-extrabold tracking-tight">Top spending categories</div>
          {data.top_categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-dim">No spend recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.top_categories.map((t) => (
                <div key={t.subcategory_id} className="flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: sectionColor(t.section) }} />
                    <span className="truncate">{t.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2.5">
                    {t.mom_change === null ? (
                      <span className="text-[11px] font-semibold text-dim">—</span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: t.mom_change > 0 ? "var(--neg)" : "var(--pos)" }}>
                        {t.mom_change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span className="num">{money(Math.abs(t.mom_change))}</span>
                      </span>
                    )}
                    <span className="num text-[13px] font-bold">{moneyCompact(t.ytd_spent)}</span>
                  </span>
                </div>
              ))}
              <div className="mt-1 text-[11px] font-medium text-dim">Year to date · arrow = change vs last month</div>
            </div>
          )}
        </div>

        {/* Needs attention — overspent envelopes */}
        <div className={card}>
          <div className="mb-3.5 text-[15px] font-extrabold tracking-tight">Needs attention</div>
          {data.needs_attention.length === 0 ? (
            <p className="py-6 text-center text-sm font-semibold" style={{ color: "var(--pos)" }}>
              Nothing overspent — envelopes on track.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.needs_attention.slice(0, 6).map((a) => (
                <Link key={a.subcategory_id} to="/dashboard/month" className="flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: sectionColor(a.section) }} />
                    <span className="truncate">{a.name}</span>
                  </span>
                  <span className="num shrink-0 text-[13px] font-bold" style={{ color: "var(--neg)" }}>
                    {money(a.overspent)} over
                  </span>
                </Link>
              ))}
              <div className="mt-1 text-[11px] font-medium text-dim">
                Overspend across elapsed months, worst first
                {data.needs_attention.length > 6 ? ` · +${data.needs_attention.length - 6} more in Annual view` : ""}
              </div>
            </div>
          )}
        </div>
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

      {/* Upcoming this month — recurring charges still to auto-post, plus big renewals ahead */}
      {(upcoming.length > 0 || renewals.length > 0) && (
        <div className={card}>
          <div className="mb-3.5 flex items-baseline justify-between">
            <Link to="/dashboard/recurring" className="text-[15px] font-extrabold tracking-tight">Upcoming this month</Link>
            {upcoming.length > 0 && <span className="num text-[12px] font-bold text-dim">{money(upcoming.reduce((s, c) => s + c.amount, 0))}</span>}
          </div>
          {upcoming.length === 0 && <p className="text-[13px] text-dim">Nothing else due this month.</p>}
          <div className="flex flex-col gap-2.5">
            {upcoming.map((c) => (
              <div key={`${c.subscription_id}-${c.due_date}`} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5 text-[13px] font-semibold">
                  <span className="num w-12 shrink-0 text-[12px] font-bold text-dim">{Number(c.due_date.slice(8))} {MONTH_SHORT[currentMonth - 1]}</span>
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="num shrink-0 text-[13px] font-bold">{money(c.amount)}</span>
              </div>
            ))}
          </div>
          {renewals.length > 0 && (
            <>
              <div className="mb-2.5 mt-4 text-[12px] font-bold uppercase tracking-[.05em] text-dim">Renewals in the next 30 days</div>
              <div className="flex flex-col gap-2.5">
                {renewals.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5 text-[13px] font-semibold">
                      <span className="num w-12 shrink-0 text-[12px] font-bold text-dim">{Number(s.next_due_date.slice(8))} {MONTH_SHORT[Number(s.next_due_date.slice(5, 7)) - 1]}</span>
                      <span className="truncate">{s.name}</span>
                      <span className="pill pill-warn shrink-0">{kindMeta(s.kind).label}</span>
                    </span>
                    <span className="num shrink-0 text-[13px] font-bold">{money(s.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* This year — spent vs invested, per month */}
      <div className={card}>
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[15px] font-extrabold tracking-tight">This year</span>
          <span className="text-[11.5px] font-semibold text-dim">spent vs invested</span>
        </div>
        {trend.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">The year hasn't started yet.</p>
        ) : (
          <MonthlyTrendChart data={trend} />
        )}
        <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-dim">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--accent)" }} /> Spent</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--violet)" }} /> Invested</span>
          <span className="ml-auto num">{moneyCompact(k.spent)} spent · {moneyCompact(k.invested)} invested</span>
        </div>
      </div>
    </div>
  );
}
