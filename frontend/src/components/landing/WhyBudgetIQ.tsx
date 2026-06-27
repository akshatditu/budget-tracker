import { motion } from "framer-motion";
import { Brain, Zap, ShieldCheck, Smile, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./shared";

const CARDS: { icon: LucideIcon; title: string; desc: string; from: string; to: string }[] = [
  {
    icon: Brain,
    title: "AI Powered",
    desc: "Insights, predictions, and auto-categorization that get sharper the more you use them.",
    from: "from-violet-500",
    to: "to-purple-600",
  },
  {
    icon: Zap,
    title: "Fast",
    desc: "Snappy, real-time numbers. No spreadsheets to recalc, no waiting on sync.",
    from: "from-amber-400",
    to: "to-orange-500",
  },
  {
    icon: ShieldCheck,
    title: "Secure",
    desc: "Bank-grade encryption at rest, private by design — your money data stays yours.",
    from: "from-emerald-500",
    to: "to-teal-600",
  },
  {
    icon: Smile,
    title: "Easy to Use",
    desc: "A calm, intuitive interface that replaces your messy workbook in minutes.",
    from: "from-blue-500",
    to: "to-indigo-600",
  },
];

export default function WhyBudgetIQ() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why BudgetIQ"
          title={<>Built to be <span className="text-brand">delightfully different</span></>}
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-white/5"
              >
                <span className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${c.from} ${c.to} text-white shadow-lg`}>
                  <Icon size={24} />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
