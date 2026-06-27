import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./shared";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is my financial data secure?",
    a: "Yes. Your money values are encrypted at rest, every record is scoped to your account, and we never sell or share your data. BudgetIQ is private by design.",
  },
  {
    q: "How does the AI assistant work?",
    a: "It analyzes your own transaction history to answer questions in plain language — spotting overspending, predicting next month, finding unused subscriptions, and even drafting your next budget. It only ever sees your data to help you.",
  },
  {
    q: "Can I import from my existing spreadsheet?",
    a: "Absolutely. BudgetIQ was built to replace multi-tab Excel workflows — sections, sub-items, monthly Initial/Revised/Spent/Remaining, and automatic carry-forward all map over cleanly.",
  },
  {
    q: "Does it handle investments differently?",
    a: "It does. Investments are treated as retained wealth — excluded from your 'spent' totals and they don't drain your carry-forward pool, so your true savings picture stays accurate.",
  },
  {
    q: "Can I export my data?",
    a: "Anytime. Export to CSV on the Free plan or Excel on Pro and above. Your data is always yours to take with you.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan is genuinely free forever — sign in with Google and start budgeting in under a minute. Upgrade only if and when you want AI features.",
  },
];

function Item({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <Item key={f.q} q={f.q} a={f.a} isOpen={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
