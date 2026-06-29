import { useState, type FormEvent } from "react";
import { Plus, Trash2, Target, PiggyBank, Link2, AlertTriangle } from "lucide-react";
import { useGoals, useGoalMutations, useGoalContributions, useCategories, useSubcategories, useSubcatUnspent } from "../api/hooks";
import { money, moneyCompact, pct } from "../lib/format";
import {
  Card, Button, Modal, Field, Input, Select, ProgressBar, EmptyState,
} from "../components/ui";
import type { Goal } from "../types/api";

const today = () => new Date().toISOString().slice(0, 10);

function OnTrackChip({ goal }: { goal: Goal }) {
  if (goal.saved >= goal.target_amount && goal.target_amount > 0) {
    return <span className="pill pill-pos">Funded</span>;
  }
  if (goal.on_track === null) {
    return <span className="pill pill-muted">No date</span>;
  }
  return goal.on_track ? (
    <span className="pill pill-pos">On track</span>
  ) : (
    <span className="pill pill-warn">Behind</span>
  );
}

function ManageLinksModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useSubcategories();
  const { addLink, removeLink } = useGoalMutations();

  const [newSubcatId, setNewSubcatId] = useState<number | null>(null);
  const { data: subcatPool } = useSubcatUnspent(newSubcatId);

  const linkedSubcatIds = new Set(goal.links.map((l) => l.subcategory_id));
  const availableSubs = subcategories.filter((s) => !linkedSubcatIds.has(s.id));

  // Compare at whole-rupee precision — the same precision money() displays — so a
  // sub-rupee gap (e.g. ₹21,256.98 vs ₹21,257) that the UI rounds to equal numbers
  // doesn't silently block the link.
  const canAdd = !!newSubcatId && !!subcatPool && Math.round(subcatPool.available) >= Math.round(goal.target_amount);
  const insufficientPool = !!newSubcatId && !!subcatPool && Math.round(subcatPool.available) < Math.round(goal.target_amount);
  const handleAddLink = () => {
    if (!newSubcatId || !canAdd) return;
    addLink.mutate(
      { goalId: goal.id, subcategory_id: newSubcatId },
      { onSuccess: () => setNewSubcatId(null) }
    );
  };

  return (
    <Modal open onClose={onClose} title={`Linked subcategories — ${goal.name}`}>
      <p className="mb-3 text-sm text-muted">
        Each linked subcategory contributes its unspent budget toward this goal (up to the goal target),
        after higher-priority links are served. When no links exist the goal uses manual contributions instead.
      </p>

      {goal.links.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No links yet — add one below.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {goal.links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{link.subcategory_name ?? "—"}</p>
              </div>
              <span className="rounded-md bg-surface2 px-2 py-0.5 text-sm text-muted">
                {link.auto_weight.toFixed(1)}%
              </span>
              <button
                className="text-muted hover:text-neg"
                onClick={() => removeLink.mutate({ goalId: goal.id, linkId: link.id })}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
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
          <Button
            onClick={handleAddLink}
            disabled={!canAdd || addLink.isPending}
            title={insufficientPool ? "Insufficient unspent budget — revise the subcategory budget first" : undefined}
          >
            <Plus size={16} />
          </Button>
        </div>
        {newSubcatId && subcatPool && (
          <div className="mt-2 text-xs">
            {insufficientPool ? (
              <div className="flex items-center gap-1.5 rounded bg-surface2 px-2 py-1.5 text-warn">
                <AlertTriangle size={12} className="shrink-0" />
                Only {money(subcatPool.available)} available (unspent {money(subcatPool.unspent)} − claimed by other goals {money(subcatPool.claimed)}).
                Increase the subcategory budget by at least {money(goal.target_amount - subcatPool.available)} to link.
              </div>
            ) : (
              <p className="text-muted">
                Unspent: {money(subcatPool.unspent)} · Claimed by other goals: {money(subcatPool.claimed)} · Available: {money(subcatPool.available)}
              </p>
            )}
          </div>
        )}
        {newSubcatId && !subcatPool && (
          <p className="mt-2 text-xs text-muted">Loading budget data…</p>
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
            <button className="text-muted hover:text-neg" onClick={() => removeContribution.mutate({ goalId: goal.id, id: c.id })}>
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
          <button className="text-muted hover:text-neg" onClick={() => remove.mutate(goal.id)} title="Delete goal">
            <Trash2 size={15} />
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">{moneyCompact(goal.saved)}</span>
          <span className="text-sm text-muted">of {moneyCompact(goal.target_amount)}</span>
        </div>
        <ProgressBar value={goal.saved} max={goal.target_amount} color="var(--color-investments)" />
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Progress</dt><dd className="font-medium">{pct(goal.pct)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Remaining</dt><dd className="font-medium">{moneyCompact(goal.remaining)}</dd></div>
          {goal.target_date && (
            <div className="flex justify-between"><dt className="text-muted">Target date</dt><dd className="font-medium">{goal.target_date}</dd></div>
          )}
          {goal.monthly_required !== null && (
            <div className="flex justify-between">
              <dt className="text-muted">Need / month</dt>
              <dd className="font-semibold text-brand">{moneyCompact(goal.monthly_required)}</dd>
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
                <Link2 size={10} />{l.subcategory_name ?? "—"} {l.auto_weight.toFixed(1)}%
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
        <h1 className="hidden text-[26px] font-extrabold tracking-tight lg:block">Goals & Sinking Funds</h1>
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
