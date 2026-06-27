import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, TrendingUp, PiggyBank, Wand2 } from "lucide-react";
import { BrowserFrame, DashboardMockup } from "./mockups";
import { GradientText, PrimaryButton, SecondaryButton, fadeUp, stagger } from "./shared";

/** A small glass card that floats over the hero dashboard. */
function FloatingCard({
  className,
  float,
  children,
}: {
  className: string;
  float: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
      className={`absolute z-20 ${className}`}
    >
      <div className={`${float} rounded-2xl border border-white/60 bg-white/80 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/80`}>
        {children}
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/30 via-indigo-400/20 to-sky-300/20 blur-3xl dark:from-blue-600/20 dark:via-indigo-600/15 dark:to-sky-700/10" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-white/10" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp} className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-brand shadow-sm backdrop-blur dark:border-brand/30 dark:bg-white/5">
              <Sparkles size={14} />
              Smarter Budgeting. Powered by AI.
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl dark:text-white"
          >
            Smarter Budgeting.
            <br />
            <GradientText>Powered by AI.</GradientText>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-300"
          >
            BudgetIQ unifies expense tracking, budget planning, AI insights, savings
            goals, and financial analytics into one beautifully simple workspace —
            so you always know where your money goes and how to keep more of it.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto">
              Start Free <ArrowRight size={16} />
            </PrimaryButton>
            <SecondaryButton href="#ai" className="w-full sm:w-auto">
              <Play size={15} /> Watch Demo
            </SecondaryButton>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            No credit card required · Free forever plan · Bank-grade encryption
          </motion.p>
        </motion.div>

        {/* Dashboard mockup with floating cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <FloatingCard className="-left-2 top-16 sm:left-6 sm:top-24" float="lp-float">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20">
                <TrendingUp size={18} />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Monthly Budget</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">₹1,20,000</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-right-2 top-8 sm:right-4 sm:top-12" float="lp-float-slow">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
                <PiggyBank size={18} />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Savings</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">₹36,400</p>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard className="-right-2 bottom-16 sm:right-2 sm:bottom-24" float="lp-float">
            <div className="flex max-w-[190px] items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20">
                <Wand2 size={18} />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">AI Insight</p>
                <p className="text-xs font-semibold leading-snug text-slate-900 dark:text-white">
                  Dining is up 23% — trim ₹4k to hit your goal.
                </p>
              </div>
            </div>
          </FloatingCard>

          <BrowserFrame className="relative z-10">
            <DashboardMockup />
          </BrowserFrame>

          {/* soft reflection */}
          <div aria-hidden className="absolute inset-x-12 -bottom-6 -z-0 h-12 rounded-full bg-blue-500/20 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
