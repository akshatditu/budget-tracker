/**
 * Hand-built SVG mockups standing in for real product screenshots. They use the
 * BudgetIQ section palette (bills/needs/wants/investments) and read well on both
 * light and dark backgrounds. Swap any of these for a real <img> later.
 */
import type { ReactNode } from "react";

const BILLS = "#0ea5e9";
const NEEDS = "#10b981";
const WANTS = "#f59e0b";
const INVEST = "#8b5cf6";
const BRAND = "#2563eb";

/** A faux browser chrome wrapper around any screenshot/mockup. */
export function BrowserFrame({
  children,
  label = "app.budgetiq.com",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-white/5 dark:bg-white/5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[10px] font-medium text-slate-400 shadow-sm dark:bg-white/10 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full border border-slate-300 dark:border-slate-500" />
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

/** The flagship dashboard: donut split, KPI row, and a monthly bar trend. */
export function DashboardMockup() {
  return (
    <svg viewBox="0 0 720 460" className="h-auto w-full" role="img" aria-label="BudgetIQ dashboard showing budget breakdown, key metrics and monthly spending trend">
      <defs>
        <linearGradient id="dm-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="dm-head" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="720" height="460" rx="16" fill="currentColor" className="text-slate-50 dark:text-slate-950" />

      {/* Header */}
      <rect x="24" y="22" width="220" height="14" rx="7" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
      <rect x="24" y="44" width="120" height="9" rx="4.5" fill="currentColor" className="text-slate-200 dark:text-slate-800" />
      <rect x="600" y="26" width="96" height="30" rx="8" fill="url(#dm-head)" />

      {/* KPI cards */}
      {[
        { x: 24, c: BRAND, w: 132 },
        { x: 196, c: NEEDS, w: 88 },
        { x: 320, c: WANTS, w: 104 },
        { x: 540, c: INVEST, w: 96 },
      ].map((k, i) => (
        <g key={i}>
          <rect x={24 + i * 172} y="78" width="156" height="86" rx="12" fill="currentColor" className="text-white dark:text-slate-900" stroke="currentColor" strokeWidth="1" />
          <rect x={36 + i * 172} y="94" width="64" height="8" rx="4" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
          <rect x={36 + i * 172} y="112" width={k.w} height="16" rx="6" fill={k.c} opacity="0.9" />
          <rect x={36 + i * 172} y="140" width="80" height="7" rx="3.5" fill="currentColor" className="text-slate-200 dark:text-slate-800" />
        </g>
      ))}

      {/* Donut */}
      <g transform="translate(150 320)">
        <circle r="74" fill="none" stroke={BILLS} strokeWidth="26" strokeDasharray="120 345" transform="rotate(-90)" />
        <circle r="74" fill="none" stroke={NEEDS} strokeWidth="26" strokeDasharray="110 345" strokeDashoffset="-120" transform="rotate(-90)" />
        <circle r="74" fill="none" stroke={WANTS} strokeWidth="26" strokeDasharray="80 345" strokeDashoffset="-230" transform="rotate(-90)" />
        <circle r="74" fill="none" stroke={INVEST} strokeWidth="26" strokeDasharray="55 345" strokeDashoffset="-310" transform="rotate(-90)" />
        <text textAnchor="middle" y="-2" fontSize="22" fontWeight="700" fill="currentColor" className="text-slate-800 dark:text-white">₹84k</text>
        <text textAnchor="middle" y="18" fontSize="11" fill="currentColor" className="text-slate-400">spent</text>
      </g>

      {/* Bar trend */}
      <g transform="translate(300 196)">
        <rect x="0" y="0" width="396" height="240" rx="14" fill="currentColor" className="text-white dark:text-slate-900" stroke="currentColor" strokeWidth="1" />
        <rect x="20" y="20" width="120" height="10" rx="5" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
        {[140, 92, 165, 120, 188, 150, 205, 175].map((h, i) => (
          <rect key={i} x={28 + i * 44} y={216 - h} width="22" height={h} rx="5" fill="url(#dm-bar)" opacity={i === 6 ? 1 : 0.65} />
        ))}
        <polyline points="39,90 83,120 127,70 171,100 215,55 259,80 303,42 347,62" fill="none" stroke={NEEDS} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Compact analytics line/area chart mockup for the gallery. */
export function AnalyticsMockup() {
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="Spending analytics over time">
      <defs>
        <linearGradient id="an-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.35" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="currentColor" className="text-white dark:text-slate-900" />
      <rect x="20" y="18" width="120" height="10" rx="5" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
      <path d="M20 180 L70 150 L120 165 L170 110 L220 130 L270 78 L320 96 L380 50 L380 210 L20 210 Z" fill="url(#an-area)" />
      <polyline points="20,180 70,150 120,165 170,110 220,130 270,78 320,96 380,50" fill="none" stroke={BRAND} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[[170, 110], [270, 78], [380, 50]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="#fff" stroke={BRAND} strokeWidth="3" />
      ))}
    </svg>
  );
}

/** Budget planner table mockup. */
export function PlannerMockup() {
  const rows = [
    { c: BILLS, w: 0.82 },
    { c: NEEDS, w: 0.55 },
    { c: WANTS, w: 0.93 },
    { c: INVEST, w: 0.4 },
  ];
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="Budget planner with category allocations">
      <rect width="400" height="240" fill="currentColor" className="text-white dark:text-slate-900" />
      {rows.map((r, i) => (
        <g key={i} transform={`translate(20 ${24 + i * 50})`}>
          <circle cx="8" cy="8" r="8" fill={r.c} />
          <rect x="28" y="2" width="90" height="12" rx="6" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
          <rect x="150" y="4" width="210" height="9" rx="4.5" fill="currentColor" className="text-slate-100 dark:text-slate-800" />
          <rect x="150" y="4" width={210 * r.w} height="9" rx="4.5" fill={r.c} />
          <rect x="150" y="22" width="60" height="7" rx="3.5" fill="currentColor" className="text-slate-200 dark:text-slate-800" />
        </g>
      ))}
    </svg>
  );
}

/** AI chat mockup for the gallery. */
export function ChatMockup() {
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="AI assistant chat conversation">
      <rect width="400" height="240" fill="currentColor" className="text-white dark:text-slate-900" />
      {/* user bubble */}
      <rect x="150" y="22" width="230" height="40" rx="14" fill={BRAND} />
      <rect x="166" y="34" width="170" height="7" rx="3.5" fill="#fff" opacity="0.85" />
      <rect x="166" y="46" width="120" height="7" rx="3.5" fill="#fff" opacity="0.6" />
      {/* ai bubble */}
      <rect x="20" y="80" width="260" height="86" rx="14" fill="currentColor" className="text-slate-100 dark:text-slate-800" />
      <circle cx="40" cy="100" r="10" fill={INVEST} />
      <rect x="60" y="94" width="150" height="7" rx="3.5" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
      <rect x="36" y="120" width="220" height="7" rx="3.5" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
      <rect x="36" y="134" width="190" height="7" rx="3.5" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
      <rect x="36" y="148" width="120" height="7" rx="3.5" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
      {/* input */}
      <rect x="20" y="190" width="360" height="34" rx="17" fill="currentColor" className="text-slate-100 dark:text-slate-800" stroke={BRAND} strokeWidth="1.5" />
      <circle cx="360" cy="207" r="12" fill={BRAND} />
    </svg>
  );
}

/** Reports / export mockup. */
export function ReportsMockup() {
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="Financial reports and export">
      <rect width="400" height="240" fill="currentColor" className="text-white dark:text-slate-900" />
      <rect x="20" y="18" width="140" height="11" rx="5.5" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(20 ${50 + i * 34})`}>
          <rect x="0" y="0" width="360" height="24" rx="6" fill="currentColor" className={i % 2 ? "text-slate-50 dark:text-slate-800/50" : "text-slate-100 dark:text-slate-800"} />
          <rect x="12" y="8" width="90" height="8" rx="4" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
          <rect x="150" y="8" width="60" height="8" rx="4" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
          <rect x="290" y="8" width="58" height="8" rx="4" fill={[BILLS, NEEDS, WANTS, INVEST, BRAND][i]} />
        </g>
      ))}
    </svg>
  );
}

/** Savings goals mockup with progress rings. */
export function GoalsMockup() {
  const goals = [
    { c: NEEDS, p: 0.72, x: 70 },
    { c: WANTS, p: 0.45, x: 200 },
    { c: INVEST, p: 0.9, x: 330 },
  ];
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="Savings goals progress">
      <rect width="400" height="240" fill="currentColor" className="text-white dark:text-slate-900" />
      {goals.map((g, i) => {
        const r = 42;
        const circ = 2 * Math.PI * r;
        return (
          <g key={i} transform={`translate(${g.x} 100)`}>
            <circle r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="10" />
            <circle r={r} fill="none" stroke={g.c} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circ * g.p} ${circ}`} transform="rotate(-90)" />
            <text textAnchor="middle" y="6" fontSize="18" fontWeight="700" fill="currentColor" className="text-slate-700 dark:text-white">{Math.round(g.p * 100)}%</text>
            <rect x="-34" y="68" width="68" height="9" rx="4.5" fill="currentColor" className="text-slate-200 dark:text-slate-700" />
          </g>
        );
      })}
    </svg>
  );
}
