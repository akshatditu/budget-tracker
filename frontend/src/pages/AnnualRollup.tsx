import type { ReactNode } from "react";
import { useApp } from "../lib/AppContext";
import { useRollup } from "../api/hooks";
import { money, pct, sectionColor } from "../lib/format";
import { Card, StatusChip } from "../components/ui";
import type { RollupSection } from "../types/api";

interface GridProps {
  title: ReactNode;
  grid: Record<string, number[]>;
  monthNames: string[];
  sections: RollupSection[];
}

function Grid({ title, grid, monthNames, sections }: GridProps) {
  const colTotal = (name: string) => grid[name].reduce((a, b) => a + b, 0);
  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted">
              <th className="sticky left-0 bg-surface py-2 text-left font-medium">Section</th>
              {monthNames.map((m) => <th key={m} className="px-2 py-2 text-right font-medium">{m}</th>)}
              <th className="px-2 py-2 text-right font-semibold text-ink">Total</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.name} className="border-t border-line">
                <td className="sticky left-0 bg-surface py-1.5 text-left font-medium">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: sectionColor(s.name) }} />{s.name}</span>
                </td>
                {grid[s.name].map((v, i) => <td key={i} className="px-2 py-1.5 text-right text-muted">{v ? money(v) : "—"}</td>)}
                <td className="px-2 py-1.5 text-right font-semibold">{money(colTotal(s.name))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AnnualRollup() {
  const { year } = useApp();
  const { data, isLoading } = useRollup(year);
  if (isLoading || !data) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{year} Annual Rollup</h1>

      <Grid title="Monthly Spend" grid={data.spend_grid} monthNames={data.month_names} sections={data.sections} />
      <Grid title="Monthly Budget (Revised)" grid={data.budget_grid} monthNames={data.month_names} sections={data.sections} />

      <Card title="Plan vs Actual">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Section</th>
              <th className="pb-2 text-right font-medium">Annual Plan</th>
              <th className="pb-2 text-right font-medium">YTD Budget</th>
              <th className="pb-2 text-right font-medium">YTD Spent</th>
              <th className="pb-2 text-right font-medium">% of YTD</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.plan_vs_actual.map((r) => (
              <tr key={r.section} className="border-t border-line">
                <td className="py-2 font-medium">{r.section}</td>
                <td className="py-2 text-right">{money(r.annual_plan)}</td>
                <td className="py-2 text-right text-muted">{money(r.ytd_budget)}</td>
                <td className="py-2 text-right">{money(r.ytd_spent)}</td>
                <td className="py-2 text-right text-muted">{pct(r.pct_of_ytd_budget)}</td>
                <td className="py-2 text-right"><StatusChip status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Set Aside by Sub-item (saved for future spend)">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {data.sections.map((s) => (
            <div key={s.name}>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(s.name) }} />{s.name}
              </h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-1 font-medium">Item</th>
                    <th className="pb-1 text-right font-medium">Revised</th>
                    <th className="pb-1 text-right font-medium">{s.kind === "investment" ? "Invested" : "Spent"}</th>
                    <th className="pb-1 text-right font-medium">Set Aside</th>
                    <th className="pb-1 text-right font-medium">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {s.items.map((it) => (
                    <tr key={it.subcategory_id} className="border-t border-line">
                      <td className="py-1.5">{it.name}</td>
                      <td className="py-1.5 text-right text-muted">{money(it.revised)}</td>
                      <td className="py-1.5 text-right">{money(it.spent)}</td>
                      <td className="py-1.5 text-right text-emerald-600">{money(it.set_aside)}</td>
                      <td className={`py-1.5 text-right ${it.remaining < 0 ? "text-red-600" : ""}`}>{money(it.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
