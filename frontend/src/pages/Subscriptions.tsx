import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Pause, Play } from "lucide-react";
import { useCategories, useSubcategories, useSubscriptions, useSubscriptionMutations } from "../api/hooks";
import { money, sectionColor, MONTH_SHORT } from "../lib/format";
import { Input, Select, Button, DateField, Sheet } from "../components/ui";
import type { Frequency, Subscription } from "../types/api";

const card = "rounded-[var(--radius)] border border-line bg-surface p-5 shadow-[var(--shadow)]";

const FREQUENCIES: { value: Frequency; label: string; perMonth: number }[] = [
  { value: "weekly", label: "Weekly", perMonth: 52 / 12 },
  { value: "monthly", label: "Monthly", perMonth: 1 },
  { value: "quarterly", label: "Quarterly", perMonth: 1 / 3 },
  { value: "semiannual", label: "Half-yearly", perMonth: 1 / 6 },
  { value: "yearly", label: "Yearly", perMonth: 1 / 12 },
];
const freq = (f: Frequency) => FREQUENCIES.find((x) => x.value === f)!;

const parse = (iso: string) => iso.split("-").map(Number);
const fmtDate = (iso: string) => {
  const [y, m, d] = parse(iso);
  return `${String(d).padStart(2, "0")} ${MONTH_SHORT[m - 1]} ${y}`;
};
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
/** "Monthly on the 1st", "Weekly on Mon", "Yearly on 12 Mar" — derived from the anchor date. */
const schedule = (s: Subscription) => {
  const [y, m, d] = parse(s.start_date);
  if (s.frequency === "weekly") return `Weekly on ${new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" })}`;
  if (s.frequency === "yearly") return `Yearly on ${d} ${MONTH_SHORT[m - 1]}`;
  return `${freq(s.frequency).label} on the ${ordinal(d)}`;
};

/** Matches Tailwind's `lg` breakpoint — below it, add/edit opens in a bottom sheet. */
const DESKTOP = "(min-width: 1024px)";
const useIsDesktop = () => {
  const [m, setM] = useState(() => window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
};

const todayIso = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

interface Draft {
  name: string;
  subcategory_id: string;
  amount: string;
  frequency: Frequency;
  start_date: string;
  end_date: string;
}
const blank = (): Draft => ({ name: "", subcategory_id: "", amount: "", frequency: "monthly", start_date: todayIso(), end_date: "" });

function Editor({ draft, setDraft, onSave, onCancel, saving, inSheet = false }: {
  inSheet?: boolean;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useSubcategories();
  const label = "flex min-w-0 flex-col gap-1.5";
  const labelText = "text-[12px] font-semibold text-dim";
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const valid = draft.name.trim() && draft.subcategory_id && Number(draft.amount) > 0 && draft.start_date;
  // Inline: a wrapping row of fields. In the mobile sheet: a 2-column grid, full-width actions.
  const w = (inline: string, wide = false) => (inSheet ? (wide ? "col-span-2" : "") : inline);
  return (
    <div className={inSheet ? "mt-3 grid grid-cols-2 items-end gap-3" : "my-2.5 flex flex-wrap items-end gap-2.5 rounded-[var(--radiusSm)] border border-line bg-surface2 p-3.5"}>
      <label className={`${label} ${w("flex-[1_1_10rem]", true)}`}>
        <span className={labelText}>Name</span>
        <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Netflix / Phone bill / SIP" />
      </label>
      <label className={`${label} ${w("flex-[1_1_11rem]", true)}`}>
        <span className={labelText}>Category</span>
        <Select value={draft.subcategory_id} onChange={(e) => set({ subcategory_id: e.target.value })}>
          <option value="" disabled>Pick a category…</option>
          {categories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {subs.filter((s) => s.category_id === c.id && !s.archived).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </Select>
      </label>
      <label className={`${label} ${w("flex-[1_1_7rem]")}`}>
        <span className={labelText}>Amount (₹)</span>
        <Input type="number" inputMode="numeric" value={draft.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0" />
      </label>
      <label className={`${label} ${w("flex-[1_1_8rem]")}`}>
        <span className={labelText}>Repeats</span>
        <Select value={draft.frequency} onChange={(e) => set({ frequency: e.target.value as Frequency })}>
          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </label>
      <div className={`${label} ${w("flex-[1_1_10rem]")}`}>
        <span className={labelText}>Deduction date</span>
        <DateField value={draft.start_date} onChange={(start_date) => set({ start_date })} />
      </div>
      <div className={`${label} ${w("flex-[1_1_10rem]")}`}>
        <span className={labelText}>
          Ends <span className="font-medium text-faint">(optional)</span>
          {draft.end_date && <button type="button" onClick={() => set({ end_date: "" })} className="ml-2 font-semibold text-accent2">Clear</button>}
        </span>
        <DateField value={draft.end_date} onChange={(end_date) => set({ end_date })} min={draft.start_date} />
      </div>
      {inSheet ? (
        <Button onClick={onSave} disabled={!valid || saving} className="col-span-2 mt-1 justify-center py-3.5 text-[15px]">
          {saving ? "Saving…" : "Save subscription"}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!valid || saving}>Save</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

export default function Subscriptions() {
  const { data: items = [] } = useSubscriptions();
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useSubcategories(true);
  const { create, update, remove } = useSubscriptionMutations();
  const isDesktop = useIsDesktop();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const startAdd = () => { setEditingId(null); setDraft(blank()); setAdding(true); };
  const startEdit = (s: Subscription) => {
    setAdding(false);
    setDraft({
      name: s.name, subcategory_id: String(s.subcategory_id), amount: String(s.amount),
      frequency: s.frequency, start_date: s.start_date, end_date: s.end_date ?? "",
    });
    setEditingId(s.id);
  };
  const cancel = () => { setAdding(false); setEditingId(null); setDraft(blank()); };

  const payload = () => ({
    name: draft.name.trim(),
    subcategory_id: Number(draft.subcategory_id),
    amount: Number(draft.amount),
    frequency: draft.frequency,
    start_date: draft.start_date,
    end_date: draft.end_date || null,
  });
  const saveAdd = () => create.mutate(payload(), { onSuccess: cancel });
  const saveEdit = (id: number) => update.mutate({ id, ...payload() }, { onSuccess: cancel });

  const subName = (id: number) => subs.find((s) => s.id === id);
  const catOf = (id: number) => categories.find((c) => c.id === subName(id)?.category_id)?.name ?? "";

  const active = items.filter((s) => s.active);
  const perMonth = active.reduce((sum, s) => sum + s.amount * freq(s.frequency).perMonth, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="hidden lg:block">
          <div className="text-[12px] font-semibold uppercase tracking-[.12em] text-dim">Recurring payments</div>
          <h1 className="text-[28px] font-extrabold tracking-tight">Subscriptions</h1>
        </div>
        <div className="ml-auto text-right">
          <div className="num text-[34px] font-extrabold leading-none tracking-tight">≈ {money(perMonth)}<span className="text-[16px] font-bold text-dim"> / month</span></div>
          <div className="mt-1.5 text-[13px] text-dim">{active.length} active · charges post automatically on their due date</div>
        </div>
      </div>

      <div className={card}>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-extrabold tracking-tight">
            All subscriptions <span className="font-bold text-faint">({items.length})</span>
          </h2>
          <Button onClick={startAdd}><Plus size={16} /> Add subscription</Button>
        </div>

        {adding && isDesktop && <Editor draft={draft} setDraft={setDraft} onSave={saveAdd} onCancel={cancel} saving={create.isPending} />}

        {items.length === 0 && !adding && (
          <div className="py-11 text-center">
            <div className="text-[15px] font-semibold text-dim">No subscriptions yet</div>
            <div className="mt-1 text-[13px] text-faint">Add Netflix, your phone bill or a SIP and it'll be logged for you every time it's due.</div>
          </div>
        )}

        <div className="mt-2">
          {items.map((s) =>
            editingId === s.id && isDesktop ? (
              <Editor key={s.id} draft={draft} setDraft={setDraft} onSave={() => saveEdit(s.id)} onCancel={cancel} saving={update.isPending} />
            ) : (
              <div key={s.id} className={`flex items-center gap-3.5 border-b border-line py-3.5 ${s.active ? "" : "opacity-55"}`}>
                <span className="h-[11px] w-[11px] shrink-0 rounded-full" style={{ background: sectionColor(catOf(s.subcategory_id)) }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{s.name}</div>
                  <div className="truncate text-[13px] text-dim">
                    {subName(s.subcategory_id)?.name ?? "—"} · {schedule(s)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-[16px] font-semibold">{money(s.amount)}</div>
                  <div className="mt-0.5 text-[12px] text-faint">
                    {!s.active ? "Paused" : s.end_date && s.next_due_date > s.end_date ? "Ended" : `Next ${fmtDate(s.next_due_date)}`}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button onClick={() => update.mutate({ id: s.id, active: !s.active })} aria-label={s.active ? "Pause" : "Resume"} title={s.active ? "Pause" : "Resume"} className="rounded-[9px] p-2 text-dim transition hover:bg-surface2 hover:text-ink">
                    {s.active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => startEdit(s)} aria-label="Edit" className="rounded-[9px] p-2 text-dim transition hover:bg-surface2 hover:text-ink">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => remove.mutate(s.id)} aria-label="Delete" className="rounded-[9px] p-2 text-dim transition hover:bg-surface2 hover:text-neg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile: add/edit in a bottom sheet, like Add expense. */}
      {!isDesktop && (
        <Sheet open={adding || editingId !== null} onClose={cancel} title={editingId !== null ? "Edit subscription" : "Add subscription"}>
          <Editor
            inSheet
            draft={draft}
            setDraft={setDraft}
            onSave={editingId !== null ? () => saveEdit(editingId) : saveAdd}
            onCancel={cancel}
            saving={create.isPending || update.isPending}
          />
        </Sheet>
      )}
    </div>
  );
}
