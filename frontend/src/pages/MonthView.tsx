import { useState, type FormEvent } from "react";
import { Plus, Trash2, TrendingUp, PiggyBank, Wallet, Receipt, Gauge, RotateCw } from "lucide-react";
import { useApp } from "../lib/AppContext";
import {
  useMonth, useBudgetMutations, useTransactions, useTransactionMutations,
  useIncomes, useIncomeMutations,
} from "../api/hooks";
import { money, sectionColor, MONTH_NAMES } from "../lib/format";
import {
  Card, EditableNumber, ProgressBar, Modal, Button, Field, Input, KpiCard,
} from "../components/ui";
import type { MonthItem, MonthSection } from "../types/api";

interface TransactionDrawerProps {
  year: number;
  month: number;
  sub: MonthItem;
  onClose: () => void;
}

function TransactionDrawer({ year, month, sub, onClose }: TransactionDrawerProps) {
  const { data: txns = [] } = useTransactions(year, { month, subcategory_id: sub.subcategory_id });
  const { create, remove } = useTransactionMutations(year);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [day, setDay] = useState(`${year}-${String(month).padStart(2, "0")}-01`);

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount) return;
    create.mutate(
      { subcategory_id: sub.subcategory_id, txn_date: day, amount: Number(amount), note: note || null },
      { onSuccess: () => { setAmount(""); setNote(""); } }
    );
  };

  return (
    <Modal open onClose={onClose} title={`${sub.name} — ${MONTH_NAMES[month - 1]} ${year}`}>
      <form onSubmit={add} className="grid grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={day} min={`${year}-01-01`} max={`${year}-12-31`} onChange={(e) => setDay(e.target.value)} /></Field>
        <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
        <div className="col-span-2"><Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field></div>
        <div className="col-span-2"><Button type="submit" className="w-full justify-center"><Plus size={16} /> Add expense</Button></div>
      </form>

      <div className="mt-4 max-h-64 space-y-1 overflow-auto">
        {txns.length === 0 && <p className="py-6 text-center text-sm text-muted">No expenses yet this month.</p>}
        {txns.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <div>
              <div className="font-medium">{money(t.amount)}</div>
              <div className="text-xs text-muted">{t.txn_date}{t.note ? ` · ${t.note}` : ""}</div>
            </div>
            <button className="text-muted hover:text-red-600" onClick={() => remove.mutate(t.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function IncomePanel({ year, month }: { year: number; month: number }) {
  const { data: incomes = [] } = useIncomes(year, month);
  const { create, remove } = useIncomeMutations(year);
  const [source, setSource] = useState("Salary");
  const [amount, setAmount] = useState("");

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount) return;
    create.mutate({ month, source, amount: Number(amount) }, { onSuccess: () => setAmount("") });
  };

  return (
    <Card title="Income">
      <form onSubmit={add} className="flex gap-2">
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source" />
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-28" />
        <Button type="submit"><Plus size={16} /></Button>
      </form>
      <div className="mt-3 space-y-1">
        {incomes.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-canvas">
            <span className="text-muted">{i.source}</span>
            <span className="flex items-center gap-2 font-medium">
              {money(i.amount)}
              <button className="text-muted hover:text-red-600" onClick={() => remove.mutate(i.id)}><Trash2 size={14} /></button>
            </span>
          </div>
        ))}
        {incomes.length === 0 && <p className="py-3 text-center text-xs text-muted">No income recorded.</p>}
      </div>
    </Card>
  );
}

interface SectionTableProps {
  section: MonthSection;
  year: number;
  month: number;
  onPickSub: (item: MonthItem) => void;
}

function SectionTable({ section, year, month, onPickSub }: SectionTableProps) {
  const { patchMonthly } = useBudgetMutations(year);
  const color = sectionColor(section.name);
  // Investment sections hold retained wealth — show contributions as "Invested", not "Spent".
  const spentLabel = section.kind === "investment" ? "Invested" : "Spent";
  // Only widen the table with rollover columns when at least one item rolls over.
  const hasRollover = section.items.some((it) => it.rollover);
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          {section.name}
        </span>
      }
      action={<span className="text-xs text-muted">{spentLabel} {money(section.totals.spent)} / {money(section.totals.available)}</span>}
    >
      <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 text-right font-medium">Initial</th>
            <th className="pb-2 text-right font-medium">Revised</th>
            {hasRollover && <th className="pb-2 text-right font-medium" title="Surplus/deficit carried in from prior months">Rolled-in</th>}
            {hasRollover && <th className="pb-2 text-right font-medium" title="Revised + rolled-in — spendable this month">Available</th>}
            <th className="pb-2 text-right font-medium">{spentLabel}</th>
            <th className="pb-2 text-right font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {section.items.map((it) => (
            <tr key={it.subcategory_id} className="border-t border-line">
              <td className="py-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  {it.name}
                  {it.rollover && <RotateCw size={12} className="text-brand" aria-label="rolls over" />}
                </span>
              </td>
              <td className="py-1.5 text-right text-muted">{money(it.initial)}</td>
              <td className="py-1.5">
                <EditableNumber
                  value={it.revised}
                  onCommit={(v) => patchMonthly.mutate({ month, subcategory_id: it.subcategory_id, revised_amount: v })}
                />
              </td>
              {hasRollover && (
                <td className={`py-1.5 pr-2 text-right ${it.rolled_in < 0 ? "text-red-600" : "text-muted"}`}>
                  {it.rollover ? money(it.rolled_in) : "—"}
                </td>
              )}
              {hasRollover && (
                <td className="py-1.5 pr-2 text-right font-medium">{money(it.available)}</td>
              )}
              <td className="py-1.5">
                <button onClick={() => onPickSub(it)} className="w-full rounded px-2 py-1 text-right hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200" title="Manage expenses">
                  {money(it.spent)}
                </button>
              </td>
              <td className={`py-1.5 pr-2 text-right font-medium ${it.remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {money(it.remaining)}
              </td>
            </tr>
          ))}
          {section.items.length === 0 && (
            <tr><td colSpan={5} className="py-3 text-center text-xs text-muted">No items — add some in Budget Setup.</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-line text-sm font-semibold">
            <td className="pt-2">Total</td>
            <td className="pt-2 text-right text-muted">{money(section.totals.initial)}</td>
            <td className="pt-2 pr-2 text-right">{money(section.totals.revised)}</td>
            {hasRollover && <td className={`pt-2 pr-2 text-right ${section.totals.rolled_in < 0 ? "text-red-600" : "text-muted"}`}>{money(section.totals.rolled_in)}</td>}
            {hasRollover && <td className="pt-2 pr-2 text-right">{money(section.totals.available)}</td>}
            <td className="pt-2 pr-2 text-right">{money(section.totals.spent)}</td>
            <td className="pt-2 pr-2 text-right">{money(section.totals.remaining)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
      <div className="mt-3"><ProgressBar value={section.totals.spent} max={section.totals.available} color={color} /></div>
    </Card>
  );
}

export default function MonthView() {
  const { year, month } = useApp();
  const { data, isLoading } = useMonth(year, month);
  const [picked, setPicked] = useState<MonthItem | null>(null);

  if (isLoading || !data) return <p className="text-sm text-muted">Loading…</p>;
  const s = data.summary;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard label="Income" value={money(s.income)} icon={Wallet} accent="var(--color-needs)" />
          <KpiCard label="Budget" value={money(s.budget_total)} icon={TrendingUp} accent="var(--color-brand)" />
          <KpiCard label="Spent" value={money(s.spent)} icon={Receipt} accent="var(--color-wants)" />
          <KpiCard label="In Bank" value={money(s.remaining_in_bank)} icon={PiggyBank} accent="var(--color-investments)" />
          <KpiCard
            label="Safe to spend / day"
            value={money(s.safe_to_spend_today)}
            sub={s.days_left > 0 ? `${s.days_left} day${s.days_left === 1 ? "" : "s"} left` : "month ended"}
            icon={Gauge}
            accent="var(--color-bills)"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          {data.sections.map((sec) => (
            <SectionTable key={sec.category_id} section={sec} year={year} month={month} onPickSub={setPicked} />
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        <IncomePanel year={year} month={month} />
        <Card title="Monthly Summary">
          <dl className="space-y-2 text-sm">
            {Object.entries(s.section_totals).map(([name, v]) => (
              <div key={name} className="flex justify-between">
                <dt className="flex items-center gap-2 text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: sectionColor(name) }} />{name}
                </dt>
                <dd className="font-medium">{money(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">Budget total</dt><dd className="font-semibold">{money(s.budget_total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Spent</dt><dd className="font-semibold">{money(s.spent)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Invested</dt><dd className="font-semibold">{money(s.invested)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Income</dt><dd className="font-semibold">{money(s.income)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Remaining in bank</dt><dd className={`font-semibold ${s.remaining_in_bank < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(s.remaining_in_bank)}</dd></div>
          </dl>
        </Card>
        <Card title="Carry Forward">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">From last month</dt><dd className="font-medium">{money(s.carry_forward.carry_in)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">+ Income</dt><dd className="font-medium">{money(s.carry_forward.income)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">− Spent</dt><dd className="font-medium">{money(s.carry_forward.spent)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Invested (kept)</dt><dd className="font-medium">{money(s.carry_forward.invested)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">Net carry forward</dt><dd className={`font-semibold ${s.carry_forward.carry_out < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(s.carry_forward.carry_out)}</dd></div>
          </dl>
        </Card>
      </div>

      {picked && <TransactionDrawer year={year} month={month} sub={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}
