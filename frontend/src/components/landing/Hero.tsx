import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, TrendingUp } from "lucide-react";
import { GradientText, PrimaryButton, SecondaryButton, fadeUp, stagger } from "./shared";

const mono = { fontFamily: "'Space Mono', monospace" } as const;

const DOTS = [
  { label: "Expense tracking", color: "#10b981" },
  { label: "Budget planning", color: "#0ea5e9" },
  { label: "AI insights", color: "#8b5cf6" },
  { label: "Savings goals", color: "#f59e0b" },
];

const LEGEND = [
  { label: "Bills", pct: "35%", color: "#0ea5e9" },
  { label: "Needs", pct: "27%", color: "#10b981" },
  { label: "Wants", pct: "22%", color: "#f59e0b" },
  { label: "Investments", pct: "16%", color: "#8b5cf6" },
];

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-28 pb-12 sm:px-6 sm:pt-32 lg:px-8 lg:pb-16"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Copy */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-600/10 py-1.5 pr-3.5 pl-2 text-[13px] font-semibold text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-teal-300">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-teal-600 to-violet-600">
                <Sparkles size={12} className="text-white" />
              </span>
              Smarter budgeting, powered by AI
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[clamp(2.5rem,6.4vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-slate-900 dark:text-white"
          >
            Smarter Budgeting.
            <br />
            <GradientText>Powered by AI.</GradientText>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
          >
            Track every expense, plan budgets that actually hold, and let an AI
            co-pilot turn your transactions into insights, savings goals, and
            clear financial analytics.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {DOTS.map((d) => (
              <span key={d.label} className="flex items-center gap-2">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: d.color }} />
                {d.label}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <PrimaryButton className="px-6 py-3.5 text-base">
              Start Free <ArrowRight size={18} />
            </PrimaryButton>
            <SecondaryButton href="#ai" className="px-6 py-3.5 text-base">
              <Play size={15} /> Watch Demo
            </SecondaryButton>
          </motion.div>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto min-h-[420px] w-full max-w-md lg:max-w-none"
        >
          {/* Dashboard card */}
          <div className="lp-float relative z-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/15 dark:bg-[#12161f] dark:shadow-black/50">
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="mx-auto text-[11px] text-slate-400" style={mono}>
                app.budgetiq.com
              </span>
            </div>
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Monthly Budget · June</div>
                  <div className="font-display mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
                    ₹1,20,000
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400">Spent</div>
                  <div className="mt-1 text-base font-bold text-slate-900 dark:text-white" style={mono}>
                    ₹84,000
                  </div>
                </div>
              </div>
              <div className="mb-5 h-2.5 overflow-hidden rounded-md bg-slate-100 dark:bg-white/10">
                <div className="h-full w-[70%] rounded-md bg-gradient-to-r from-teal-600 to-violet-600" />
              </div>
              <div className="mb-2.5 text-xs font-bold tracking-wider text-slate-400">
                EXPENSE BREAKDOWN
              </div>
              <div className="flex items-center gap-4">
                <svg width="118" height="118" viewBox="0 0 118 118" className="shrink-0">
                  <g transform="translate(59 59)">
                    <circle r="44" fill="none" stroke="#0ea5e9" strokeWidth="16" strokeDasharray="92 184" transform="rotate(-90)" />
                    <circle r="44" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="70 206" strokeDashoffset="-92" transform="rotate(-90)" />
                    <circle r="44" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="48 228" strokeDashoffset="-162" transform="rotate(-90)" />
                    <circle r="44" fill="none" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="36 240" strokeDashoffset="-210" transform="rotate(-90)" />
                  </g>
                </svg>
                <div className="grid flex-1 gap-2.5">
                  {LEGEND.map((l) => (
                    <div key={l.label} className="flex items-center gap-2.5 text-[13px]">
                      <span className="h-2.5 w-2.5 rounded" style={{ background: l.color }} />
                      <span className="flex-1 text-slate-600 dark:text-slate-300">{l.label}</span>
                      <span className="font-bold text-slate-900 dark:text-white" style={mono}>
                        {l.pct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating: savings */}
          <div className="lp-float-slow absolute -top-8 -left-4 z-20 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:-left-8 dark:border-white/10 dark:bg-white/10">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={18} />
              </span>
              <div>
                <div className="text-[11px] font-semibold text-slate-400">Savings this month</div>
                <div className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                  ₹26,400 <span className="text-xs text-emerald-600 dark:text-emerald-400">+18%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating: AI insight */}
          <div className="lp-float absolute -right-2 -bottom-6 z-20 max-w-[230px] rounded-2xl border border-white/70 bg-white/80 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:-right-4 dark:border-white/10 dark:bg-white/10">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-teal-600 to-violet-600">
                <Sparkles size={13} className="text-white" />
              </span>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300">AI Insight</span>
            </div>
            <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              Cap dining at <b className="text-slate-900 dark:text-white">₹3,800</b> and you'll
              hit your savings goal 9 days early.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
