import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeading } from "./shared";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  hue: string;
}

const ITEMS: Testimonial[] = [
  {
    quote:
      "BudgetIQ replaced my five-tab spreadsheet overnight. The AI caught two subscriptions I'd completely forgotten about — paid for itself in week one.",
    name: "Aarav Mehta",
    role: "Product Designer, Bengaluru",
    initials: "AM",
    hue: "from-blue-500 to-indigo-600",
  },
  {
    quote:
      "I finally understand where my money goes. The monthly rollups and carry-forward work exactly like my old Excel sheet, just without the broken formulas.",
    name: "Priya Sharma",
    role: "Freelance Consultant",
    initials: "PS",
    hue: "from-violet-500 to-purple-600",
  },
  {
    quote:
      "Asking 'how can I save ₹10,000?' and getting a real plan back is wild. It's like having a financial analyst in my pocket.",
    name: "Rohan Iyer",
    role: "Software Engineer",
    initials: "RI",
    hue: "from-emerald-500 to-teal-600",
  },
  {
    quote:
      "The dashboards are gorgeous and the goal tracking actually keeps me honest. I've saved more in three months than all of last year.",
    name: "Neha Kapoor",
    role: "Marketing Lead",
    initials: "NK",
    hue: "from-amber-400 to-orange-500",
  },
  {
    quote:
      "Clean, fast, and genuinely smart. The investment-vs-spending separation is exactly how I think about money. Couldn't go back.",
    name: "Vikram Nair",
    role: "Startup Founder",
    initials: "VN",
    hue: "from-sky-500 to-blue-600",
  },
  {
    quote:
      "Setup took five minutes and the AI categorization was right almost every time. This is what budgeting apps should have been all along.",
    name: "Ananya Reddy",
    role: "Data Analyst",
    initials: "AR",
    hue: "from-rose-500 to-pink-600",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title={<>Loved by people who <span className="text-brand">hate budgeting</span></>}
          subtitle="Thousands of people have swapped spreadsheets and guilt for clarity and control."
        />

        <div className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {ITEMS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
              className="break-inside-avoid rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${t.hue} text-sm font-semibold text-white`}>
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
