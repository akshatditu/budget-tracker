import { motion } from "framer-motion";
import {
  Receipt,
  Tags,
  CalendarRange,
  LayoutDashboard,
  Target,
  FileBarChart,
  Download,
  type LucideIcon,
} from "lucide-react";
import { BrowserFrame, AnalyticsMockup, PlannerMockup, GoalsMockup, ReportsMockup } from "./mockups";
import { SectionHeading, Reveal } from "./shared";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  bullets: string[];
  mockup: React.ReactNode;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: Receipt,
    title: "Expense Tracking",
    desc: "Every transaction lands in one clean ledger. Spent is always summed live from your entries — never a stale number you have to maintain by hand.",
    bullets: ["Unified transaction ledger", "Live Spent & Remaining", "Multi-account ready"],
    mockup: <AnalyticsMockup />,
    accent: "#0ea5e9",
  },
  {
    icon: Tags,
    title: "Smart Categories",
    desc: "BudgetIQ sorts spending into Bills, Needs, Wants, and Investments automatically, learning your patterns so the right bucket is always pre-filled.",
    bullets: ["AI auto-categorization", "Custom sub-items", "Investments kept separate"],
    mockup: <PlannerMockup />,
    accent: "#10b981",
  },
  {
    icon: CalendarRange,
    title: "Budget Planner",
    desc: "Set Initial and Revised budgets per month, watch Remaining update in real time, and let unspent money roll forward exactly the way your spreadsheet used to — minus the formulas.",
    bullets: ["Monthly & annual rollups", "Automatic carry-forward", "Initial vs Revised tracking"],
    mockup: <PlannerMockup />,
    accent: "#f59e0b",
  },
  {
    icon: Target,
    title: "Savings Goals",
    desc: "Name a goal, set a target, and BudgetIQ tells you exactly how much to set aside each month — then nudges you when you drift off pace.",
    bullets: ["Goal progress rings", "Pace recommendations", "Smart reminders"],
    mockup: <GoalsMockup />,
    accent: "#8b5cf6",
  },
  {
    icon: FileBarChart,
    title: "Reports & Export",
    desc: "Beautiful reports break down where every rupee went. Export to CSV or Excel anytime — your data is always yours to take.",
    bullets: ["Year-end summaries", "CSV & Excel export", "Shareable breakdowns"],
    mockup: <ReportsMockup />,
    accent: "#2563eb",
  },
];

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const reversed = index % 2 === 1;
  const Icon = feature.icon;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <motion.div
        initial={{ opacity: 0, x: reversed ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={reversed ? "lg:order-2" : ""}
      >
        <span
          className="inline-grid h-12 w-12 place-items-center rounded-2xl"
          style={{ background: `${feature.accent}1a`, color: feature.accent }}
        >
          <Icon size={24} />
        </span>
        <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {feature.title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {feature.desc}
        </p>
        <ul className="mt-5 space-y-2.5">
          {feature.bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: `${feature.accent}26`, color: feature.accent }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: reversed ? -40 : 40, scale: 0.96 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={reversed ? "lg:order-1" : ""}
      >
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-[2rem] opacity-30 blur-2xl"
            style={{ background: feature.accent }}
          />
          <BrowserFrame label={`${feature.title.toLowerCase().replace(/\s/g, "-")}.budgetiq.com`}>
            <div className="aspect-[5/3] bg-white dark:bg-slate-900">{feature.mockup}</div>
          </BrowserFrame>
        </div>
      </motion.div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title={<>Everything you need to <span className="text-brand">master your money</span></>}
          subtitle="A complete budgeting workspace that replaces a tangle of spreadsheets — tracking, planning, goals, and reporting, all in sync."
        />
        <div className="mt-20 space-y-24">
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Compact icon strip teasing the remaining capabilities. */
export function FeatureStrip() {
  const items: { icon: LucideIcon; label: string }[] = [
    { icon: LayoutDashboard, label: "Financial Dashboard" },
    { icon: Receipt, label: "Expense Tracking" },
    { icon: Tags, label: "Smart Categories" },
    { icon: CalendarRange, label: "Budget Planner" },
    { icon: Target, label: "Savings Goals" },
    { icon: FileBarChart, label: "Reports" },
    { icon: Download, label: "Export Data" },
  ];
  return (
    <Reveal className="mx-auto mt-20 flex max-w-5xl flex-wrap justify-center gap-3">
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          <Icon size={15} className="text-brand" />
          {label}
        </span>
      ))}
    </Reveal>
  );
}
