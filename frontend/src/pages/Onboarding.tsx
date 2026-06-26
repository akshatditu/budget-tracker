import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useCompleteOnboarding } from "../api/hooks";
import { Button, Input } from "../components/ui";
import type { CategoryKind, OnboardingSection } from "../types/api";

interface PresetSection {
  name: string;
  kind: CategoryKind;
  blurb: string;
  accent: string;
  options: string[];
}

// The 4 sections + ~10 common sub-items each. Users toggle what applies and can
// add their own; this becomes their starting category structure.
const PRESETS: PresetSection[] = [
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

const TOTAL_STEPS = PRESETS.length; // section steps (welcome is step 0)

export default function Onboarding() {
  const { data: user } = useAuth();
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(0); // 0 = welcome, 1..4 = sections
  const [selected, setSelected] = useState<Record<string, string[]>>(
    Object.fromEntries(PRESETS.map((p) => [p.name, [] as string[]]))
  );
  const [custom, setCustom] = useState("");

  const section = PRESETS[step - 1];

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

  const next = () => { setCustom(""); setStep((s) => s + 1); };
  const back = () => { setCustom(""); setStep((s) => s - 1); };

  const finish = () => {
    const sections: OnboardingSection[] = PRESETS.map((p) => ({
      name: p.name,
      kind: p.kind,
      items: selected[p.name],
    }));
    complete.mutate({ sections });
  };

  const totalPicked = Object.values(selected).reduce((n, arr) => n + arr.length, 0);

  return (
    // Own scroll container: vertically centered when it fits, scrollable when the
    // card is taller than the viewport (small/short phones, lots of chips).
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
        {/* progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand" : i < step ? "w-1.5 bg-brand" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-white">
              <Sparkles size={22} />
            </div>
            <h1 className="mt-4 text-xl font-semibold">
              Welcome{user?.display_name ? `, ${user.display_name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Let's set up your budget in 4 quick steps. Pick the things you spend on in each
              section — you can always change these later. Your amounts are encrypted, so only you
              can read them.
            </p>
            <Button className="mt-6 w-full justify-center sm:w-auto" onClick={next}>
              Get started <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: section.accent }} />
              <h2 className="text-lg font-semibold">{section.name}</h2>
              <span className="ml-auto text-xs text-muted">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{section.blurb}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(new Set([...section.options, ...selected[section.name]])).map((item) => {
                const on = selected[section.name].includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggle(section.name, item)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      on ? "border-brand bg-indigo-50 text-brand" : "border-line text-muted hover:bg-canvas hover:text-ink"
                    }`}
                  >
                    {on && <Check size={14} />}
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                placeholder={`Add your own ${section.name.toLowerCase()} item…`}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
              />
              <Button variant="outline" onClick={addCustom} className="shrink-0"><Plus size={16} /> Add</Button>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft size={16} /> Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={next}>Next <ArrowRight size={16} /></Button>
              ) : (
                <Button onClick={finish} disabled={complete.isPending}>
                  {complete.isPending ? "Setting up…" : `Finish (${totalPicked} picked)`}
                </Button>
              )}
            </div>
            {complete.isError && (
              <p className="mt-3 text-center text-xs text-red-600">
                Something went wrong saving your setup. Please try again.
              </p>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
