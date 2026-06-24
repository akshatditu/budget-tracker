import { useState, useEffect } from "react";
import { useApp } from "../lib/AppContext";
import { useMe, useUpdateMe, useYears, useCreateYear } from "../api/hooks";
import { Card, Button, Input, Field, Select } from "../components/ui";

export default function Settings() {
  const { year, setYear } = useApp();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const { data: years = [] } = useYears();
  const createYear = useCreateYear();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [newYear, setNewYear] = useState<number | string>(new Date().getFullYear() + 1);
  const [copyFrom, setCopyFrom] = useState("");

  useEffect(() => {
    if (me) { setName(me.display_name); setCurrency(me.currency); }
  }, [me]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card title="Profile">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Display name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Currency code">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </Select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted">Currency is stored for phase-2 multi-currency; amounts currently render as ₹.</p>
        <div className="mt-4">
          <Button onClick={() => updateMe.mutate({ display_name: name, currency })}>
            {updateMe.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </Card>

      <Card title="Budget years">
        <div className="mb-4 flex flex-wrap gap-2">
          {years.map((y) => (
            <button
              key={y.id}
              onClick={() => setYear(y.year)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${y.year === year ? "border-brand bg-indigo-50 text-brand" : "border-line text-muted hover:bg-canvas"}`}
            >
              {y.year}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 items-end gap-3">
          <Field label="New year"><Input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} /></Field>
          <Field label="Copy budgets from">
            <Select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
              <option value="">Start empty</option>
              {years.map((y) => <option key={y.id} value={y.year}>{y.year}</option>)}
            </Select>
          </Field>
          <Button
            onClick={() =>
              createYear.mutate(
                { year: Number(newYear), copy_structure_from: copyFrom ? Number(copyFrom) : null },
                { onSuccess: () => setYear(Number(newYear)) }
              )
            }
          >
            Create year
          </Button>
        </div>
      </Card>

      <Card title="About">
        <p className="text-sm text-muted">
          Budget Tracker v0.1 — sections → sub-items → monthly Initial / Revised / Spent / Remaining,
          with annual set-aside rollups and a carry-forward pool. Phase 2: login, net-worth tracker, Excel import.
        </p>
      </Card>
    </div>
  );
}
