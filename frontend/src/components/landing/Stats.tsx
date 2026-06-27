import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 50, suffix: "K+", label: "Budgets tracked" },
  { prefix: "₹", value: 2.4, suffix: "Cr", label: "Saved by users" },
  { value: 98, suffix: "%", label: "Categorization accuracy" },
  { value: 4.9, suffix: "/5", label: "Average rating" },
];

/** Counts up from 0 to `to` once the element scrolls into view. */
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);
  const decimals = to % 1 !== 0 ? 1 : 0;

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="border-y border-slate-200/70 bg-white/50 py-14 backdrop-blur dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <p className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl dark:from-blue-400 dark:to-indigo-300">
              <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
