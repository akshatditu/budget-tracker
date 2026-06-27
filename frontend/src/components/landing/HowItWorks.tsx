import { motion } from "framer-motion";
import { UserPlus, ListPlus, Tags, LineChart, TrendingUp, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./shared";

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserPlus, title: "Create Account", desc: "Sign in with Google in one click — no forms, no setup friction." },
  { icon: ListPlus, title: "Add Transactions", desc: "Log expenses fast, or import them. Your ledger fills up in minutes." },
  { icon: Tags, title: "AI Categorizes", desc: "BudgetIQ sorts every entry into the right bucket automatically." },
  { icon: LineChart, title: "View Insights", desc: "Dashboards and AI answers reveal exactly where your money goes." },
  { icon: TrendingUp, title: "Save More", desc: "Act on recommendations, hit your goals, and keep more each month." },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-slate-200/70 bg-white/50 py-24 backdrop-blur sm:py-32 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title={<>From zero to in control in <span className="text-brand">five steps</span></>}
          subtitle="No accounting degree required. BudgetIQ does the heavy lifting so you just make better decisions."
        />

        <div className="relative mt-16">
          {/* connecting line (desktop) */}
          <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block dark:via-white/15" />
          <div className="grid gap-10 lg:grid-cols-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="relative text-center"
                >
                  <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
                    <Icon size={24} />
                    <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-slate-900 text-[11px] font-bold text-white dark:border-slate-950">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-[14rem] text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
