import type { ReactNode } from "react";
import { Reveal, SectionHeading } from "./shared";

const mono = { fontFamily: "'Space Mono', monospace" } as const;

/** Bento tile shell with a labelled header. */
function Tile({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl dark:border-white/10 dark:bg-[#12161f] dark:shadow-black/30 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-white/10">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        {meta && <span className="text-[11px] text-slate-400" style={mono}>{meta}</span>}
      </div>
      {children}
    </div>
  );
}

export default function ScreenshotGallery() {
  return (
    <section
      id="gallery"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <SectionHeading
        eyebrow="See it in action"
        title="A look inside BudgetIQ"
        className="mb-12 sm:mb-14"
      />

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Dashboard — spans two columns */}
        <Tile title="Dashboard" meta="Overview" className="sm:col-span-2">
          <div className="grid grid-cols-2 gap-3.5 p-4 sm:p-5">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-white/5">
                <div className="text-[11px] text-slate-400">Balance</div>
                <div className="font-display text-xl font-extrabold text-slate-900 dark:text-white">₹2,48,000</div>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
                  <div className="text-[10.5px] text-slate-400">Income</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400" style={mono}>₹1,32,000</div>
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
                  <div className="text-[10.5px] text-slate-400">Spent</div>
                  <div className="text-sm font-bold text-[#e0524b]" style={mono}>₹84,000</div>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 200 150" className="h-auto w-full">
              <defs>
                <linearGradient id="gal-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f9d8f" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              {[
                [14, 70, 92, 40], [52, 50, 78, 54], [90, 60, 84, 48], [128, 38, 58, 74], [166, 54, 44, 88],
              ].map(([x, yBg, yFg, hFg], i) => (
                <g key={i}>
                  <rect x={x} y={yBg} width="22" height={132 - yBg} rx="5" className="fill-slate-100 dark:fill-white/10" />
                  <rect x={x} y={yFg} width="22" height={hFg} rx="5" fill="url(#gal-bar)" />
                </g>
              ))}
            </svg>
          </div>
        </Tile>

        {/* Analytics */}
        <Tile title="Analytics">
          <div className="p-4 sm:p-5">
            <svg viewBox="0 0 240 150" className="h-auto w-full">
              <defs>
                <linearGradient id="gal-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f9d8f" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0f9d8f" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M10 110 L50 86 L90 96 L130 60 L170 76 L210 40 L230 30 L230 130 L10 130 Z" fill="url(#gal-area)" />
              <polyline points="10,110 50,86 90,96 130,60 170,76 210,40 230,30" fill="none" stroke="#0f9d8f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="170" cy="76" r="4.5" className="fill-white dark:fill-[#12161f]" stroke="#0f9d8f" strokeWidth="3" />
              <circle cx="230" cy="30" r="4.5" className="fill-white dark:fill-[#12161f]" stroke="#7c3aed" strokeWidth="3" />
            </svg>
          </div>
        </Tile>

        {/* AI Chat */}
        <Tile title="AI Chat">
          <div className="grid gap-2.5 p-4 sm:p-5">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-teal-600 to-violet-600 px-3.5 py-2.5 text-xs text-white">
              Find unused subscriptions
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600 dark:bg-white/5 dark:text-slate-300">
              Found 3 — cancelling all saves ₹1,178/mo.
            </div>
          </div>
        </Tile>

        {/* Budget Planner */}
        <Tile title="Budget Planner">
          <div className="grid gap-3.5 p-4 sm:p-5">
            {[
              { label: "Bills", pct: 82, color: "#0ea5e9" },
              { label: "Wants", pct: 93, color: "#f59e0b" },
              { label: "Invest", pct: 40, color: "#8b5cf6" },
            ].map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{p.label}</span>
                  <span style={mono}>{p.pct}%</span>
                </div>
                <div className="h-2 rounded-md bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-md" style={{ width: `${p.pct}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </Tile>

        {/* Goals */}
        <Tile title="Goals">
          <div className="flex items-center justify-around p-4 sm:p-5">
            {[
              { pct: "72%", dash: "136 188", color: "#10b981" },
              { pct: "90%", dash: "170 188", color: "#8b5cf6" },
            ].map((g) => (
              <svg key={g.pct} width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="30" fill="none" className="stroke-slate-100 dark:stroke-white/10" strokeWidth="8" />
                <circle cx="38" cy="38" r="30" fill="none" stroke={g.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={g.dash} transform="rotate(-90 38 38)" />
                <text x="38" y="43" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-slate-900 dark:fill-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {g.pct}
                </text>
              </svg>
            ))}
          </div>
        </Tile>

        {/* Reports */}
        <Tile title="Reports">
          <div className="grid gap-2 px-4 py-3.5 sm:px-5">
            {[
              { label: "June statement", fmt: "PDF", color: "#0ea5e9" },
              { label: "Category breakdown", fmt: "CSV", color: "#10b981" },
              { label: "Annual roll-up 2026", fmt: "PDF", color: "#8b5cf6" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                <span className="h-2 w-2 rounded" style={{ background: r.color }} />
                <span className="flex-1 text-xs text-slate-600 dark:text-slate-300">{r.label}</span>
                <span className="text-[11.5px] text-slate-400" style={mono}>{r.fmt}</span>
              </div>
            ))}
          </div>
        </Tile>
      </Reveal>
    </section>
  );
}
