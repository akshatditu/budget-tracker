/**
 * Shared building blocks for the marketing landing page: the OAuth entry point,
 * reusable Framer Motion variants, and small presentational primitives.
 * Everything here is presentational and self-contained — it never touches the
 * authenticated data layer.
 */
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Sign-in / Get-started both kick off the same Google OAuth flow the Login
// screen uses. In dev the link must hit the backend port directly so the OAuth
// state cookie is set on the same origin; in prod the SPA is served same-origin.
export const loginHref = import.meta.env.DEV
  ? "http://localhost:8000/api/auth/login"
  : "/api/auth/login";

/** Fade + rise, the workhorse scroll reveal. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Container that staggers its children's reveals. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

/** A section whose children fade-up in sequence as it scrolls into view. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Small pill used to label a section ("AI Assistant", "Pricing", …). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand dark:border-brand/30 dark:bg-brand/10">
      {children}
    </span>
  );
}

/** Blue gradient text used in headings. */
export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="lp-animate-gradient bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">
      {children}
    </span>
  );
}

/** Centered section header: eyebrow + title + optional subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className = "",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={`mx-auto max-w-2xl text-center ${className}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

/** Primary CTA button — links to the OAuth flow by default. */
export function PrimaryButton({
  children,
  href = loginHref,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-shadow hover:shadow-xl hover:shadow-blue-600/40 ${className}`}
    >
      {children}
    </motion.a>
  );
}

/** Secondary / ghost CTA button. */
export function SecondaryButton({
  children,
  href = loginHref,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 ${className}`}
    >
      {children}
    </motion.a>
  );
}

/** Glassmorphism card shell reused across sections. */
export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/60 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 ${className}`}
    >
      {children}
    </div>
  );
}
