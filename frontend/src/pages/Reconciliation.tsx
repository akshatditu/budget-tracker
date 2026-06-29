import { useState, type FormEvent } from "react";
import { Plus, Trash2, Scale } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useReconciliations, useReconciliationMutations } from "../api/hooks";
import { money } from "../lib/format";
import { Card, Button, Field, Input, EmptyState } from "../components/ui";

function DriftCell({ drift }: { drift: number }) {
  if (Math.abs(drift) < 0.005) {
    return <span className="pill pill-pos">Matched</span>;
  }
  // Negative = real bank has less than computed (likely an unlogged expense).
  const cls = drift < 0 ? "text-neg" : "text-warn";
  return <span className={`font-semibold ${cls}`}>{drift > 0 ? "+" : ""}{money(drift)}</span>;
}

export default function Reconciliation() {
  const { year } = useApp();
  const { data: rows = [], isLoading } = useReconciliations(year);
  const { create, remove } = useReconciliationMutations(year);

  const [date, setDate] = useState(`${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`);
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!balance) return;
    create.mutate(
      { as_of_date: date, actual_balance: Number(balance), note: note || null },
      { onSuccess: () => { setBalance(""); setNote(""); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <h1 className="text-[26px] font-extrabold tracking-tight">Reconciliation</h1>
        <p className="text-sm text-muted">Record your real bank balance and compare it against the computed carry-forward, so drift (e.g. an unlogged expense) surfaces instead of quietly accruing.</p>
      </div>

      <Card title="Add a balance snapshot">
        <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="As of date"><Input type="date" value={date} min={`${year}-01-01`} max={`${year}-12-31`} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Actual balance"><Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" /></Field>
          <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
          <div className="flex items-end"><Button type="submit" className="w-full justify-center"><Plus size={16} /> Add</Button></div>
        </form>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No snapshots yet"
          hint="Add your actual bank balance for a date to check it against what the app computed."
        />
      ) : (
        <Card title="Snapshots">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 text-right font-medium">Actual</th>
                  <th className="pb-2 text-right font-medium">Expected (computed)</th>
                  <th className="pb-2 text-right font-medium">Drift</th>
                  <th className="pb-2 font-medium">Note</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-2 font-medium">{r.as_of_date}</td>
                    <td className="py-2 text-right">{money(r.actual_balance)}</td>
                    <td className="py-2 text-right text-muted">{money(r.expected_balance)}</td>
                    <td className="py-2 text-right"><DriftCell drift={r.drift} /></td>
                    <td className="py-2 text-muted">{r.note || "—"}</td>
                    <td className="py-2 text-right">
                      <button className="text-muted hover:text-neg" title="Delete snapshot" onClick={() => remove.mutate(r.id)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
