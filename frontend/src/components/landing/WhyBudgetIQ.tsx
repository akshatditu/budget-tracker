import { Sparkles, Zap, ShieldCheck, Smile, type LucideIcon } from "lucide-react";
import { Reveal, SectionHeading } from "./shared";

const CARDS: { icon: LucideIcon; title: string; desc: string; iconClass: string }[] = [
  {
    icon: Sparkles,
    title: "AI Powered",
    desc: "Insights, predictions, and auto-budgets that get smarter the more you use them.",
    iconClass: "bg-gradient-to-br from-teal-600 to-violet-600 text-white",
  },
  {
    icon: Zap,
    title: "Fast",
    desc: "Instant sync and a snappy interface. Log an expense and move on in seconds.",
    iconClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "Secure",
    desc: "Bank-grade encryption, private by design. Your data is yours and exportable anytime.",
    iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Smile,
    title: "Easy to Use",
    desc: "A calm, friendly design anyone can master — no spreadsheets, no finance degree.",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
];

export default function WhyBudgetIQ() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeading eyebrow="Why BudgetIQ" title="Built to be loved, daily" className="mb-12 sm:mb-14" />

      <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:bg-[#12161f] dark:shadow-black/30"
          >
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${c.iconClass}`}>
              <c.icon size={24} />
            </div>
            <h3 className="font-display mb-2 text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.desc}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
