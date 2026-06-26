import { useState } from "react";
import { Plus, Archive, FolderPlus, RotateCw } from "lucide-react";
import { useApp } from "../lib/AppContext";
import {
  useAnnualBudget, useCategories, useSubcategories, useBudgetMutations, useCatalogMutations,
} from "../api/hooks";
import { money, sectionColor } from "../lib/format";
import { Card, EditableNumber, Button, Input, Modal, Field } from "../components/ui";
import type { AnnualBudgetRow } from "../types/api";

export default function BudgetSetup() {
  const { year } = useApp();
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useSubcategories();
  const { data: budget = [] } = useAnnualBudget(year);
  const { setAnnual, setAnnualRevised } = useBudgetMutations(year);
  const { createCategory, createSubcategory, deleteSubcategory, updateSubcategory } = useCatalogMutations(year);

  const [addingTo, setAddingTo] = useState<number | null>(null); // category id
  const [newSubName, setNewSubName] = useState("");
  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{year} Budget Setup</h1>
          <p className="text-sm text-muted">Set each item's yearly budget — it auto-splits evenly across 12 months. Revise individual months in the Month view.</p>
        </div>
        <Button variant="outline" className="self-start" onClick={() => setCatModal(true)}><FolderPlus size={16} /> Add section</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><div className="text-xs uppercase text-muted">Initial annual</div><div className="mt-1 text-2xl font-semibold">{money(grandInitial)}</div></Card>
        <Card><div className="text-xs uppercase text-muted">Revised annual (rolled up)</div><div className="mt-1 text-2xl font-semibold">{money(grandRevised)}</div></Card>
        <Card><div className="text-xs uppercase text-muted">Sections / Items</div><div className="mt-1 text-2xl font-semibold">{categories.length} / {subs.length}</div></Card>
      </div>

      {subsByCat.map((cat) => (
        <Card
          key={cat.id}
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
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition ${it.rollover ? "bg-blue-50 text-brand" : "text-muted hover:bg-canvas"}`}
                      >
                        <RotateCw size={13} className={it.rollover ? "" : "opacity-50"} />
                      </button>
                    </td>
                    <td className="py-1.5 text-right">
                      <button className="text-muted hover:text-red-600" title="Archive item" onClick={() => deleteSubcategory.mutate(it.id)}><Archive size={15} /></button>
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
      ))}

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
