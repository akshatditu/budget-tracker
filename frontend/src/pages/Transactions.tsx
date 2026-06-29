import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useTransactions, useSubcategories, useTransactionMutations, useCategories } from "../api/hooks";
import { moneyCompact, sectionColor, MONTH_NAMES } from "../lib/format";
import { Card, Button, Input, Select, Field, EmptyState } from "../components/ui";
import AddExpenseSheet from "../components/AddExpenseSheet";
import type { TransactionFilter } from "../types/api";

interface TransactionForm {
  subcategory_id: string;
  txn_date: string;
  amount: string;
  note: string;
}

export default function Transactions() {
  const { year } = useApp();
  const [fMonth, setFMonth] = useState("");
  const [fSub, setFSub] = useState("");
  const { data: subs = [] } = useSubcategories();
  const { data: categories = [] } = useCategories();
  const params: TransactionFilter = {};
  if (fMonth) params.month = Number(fMonth);
  if (fSub) params.subcategory_id = Number(fSub);
  const { data: txns = [] } = useTransactions(year, params);
  const { create, remove } = useTransactionMutations(year);

  const subName = useMemo(
    () => Object.fromEntries(subs.map((s): [number, string] => [s.id, s.name])),
    [subs]
  );
  const catName = useMemo(
    () => Object.fromEntries(categories.map((c): [number, string] => [c.id, c.name])),
    [categories]
  );
  const subCat = useMemo(
    () => Object.fromEntries(subs.map((s): [number, string] => [s.id, catName[s.category_id]])),
    [subs, catName]
  );

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<TransactionForm>({ subcategory_id: "", txn_date: `${year}-01-01`, amount: "", note: "" });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.subcategory_id || !form.amount) return;
    create.mutate(
      { subcategory_id: Number(form.subcategory_id), txn_date: form.txn_date, amount: Number(form.amount), note: form.note || null },
      { onSuccess: () => setForm((f) => ({ ...f, amount: "", note: "" })) }
    );
  };

  const total = txns.reduce((a, t) => a + t.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="hidden text-[26px] font-extrabold tracking-tight lg:block">{year} Transactions</h1>

      {/* Mobile: dashed button opens the design's quick-add sheet */}
      <button
        onClick={() => setAddOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radiusSm)] border border-dashed py-3.5 text-sm font-bold lg:hidden"
        style={{ borderColor: "var(--accent)", background: "var(--accentSoft)", color: "var(--accent2)" }}
      >
        <Plus size={16} /> Add an expense
      </button>

      <div className="hidden lg:block">
      <Card title="Add expense">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Field label="Item">
            <Select value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}>
              <option value="">Select…</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{subCat[s.id]} › {s.name}</option>)}
            </Select>
          </Field>
          <Field label="Date"><Input type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={form.txn_date} onChange={(e) => setForm({ ...form, txn_date: e.target.value })} /></Field>
          <Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
          <Field label="Note"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></Field>
          <div className="flex items-end"><Button type="submit" className="w-full justify-center"><Plus size={16} /> Add</Button></div>
        </form>
      </Card>
      </div>

      <Card
        title={`Ledger (${txns.length}) · ${moneyCompact(total)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={fMonth} onChange={(e) => setFMonth(e.target.value)} className="w-32 sm:w-36">
              <option value="">All months</option>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
            <Select value={fSub} onChange={(e) => setFSub(e.target.value)} className="w-36 sm:w-44">
              <option value="">All items</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        }
      >
        {txns.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions" hint="Tap ＋ to add an expense, or click a Spent cell in the Month view." />
        ) : (
          <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Note</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="py-2 text-muted">{t.txn_date}</td>
                  <td className="py-2 font-medium">{subCat[t.subcategory_id]} › {subName[t.subcategory_id]}</td>
                  <td className="py-2 text-muted">{t.note || "—"}</td>
                  <td className="num py-2 text-right font-medium">{moneyCompact(t.amount)}</td>
                  <td className="py-2 text-right"><button className="text-muted hover:text-neg" onClick={() => remove.mutate(t.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Mobile cards */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-[var(--radiusSm)] border border-line bg-surface px-[15px] py-[13px] shadow-[var(--shadow)]">
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px]" style={{ background: `color-mix(in srgb, ${sectionColor(subCat[t.subcategory_id])} 14%, transparent)` }}>
                  <span className="h-[11px] w-[11px] rounded-[4px]" style={{ background: sectionColor(subCat[t.subcategory_id]) }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{subName[t.subcategory_id]}</div>
                  <div className="text-[11.5px] font-medium text-dim">{t.txn_date}{t.note ? "" : ` · ${subCat[t.subcategory_id]}`}</div>
                  {t.note && <div className="line-clamp-2 text-[11.5px] font-medium text-dim">{t.note}</div>}
                </div>
                <span className="num text-[15px] font-extrabold">{moneyCompact(t.amount)}</span>
                <button className="text-faint hover:text-neg" onClick={() => remove.mutate(t.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          </>
        )}
      </Card>

      <AddExpenseSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
