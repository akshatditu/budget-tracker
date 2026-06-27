import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun } from "lucide-react";
import { BudgetIQIcon } from "../Logo";
import { loginHref } from "./shared";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "AI Assistant", href: "#ai" },
  { label: "Screenshots", href: "#screenshots" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar({
  dark,
  onToggleDark,
}: {
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0F172A]">
            <BudgetIQIcon size={26} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Budget<span className="text-brand">IQ</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            href={loginHref}
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 sm:block dark:text-slate-200 dark:hover:text-white"
          >
            Sign In
          </a>
          <a
            href={loginHref}
            className="hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-shadow hover:shadow-xl hover:shadow-blue-600/40 sm:inline-flex"
          >
            Get Started
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden dark:text-slate-200 dark:hover:bg-white/10"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95"
          >
            <div className="space-y-1 px-4 py-4">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={loginHref}
                className="mt-2 block rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
