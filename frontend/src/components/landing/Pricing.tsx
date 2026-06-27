import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionHeading, loginHref } from "./shared";

interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    tagline: "Everything you need to start budgeting smarter.",
    features: ["Unlimited transactions", "Monthly & annual rollups", "Core dashboards", "CSV export", "1 savings goal"],
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "₹299",
    period: "per month",
    tagline: "AI superpowers for people serious about saving.",
    features: ["Everything in Free", "AI assistant & insights", "Smart auto-categorization", "Unlimited savings goals", "Spending predictions", "Excel export"],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "Premium",
    price: "₹599",
    period: "per month",
    tagline: "For households and power users who want it all.",
    features: ["Everything in Pro", "Up to 5 members", "Advanced reports", "Priority AI responses", "Dedicated support"],
    cta: "Go Premium",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title={<>Simple pricing that <span className="text-brand">pays for itself</span></>}
          subtitle="Start free and upgrade when you're ready. Cancel anytime — no lock-in."
        />

        <div className="mx-auto mt-16 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex flex-col rounded-3xl border p-7 ${
                p.featured
                  ? "border-transparent bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-600/30 lg:-mt-4 lg:mb-0"
                  : "border-slate-200 bg-white text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand shadow">
                  Most Popular
                </span>
              )}
              <h3 className={`text-lg font-bold ${p.featured ? "text-white" : "text-slate-900 dark:text-white"}`}>{p.name}</h3>
              <p className={`mt-1 text-sm ${p.featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>{p.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                <span className={`text-sm ${p.featured ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>/{p.period}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${p.featured ? "bg-white/20 text-white" : "bg-brand/10 text-brand"}`}>
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span className={p.featured ? "text-blue-50" : "text-slate-700 dark:text-slate-200"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={loginHref}
                className={`mt-7 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  p.featured
                    ? "bg-white text-brand hover:bg-blue-50"
                    : "bg-slate-900 text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
                }`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
