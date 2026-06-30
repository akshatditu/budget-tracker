import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal, SectionHeading } from "./shared";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is BudgetIQ really free to start?",
    a: "Yes. You can track expenses, plan budgets, and use core AI insights on the free plan forever — no credit card required. Premium adds advanced forecasting, unlimited goals, and priority support.",
  },
  {
    q: "How does the AI categorize my expenses?",
    a: "BudgetIQ reads the merchant, amount, and context of each transaction and assigns it to the right category. It learns from your corrections, so it gets more accurate the more you use it.",
  },
  {
    q: "Does it support multiple currencies?",
    a: "Absolutely. BudgetIQ works in ₹, $, and dozens of other currencies, with localized formatting so your money always reads the way you expect.",
  },
  {
    q: "Is my financial data secure?",
    a: "Your data is protected with bank-grade encryption in transit and at rest. We never sell your data, and you can export or delete everything you own at any time.",
  },
  {
    q: "Can I export my data?",
    a: "Yes — download clean CSV or PDF reports for any period in one click. Monthly statements, category breakdowns, and annual roll-ups are all available.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number>(-1);

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" className="mb-10 sm:mb-12" />

      <Reveal className="flex flex-col gap-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#12161f] dark:shadow-black/30"
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display flex-1 text-base font-bold text-slate-900 dark:text-white">
                  {f.q}
                </span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-teal-700 transition-transform dark:bg-white/5 dark:text-teal-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown size={16} strokeWidth={2.4} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
