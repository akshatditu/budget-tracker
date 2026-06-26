import { useState, type FormEvent } from "react";
import { Plus, Trash2, Target, PiggyBank, Link2, AlertTriangle } from "lucide-react";
import { useGoals, useGoalMutations, useGoalContributions, useCategories, useSubcategories, useAnnualBudget } from "../api/hooks";
import { useApp } from "../lib/AppContext";
import { money, pct } from "../lib/format";
import {
  Card, Button, Modal, Field, Input, Select, ProgressBar, EmptyState,
} from "../components/ui";
import type { Goal, GoalSubcategoryLink } from "../types/api";

const today = () => new Date().toISOString().slice(0, 10);

function OnTrackChip({ goal }: { goal: Goal }) {
  if (goal.saved >= goal.target_amount && goal.target_amount > 0) {
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Funded</span>;
  }
  if (goal.on_track === null) {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">No date</span>;
  }
  return goal.on_track ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">On track</span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Behind</span>
  );
}

function ManageLinksModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { year } = useApp();
  const { data: allGoals = [] } = useGoals();
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories();
  const { data: annualBudget = [] } = useAnnualBudget(year);
  const { addLink, updateLink, removeLink } = useGoalMutations();

  const [newSubcatId, setNewSubcatId] = useState<number | null>(null);
  const [editWeights, setEditWeights] = useState<Record<number, string>>(() =>
    Object.fromEntries(goal.links.map((l) => [l.id, String(l.weight)]))
  );

  // Auto-weight = goal.target_amount / subcategory.revised_annual * 100, capped at 100.
  // Returns null when the subcategory has no annual budget set yet.
  const calcAutoWeight = (subcatId: number | null): number | null => {
    if (!subcatId) return null;
    const row = annualBudget.find((r) => r.subcategory_id === subcatId);
    if (!row || row.revised_annual <= 0) return null;
    return Math.min(100, (goal.target_amount / row.revised_annual) * 100);
  };

  const getRevisedAnnual = (subcatId: number | null): number =>
    annualBudget.find((r) => r.subcategory_id === subcatId)?.revised_annual ?? 0;

  // Total weight per subcategory across ALL goals (for over-allocation warning).
  const totalWeightForSubcat = (subcatId: number | null): number => {
    if (subcatId === null) return 0;
    return allGoals
      .flatMap((g) => g.links)
      .filter((l) => l.subcategory_id === subcatId)
      .reduce((sum, l) => sum + l.weight, 0);
  };

  const linkedSubcatIds = new Set(goal.links.map((l) => l.subcategory_id));
  const availableSubs = subcategories.filter((s) => !linkedSubcatIds.has(s.id));

  const autoWeight = calcAutoWeight(newSubcatId);
  const newSubcatRevised = getRevisedAnnual(newSubcatId);

  const handleAddLink = () => {
    if (!newSubcatId || autoWeight === null) return;
    addLink.mutate(
      { goalId: goal.id, subcategory_id: newSubcatId, weight: autoWeight },
      { onSuccess: () => setNewSubcatId(null) }
    );
  };

  const handleSaveWeight = (link: GoalSubcategoryLink) => {
    const w = Number(editWeights[link.id]);
    if (!w || w <= 0) return;
    updateLink.mutate({ goalId: goal.id, linkId: link.id, weight: w });
  };

  const thisGoalTotal = goal.links.reduce((sum, l) => sum + l.weight, 0);

  return (
    <Modal open onClose={onClose} title={`Linked subcategories — ${goal.name}`}>
      <p className="mb-3 text-sm text-muted">
        Each linked subcategory contributes its monthly unspent budget to this goal, scaled by its weight.
        When no links exist the goal uses manual contributions instead.
      </p>

      {goal.links.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No links yet — add one below.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {goal.links.map((link) => {
            const total = totalWeightForSubcat(link.subcategory_id);
            const suggested = calcAutoWeight(link.subcategory_id);
            return (
              <div key={link.id} className="space-y-1">
                <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{link.subcategory_name ?? "—"}</p>
                    {suggested !== null && Math.abs(suggested - link.weight) > 0.1 && (
                      <p className="text-xs text-muted">suggested: {suggested.toFixed(1)}%</p>
                    )}
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      className="text-right"
                      value={editWeights[link.id] ?? String(link.weight)}
                      onChange={(e) => setEditWeights((prev) => ({ ...prev, [link.id]: e.target.value }))}
                    />
                  </div>
                  <span className="text-sm text-muted">%</span>
                  <button
                    className="text-xs text-brand hover:underline disabled:opacity-50"
                    onClick={() => handleSaveWeight(link)}
                    disabled={updateLink.isPending}
                  >
                    Save
                  </button>
                  <button
                    className="text-muted hover:text-red-600"
                    onClick={() => removeLink.mutate({ goalId: goal.id, linkId: link.id })}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {total > 100 && (
                  <div className="flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    <AlertTriangle size={12} />
                    {link.subcategory_name} is over-allocated ({total.toFixed(0)}% across all goals).
                    Some goals may receive less than expected.
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-right text-xs text-muted">
            This goal’s total: <span className="font-medium">{thisGoalTotal.toFixed(0)}%</span>
          </p>
        </div>
      )}

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Add a link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={newSubcatId ?? ""}
              onChange={(e) => setNewSubcatId(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">— Select subcategory —</option>
              {categories.map((cat) => {
                const subs = availableSubs.filter((s) => s.category_id === cat.id);
                if (subs.length === 0) return null;
                return (
                  <optgroup key={cat.id} label={cat.name}>
                    {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                );
              })}
            </Select>
          </div>
          {/* Weight is auto-calculated from goal target ÷ subcategory annual budget — read-only */}
          <div className="flex w-28 shrink-0 items-center justify-end gap-1 rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium">{autoWeight !== null ? autoWeight.toFixed(1) : "—"}</span>
            <span className="text-muted">%</span>
          </div>
          <Button
            onClick={handleAddLink}
            disabled={!newSubcatId || autoWeight === null || addLink.isPending}
            title={autoWeight === null ? "Set an annual budget for this subcategory first" : undefined}
          >
            <Plus size={16} />
          </Button>
        </div>
        {newSubcatId && (
          <p className="mt-2 text-xs text-muted">
            {newSubcatRevised > 0
              ? `Annual budget: ${money(newSubcatRevised)}  ·  Goal target: ${money(goal.target_amount)}  →  auto-weight: ${(autoWeight ?? 0).toFixed(1)}%`
              : "⚠ No annual budget set for this subcategory — set one in Budget Setup first."}
          </p>
        )}
      </div>
    </Modal>
  );
}

function ContributionsModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data: contribs = [] } = useGoalContributions(goal.id);
  const { addContribution, removeContribution } = useGoalMutations();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount) return;
    addContribution.mutate(
      { goalId: goal.id, amount: Number(amount), contrib_date: date, note: note || null },
      { onSuccess: () => { setAmount(""); setNote(""); } }
    );
  };

  return (
    <Modal open onClose={onClose} title={`${goal.name} — contributions`}>
      <form onSubmit={add} className="grid grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></Field>
        <div className="col-span-2"><Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field></div>
        <div className="col-span-2"><Button type="submit" className="w-full justify-center"><Plus size={16} /> Add contribution</Button></div>
      </form>

      <div className="mt-4 max-h-64 space-y-1 overflow-auto">
        {contribs.length === 0 && <p className="py-6 text-center text-sm text-muted">No contributions yet.</p>}
        {contribs.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <div>
              <div className="font-medium">{money(c.amount)}</div>
              <div className="text-xs text-muted">{c.contrib_date}{c.note ? ` · ${c.note}` : ""}</div>
            </div>
            <button className="text-muted hover:text-red-600" onClick={() => removeContribution.mutate({ goalId: goal.id, id: c.id })}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { remove } = useGoalMutations();
  const [showContribs, setShowContribs] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  const hasLinks = goal.links.length > 0;

  return (
    <Card
      title={<span className="flex items-center gap-2"><Target size={16} className="text-brand" />{goal.name}</span>}
      action={
        <div className="flex items-center gap-2">
          <OnTrackChip goal={goal} />
          <button className="text-muted hover:text-red-600" onClick={() => remove.mutate(goal.id)} title="Delete goal">
            <Trash2 size={15} />
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">{money(goal.saved)}</span>
          <span className="text-sm text-muted">of {money(goal.target_amount)}</span>
        </div>
        <ProgressBar value={goal.saved} max={goal.target_amount} color="var(--color-investments)" />
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Progress</dt><dd className="font-medium">{pct(goal.pct)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Remaining</dt><dd className="font-medium">{money(goal.remaining)}</dd></div>
          {goal.target_date && (
            <div className="flex justify-between"><dt className="text-muted">Target date</dt><dd className="font-medium">{goal.target_date}</dd></div>
          )}
          {goal.monthly_required !== null && (
            <div className="flex justify-between">
              <dt className="text-muted">Need / month</dt>
              <dd className="font-semibold text-brand">{money(goal.monthly_required)}</dd>
            </div>
          )}
        </dl>

        {hasLinks ? (
          <button
            className="flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-left hover:bg-surface-hover"
            onClick={() => setShowLinks(true)}
            title="Manage subcategory links"
          >
            {goal.links.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                <Link2 size={10} />{l.subcategory_name ?? "—"} {l.weight}%
              </span>
            ))}
            <span className="ml-auto text-xs text-muted">Auto-tracked</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 justify-center" onClick={() => setShowContribs(true)}>
              <PiggyBank size={16} /> Contributions
            </Button>
            <Button variant="outline" className="justify-center px-3" onClick={() => setShowLinks(true)} title="Link to subcategories">
              <Link2 size={16} />
            </Button>
          </div>
        )}
      </div>
      {showContribs && <ContributionsModal goal={goal} onClose={() => setShowContribs(false)} />}
      {showLinks && <ManageLinksModal goal={goal} onClose={() => setShowLinks(false)} />}
    </Card>
  );
}

function NewGoalModal({ onClose }: { onClose: () => void }) {
  const { create } = useGoalMutations();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name) return;
    create.mutate(
      { name, target_amount: Number(target) || 0, target_date: date || null },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal open onClose={onClose} title="New goal">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vacation fund" /></Field>
        <Field label="Target amount"><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" /></Field>
        <Field label="Target date (optional)"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Button type="submit" className="w-full justify-center"><Plus size={16} /> Create goal</Button>
      </form>
    </Modal>
  );
}

export default function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goals & Sinking Funds</h1>
        <Button onClick={() => setAdding(true)}><Plus size={16} /> Add goal</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          hint="Create a sinking fund for a known future expense — a vacation, insurance premium, or a big purchase — and track monthly contributions toward it."
          action={<Button onClick={() => setAdding(true)}><Plus size={16} /> Add your first goal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}

      {adding && <NewGoalModal onClose={() => setAdding(false)} />}
    </div>
  );
}
