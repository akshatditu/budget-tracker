import { useState } from "react";
import { useApp } from "../lib/AppContext";
import { useRollup } from "../api/hooks";
import { moneyCompact, sectionColor } from "../lib/format";
import { StatusChip } from "../components/ui";
import SpendDeepDive from "../components/SpendDeepDive";
import type { Rollup } from "../types/api";

const cardCls = "rounded-[var(--radius)] border border-line bg-surface p-[17px] shadow-[var(--shadow)]";

/** Mobile "Reports": section tab chips → monthly spend bars + plan-vs-actual cards. */
function MobileRollup({ data }: { data: Rollup }) {
  const spendSections = data.sections.filter((s) => s.kind !== "investment");
  const [sel, setSel] = useState(0);
  const sec = spendSections[Math.min(sel, spendSections.length - 1)];
  const series = sec ? data.spend_grid[sec.name] ?? [] : [];
  const max = Math.max(...series, 1);
  const total = series.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3.5">
      <div className="scwrap flex gap-2 overflow-x-auto">
        {spendSections.map((s, i) => {
          const on = i === sel;
          return (
            <button
              key={s.name}
              onClick={() => setSel(i)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-bold"
              style={on
                ? { borderColor: "var(--accent)", background: "var(--accentSoft)", color: "var(--accent2)" }
                : { borderColor: "var(--border)", background: "var(--surface)", color: "var(--dim)" }}
            >
              <span className="h-2 w-2 rounded-[3px]" style={{ background: sectionColor(s.name) }} />
              {s.name}
            </button>
          );
        })}
      </div>

      {sec && (
        <div className={cardCls}>
          <div className="text-[15px] font-extrabold tracking-tight">{sec.name} · monthly spend</div>
          <div className="num mb-3.5 mt-1 text-[13px] font-bold text-dim">{moneyCompact(total)} this year</div>
          <div className="flex flex-col gap-2.5">
            {series.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 text-[11.5px] font-bold text-dim">{data.month_names[i]}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: sectionColor(sec.name) }} />
                </div>
                <span className="num w-14 text-right text-xs font-bold">{v ? moneyCompact(v) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardCls}>
        <div className="mb-3 text-[15px] font-extrabold tracking-tight">Plan vs actual</div>
        <div className="flex flex-col gap-3.5">
          {data.plan_vs_actual.map((r) => (
            <div key={r.section} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13.5px] font-bold">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: sectionColor(r.section) }} />
                  {r.section}
                </span>
                {r.kind === "investment" ? <span className="text-xs font-semibold text-dim">invested</span> : <StatusChip status={r.status} />}
              </div>
              <div className="num flex justify-between text-[11.5px] font-semibold text-dim">
                <span>{moneyCompact(r.ytd_spent)} spent</span>
                <span>plan {moneyCompact(r.annual_plan)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnnualRollup() {
  const { year } = useApp();
  const { data, isLoading } = useRollup(year);
  const [view, setView] = useState<"charts" | "table">("charts");
  if (isLoading || !data) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="hidden items-end justify-between gap-4 lg:flex">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.08em] text-dim">{year} · Analytics</div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight">Spend deep dive</h1>
          <p className="mt-1 text-[13px] text-dim">Revised budget vs spent, set aside and overspent, by category and sub-item for {year}.</p>
        </div>
        <div className="inline-flex shrink-0 rounded-[var(--radiusSm)] bg-surface2 p-1">
          {(["charts", "table"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-[var(--radiusXs)] px-4 py-1.5 text-[13.5px] font-semibold capitalize ${view === v ? "bg-surface text-ink shadow-sm" : "text-dim hover:text-ink"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:hidden"><MobileRollup data={data} /></div>

      <div className="hidden lg:block"><SpendDeepDive data={data} view={view} /></div>
    </div>
  );
}
