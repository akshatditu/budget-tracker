import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import { BudgetIQIcon } from "../Logo";
import { loginHref } from "./shared";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "AI Assistant", href: "#ai" },
      { label: "Screenshots", href: "#screenshots" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Blog", href: "#top" },
      { label: "Careers", href: "#top" },
      { label: "Contact", href: "#top" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#faq" },
      { label: "Guides", href: "#top" },
      { label: "Privacy", href: "#top" },
      { label: "Terms", href: "#top" },
    ],
  },
];

const SOCIALS = [
  { icon: Twitter, label: "Twitter" },
  { icon: Github, label: "GitHub" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Instagram, label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <BudgetIQIcon size={36} />
              <span
                className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Budget
                <span className="bg-gradient-to-br from-[#0f9d8f] to-[#7c3aed] bg-clip-text font-extrabold text-transparent dark:from-[#2dd4bf] dark:to-[#a78bfa]">
                  IQ
                </span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Smarter budgeting, powered by AI. Track expenses, plan budgets, hit your savings goals.
            </p>
            <div className="mt-5 flex gap-2.5">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#top"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand hover:text-brand dark:border-white/10 dark:text-slate-400"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-slate-500 transition-colors hover:text-brand dark:text-slate-400">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 pt-6 sm:flex-row dark:border-white/10">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} BudgetIQ. All rights reserved.
          </p>
          <a href={loginHref} className="text-xs font-semibold text-brand hover:underline">
            Get started free →
          </a>
        </div>
      </div>
    </footer>
  );
}
