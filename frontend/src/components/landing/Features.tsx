import type { ReactNode } from "react";
import {
  Wallet,
  BarChart3,
  PieChart,
  Check,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  AlignLeft,
  FileText,
  Download,
  Clock,
} from "lucide-react";
import { Reveal, SectionHeading } from "./shared";

const mono = { fontFamily: "'Space Mono', monospace" } as const;

/** Browser-chrome shell reused by the feature mockups. */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-white/15 dark:bg-[#12161f] dark:shadow-black/40 ${className}`}
    >
      {children}
    </div>
  );
}

function Bullets({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="grid gap-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <Check size={18} strokeWidth={2.5} style={{ color }} className="shrink-0" />
          {t}
        </li>
      ))}
    </ul>
  );
}

const TXNS = [
  { icon: CreditCard, tint: "#0ea5e9", title: "Electricity Bill", sub: "Bills · Auto-categorized", amt: "-₹2,400", pos: false },
  { icon: ShoppingBag, tint: "#f59e0b", title: "Coffee & Lunch", sub: "Wants · Dining", amt: "-₹560", pos: false },
  { icon: TrendingUp, tint: "#8b5cf6", title: "SIP — Index Fund", sub: "Investments · Recurring", amt: "+₹5,000", pos: true },
];

const PLAN = [
  { label: "Bills", pct: 82, color: "#0ea5e9", warn: false },
  { label: "Needs", pct: 55, color: "#10b981", warn: false },
  { label: "Wants", pct: 93, color: "#f59e0b", warn: true },
  { label: "Investments", pct: 40, color: "#8b5cf6", warn: false },
];

export default function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <SectionHeading
        eyebrow="Everything you need"
        title="Everything your money needs, in one place"
        subtitle="From the first transaction to the year-end report, BudgetIQ keeps your money organized, planned, and growing."
        className="mb-12 sm:mb-16"
      />

      {/* Row 1 — expense tracking */}
      <Reveal className="mb-12 grid items-center gap-8 sm:mb-20 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Wallet size={22} />
          </div>
          <h3 className="font-display mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Effortless expense tracking
          </h3>
          <p className="mb-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Log spending in seconds or connect your accounts. Every transaction lands in the
            right place automatically, so your balance is always real-time.
          </p>
          <Bullets
            color="#10b981"
            items={[
              "Auto-sync across all devices",
              "Receipts, recurring & split bills",
              "Multi-currency ready",
            ]}
          />
        </div>
        <Card>
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            {TXNS.map((t) => (
              <div key={t.title} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-3 dark:bg-white/5">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: `${t.tint}28`, color: t.tint }}
                >
                  <t.icon size={16} />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</div>
                  <div className="text-[11.5px] text-slate-400">{t.sub}</div>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ ...mono, color: t.pos ? "#10b981" : "#e0524b" }}
                >
                  {t.amt}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* Row 2 — budget planner (reversed) */}
      <Reveal className="mb-12 grid items-center gap-8 sm:mb-20 lg:grid-cols-2 lg:gap-14">
        <Card className="p-5 lg:order-1">
          <div className="grid gap-4">
            {PLAN.map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="font-semibold text-slate-900 dark:text-white">{p.label}</span>
                  <span
                    style={{ ...mono, color: p.warn ? "#df8c2f" : undefined }}
                    className={p.warn ? "" : "text-slate-500 dark:text-slate-400"}
                  >
                    {p.pct}%
                  </span>
                </div>
                <div className="h-2.5 rounded-md bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-md" style={{ width: `${p.pct}%`, background: p.color }} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
              <AlertTriangle size={17} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-[13px] text-slate-900 dark:text-white">
                Wants is nearing its limit — ₹1,200 left
              </span>
            </div>
          </div>
        </Card>
        <div className="lg:order-2">
          <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <BarChart3 size={22} />
          </div>
          <h3 className="font-display mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Budget planner that holds
          </h3>
          <p className="mb-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Set limits per category and watch them in real time. BudgetIQ nudges you before you
            overspend and rolls leftover funds forward to next month.
          </p>
          <Bullets
            color="#0ea5e9"
            items={[
              "Smart categories with auto-tagging",
              "Carry-forward & rollover budgets",
              "Overspend alerts before it happens",
            ]}
          />
        </div>
      </Reveal>

      {/* Row 3 — dashboard */}
      <Reveal className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <PieChart size={22} />
          </div>
          <h3 className="font-display mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            A dashboard that tells the story
          </h3>
          <p className="mb-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Trends, cash flow, net worth, and savings goals — every number you care about in
            one beautiful, glanceable view that updates the moment money moves.
          </p>
          <Bullets
            color="#8b5cf6"
            items={[
              "Savings-goal progress rings",
              "Reports & one-click CSV / PDF export",
              "Annual roll-up & net-worth tracking",
            ]}
          />
        </div>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-900 dark:text-white">Cash flow</div>
            <div className="flex gap-2.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />In</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Out</span>
            </div>
          </div>
          <svg viewBox="0 0 360 170" className="h-auto w-full">
            <defs>
              <linearGradient id="cf-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f9d8f" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#0f9d8f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="140" x2="360" y2="140" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />
            <line x1="0" y1="95" x2="360" y2="95" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />
            <line x1="0" y1="50" x2="360" y2="50" className="stroke-slate-200 dark:stroke-white/10" strokeWidth="1" />
            <path d="M5 120 L55 95 L105 105 L155 65 L205 80 L255 42 L305 56 L355 30 L355 140 L5 140 Z" fill="url(#cf-area)" />
            <polyline points="5,120 55,95 105,105 155,65 205,80 255,42 305,56 355,30" fill="none" stroke="#0f9d8f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="5,128 55,118 105,124 155,110 205,118 255,100 305,112 355,96" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="4 5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <circle cx="255" cy="42" r="5" className="fill-white dark:fill-[#12161f]" stroke="#0f9d8f" strokeWidth="3" />
            <circle cx="355" cy="30" r="5" className="fill-white dark:fill-[#12161f]" stroke="#0f9d8f" strokeWidth="3" />
          </svg>
          <div className="mt-3.5 flex gap-3">
            <div className="flex-1 rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-[11px] font-semibold text-slate-400">Net this month</div>
              <div className="font-display text-lg font-extrabold text-emerald-600 dark:text-emerald-400">+₹26,400</div>
            </div>
            <div className="flex-1 rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-[11px] font-semibold text-slate-400">Net worth</div>
              <div className="font-display text-lg font-extrabold text-slate-900 dark:text-white">₹8,40,000</div>
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}

const STRIP = [
  { icon: AlignLeft, title: "Smart Categories", body: "AI tags every transaction and learns your habits over time." },
  { icon: FileText, title: "Reports", body: "Monthly, category, and annual roll-ups generated automatically." },
  { icon: Download, title: "Export Data", body: "Download clean CSV or PDF anytime — your data is always yours." },
  { icon: Clock, title: "Savings Goals", body: "Set targets and let AI route spare cash to reach them faster." },
];

export function FeatureStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STRIP.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#12161f] dark:shadow-black/30"
          >
            <div className="mb-3.5 grid h-10 w-10 place-items-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              <s.icon size={20} />
            </div>
            <div className="font-display mb-1.5 text-lg font-bold text-slate-900 dark:text-white">
              {s.title}
            </div>
            <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.body}</div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
