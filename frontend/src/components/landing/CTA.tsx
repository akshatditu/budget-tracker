import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { loginHref } from "./shared";

export default function CTA() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 py-16 text-center shadow-2xl shadow-blue-600/30 sm:px-12 sm:py-20"
      >
        {/* decorative glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="lp-pulse-glow absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="lp-pulse-glow absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        </div>

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Take Control of Your Money Today
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-blue-100 sm:text-lg">
            Join thousands who swapped spreadsheets for clarity. Free to start, smarter every month.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.a
              href={loginHref}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-brand shadow-lg transition-shadow hover:shadow-xl sm:w-auto"
            >
              Get Started <ArrowRight size={16} />
            </motion.a>
            <motion.a
              href={loginHref}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto"
            >
              Sign In
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
