import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Bot } from "lucide-react";
import { SectionHeading } from "./shared";

const EXCHANGES: { prompt: string; response: string }[] = [
  {
    prompt: "Where did I overspend this month?",
    response:
      "You're ₹4,200 over on Dining and ₹1,800 over on Subscriptions. Bills and Investments are right on plan — nice work staying disciplined there.",
  },
  {
    prompt: "Predict my expenses next month.",
    response:
      "Based on your last 6 months I expect about ₹1,08,500 in spending. Rent and SIPs stay flat; discretionary tends to climb near festivals, so set aside a little extra for Wants.",
  },
  {
    prompt: "How can I save ₹10,000?",
    response:
      "Three painless moves: pause 2 unused subscriptions (₹1,150), cap dining at ₹6,000 (saves ₹3,800), and route the rest to your SIP. That clears ₹10,000 this month.",
  },
  {
    prompt: "Find unnecessary subscriptions.",
    response:
      "I found 3 you haven't opened in 60+ days: a streaming plan (₹649), a fitness app (₹399), and cloud storage (₹130). Cancelling all three saves ₹1,178 every month.",
  },
  {
    prompt: "Create next month's budget.",
    response:
      "Done — I drafted July: Bills ₹42,000, Needs ₹28,000, Wants ₹18,000, Investments ₹20,000. A carry-forward of ₹3,400 is applied. Review and approve in one tap.",
  },
];

export default function AISection() {
  const [active, setActive] = useState(0);
  const [thinking, setThinking] = useState(true);
  const [typed, setTyped] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const typer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive one prompt: brief "thinking" pause → typewriter answer → advance.
  useEffect(() => {
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (typer.current) clearInterval(typer.current);
    };
    setThinking(true);
    setTyped("");
    const full = EXCHANGES[active].response;

    timers.current.push(
      setTimeout(() => {
        setThinking(false);
        let i = 0;
        typer.current = setInterval(() => {
          i += 1;
          setTyped(full.slice(0, i));
          if (i >= full.length) {
            if (typer.current) clearInterval(typer.current);
            timers.current.push(
              setTimeout(() => setActive((a) => (a + 1) % EXCHANGES.length), 3000),
            );
          }
        }, 16);
      }, 850),
    );

    return clearAll;
  }, [active]);

  const typing = !thinking && typed.length < EXCHANGES[active].response.length;

  return (
    <section id="ai" className="relative scroll-mt-20 overflow-hidden py-16 sm:py-24">
      <div
        aria-hidden
        className="lp-pulse-glow pointer-events-none absolute top-[30%] left-1/2 h-[520px] w-[820px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(124,58,237,0.13),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(167,139,250,0.16),transparent)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={
            <>
              <Sparkles size={14} /> AI Assistant
            </>
          }
          title={
            <>
              Your money has a{" "}
              <span className="bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-violet-400">
                co-pilot
              </span>
            </>
          }
          subtitle="Ask anything in plain language. BudgetIQ reads your transactions, spots the patterns, and tells you exactly what to do next."
          className="mb-12 sm:mb-14"
        />

        <div className="grid items-start gap-5 lg:grid-cols-2">
          {/* Prompt chips */}
          <div>
            <div className="mb-3 text-xs font-bold tracking-wider text-slate-400">TRY ASKING…</div>
            <div className="flex flex-col gap-3">
              {EXCHANGES.map((e, i) => {
                const on = i === active;
                return (
                  <button
                    key={e.prompt}
                    onClick={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                      on
                        ? "border-teal-600/25 bg-teal-600/10 text-slate-900 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20"
                    }`}
                  >
                    <Sparkles size={16} className="shrink-0 text-teal-600 dark:text-teal-400" />
                    <span>{e.prompt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-white/10">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-violet-600 text-white">
                <Bot size={19} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">BudgetIQ Assistant</div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-emerald-600 dark:text-emerald-400">
                  <span className="lp-blink h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online · analyzing your data
                </div>
              </div>
            </div>

            <div className="flex min-h-[280px] flex-col gap-4 p-4 sm:p-5">
              {/* user bubble */}
              <div className="max-w-[84%] self-end rounded-2xl rounded-br-sm bg-gradient-to-br from-teal-600 to-violet-600 px-4 py-2.5 text-sm font-medium leading-relaxed text-white shadow-lg shadow-violet-600/20">
                {EXCHANGES[active].prompt}
              </div>
              {/* assistant bubble */}
              <div className="flex max-w-[90%] gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-teal-600 to-violet-600 text-white">
                  <Sparkles size={14} />
                </span>
                <div className="min-h-5 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-900 dark:bg-white/5 dark:text-slate-100">
                  {thinking ? (
                    <span className="inline-flex gap-1.5 py-1">
                      <span className="lp-dot h-2 w-2 rounded-full bg-slate-400" />
                      <span className="lp-dot h-2 w-2 rounded-full bg-slate-400" style={{ animationDelay: "0.15s" }} />
                      <span className="lp-dot h-2 w-2 rounded-full bg-slate-400" style={{ animationDelay: "0.3s" }} />
                    </span>
                  ) : (
                    <span className={typing ? "lp-caret" : ""}>{typed}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 dark:border-white/10">
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pr-2.5 pl-4 dark:border-white/10 dark:bg-white/5">
                <span className="flex-1 text-sm text-slate-400">
                  Ask BudgetIQ anything about your money…
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-violet-600 text-white">
                  <Send size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
