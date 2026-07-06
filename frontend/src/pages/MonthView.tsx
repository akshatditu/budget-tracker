import { useState, type FormEvent } from "react";
import { Plus, Trash2, Pencil, RotateCw } from "lucide-react";
import { useApp } from "../lib/AppContext";
import {
  useMonth, useBudgetMutations, useTransactions, useTransactionMutations,
  useIncomes, useIncomeMutations,
} from "../api/hooks";
import { money, moneyCompact, sectionColor, MONTH_NAMES, defaultTxnDate } from "../lib/format";
import {
  Card, EditableNumber, ProgressBar, Sheet, Button, Input, DateField,
} from "../components/ui";
import EditTransactionSheet from "../components/EditTransactionSheet";
import type { MonthItem, MonthSection, Transaction } from "../types/api";

const remTone = (it: MonthItem) => (it.remaining < 0 ? "var(--neg)" : "var(--pos)");

interface TransactionDrawerProps {
  year: number;
  month: number;
  section: MonthSection;
  sub: MonthItem;
  onClose: () => void;
}

/** Item-detail bottom sheet (mobile design): remaining hero + Initial/Revised/
 *  Rolled-in/Available grid + quick add + recent expenses. */
function TransactionDrawer({ year, month, section, sub, onClose }: TransactionDrawerProps) {
  const { data: txns = [] } = useTransactions(year, { month, subcategory_id: sub.subcategory_id });
  const { create, remove } = useTransactionMutations(year);
  const [txnDate, setTxnDate] = useState(() => defaultTxnDate(year, month));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const tone = remTone(sub);
  const barPct = sub.available > 0 ? Math.min(sub.spent / sub.available, 1) * 100 : sub.spent > 0 ? 100 : 0;

  const add = () => {
    if (!amount || !txnDate) return;
    create.mutate(
      { subcategory_id: sub.subcategory_id, txn_date: txnDate, amount: Number(amount), note: note || null },
      { onSuccess: () => { setAmount(""); setNote(""); } },
    );
  };

  const stat = (label: string, value: number) => (
    <div className="flex items-center justify-between rounded-[var(--radiusXs)] bg-surface2 px-3 py-2.5">
      <span className="text-xs font-semibold text-dim">{label}</span>
      <span className="num text-[12.5px] font-bold">{money(value)}</span>
    </div>
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-[4px]" style={{ background: sectionColor(section.name) }} />
          {sub.name}
        </span>
      }
    >
      <div className="mt-4 rounded-[var(--radiusSm)] bg-surface2 p-4 text-center">
        <div className="text-[11.5px] font-bold text-dim">Remaining this month</div>
        <div className="num mt-1 text-[32px] font-extrabold" style={{ color: tone }}>{money(sub.remaining)}</div>
        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "var(--bg)" }}>
          <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: sub.remaining < 0 ? "var(--neg)" : sectionColor(section.name) }} />
        </div>
        <div className="mt-2 text-[11.5px] font-semibold text-dim">{money(sub.spent)} spent of {money(sub.available)}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {stat("Initial", sub.initial)}
        {stat("Revised", sub.revised)}
        {stat("Rolled-in", sub.rolled_in)}
        {stat("Available", sub.available)}
      </div>

      <div className="mt-5 text-[13px] font-extrabold">Add expense</div>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); add(); }} className="mt-2.5 flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <DateField value={txnDate} onChange={setTxnDate} min={`${year}-01-01`} max={`${year}-12-31`} />
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹" className="num" />
        </div>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        <Button type="submit" disabled={!amount || create.isPending} className="w-full justify-center py-4 text-[15px] font-extrabold">
          {create.isPending ? "Adding…" : `Add to ${MONTH_NAMES[month - 1]}`}
        </Button>
      </form>

      {txns.length > 0 && (
        <>
          <div className="mt-5 text-[13px] font-extrabold">Recent</div>
          <div className="mt-2 flex flex-col">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-line py-2.5">
                <div>
                  <div className="text-[13px] font-semibold">{t.note || sub.name}</div>
                  <div className="text-[11px] font-semibold text-dim">{t.txn_date}</div>
                </div>
                <span className="flex items-center gap-2.5">
                  <span className="num text-[13.5px] font-extrabold">{money(t.amount)}</span>
                  <button className="text-faint hover:text-accent2" onClick={() => setEditing(t)}><Pencil size={15} /></button>
                  <button className="text-faint hover:text-neg" onClick={() => remove.mutate(t.id)}><Trash2 size={15} /></button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {editing && <EditTransactionSheet txn={editing} year={year} onClose={() => setEditing(null)} />}
    </Sheet>
  );
}

/** Section → item cards (mobile design). Tables stay for lg+. */
function SectionCards({ section, onPickSub }: { section: MonthSection; onPickSub: (it: MonthItem) => void }) {
  const color = sectionColor(section.name);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
          <span className="h-[11px] w-[11px] rounded-[4px]" style={{ background: color }} />
          {section.name}
        </span>
        <span className="num text-[12.5px] font-bold text-dim">{moneyCompact(section.totals.spent)} / {moneyCompact(section.totals.available)}</span>
      </div>
      {section.items.map((it) => {
        const tone = remTone(it);
        const barPct = it.available > 0 ? Math.min(it.spent / it.available, 1) * 100 : it.spent > 0 ? 100 : 0;
        return (
          <button
            key={it.subcategory_id}
            onClick={() => onPickSub(it)}
            className="flex w-full flex-col gap-2.5 rounded-[var(--radiusSm)] border border-line bg-surface px-[15px] py-[13px] text-left shadow-[var(--shadow)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-[14.5px] font-bold">
                  {it.name}
                  {it.rollover && <RotateCw size={12} style={{ color: "var(--accent)" }} aria-label="rolls over" />}
                </span>
                <span className="text-[11.5px] font-medium text-dim">{moneyCompact(it.spent)} of {moneyCompact(it.available)}</span>
              </div>
              <div className="text-right">
                <div className="num text-[17px] font-extrabold" style={{ color: tone }}>{moneyCompact(it.remaining)}</div>
                <div className="text-[10.5px] font-bold" style={{ color: tone }}>{it.remaining < 0 ? "over" : "left"}</div>
              </div>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: it.remaining < 0 ? "var(--neg)" : color }} />
            </div>
          </button>
        );
      })}
      {section.items.length === 0 && <p className="px-1 py-2 text-xs text-dim">No items — add some in Budget Setup.</p>}
    </div>
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
          <div key={i.id} className="flex items-center justify-between rounded-[var(--radiusXs)] px-2 py-1.5 text-sm hover:bg-surface2">
            <span className="text-dim">{i.source}</span>
            <span className="num flex items-center gap-2 font-semibold">
              {moneyCompact(i.amount)}
              <button className="text-dim hover:text-neg" onClick={() => remove.mutate(i.id)}><Trash2 size={14} /></button>
            </span>
          </div>
        ))}
        {incomes.length === 0 && <p className="py-3 text-center text-xs text-dim">No income recorded.</p>}
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
      action={<span className="text-xs text-muted">{spentLabel} {moneyCompact(section.totals.spent)} / {moneyCompact(section.totals.available)}</span>}
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
              <td className="py-1.5 text-right text-muted">{moneyCompact(it.initial)}</td>
              <td className="py-1.5">
                <EditableNumber
                  value={it.revised}
                  onCommit={(v) => patchMonthly.mutate({ month, subcategory_id: it.subcategory_id, revised_amount: v })}
                />
              </td>
              {hasRollover && (
                <td className={`py-1.5 pr-2 text-right ${it.rolled_in < 0 ? "text-neg" : "text-muted"}`}>
                  {it.rollover ? moneyCompact(it.rolled_in) : "—"}
                </td>
              )}
              {hasRollover && (
                <td className="py-1.5 pr-2 text-right font-medium">{moneyCompact(it.available)}</td>
              )}
              <td className="py-1.5">
                <button onClick={() => onPickSub(it)} className="num w-full rounded px-2 py-1 text-right hover:bg-accentsoft" title="Manage expenses">
                  {moneyCompact(it.spent)}
                </button>
              </td>
              <td className={`py-1.5 pr-2 text-right font-medium ${it.remaining < 0 ? "text-neg" : "text-pos"}`}>
                {moneyCompact(it.remaining)}
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
            <td className="pt-2 text-right text-muted">{moneyCompact(section.totals.initial)}</td>
            <td className="pt-2 pr-2 text-right">{moneyCompact(section.totals.revised)}</td>
            {hasRollover && <td className={`pt-2 pr-2 text-right ${section.totals.rolled_in < 0 ? "text-neg" : "text-muted"}`}>{moneyCompact(section.totals.rolled_in)}</td>}
            {hasRollover && <td className="pt-2 pr-2 text-right">{moneyCompact(section.totals.available)}</td>}
            <td className="pt-2 pr-2 text-right">{moneyCompact(section.totals.spent)}</td>
            <td className="pt-2 pr-2 text-right">{moneyCompact(section.totals.remaining)}</td>
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
  const [picked, setPicked] = useState<{ section: MonthSection; item: MonthItem } | null>(null);

  if (isLoading || !data) return <p className="text-sm text-muted">Loading…</p>;
  const s = data.summary;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <div className="rounded-[var(--radius)] border border-line bg-surface p-[18px] shadow-[var(--shadow)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-dim">Safe to spend / day</div>
              <div className="num mt-1 text-[36px] font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>{moneyCompact(s.safe_to_spend_today)}</div>
              <div className="text-xs font-medium text-dim">
                {s.days_left > 0 ? `${s.days_left} day${s.days_left === 1 ? "" : "s"} left in ${MONTH_NAMES[month - 1]}` : "month ended"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-[.04em] text-dim">In bank</div>
              <div className={`num mt-0.5 text-[20px] font-extrabold ${s.available_cash < 0 ? "text-neg" : "text-pos"}`}>{moneyCompact(s.available_cash)}</div>
              <div className="mt-0.5 text-[11px] font-medium text-dim">{MONTH_NAMES[month - 1]}: {moneyCompact(s.remaining_in_bank)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {([["Income", s.income], ["Budget", s.budget_total], ["Spent", s.spent], ["Invested", s.invested]] as const).map(([label, v]) => (
              <div key={label} className="rounded-[var(--radiusXs)] bg-surface2 px-3 py-2.5">
                <div className="text-[10.5px] font-bold text-dim">{label}</div>
                <div className="num mt-0.5 text-[15px] font-extrabold">{moneyCompact(v)}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Mobile: design's section → item cards */}
        <div className="space-y-5 lg:hidden">
          {data.sections.map((sec) => (
            <SectionCards key={sec.category_id} section={sec} onPickSub={(it) => setPicked({ section: sec, item: it })} />
          ))}
        </div>
        {/* Desktop: editable tables */}
        <div className="hidden grid-cols-1 gap-6 lg:grid 2xl:grid-cols-2">
          {data.sections.map((sec) => (
            <SectionTable key={sec.category_id} section={sec} year={year} month={month} onPickSub={(it) => setPicked({ section: sec, item: it })} />
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
                <dd className="font-medium">{moneyCompact(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">Budget total</dt><dd className="font-semibold">{moneyCompact(s.budget_total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Spent</dt><dd className="font-semibold">{moneyCompact(s.spent)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Invested</dt><dd className="font-semibold">{moneyCompact(s.invested)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Income</dt><dd className="font-semibold">{moneyCompact(s.income)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Remaining in bank</dt><dd className={`font-semibold ${s.remaining_in_bank < 0 ? "text-neg" : "text-pos"}`}>{moneyCompact(s.remaining_in_bank)}</dd></div>
          </dl>
        </Card>
        <Card title="Carry Forward">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">From last month</dt><dd className="font-medium">{moneyCompact(s.carry_forward.carry_in)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">+ Income</dt><dd className="font-medium">{moneyCompact(s.carry_forward.income)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">− Spent</dt><dd className="font-medium">{moneyCompact(s.carry_forward.spent)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Invested (kept)</dt><dd className="font-medium">{moneyCompact(s.carry_forward.invested)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">Net carry forward</dt><dd className={`font-semibold ${s.carry_forward.carry_out < 0 ? "text-neg" : "text-pos"}`}>{moneyCompact(s.carry_forward.carry_out)}</dd></div>
          </dl>
        </Card>
      </div>

      {picked && <TransactionDrawer year={year} month={month} section={picked.section} sub={picked.item} onClose={() => setPicked(null)} />}
    </div>
  );
}
