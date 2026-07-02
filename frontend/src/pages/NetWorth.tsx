import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useAssets, useAssetMutations, useDashboard } from "../api/hooks";
import { money, MONTH_SHORT } from "../lib/format";
import { ASSET_CATEGORIES, assetColor } from "../lib/assets";
import { Input, Select, Button } from "../components/ui";
import type { AssetHolding } from "../types/api";

const card = "rounded-[var(--radius)] border border-line bg-surface p-5 shadow-[var(--shadow)]";

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTH_SHORT[m - 1]} ${y}`;
};

interface Draft {
  category: string;
  name: string;
  amount: string;
}
const blank = (): Draft => ({ category: "Stocks", name: "", amount: "" });

/** Shared add/edit editor — a compact inline panel with no date field (the date
 *  is stamped automatically server-side to the day of the edit). */
function Editor({
  draft,
  setDraft,
  onSave,
  onCancel,
  inBank,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  inBank?: number;
}) {
  // Picking "Bank Balance" prefills the amount from the dashboard's In-bank figure.
  const pickCategory = (category: string) => {
    const prefill =
      category === "Bank Balance" && inBank != null && !draft.amount ? String(Math.round(inBank)) : draft.amount;
    setDraft({ ...draft, category, amount: prefill });
  };
  const label = "flex min-w-0 flex-col gap-1.5";
  const labelText = "text-[12px] font-semibold text-dim";
  return (
    <div className="my-2.5 flex flex-wrap items-end gap-2.5 rounded-[var(--radiusSm)] border border-line bg-surface2 p-3.5">
      <label className={`${label} flex-[1_1_9rem]`}>
        <span className={labelText}>Category</span>
        <Select value={draft.category} onChange={(e) => pickCategory(e.target.value)}>
          {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </label>
      <label className={`${label} flex-[1_1_10rem]`}>
        <span className={labelText}>Name <span className="font-medium text-faint">(optional)</span></span>
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="TCS / HDFC FD / …" />
      </label>
      <label className={`${label} flex-[1_1_8rem]`}>
        <span className={labelText}>Amount (₹)</span>
        <Input type="number" inputMode="numeric" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" />
      </label>
      <div className="flex gap-2">
        <Button onClick={onSave}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function NetWorth() {
  const { year } = useApp();
  const { data: assets = [] } = useAssets();
  const { create, update, remove } = useAssetMutations();
  const { data: dash } = useDashboard(year);
  const inBank = dash?.kpis.remaining_in_bank;

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(blank());

  const startAdd = () => { setEditingId(null); setDraft(blank()); setAdding(true); };
  const startEdit = (a: AssetHolding) => {
    setAdding(false);
    setDraft({ category: a.category, name: a.name || "", amount: String(a.amount) });
    setEditingId(a.id);
  };
  const cancel = () => { setAdding(false); setEditingId(null); setDraft(blank()); };

  const saveAdd = () => {
    const amount = Number(draft.amount);
    if (!(amount > 0)) return;
    create.mutate({ category: draft.category, name: draft.name.trim() || null, amount }, { onSuccess: cancel });
  };
  const saveEdit = (id: number) => {
    const amount = Number(draft.amount);
    if (!(amount > 0)) return;
    update.mutate({ id, category: draft.category, name: draft.name.trim() || null, amount }, { onSuccess: cancel });
  };

  const total = assets.reduce((s, a) => s + a.amount, 0);
  const lastUpdated = assets.reduce<string | null>((max, a) => (max && max >= a.as_of_date ? max : a.as_of_date), null);
  const rows = [...assets].sort((a, b) => b.id - a.id); // newest first

  // Category totals (amount desc) drive both the donut and its legend.
  const byCategory = ASSET_CATEGORIES.map((category) => ({
    category,
    amount: assets.filter((a) => a.category === category).reduce((s, a) => s + a.amount, 0),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const C = 2 * Math.PI * 80;
  let acc = 0;
  const segments = byCategory.map((c) => {
    const len = total > 0 ? (c.amount / total) * C : 0;
    const seg = { ...c, color: assetColor(c.category), pct: Math.round((c.amount / total) * 100), dash: `${len} ${C - len}`, offset: -acc };
    acc += len;
    return seg;
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="hidden lg:block">
          <div className="text-[12px] font-semibold uppercase tracking-[.12em] text-dim">Portfolio</div>
          <h1 className="text-[28px] font-extrabold tracking-tight">Net Worth</h1>
        </div>
        <div className="ml-auto text-right">
          <div className="num text-[34px] font-extrabold leading-none tracking-tight">{money(total)}</div>
          {lastUpdated && <div className="mt-1.5 text-[13px] text-dim">Updated {fmtDate(lastUpdated)}</div>}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {/* Holdings */}
        <div className={`${card} min-w-0`} style={{ flex: "2 1 400px" }}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-extrabold tracking-tight">
              Holdings <span className="font-bold text-faint">({assets.length})</span>
            </h2>
            <Button onClick={startAdd}><Plus size={16} /> Add asset</Button>
          </div>

          {adding && <Editor draft={draft} setDraft={setDraft} onSave={saveAdd} onCancel={cancel} inBank={inBank} />}

          {assets.length === 0 && !adding && (
            <div className="py-11 text-center">
              <div className="text-[15px] font-semibold text-dim">No assets yet</div>
              <div className="mt-1 text-[13px] text-faint">Add your first holding to start tracking.</div>
            </div>
          )}

          <div className="mt-2">
            {rows.map((a) =>
              editingId === a.id ? (
                <Editor key={a.id} draft={draft} setDraft={setDraft} onSave={() => saveEdit(a.id)} onCancel={cancel} inBank={inBank} />
              ) : (
                <div key={a.id} className="flex items-center gap-3.5 border-b border-line py-3.5">
                  <span className="h-[11px] w-[11px] shrink-0 rounded-full" style={{ background: assetColor(a.category) }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold">{a.category}</div>
                    <div className="truncate text-[13px] text-dim">{a.name || "—"}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-[16px] font-semibold">{money(a.amount)}</div>
                    <div className="mt-0.5 text-[12px] text-faint">Updated {fmtDate(a.as_of_date)}</div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button onClick={() => startEdit(a)} aria-label="Edit" className="rounded-[9px] p-2 text-dim transition hover:bg-surface2 hover:text-ink">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => remove.mutate(a.id)} aria-label="Delete" className="rounded-[9px] p-2 text-dim transition hover:bg-surface2 hover:text-neg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {assets.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-[15px] font-bold">Total net worth</span>
              <span className="num text-[17px] font-bold">{money(total)}</span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className={`${card} min-w-0`} style={{ flex: "1 1 280px" }}>
          <h2 className="mb-1 text-[17px] font-extrabold tracking-tight">Breakdown</h2>

          <div className="relative mx-auto my-3.5 h-[210px] w-[210px]">
            <svg viewBox="0 0 200 200" width="210" height="210">
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--surface2)" strokeWidth="24" />
              <g transform="rotate(-90 100 100)">
                {segments.map((s) => (
                  <circle key={s.category} cx="100" cy="100" r="80" fill="none" stroke={s.color} strokeWidth="24" strokeDasharray={s.dash} strokeDashoffset={s.offset} />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[.09em] text-faint">Total</div>
              <div className="num mt-0.5 text-[19px] font-extrabold">{money(total)}</div>
            </div>
          </div>

          {segments.length === 0 ? (
            <div className="pb-2 text-center text-[13px] text-faint">Nothing to break down yet.</div>
          ) : (
            <div className="flex flex-col">
              {segments.map((s) => (
                <div key={s.category} className="flex items-center gap-2.5 border-b border-line py-2.5">
                  <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{s.category}</span>
                  <span className="shrink-0 text-[12px] text-faint">{s.pct}%</span>
                  <span className="num min-w-[72px] shrink-0 text-right text-[14px] font-semibold">{money(s.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
