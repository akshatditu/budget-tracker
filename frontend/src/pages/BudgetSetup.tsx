import { Fragment, useState } from "react";
import { Plus, Archive, FolderPlus, RotateCw } from "lucide-react";
import { useApp } from "../lib/AppContext";
import {
  useAnnualBudget, useCategories, useSubcategories, useBudgetMutations, useCatalogMutations,
} from "../api/hooks";
import { money, moneyCompact, sectionColor } from "../lib/format";
import { Card, EditableNumber, Button, Input, Modal, Field, Sheet } from "../components/ui";
import RegenerateBudget from "../components/RegenerateBudget";
import type { AnnualBudgetRow, Category, Subcategory } from "../types/api";

const ROLLOVER_HINT = "Unspent budget carries into next month instead of resetting.";

/** On/off switch used in the mobile add / detail sheets. */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="relative h-6 w-11 shrink-0 rounded-full transition"
      style={{ background: on ? "var(--accent)" : "var(--border)" }}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

type BudgetCells = Pick<AnnualBudgetRow, "initial_annual" | "revised_annual" | "ytd_revised">;

/** Mobile item-detail bottom sheet — edit Initial/Revised, see Per-month/YTD,
 *  toggle rollover, or archive. Mirrors the desktop table row. */
function ItemDetailSheet({ year, catName, item, budget, onClose }: {
  year: number; catName: string; item: Subcategory; budget: BudgetCells; onClose: () => void;
}) {
  const { setAnnual, setAnnualRevised } = useBudgetMutations(year);
  const { updateSubcategory, deleteSubcategory } = useCatalogMutations(year);

  const editRow = (label: string, value: number, onCommit: (v: number) => void) => (
    <div className="flex items-center justify-between rounded-[var(--radiusXs)] bg-surface2 px-3 py-1.5">
      <span className="text-xs font-semibold text-dim">{label}</span>
      <div className="w-32"><EditableNumber value={value} onCommit={onCommit} className="text-[13px] font-bold" /></div>
    </div>
  );
  const statRow = (label: string, value: number) => (
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
          <span className="h-3 w-3 rounded-[4px]" style={{ background: sectionColor(catName) }} />
          {item.name}
        </span>
      }
    >
      <div className="mt-4 space-y-2.5">
        {editRow("Initial annual", budget.initial_annual, (v) => setAnnual.mutate({ subcategory_id: item.id, initial_amount: v }))}
        {statRow("Per month", budget.initial_annual / 12)}
        {editRow("Revised annual", budget.revised_annual, (v) => setAnnualRevised.mutate({ subcategory_id: item.id, revised_amount: v }))}
        {statRow("Revised YTD", budget.ytd_revised)}
      </div>

      <div className="mt-4 rounded-[var(--radiusXs)] bg-surface2 px-3 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-extrabold">Rollover</span>
          <Toggle on={item.rollover} onChange={() => updateSubcategory.mutate({ id: item.id, rollover: !item.rollover })} />
        </div>
        <p className="mt-1.5 text-[11.5px] font-medium leading-snug text-dim">{ROLLOVER_HINT}</p>
      </div>

      <button
        onClick={() => deleteSubcategory.mutate(item.id, { onSuccess: onClose })}
        className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-[var(--radiusSm)] border border-line py-3 text-[13px] font-bold"
        style={{ color: "var(--neg)" }}
      >
        <Archive size={15} /> Archive item
      </button>
    </Sheet>
  );
}

/** Mobile add-item bottom sheet — name, yearly budget, rollover in one step. */
function AddSubSheet({ year, category, onClose }: { year: number; category: Category; onClose: () => void }) {
  const { createSubcategory, updateSubcategory } = useCatalogMutations(year);
  const { setAnnual } = useBudgetMutations(year);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [rollover, setRollover] = useState(true); // backend default

  const submit = () => {
    if (!name.trim()) return;
    createSubcategory.mutate(
      { category_id: category.id, name: name.trim() },
      { onSuccess: (res) => {
          const id = res.data.id;
          const amt = Number(amount);
          if (amt > 0) setAnnual.mutate({ subcategory_id: id, initial_amount: amt });
          if (!rollover) updateSubcategory.mutate({ id, rollover: false });
          onClose();
        } },
    );
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-[4px]" style={{ background: sectionColor(category.name) }} />
          Add to {category.name}
        </span>
      }
    >
      <div className="mt-4 space-y-3.5">
        <Field label="Item name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" onKeyDown={(e) => e.key === "Enter" && submit()} />
        </Field>
        <Field label="Yearly budget">
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹" className="num" />
        </Field>
        <div className="rounded-[var(--radiusXs)] bg-surface2 px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold">Rollover</span>
            <Toggle on={rollover} onChange={() => setRollover((v) => !v)} />
          </div>
          <p className="mt-1.5 text-[11.5px] font-medium leading-snug text-dim">{ROLLOVER_HINT}</p>
        </div>
      </div>
      <Button onClick={submit} disabled={!name.trim() || createSubcategory.isPending} className="mt-5 w-full justify-center py-3.5 text-[15px]">
        {createSubcategory.isPending ? "Adding…" : "Add item"}
      </Button>
    </Sheet>
  );
}

export default function BudgetSetup() {
  const { year } = useApp();
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useSubcategories();
  const { data: budget = [] } = useAnnualBudget(year);
  const { setAnnual, setAnnualRevised } = useBudgetMutations(year);
  const { createCategory, createSubcategory, deleteSubcategory, updateSubcategory } = useCatalogMutations(year);

  const [addingTo, setAddingTo] = useState<number | null>(null); // category id (desktop inline add)
  const [newSubName, setNewSubName] = useState("");
  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addSheetCat, setAddSheetCat] = useState<Category | null>(null); // mobile add sheet
  const [detail, setDetail] = useState<{ catName: string; itemId: number } | null>(null); // mobile detail sheet

  const budgetBySub: Record<number, AnnualBudgetRow> = Object.fromEntries(
    budget.map((b): [number, AnnualBudgetRow] => [b.subcategory_id, b])
  );
  const subsByCat = categories.map((c) => ({
    ...c,
    items: subs.filter((s) => s.category_id === c.id),
  }));

  const grandInitial = budget.reduce((a, b) => a + b.initial_annual, 0);
  const grandRevised = budget.reduce((a, b) => a + b.revised_annual, 0);

  const addSub = (catId: number) => {
    if (!newSubName.trim()) return;
    createSubcategory.mutate(
      { category_id: catId, name: newSubName.trim() },
      { onSuccess: () => { setNewSubName(""); setAddingTo(null); } }
    );
  };

  return (
    <div className="space-y-3.5 lg:space-y-6">
      {/* Desktop header */}
      <div className="hidden flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">{year} Budget Setup</h1>
          <p className="text-sm text-muted">Set each item's yearly budget — it auto-splits evenly across 12 months. Revise individual months in the Month view.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <RegenerateBudget />
          <Button variant="outline" onClick={() => setCatModal(true)}><FolderPlus size={16} /> Add section</Button>
        </div>
      </div>

      {/* Mobile: Build with AI banner + intro */}
      <div className="space-y-3.5 lg:hidden">
        <RegenerateBudget banner />
        <div className="rounded-[var(--radiusSm)] border border-line bg-surface px-[15px] py-[13px] text-[12.5px] font-semibold leading-snug text-dim">
          Set each item's yearly budget — it auto-splits across 12 months. Tap a month in Month view to revise just that one.
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 sm:grid-cols-3 lg:grid">
        <Card><div className="text-xs uppercase text-muted">Initial annual</div><div className="mt-1 text-2xl font-semibold">{money(grandInitial)}</div></Card>
        <Card><div className="text-xs uppercase text-muted">Revised annual (rolled up)</div><div className="mt-1 text-2xl font-semibold">{money(grandRevised)}</div></Card>
        <Card><div className="text-xs uppercase text-muted">Sections / Items</div><div className="mt-1 text-2xl font-semibold">{categories.length} / {subs.length}</div></Card>
      </div>

      {subsByCat.map((cat) => (
        <Fragment key={cat.id}>
        {/* Mobile section card */}
        <div className="rounded-[var(--radius)] border border-line bg-surface px-4 py-1 shadow-[var(--shadow)] lg:hidden">
          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-[14.5px] font-extrabold">
              <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: sectionColor(cat.name) }} />{cat.name}
            </span>
            <button
              onClick={() => setAddSheetCat(cat)}
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: "var(--accent2)" }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {cat.items.map((it) => {
            const b = budgetBySub[it.id] ?? { initial_annual: 0, revised_annual: 0, ytd_revised: 0 };
            return (
              <button
                key={it.id}
                onClick={() => setDetail({ catName: cat.name, itemId: it.id })}
                className="flex w-full items-center justify-between gap-3 border-t border-line py-[11px] text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate text-sm font-bold">
                    {it.name}
                    {it.rollover && <RotateCw size={12} style={{ color: "var(--accent)" }} aria-label="rolls over" />}
                  </div>
                  <div className="mt-px text-[11px] font-semibold text-dim">Initial {moneyCompact(b.initial_annual)} · {moneyCompact(b.initial_annual / 12)}/mo</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-[14.5px] font-extrabold">{money(b.revised_annual)}</div>
                  <div className="text-[10.5px] font-semibold text-dim">revised</div>
                </div>
              </button>
            );
          })}
          {cat.items.length === 0 && (
            <div className="border-t border-line py-3 text-center text-xs text-dim">No items yet.</div>
          )}
        </div>

        {/* Desktop section card + table */}
        <Card
          className="hidden lg:block"
          title={<span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(cat.name) }} />{cat.name}</span>}
          action={<Button variant="ghost" onClick={() => { setAddingTo(cat.id); setNewSubName(""); }}><Plus size={16} /> Add item</Button>}
        >
          <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Initial annual</th>
                <th className="pb-2 text-right font-medium">Per month</th>
                <th className="pb-2 text-right font-medium">Revised annual</th>
                <th className="pb-2 text-right font-medium">Revised YTD</th>
                <th className="pb-2 text-center font-medium" title="Carry unspent budget into next month">Rollover</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {cat.items.map((it) => {
                const b = budgetBySub[it.id] ?? { initial_annual: 0, revised_annual: 0, ytd_revised: 0 };
                return (
                  <tr key={it.id} className="border-t border-line">
                    <td className="py-1.5 font-medium">{it.name}</td>
                    <td className="py-1.5">
                      <EditableNumber value={b.initial_annual} onCommit={(v) => setAnnual.mutate({ subcategory_id: it.id, initial_amount: v })} />
                    </td>
                    <td className="py-1.5 pr-2 text-right text-muted">{money(b.initial_annual / 12)}</td>
                    <td className="py-1.5">
                      <EditableNumber value={b.revised_annual} onCommit={(v) => setAnnualRevised.mutate({ subcategory_id: it.id, revised_amount: v })} />
                    </td>
                    <td className="py-1.5 pr-2 text-right text-muted">{money(b.ytd_revised)}</td>
                    <td className="py-1.5 text-center">
                      <button
                        title={it.rollover ? "Rollover on — click to turn off" : "Rollover off — click to turn on"}
                        onClick={() => updateSubcategory.mutate({ id: it.id, rollover: !it.rollover })}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition ${it.rollover ? "bg-accentsoft text-accent2" : "text-muted hover:bg-canvas"}`}
                      >
                        <RotateCw size={13} className={it.rollover ? "" : "opacity-50"} />
                      </button>
                    </td>
                    <td className="py-1.5 text-right">
                      <button className="text-muted hover:text-neg" title="Archive item" onClick={() => deleteSubcategory.mutate(it.id)}><Archive size={15} /></button>
                    </td>
                  </tr>
                );
              })}
              {addingTo === cat.id && (
                <tr className="border-t border-line">
                  <td colSpan={7} className="py-2">
                    <div className="flex gap-2">
                      <Input autoFocus value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="New item name" onKeyDown={(e) => e.key === "Enter" && addSub(cat.id)} />
                      <Button onClick={() => addSub(cat.id)}>Add</Button>
                      <Button variant="ghost" onClick={() => setAddingTo(null)}>Cancel</Button>
                    </div>
                  </td>
                </tr>
              )}
              {cat.items.length === 0 && addingTo !== cat.id && (
                <tr><td colSpan={7} className="py-3 text-center text-xs text-muted">No items yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </Card>
        </Fragment>
      ))}

      {(() => {
        const item = detail ? subs.find((s) => s.id === detail.itemId) : undefined;
        return detail && item ? (
          <ItemDetailSheet
            year={year}
            catName={detail.catName}
            item={item}
            budget={budgetBySub[item.id] ?? { initial_annual: 0, revised_annual: 0, ytd_revised: 0 }}
            onClose={() => setDetail(null)}
          />
        ) : null;
      })()}

      {addSheetCat && <AddSubSheet year={year} category={addSheetCat} onClose={() => setAddSheetCat(null)} />}

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add section">
        <Field label="Section name">
          <Input autoFocus value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Savings" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCatModal(false)}>Cancel</Button>
          <Button onClick={() => newCatName.trim() && createCategory.mutate({ name: newCatName.trim(), sort_order: categories.length }, { onSuccess: () => { setNewCatName(""); setCatModal(false); } })}>Create</Button>
        </div>
      </Modal>
    </div>
  );
}
