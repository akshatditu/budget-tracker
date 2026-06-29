import type { ReactNode } from "react";
import {
  BookOpen, Wallet, ShoppingCart, Sparkles, TrendingUp, SlidersHorizontal,
  Receipt, CalendarDays, Target, Scale, ArrowRight, Gauge,
  PiggyBank, Lightbulb, CheckCircle2,
} from "lucide-react";
import { money, sectionColor } from "../lib/format";

/* ------------------------------------------------------------------ *
 * Small building blocks
 * ------------------------------------------------------------------ */

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div>
        {kicker && <div className="text-xs font-semibold uppercase tracking-wide text-brand">{kicker}</div>}
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** A faux "screenshot" frame so examples read like a peek at the real screen. */
function Snapshot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 text-xs font-medium text-muted">{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </figure>
  );
}

function Term({ word, children }: { word: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <dt className="text-sm font-semibold text-ink">{word}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-muted">{children}</dd>
    </div>
  );
}

/** Highlights a number inside prose without changing meaning. */
function N({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}

/* ------------------------------------------------------------------ *
 * Reusable example snapshots
 * ------------------------------------------------------------------ */

function BucketCard({ name, icon: Icon, examples }: { name: string; icon: typeof Wallet; examples: string }) {
  const color = sectionColor(name);
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="rounded-lg p-1.5" style={{ background: `${color}1a`, color }}><Icon size={16} /></span>
        <span className="font-semibold text-ink">{name}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{examples}</p>
    </div>
  );
}

function MonthRowSnapshot() {
  const rows = [
    { name: "Rent", initial: 18000, revised: 18000, spent: 18000 },
    { name: "Grocery", initial: 8000, revised: 9000, spent: 6500 },
    { name: "Swiggy/Zomato", initial: 3000, revised: 3000, spent: 4200 },
  ];
  return (
    <Snapshot label="Month view — a few rows">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 text-right font-medium">Initial</th>
            <th className="pb-2 text-right font-medium">Revised</th>
            <th className="pb-2 text-right font-medium">Spent</th>
            <th className="pb-2 text-right font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const rem = r.revised - r.spent;
            return (
              <tr key={r.name} className="border-t border-line">
                <td className="py-1.5 font-medium">{r.name}</td>
                <td className="py-1.5 text-right text-muted">{money(r.initial)}</td>
                <td className="py-1.5 text-right">{money(r.revised)}</td>
                <td className="py-1.5 text-right">{money(r.spent)}</td>
                <td className={`py-1.5 text-right font-medium ${rem < 0 ? "text-neg" : "text-pos"}`}>{money(rem)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">
        Grocery has <span className="text-pos">{money(2500)} left</span>; Swiggy is
        <span className="text-neg"> {money(-1200)} over</span> — you spent more than you planned.
      </p>
    </Snapshot>
  );
}

function CarrySnapshot() {
  const rows: [string, number, string][] = [
    ["From last month", 12000, "text-ink"],
    ["+ Income", 60000, "text-pos"],
    ["− Spent", 38000, "text-neg"],
    ["Invested (kept)", 10000, "text-muted"],
  ];
  return (
    <Snapshot label="Month view — carry forward (your real cash)">
      <dl className="space-y-2 text-sm">
        {rows.map(([label, val, cls]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-muted">{label}</dt>
            <dd className={`font-medium ${cls}`}>{money(val)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2">
          <dt className="text-muted">Net carry forward (in bank)</dt>
          <dd className="font-semibold text-pos">{money(34000)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Started with {money(12000)}, earned {money(60000)}, spent {money(38000)} → you carry
        <N> {money(34000)}</N> into next month. (Investing the {money(10000)} doesn't make you
        poorer, so it isn't subtracted.)
      </p>
    </Snapshot>
  );
}

function GoalSnapshot() {
  const saved = 9000, target = 24000;
  return (
    <Snapshot label="Goals — a sinking fund">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-brand" />
        <span className="font-semibold">Goa trip</span>
        <span className="ml-auto pill pill-warn">Behind</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-semibold">{money(saved)}</span>
        <span className="text-sm text-muted">of {money(target)}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full" style={{ width: "37%", background: "var(--color-investments)" }} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Target date</dt><dd className="font-medium">2026-12-01</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Need / month</dt><dd className="font-semibold text-brand">{money(2500)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        {money(15000)} to go over 6 months ⇒ save <N>{money(2500)}</N> each month and you'll get there.
      </p>
    </Snapshot>
  );
}

function ReconcileSnapshot() {
  return (
    <Snapshot label="Reconcile — does the app match your bank?">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 text-right font-medium">Your bank</th>
            <th className="pb-2 text-right font-medium">App says</th>
            <th className="pb-2 text-right font-medium">Drift</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line">
            <td className="py-2 font-medium">2026-06-30</td>
            <td className="py-2 text-right">{money(34000)}</td>
            <td className="py-2 text-right text-muted">{money(35000)}</td>
            <td className="py-2 text-right font-semibold text-neg">−{money(1000)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">
        Your bank is <N>{money(1000)} lower</N> than the app expected — usually a forgotten
        expense. Add the missing transaction and the drift disappears.
      </p>
    </Snapshot>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const TOC: [string, string][] = [
  ["idea", "The big idea"],
  ["buckets", "The 4 buckets"],
  ["flow", "What you do, step by step"],
  ["glossary", "Every word, in plain English"],
  ["example", "A month, start to finish"],
  ["goals", "Goals (sinking funds)"],
  ["reconcile", "Reconciling with your bank"],
  ["tips", "Quick tips"],
];

const STEPS = [
  { icon: SlidersHorizontal, page: "Budget Setup", title: "Plan the year", body: "For each item, type the whole year's budget. The app splits it evenly across 12 months as your starting plan." },
  { icon: Receipt, page: "Transactions", title: "Log what you spend", body: "Every purchase goes in once. The app adds them up for you — you never type a 'spent' total yourself." },
  { icon: Wallet, page: "Income", title: "Record money coming in", body: "Salary, freelance, a gift — log it so the app knows how much cash you actually have." },
  { icon: CalendarDays, page: "Month", title: "Watch & adjust", body: "See spent vs planned per item. If a plan was wrong, edit 'Revised' for that month. Check 'Safe to spend / day'." },
  { icon: Target, page: "Goals", title: "Save toward goals", body: "Set a target and date (a trip, insurance, a gadget). The app tells you how much to set aside each month." },
  { icon: Scale, page: "Reconcile", title: "Check against reality", body: "Now and then, enter your real bank balance. If it drifts from the app, you missed logging something." },
];

export default function Guide() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* Hero */}
      <header className="rounded-2xl border border-line bg-gradient-to-br from-accentsoft to-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand">
          <BookOpen size={20} />
          <span className="text-xs font-semibold uppercase tracking-wide">Guide</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">How this budget tracker works</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          No spreadsheets, no jargon. You plan how much to spend, log what you actually spend,
          and the app does all the math — telling you what's left, whether you're on track, and
          how much you can safely spend today. Here's the whole thing in plain English.
        </p>
      </header>

      {/* TOC */}
      <nav className="flex flex-wrap gap-2">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted transition hover:border-brand hover:text-brand">
            {label}
          </a>
        ))}
      </nav>

      {/* The big idea */}
      <Section id="idea" kicker="Start here" title="The big idea">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-ink">
            Your money is split into <strong>buckets</strong> → each bucket has <strong>items</strong> →
            each item gets a small monthly budget. You log spending against items, and the app rolls
            everything up into clear answers.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-canvas px-3 py-1.5 font-medium">Bucket (e.g. Needs)</span>
            <ArrowRight size={16} className="text-muted" />
            <span className="rounded-lg bg-canvas px-3 py-1.5 font-medium">Item (e.g. Grocery)</span>
            <ArrowRight size={16} className="text-muted" />
            <span className="rounded-lg bg-canvas px-3 py-1.5 font-medium">This month: plan {money(8000)}, spent {money(6500)}</span>
            <ArrowRight size={16} className="text-muted" />
            <span className="rounded-lg bg-surface2 px-3 py-1.5 font-medium text-pos">{money(1500)} left</span>
          </div>
        </div>
      </Section>

      {/* Buckets */}
      <Section id="buckets" kicker="Step 0" title="The 4 buckets">
        <p className="text-sm text-muted">Every item lives in one of these. The first three are money you spend; the last is money you keep.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BucketCard name="Bills" icon={Receipt} examples="Fixed, predictable: rent, insurance, phone, subscriptions, gym." />
          <BucketCard name="Needs" icon={ShoppingCart} examples="Essentials that vary: groceries, fuel, medicines, pet food." />
          <BucketCard name="Wants" icon={Sparkles} examples="Nice-to-haves: eating out, trips, gifts, shopping." />
          <BucketCard name="Investments" icon={TrendingUp} examples="Money you keep & grow: SIPs, stocks, savings. Not counted as 'spending'." />
        </div>
        <div className="rounded-xl border border-line bg-canvas p-4 text-sm text-muted">
          <strong className="text-ink">Why Investments are special:</strong> putting {money(10000)} into a SIP
          doesn't make you poorer — it just moves money. So the app tracks it separately and never counts
          it as "spent".
        </div>
      </Section>

      {/* Flow */}
      <Section id="flow" kicker="The routine" title="What you do, step by step">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accentsoft text-sm font-semibold text-accent2">{i + 1}</div>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <s.icon size={15} className="text-brand" />{s.title}
                  <span className="ml-1 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">{s.page}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Glossary */}
      <Section id="glossary" kicker="Dictionary" title="Every word, in plain English">
        <h3 className="text-sm font-semibold text-muted">Words on the Month screen</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Term word="Initial">Your original plan for the month, set once at the start of the year. Example: {money(8000)} for groceries.</Term>
          <Term word="Revised">The number you actually work with. Same as Initial until you change it. Bumped groceries to {money(9000)} this month? That's Revised.</Term>
          <Term word="Spent">The total of everything you logged for that item. You never type this — the app adds your transactions.</Term>
          <Term word="Remaining">Revised − Spent. What's still left to spend this month. Goes red if you overspent.</Term>
          <Term word="Income">Money that came in this month — salary and anything else.</Term>
          <Term word="Safe to spend / day">Your leftover budget split over the days left in the month. {money(3000)} left with 10 days to go ⇒ {money(300)}/day.</Term>
        </dl>

        <h3 className="pt-2 text-sm font-semibold text-muted">Words on the Annual Rollup screen</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Term word="Set Aside">Money you budgeted in past months but didn't spend — it's still yours, sitting aside. Planned {money(8000)}, spent {money(6500)} ⇒ {money(1500)} set aside.</Term>
          <Term word="Overspent">The opposite: where you spent more than planned in past months. Surfaced clearly so it can't hide.</Term>
          <Term word="Available">Set Aside minus Overspent — your honest net cushion across the year.</Term>
          <Term word="Current">Spent so far + Set Aside. How much of the year's budget is already accounted for.</Term>
          <Term word="Projected year-end">If you keep spending at today's pace, where you'll land by December. An early warning.</Term>
        </dl>

        <h3 className="pt-2 text-sm font-semibold text-muted">Cash, goals & checking</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Term word="Carry forward / In bank">Your running cash: last month's leftover + income − spending. The closest thing to your real bank balance.</Term>
          <Term word="Rollover (envelope)">Turn it on for an item and its unspent money rolls into next month. Saved {money(1000)} on fuel in May? June's fuel budget grows by {money(1000)}.</Term>
          <Term word="Goal / Sinking fund">A savings target with a date. The app tells you how much to put aside each month to reach it.</Term>
          <Term word="Reconcile / Drift">You enter your real bank balance; the app shows the gap ('drift') versus what it computed. A drift means you missed logging something.</Term>
        </dl>
      </Section>

      {/* Worked example */}
      <Section id="example" kicker="See it in action" title="A month, start to finish">
        <ol className="space-y-3 text-sm text-muted">
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pos" /><span><strong className="text-ink">Plan:</strong> In Budget Setup you give Grocery {money(96000)} for the year ⇒ {money(8000)}/month.</span></li>
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pos" /><span><strong className="text-ink">Adjust:</strong> A wedding's coming, so on the Month screen you raise Grocery's <em>Revised</em> to {money(9000)} for this month.</span></li>
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pos" /><span><strong className="text-ink">Log:</strong> You add grocery bills as you shop. They total {money(6500)}.</span></li>
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pos" /><span><strong className="text-ink">Read:</strong> The app shows {money(2500)} remaining on Grocery, and an over-budget warning on Swiggy.</span></li>
        </ol>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MonthRowSnapshot />
          <CarrySnapshot />
        </div>
      </Section>

      {/* Goals */}
      <Section id="goals" kicker="Plan ahead" title="Goals (sinking funds)">
        <p className="text-sm leading-relaxed text-muted">
          Big one-off costs hurt when they land all at once. A goal spreads them out. Tell the app
          <em> what</em> you're saving for, <em>how much</em>, and <em>by when</em> — it works out the
          monthly amount and tells you if you're on track or behind. Add a contribution whenever you put
          money aside.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GoalSnapshot />
          <div className="space-y-3 self-center text-sm text-muted">
            <div className="flex items-center gap-2 font-medium text-ink"><PiggyBank size={16} className="text-brand" /> Good things to make goals for</div>
            <ul className="list-inside list-disc space-y-1">
              <li>A holiday or a big trip</li>
              <li>Yearly insurance premiums</li>
              <li>A new phone, laptop, or appliance</li>
              <li>Festival / wedding spending</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Reconcile */}
      <Section id="reconcile" kicker="Stay honest" title="Reconciling with your bank">
        <p className="text-sm leading-relaxed text-muted">
          The app only knows what you tell it. If you forget a transaction, its numbers slowly drift from
          your real bank. Reconciling catches that: enter your actual balance for a date, and the app shows
          the difference. {" "}
          <span className="inline-flex items-center gap-1 font-medium text-pos"><Gauge size={14} /> "Matched"</span> {" "}
          means you're spot on; a red drift means go find the missing entry.
        </p>
        <ReconcileSnapshot />
      </Section>

      {/* Tips */}
      <Section id="tips" kicker="Habits that help" title="Quick tips">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "Log spends the same day — it takes seconds and keeps everything accurate.",
            "Set 'Revised', not 'Initial', when a month is unusual. Initial is your baseline plan.",
            "Turn on Rollover for flexible items (fuel, groceries); leave it off for fixed bills like rent.",
            "Reconcile once a month against your bank to catch anything you missed.",
            "Use the Dashboard's projection as an early warning before you actually overspend.",
            "Investments aren't 'spending' — they're wealth you keep. Don't worry when they're left out of spend totals.",
          ].map((t) => (
            <div key={t} className="flex gap-2 rounded-xl border border-line bg-surface p-4 text-sm text-muted shadow-sm">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-warn" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
