import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button, Input } from "./ui";
import type { CategoryKind, FixedBill, LifestyleProfile, OnboardingSection } from "../types/api";

export interface PresetSection {
  name: string;
  kind: CategoryKind;
  blurb: string;
  accent: string;
  options: string[];
}

export type OverrideMode = "replace" | "forward";

export interface WizardInitial {
  selected: Record<string, string[]>;
  employment: "salaried" | "business";
  income: string;
  bills: FixedBill[];
  profile: LifestyleProfile;
}

export interface WizardPayload {
  sections: OnboardingSection[];
  employment_type: "salaried" | "business";
  monthly_income?: number;
  fixed_bills: FixedBill[];
  profile: LifestyleProfile;
  override_mode?: OverrideMode;
}

// The 4 sections + ~10 common sub-items each. Used directly for first-run onboarding and
// as the option suggestions when regenerating an existing user's budget.
export const PRESETS: PresetSection[] = [
  {
    name: "Bills",
    kind: "spending",
    blurb: "Recurring fixed payments that come every month.",
    accent: "var(--color-bills)",
    options: ["Rent", "Electricity", "Wifi/Mobile", "OTT/Subscriptions", "Term Insurance", "Vehicle Insurance", "Gym/Health", "Loan/EMI", "Maintenance", "Water/Gas"],
  },
  {
    name: "Needs",
    kind: "spending",
    blurb: "Essentials you can't really skip.",
    accent: "var(--color-needs)",
    options: ["Grocery", "Fuel/Transport", "Medicine", "Personal Care", "Clothing", "Household", "Education", "Childcare", "Pet Care", "Phone Recharge"],
  },
  {
    name: "Wants",
    kind: "spending",
    blurb: "Lifestyle and fun — nice to have.",
    accent: "var(--color-wants)",
    options: ["Dining Out", "Food Delivery", "Trips/Travel", "Shopping", "Gifts", "Entertainment", "Hobbies", "Gadgets", "Outings", "Misc"],
  },
  {
    name: "Investments",
    kind: "investment",
    blurb: "Money you keep and grow (never counted as 'spent').",
    accent: "var(--color-investments)",
    options: ["SIP/Mutual Funds", "Stocks", "PPF/EPF", "Recurring Deposit", "Gold", "Emergency Fund", "Crypto", "NPS", "Insurance-linked", "Goal Savings"],
  },
];

export const FIXED_BILL_SUGGESTIONS = ["Rent", "Home EMI", "Car EMI", "Personal Loan", "Maintenance", "Insurance Premium"];

const CURATING_LINES = [
  "Consulting our inner finance expert…",
  "Balancing your needs and your wants…",
  "Setting something aside for future-you…",
  "Doing the math so you don't have to…",
  "Making every rupee count…",
  "Almost there — tidying up the numbers…",
];

export function emptySelected(sections: PresetSection[]): Record<string, string[]> {
  return Object.fromEntries(sections.map((p) => [p.name, [] as string[]]));
}

type Step =
  | { kind: "welcome" }
  | { kind: "income" }
  | { kind: "bills" }
  | { kind: "life" }
  | { kind: "section"; idx: number };

// Chip options for the optional "About your life" step. Everything is skippable;
// an unset field simply isn't sent (server treats it as "prefer not to say").
const CITY_TIERS = [["metro", "Metro"], ["tier2", "Tier-2 city"], ["tier3", "Smaller city/town"]] as const;
const EMERGENCY_FUNDS = [["none", "None yet"], ["building", "Building it"], ["three_to_six", "3–6 months"], ["six_plus", "6+ months"]] as const;
const OTHER_LOANS = [["none", "None"], ["small", "Small"], ["significant", "Significant"]] as const;
const SAVINGS_LEVELS = [["just_starting", "Just starting"], ["some_cushion", "Some cushion"], ["comfortable", "Comfortable"]] as const;

interface BudgetWizardProps {
  sections: PresetSection[];
  initial: WizardInitial;
  onFinish: (payload: WizardPayload) => void;
  isPending: boolean;
  isError: boolean;
  submitLabel: string;
  welcome?: ReactNode; // shown as step 0 when provided (onboarding); omitted for regen
  showOverride?: boolean; // show the replace/forward toggle on the last step (regen)
  onClose?: () => void; // when set, render a close (X) button — used by the regen overlay
}

export default function BudgetWizard({
  sections, initial, onFinish, isPending, isError, submitLabel, welcome, showOverride, onClose,
}: BudgetWizardProps) {
  const steps: Step[] = [
    ...(welcome ? [{ kind: "welcome" } as Step] : []),
    { kind: "income" },
    { kind: "bills" },
    { kind: "life" },
    ...sections.map((_, idx): Step => ({ kind: "section", idx })),
  ];

  const [stepIdx, setStepIdx] = useState(0);
  const [employment, setEmployment] = useState(initial.employment);
  const [income, setIncome] = useState(initial.income);
  const [bills, setBills] = useState<FixedBill[]>(initial.bills);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>(initial.selected);
  const [custom, setCustom] = useState("");
  const [profile, setProfile] = useState<LifestyleProfile>(initial.profile);
  const [overrideMode, setOverrideMode] = useState<OverrideMode>("forward");

  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % CURATING_LINES.length), 2200);
    return () => clearInterval(id);
  }, [isPending]);

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const section = step?.kind === "section" ? sections[step.idx] : undefined;

  const toggle = (name: string, item: string) =>
    setSelected((s) => {
      const cur = s[name];
      return { ...s, [name]: cur.includes(item) ? cur.filter((i) => i !== item) : [...cur, item] };
    });

  const addCustom = () => {
    const v = custom.trim();
    if (!v || !section) return;
    setSelected((s) => (s[section.name].includes(v) ? s : { ...s, [section.name]: [...s[section.name], v] }));
    setCustom("");
  };

  const addBill = () => {
    const name = billName.trim();
    const amount = parseFloat(billAmount);
    if (!name || !(amount > 0) || bills.some((b) => b.name.toLowerCase() === name.toLowerCase())) return;
    setBills((b) => [...b, { name, amount }]);
    setBillName("");
    setBillAmount("");
  };
  const removeBill = (name: string) => setBills((b) => b.filter((x) => x.name !== name));

  const next = () => { setCustom(""); setStepIdx((s) => s + 1); };
  const back = () => { setCustom(""); setStepIdx((s) => s - 1); };

  // Toggle-style setter for chip fields: tapping the active chip deselects it.
  const toggleProfileField = <K extends keyof LifestyleProfile>(key: K, value: LifestyleProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: p[key] === value ? undefined : value }));

  const finish = () => {
    const billNames = new Set(bills.map((b) => b.name.toLowerCase()));
    const outSections: OnboardingSection[] = sections.map((p) => ({
      name: p.name,
      kind: p.kind,
      items: (selected[p.name] ?? []).filter((i) => !billNames.has(i.toLowerCase())),
    }));
    const monthly_income = parseFloat(income);
    // Drop unset/blank profile fields — omitted means "prefer not to say".
    const cleanProfile = Object.fromEntries(
      Object.entries(profile).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ) as LifestyleProfile;
    onFinish({
      sections: outSections,
      employment_type: employment,
      monthly_income: monthly_income > 0 ? monthly_income : undefined,
      fixed_bills: bills,
      profile: cleanProfile,
      ...(showOverride ? { override_mode: overrideMode } : {}),
    });
  };

  const totalPicked = Object.values(selected).reduce((n, arr) => n + arr.length, 0);

  if (isPending) {
    return (
      <div className="grid h-full w-full place-items-center p-6">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-brand text-white">
              <Loader2 size={26} className="animate-spin" />
            </span>
          </div>
          <h1 className="mt-6 text-xl font-semibold">Curating your budget</h1>
          <p className="mx-auto mt-2 h-5 max-w-xs text-sm text-muted">{CURATING_LINES[lineIdx]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex flex-1 items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === stepIdx ? "w-6 bg-brand" : i < stepIdx ? "w-1.5 bg-brand" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted hover:text-ink" title="Close"><X size={18} /></button>
        )}
      </div>

      {step?.kind === "welcome" ? (
        <div className="text-center">{welcome}<Button className="mt-6 w-full justify-center sm:w-auto" onClick={next}>Get started <ArrowRight size={16} /></Button></div>
      ) : step?.kind === "income" ? (
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Your income</h2>
          </div>
          <p className="mt-1 text-sm text-muted">This helps us size your budget. It's encrypted like everything else.</p>
          <div className="mt-4">
            <span className="mb-1 block text-xs font-medium text-muted">How do you earn?</span>
            <div className="flex gap-2">
              {(["salaried", "business"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setEmployment(opt)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                    employment === opt ? "border-brand bg-indigo-50 text-brand" : "border-line text-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {employment === opt && <Check size={14} className="mr-1 inline" />}{opt}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <span className="mb-1 block text-xs font-medium text-muted">Monthly income</span>
            <Input type="number" inputMode="decimal" min={0} placeholder="e.g. 80000" value={income} onChange={(e) => setIncome(e.target.value)} />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={stepIdx === 0}><ArrowLeft size={16} /> Back</Button>
            <Button onClick={next} disabled={!(parseFloat(income) > 0)}>Next <ArrowRight size={16} /></Button>
          </div>
        </div>
      ) : step?.kind === "bills" ? (
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: "var(--color-bills)" }} />
            <h2 className="text-lg font-semibold">Fixed monthly bills</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Add commitments with a fixed amount each month — rent, EMIs, etc. We'll assign these
            exactly; the rest gets allocated for you. (Optional.)
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {FIXED_BILL_SUGGESTIONS.filter((s) => !bills.some((b) => b.name === s)).map((s) => (
              <button key={s} onClick={() => setBillName(s)} className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink">{s}</button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input placeholder="Bill name" value={billName} onChange={(e) => setBillName(e.target.value)} />
            <Input type="number" inputMode="decimal" min={0} placeholder="Amount" className="max-w-[8rem]" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addBill(); }} />
            <Button variant="outline" onClick={addBill} className="shrink-0"><Plus size={16} /> Add</Button>
          </div>
          {bills.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
              {bills.map((b) => (
                <li key={b.name} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{b.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted">{b.amount.toLocaleString()}</span>
                    <button onClick={() => removeBill(b.name)} className="text-muted hover:text-red-600"><Trash2 size={14} /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={back}><ArrowLeft size={16} /> Back</Button>
            <Button onClick={next}>Next <ArrowRight size={16} /></Button>
          </div>
        </div>
      ) : step?.kind === "life" ? (
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand" />
            <h2 className="text-lg font-semibold">About your life</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Optional — helps the AI fit the budget to your situation. Skip anything you'd rather not say.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-xs font-medium text-muted">Household size</span>
              <Input
                type="number" inputMode="numeric" min={1} max={20} placeholder="e.g. 4"
                value={profile.family_size ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, family_size: e.target.value ? Math.max(1, parseInt(e.target.value)) : undefined }))}
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-muted">Dependents</span>
              <Input
                type="number" inputMode="numeric" min={0} max={20} placeholder="e.g. 2"
                value={profile.dependents ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, dependents: e.target.value ? Math.max(0, parseInt(e.target.value)) : undefined }))}
              />
            </div>
          </div>

          {([
            ["Earners in the household", "earners", [["single", "Single income"], ["dual", "Dual income"]] as const],
            ["Where you live", "city_tier", CITY_TIERS],
            ["Emergency fund", "emergency_fund", EMERGENCY_FUNDS],
            ["Other loans (beyond your EMIs)", "other_loans", OTHER_LOANS],
            ["Overall savings", "savings_level", SAVINGS_LEVELS],
          ] as const).map(([label, key, options]) => (
            <div key={key} className="mt-4">
              <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
              <div className="flex flex-wrap gap-2">
                {options.map(([val, text]) => {
                  const on = profile[key] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => toggleProfileField(key, val)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        on ? "border-brand bg-indigo-50 text-brand" : "border-line text-muted hover:bg-canvas hover:text-ink"
                      }`}
                    >
                      {on && <Check size={14} />}{text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <span className="mb-1 block text-xs font-medium text-muted">Short-term goals (next 1–2 years)</span>
            <Input
              placeholder="e.g. Goa trip in Dec (~1.2L), new phone"
              maxLength={500}
              value={profile.short_term_goals ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, short_term_goals: e.target.value || undefined }))}
            />
          </div>
          <div className="mt-3">
            <span className="mb-1 block text-xs font-medium text-muted">Long-term goals</span>
            <Input
              placeholder="e.g. house down payment in ~5 years"
              maxLength={500}
              value={profile.long_term_goals ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, long_term_goals: e.target.value || undefined }))}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={back}><ArrowLeft size={16} /> Back</Button>
            <span className="flex items-center gap-2">
              <Button variant="ghost" onClick={next}>Skip</Button>
              <Button onClick={next}>Next <ArrowRight size={16} /></Button>
            </span>
          </div>
        </div>
      ) : section ? (
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: section.accent }} />
            <h2 className="text-lg font-semibold">{section.name}</h2>
          </div>
          <p className="mt-1 text-sm text-muted">{section.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(new Set([...section.options, ...(selected[section.name] ?? [])])).map((item) => {
              const on = (selected[section.name] ?? []).includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggle(section.name, item)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    on ? "border-brand bg-indigo-50 text-brand" : "border-line text-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {on && <Check size={14} />}{item}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <Input placeholder={`Add your own ${section.name.toLowerCase()} item…`} value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }} />
            <Button variant="outline" onClick={addCustom} className="shrink-0"><Plus size={16} /> Add</Button>
          </div>

          {isLast && showOverride && (
            <div className="mt-6 rounded-lg border border-line bg-canvas p-3">
              <span className="mb-2 block text-xs font-medium text-muted">How should we apply the new amounts?</span>
              <div className="flex gap-2">
                {([["forward", "Going forward"], ["replace", "Replace whole year"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setOverrideMode(val)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      overrideMode === val ? "border-brand bg-indigo-50 text-brand" : "border-line text-muted hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {overrideMode === val && <Check size={12} className="mr-1 inline" />}{label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                {overrideMode === "forward"
                  ? "Past months stay as they are; this month onward gets the new plan."
                  : "Overwrites planned amounts for every month (your recorded spending is untouched)."}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={back}><ArrowLeft size={16} /> Back</Button>
            {!isLast ? (
              <Button onClick={next}>Next <ArrowRight size={16} /></Button>
            ) : (
              <Button onClick={finish}>{submitLabel} ({totalPicked} picked) <Sparkles size={16} /></Button>
            )}
          </div>
          {isError && (
            <p className="mt-3 text-center text-xs text-red-600">Something went wrong. Please try again.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
