import { useState, type FormEvent } from "react";
import { Plus, Trash2, Target, PiggyBank } from "lucide-react";
import { useGoals, useGoalMutations, useGoalContributions } from "../api/hooks";
import { money, pct } from "../lib/format";
import {
  Card, Button, Modal, Field, Input, ProgressBar, EmptyState,
} from "../components/ui";
import type { Goal } from "../types/api";

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
        <Button variant="outline" className="w-full justify-center" onClick={() => setShowContribs(true)}>
          <PiggyBank size={16} /> Contributions
        </Button>
      </div>
      {showContribs && <ContributionsModal goal={goal} onClose={() => setShowContribs(false)} />}
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
