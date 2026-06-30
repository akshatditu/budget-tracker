import { Reveal, SectionHeading } from "./shared";

const STEPS = [
  { n: "1", title: "Create Account", desc: "Sign up free in under a minute — no card required.", accent: false },
  { n: "2", title: "Add Transactions", desc: "Import, sync, or log spending in a couple of taps.", accent: false },
  { n: "3", title: "AI Categorizes", desc: "Every expense is sorted and tagged automatically.", accent: true },
  { n: "4", title: "View Insights", desc: "See trends, alerts, and AI advice on one dashboard.", accent: false },
  { n: "5", title: "Save More", desc: "Hit goals faster and watch your savings grow.", accent: false },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeading
        eyebrow="How it works"
        title="From sign-up to savings in 5 steps"
        className="mb-12 sm:mb-14"
      />

      <Reveal className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-[#12161f] dark:shadow-black/30"
          >
            <div
              className={`font-display mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl text-xl font-extrabold ${
                s.accent
                  ? "bg-gradient-to-br from-teal-600 to-violet-600 text-white"
                  : s.n === "5"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"
              }`}
            >
              {s.n}
            </div>
            <div className="font-display mb-1.5 text-base font-bold text-slate-900 dark:text-white">
              {s.title}
            </div>
            <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{s.desc}</div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
