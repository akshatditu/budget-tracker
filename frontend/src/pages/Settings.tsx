import { useState, useEffect } from "react";
import { useApp } from "../lib/AppContext";
import { useTheme } from "../lib/theme";
import { useMe, useUpdateMe, useYears, useCreateYear } from "../api/hooks";
import { Button, Input, Field, Select } from "../components/ui";
import { startTour } from "../lib/tour";

const card = "rounded-[var(--radius)] border border-line bg-surface p-[17px] shadow-[var(--shadow)]";
const cardTitle = "mb-3.5 text-[14px] font-extrabold tracking-tight";

export default function Settings() {
  const { year, setYear } = useApp();
  const { theme, toggleTheme } = useTheme();
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
    <div className="mx-auto max-w-2xl space-y-3.5">
      <h1 className="hidden text-[26px] font-extrabold tracking-tight lg:block">Settings</h1>

      <div className={card}>
        <div className={cardTitle}>Profile</div>
        <Field label="Display name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="mt-3.5">
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </Select>
          </Field>
        </div>
        <div className="mt-3.5">
          <Button onClick={() => updateMe.mutate({ display_name: name, currency })}>
            {updateMe.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>

      <div className={card}>
        <div className={cardTitle}>Appearance</div>
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-semibold text-dim">Dark mode</span>
          <button
            onClick={toggleTheme}
            className="relative h-7 w-12 rounded-full transition"
            style={{ background: theme === "dark" ? "var(--accent)" : "var(--surface2)" }}
            aria-label="Toggle dark mode"
          >
            <span
              className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all"
              style={{ left: theme === "dark" ? "23px" : "3px" }}
            />
          </button>
        </div>
      </div>

      <div className={card}>
        <div className={cardTitle}>Budget years</div>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {years.map((y) => (
            <button
              key={y.id}
              onClick={() => setYear(y.year)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${y.year === year ? "border-[var(--accent)] bg-accentsoft text-accent2" : "border-line text-muted hover:bg-canvas"}`}
            >
              {y.year}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2.5">
          <div className="flex-1"><Field label="New year"><Input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} /></Field></div>
          <div className="flex-[1.3]">
            <Field label="Copy from">
              <Select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                <option value="">Start empty</option>
                {years.map((y) => <option key={y.id} value={y.year}>{y.year}</option>)}
              </Select>
            </Field>
          </div>
        </div>
        <Button
          className="mt-3.5 w-full justify-center"
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

      <div className={card}>
        <div className="mb-1.5 text-[14px] font-extrabold tracking-tight">Guided tour</div>
        <p className="text-[12.5px] font-semibold leading-snug text-dim">Take the quick walkthrough of the app again.</p>
        <div className="mt-3.5">
          <Button variant="outline" onClick={() => startTour()}>Replay tour</Button>
        </div>
      </div>
    </div>
  );
}
