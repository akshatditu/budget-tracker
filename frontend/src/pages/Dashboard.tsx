import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import { Wallet, Target, Receipt, PiggyBank, TrendingUp, ArrowRight, CalendarClock } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useDashboard } from "../api/hooks";
import { money, moneyCompact, moneyChart, pct, sectionColor } from "../lib/format";
import { Card, KpiCard, StatusChip } from "../components/ui";

export default function Dashboard() {
  const { year } = useApp();
  const { data, isLoading, isError } = useDashboard(year);

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (isError || !data) return <p className="text-sm text-muted">No budget data found for {year}.</p>;
  const k = data.kpis;
  // Investments are retained wealth, so they don't belong in the "spend" pie.
  const pie = data.section_split.filter((s) => s.kind !== "investment" && s.spent > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{year} Overview</h1>
        <Link to="/month" className="flex items-center gap-1 text-sm font-medium text-brand">
          Go to month view <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Income (YTD)" value={money(k.income)} icon={Wallet} accent="var(--color-needs)" />
        <KpiCard label="Annual Plan" value={money(k.annual_plan)} icon={Target} accent="var(--color-brand)" />
        <KpiCard
          label="Spent (YTD)"
          value={money(k.spent)}
          sub={k.overspent > 0 ? `Overspent ${money(k.overspent)} so far` : `Current incl. set-aside ${money(k.current)}`}
          icon={Receipt}
          accent="var(--color-wants)"
        />
        <KpiCard label="Invested (YTD)" value={money(k.invested)} icon={TrendingUp} accent="var(--color-investments)" />
        <KpiCard label="In Bank" value={money(k.remaining_in_bank)} sub={`Incl. invested · after ${k.elapsed_months} mo`} icon={PiggyBank} accent="var(--color-investments)" />
        <KpiCard
          label="Projected y/e spend"
          value={money(k.projected_spend)}
          sub={`In bank y/e ${money(k.projected_remaining_in_bank)}`}
          icon={CalendarClock}
          accent="var(--color-bills)"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Spend by Section">
          {pie.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No spend recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} dataKey="spent" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pie.map((s) => <Cell key={s.name} fill={sectionColor(s.name)} />)}
                </Pie>
                <Tooltip formatter={moneyChart} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Budget vs Spent by Month" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthly_trend} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 12 }} />
              <Tooltip formatter={moneyChart} />
              <Legend />
              <Line type="monotone" dataKey="budget" stroke="var(--color-brand)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="spent" stroke="var(--color-wants)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="invested" stroke="var(--color-investments)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="income" stroke="var(--color-needs)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Plan vs Actual">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.plan_vs_actual} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="section" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 12 }} />
              <Tooltip formatter={moneyChart} />
              <Legend />
              <Bar dataKey="annual_plan" name="Annual plan" fill="var(--color-line)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ytd_spent" name="YTD spent" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="min-w-0 self-start overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Section</th>
                <th className="pb-2 text-right font-medium">YTD Spent</th>
                <th className="pb-2 text-right font-medium">% of YTD</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.plan_vs_actual.map((r) => (
                <tr key={r.section} className="border-t border-line">
                  <td className="py-2 font-medium">{r.section}</td>
                  <td className="py-2 text-right">{money(r.ytd_spent)}</td>
                  <td className="py-2 text-right text-muted">{pct(r.pct_of_ytd_budget)}</td>
                  <td className="py-2 text-right"><StatusChip status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
