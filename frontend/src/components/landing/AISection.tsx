import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot } from "lucide-react";
import { SectionHeading, GlassCard } from "./shared";

interface Exchange {
  prompt: string;
  response: string;
}

const EXCHANGES: Exchange[] = [
  {
    prompt: "Where did I overspend this month?",
    response:
      "You're ₹4,200 over on Dining and ₹1,800 over on Subscriptions. Everything else is on track — Bills and Investments are right on plan. 🎯",
  },
  {
    prompt: "Predict my expenses next month.",
    response:
      "Based on the last 6 months I expect ~₹1,08,500 in spending. Rent and SIPs stay flat; discretionary tends to rise ~12% near festivals, so budget a little extra for Wants.",
  },
  {
    prompt: "How can I save ₹10,000?",
    response:
      "Three painless moves: pause 2 unused subscriptions (₹1,150), cap dining at ₹6k (saves ₹3,800), and route the rest to your SIP. That clears ₹10,000 this month. 💸",
  },
  {
    prompt: "Find unnecessary subscriptions.",
    response:
      "I found 3 you haven't touched in 60+ days: a streaming plan (₹649), a fitness app (₹399), and cloud storage (₹130). Cancelling all three saves ₹1,178/mo.",
  },
  {
    prompt: "Create next month's budget.",
    response:
      "Done — I drafted July: Bills ₹42k, Needs ₹28k, Wants ₹18k, Investments ₹20k. Carry-forward of ₹3,400 is applied. Review and approve in one tap. ✅",
  },
];

/** Types `text` out character-by-character; resets whenever the key changes. */
function useTypewriter(text: string, active: boolean, speed = 18) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return out;
}

export default function AISection() {
  const [active, setActive] = useState(0);
  const [thinking, setThinking] = useState(true);
  const timers = useRef<number[]>([]);

  const current = EXCHANGES[active];

  // Auto-advance: brief "thinking" pause, type the answer, hold, then next.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setThinking(true);
    const t1 = window.setTimeout(() => setThinking(false), 900);
    const t2 = window.setTimeout(() => {
      setActive((a) => (a + 1) % EXCHANGES.length);
    }, 6500);
    timers.current = [t1, t2];
    return () => timers.current.forEach(clearTimeout);
  }, [active]);

  const typed = useTypewriter(current.response, !thinking);

  const pick = (i: number) => {
    if (i !== active) setActive(i);
  };

  return (
    <section id="ai" className="relative overflow-hidden py-24 sm:py-32">
      {/* glow backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="lp-pulse-glow absolute left-1/2 top-1/3 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-indigo-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={<><Sparkles size={13} /> AI Assistant</>}
          title={<>Your money has an <span className="text-brand">AI co-pilot</span></>}
          subtitle="Ask anything in plain language. BudgetIQ analyzes your transactions, spots patterns, and tells you exactly what to do next."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Prompt chips */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Try asking…</p>
            {EXCHANGES.map((ex, i) => (
              <button
                key={ex.prompt}
                onClick={() => pick(i)}
                className={`group relative overflow-hidden rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                  i === active
                    ? "border-brand/40 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 shadow-md shadow-blue-500/10 dark:border-brand/50 dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-white"
                    : "border-slate-200 bg-white/60 text-slate-600 hover:border-brand/30 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                {i === active && (
                  <motion.span
                    layoutId="ai-active-bar"
                    className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500"
                  />
                )}
                <span className="flex items-center gap-2.5">
                  <Sparkles size={15} className={i === active ? "text-brand" : "text-slate-400 group-hover:text-brand"} />
                  {ex.prompt}
                </span>
              </button>
            ))}
          </div>

          {/* Chat panel */}
          <GlassCard className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 dark:border-white/10">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                <Bot size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">BudgetIQ Assistant</p>
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                </p>
              </div>
            </div>

            <div className="flex min-h-[300px] flex-1 flex-col gap-4 p-5">
              {/* user message */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`u-${active}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-md"
                >
                  {current.prompt}
                </motion.div>
              </AnimatePresence>

              {/* assistant message */}
              <div className="mr-auto flex max-w-[88%] gap-2.5">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white">
                  <Bot size={14} />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-700 dark:bg-white/10 dark:text-slate-100">
                  {thinking ? (
                    <span className="flex gap-1 py-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="h-2 w-2 rounded-full bg-slate-400"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className={typed.length < current.response.length ? "lp-caret" : ""}>{typed}</span>
                  )}
                </div>
              </div>
            </div>

            {/* faux input */}
            <div className="border-t border-slate-100 p-4 dark:border-white/10">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <input
                  readOnly
                  value=""
                  placeholder="Ask BudgetIQ anything about your money…"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-white"
                  aria-label="Ask BudgetIQ"
                />
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <Send size={15} />
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
