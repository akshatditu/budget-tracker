import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useTransactions, useSubcategories, useTransactionMutations, useCategories } from "../api/hooks";
import { money, MONTH_NAMES } from "../lib/format";
import { Card, Button, Input, Select, Field, EmptyState } from "../components/ui";
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
      <h1 className="text-xl font-semibold">{year} Transactions</h1>

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

      <Card
        title={`Ledger (${txns.length}) · ${money(total)}`}
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
          <EmptyState icon={Receipt} title="No transactions" hint="Add an expense above, or click a Spent cell in the Month view." />
        ) : (
          <div className="overflow-x-auto">
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
                  <td className="py-2 text-right font-medium">{money(t.amount)}</td>
                  <td className="py-2 text-right"><button className="text-muted hover:text-red-600" onClick={() => remove.mutate(t.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
}
