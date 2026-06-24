import { useState, type FormEvent } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useIncomes, useIncomeMutations } from "../api/hooks";
import { money, MONTH_NAMES, MONTH_SHORT } from "../lib/format";
import { Card, Button, Input, Select, Field, EmptyState } from "../components/ui";

interface IncomeForm {
  month: number | string;
  source: string;
  amount: string;
}

export default function Income() {
  const { year } = useApp();
  const { data: incomes = [] } = useIncomes(year);
  const { create, remove } = useIncomeMutations(year);
  const [form, setForm] = useState<IncomeForm>({ month: new Date().getMonth() + 1, source: "Salary", amount: "" });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.amount) return;
    create.mutate(
      { month: Number(form.month), source: form.source || "Salary", amount: Number(form.amount) },
      { onSuccess: () => setForm((f) => ({ ...f, amount: "" })) }
    );
  };

  const byMonth = MONTH_SHORT.map((_, i) => incomes.filter((x) => x.month === i + 1).reduce((a, b) => a + b.amount, 0));
  const total = incomes.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{year} Income</h1>
        <p className="text-sm text-muted">Add salary and any additional income any time — your monthly budget flexes around it.</p>
      </div>

      <Card title="Add income">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Month">
            <Select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Source"><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Salary / Bonus / Freelance" /></Field>
          <Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
          <div className="flex items-end"><Button type="submit" className="w-full justify-center"><Plus size={16} /> Add income</Button></div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="By month" className="lg:col-span-1">
          <dl className="space-y-1.5 text-sm">
            {MONTH_SHORT.map((m, i) => (
              <div key={m} className="flex justify-between">
                <dt className="text-muted">{m}</dt>
                <dd className={byMonth[i] ? "font-medium" : "text-muted"}>{money(byMonth[i])}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
        </Card>

        <Card title={`All entries (${incomes.length})`} className="lg:col-span-2">
          {incomes.length === 0 ? (
            <EmptyState icon={Wallet} title="No income yet" hint="Add your salary above to get started." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((i) => (
                  <tr key={i.id} className="border-t border-line">
                    <td className="py-2 text-muted">{MONTH_NAMES[i.month - 1]}</td>
                    <td className="py-2 font-medium">{i.source}</td>
                    <td className="py-2 text-right font-medium">{money(i.amount)}</td>
                    <td className="py-2 text-right"><button className="text-muted hover:text-red-600" onClick={() => remove.mutate(i.id)}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
