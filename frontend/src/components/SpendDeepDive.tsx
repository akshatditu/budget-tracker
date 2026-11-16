import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { money, sectionColor } from "../lib/format";
import type { CategoryKind, Rollup, RollupItem } from "../types/api";

/* Annual rollup "Spend deep dive": category/status filters → KPI strip → category mix →
   per-sub-item chart with a detail panel. Every figure comes from the existing rollup
   payload (sections[].items[] + totals); status buckets are derived client-side. */

type Status = "over" | "pace" | "ok";
type CatFilter = "all" | string;
type StatusFilter = "all" | Status;
type Tab = "bva" | "overspend" | "setaside";
type Scale = "pct" | "amount";
type SortKey = "overspent" | "used" | "remaining" | "revised";

interface Row extends RollupItem {
  section: string;
  kind: CategoryKind;
  status: Status;
  /** Spend beyond the elapsed months' budget while still within the annual budget. */
  pace_gap: number;
}

const STATUS_META: Record<Status, { label: string; color: string }> = {
  over: { label: "Over budget", color: "var(--neg)" },
  pace: { label: "Ahead of pace", color: "var(--warn)" },
  ok: { label: "On track", color: "var(--pos)" },
};

/** Annual view of one sub-item, judged against the whole-year revised budget:
 *  - over budget (spent > revised): overspent = spent − revised, nothing is set aside,
 *    remaining = revised − spent (negative).
 *  - otherwise: set aside = elapsed months' unspent budget net of any month that went
 *    over (the API's set_aside − overspent, floored at 0); remaining = revised − spent −
 *    set aside, i.e. the budget still ahead for the coming months.
 *  The API's per-month set_aside/overspent aren't netted against each other, which made
 *  an over-budget item show both a big set aside and an inflated negative remaining. */
const annualize = (it: RollupItem, section: string, kind: CategoryKind): Row => {
  const elapsedSlack = it.set_aside - it.overspent; // elapsed revised − elapsed spent
  const over = it.spent > it.revised;
  const overspent = over ? it.spent - it.revised : 0;
  const set_aside = over ? 0 : Math.max(0, Math.min(elapsedSlack, it.revised - it.spent));
  const pace_gap = over ? 0 : Math.max(0, -elapsedSlack);
  return {
    ...it,
    section,
    kind,
    overspent,
    set_aside,
    available: set_aside - overspent,
    current: it.spent + set_aside,
    remaining: it.revised - it.spent - set_aside,
    pace_gap,
    status: over ? "over" : pace_gap > 0 ? "pace" : "ok",
  };
};

const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);
const pctLabel = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");
const soft = (color: string, amt = 40) => `color-mix(in srgb, ${color} ${amt}%, transparent)`;
const TRACK = "color-mix(in srgb, var(--faint) 22%, transparent)";
const spentWord = (k: CategoryKind) => (k === "investment" ? "invested" : "spent");

const SORTS: { key: SortKey; label: string; fn: (a: Row, b: Row) => number }[] = [
  { key: "overspent", label: "Overspent", fn: (a, b) => b.overspent - a.overspent || a.remaining - b.remaining },
  { key: "used", label: "% used", fn: (a, b) => ratio(b.spent, b.revised) - ratio(a.spent, a.revised) },
  { key: "remaining", label: "Remaining", fn: (a, b) => a.remaining - b.remaining },
  { key: "revised", label: "Revised budget", fn: (a, b) => b.revised - a.revised },
];

const sum = (rows: Row[], k: keyof RollupItem) => rows.reduce((a, r) => a + (r[k] as number), 0);

// ───────────────────────────── small primitives ─────────────────────────────

const panelCls = "min-w-0 rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow)]";

function Chip({ on, onClick, dot, children, count }: { on: boolean; onClick: () => void; dot?: string; children: ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
        on ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink hover:bg-surface2"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {children}
      {count !== undefined && <span className={`text-[11.5px] ${on ? "opacity-70" : "text-dim"}`}>{count}</span>}
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[]; size?: "md" | "sm" }) {
  return (
    <div className="inline-flex rounded-[var(--radiusSm)] bg-surface2 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-[var(--radiusXs)] font-semibold transition ${size === "sm" ? "px-3 py-1 text-[12.5px]" : "px-4 py-1.5 text-[13.5px]"} ${
            value === o.key ? "bg-surface text-ink shadow-sm" : "text-dim hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: ReactNode; tone?: string }) {
  return (
    <div className={`${panelCls} px-4 py-3.5`}>
      <div className="text-[12.5px] font-medium text-dim">{label}</div>
      <div className="num mt-1 text-[21px] font-bold tracking-tight" style={{ color: tone }}>{value}</div>
      <div className="mt-1 text-[11.5px] text-dim">{sub}</div>
    </div>
  );
}

/** A horizontal bar track with absolutely-positioned segments (fractions 0..1 of the track). */
function Track({ segs, tick, h = 14 }: { segs: { from: number; to: number; color: string }[]; tick?: number; h?: number }) {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  return (
    <div className="relative w-full" style={{ height: h }}>
      {segs.map((s, i) => (
        <div
          key={i}
          className="absolute top-0 h-full rounded-[3px]"
          style={{ left: `${clamp(s.from) * 100}%`, width: `${Math.max(0, clamp(s.to) - clamp(s.from)) * 100}%`, background: s.color }}
        />
      ))}
      {tick !== undefined && (
        <div className="absolute -top-[3px] w-[2px] rounded bg-ink" style={{ left: `calc(${clamp(tick) * 100}% - 1px)`, height: h + 6 }} />
      )}
    </div>
  );
}

// ───────────────────────────── main view ─────────────────────────────

export default function SpendDeepDive({ data }: { data: Rollup }) {
  const all: Row[] = useMemo(
    () => data.sections.flatMap((s) => s.items.map((it) => annualize(it, s.name, s.kind))),
    [data],
  );
  const [cat, setCat] = useState<CatFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tab, setTab] = useState<Tab>("bva");
  const [scale, setScale] = useState<Scale>("pct");
  const [sort, setSort] = useState<SortKey>("overspent");
  const [selId, setSelId] = useState<number | null>(null);

  const byStatus = all.filter((r) => status === "all" || r.status === status);
  const byCat = all.filter((r) => cat === "all" || r.section === cat);
  const rows = byStatus.filter((r) => cat === "all" || r.section === cat);
  const sorted = [...rows].sort(SORTS.find((s) => s.key === sort)!.fn);

  const sel = sorted.find((r) => r.subcategory_id === selId) ?? sorted[0];
  const selIdx = sel ? sorted.indexOf(sel) : -1;
  const step = (d: number) => sorted.length && setSelId(sorted[(selIdx + d + sorted.length) % sorted.length].subcategory_id);

  const t = {
    revised: sum(rows, "revised"),
    spent: sum(rows, "spent"),
    set_aside: sum(rows, "set_aside"),
    overspent: sum(rows, "overspent"),
    available: sum(rows, "available"),
    remaining: sum(rows, "remaining"),
  };
  const overCount = rows.filter((r) => r.overspent > 0).length;
  const hasInvest = rows.some((r) => r.kind === "investment");
  const scopeLabel = cat === "all" ? "All categories" : cat;

  return (
    <div className="space-y-5">
      {/* filters */}
      <div className={`${panelCls} flex flex-wrap items-center gap-2 px-4 py-3`}>
        <span className="mr-1 text-[11px] font-bold uppercase tracking-[.08em] text-dim">Category</span>
        <Chip on={cat === "all"} onClick={() => setCat("all")} count={byStatus.length}>All</Chip>
        {data.sections.map((s) => (
          <Chip key={s.name} on={cat === s.name} onClick={() => setCat(s.name)} dot={sectionColor(s.name)} count={byStatus.filter((r) => r.section === s.name).length}>
            {s.name}
          </Chip>
        ))}
        <span className="ml-4 mr-1 text-[11px] font-bold uppercase tracking-[.08em] text-dim">Status</span>
        <Chip on={status === "all"} onClick={() => setStatus("all")} count={byCat.length}>All statuses</Chip>
        {(Object.keys(STATUS_META) as Status[]).map((k) => (
          <Chip key={k} on={status === k} onClick={() => setStatus(k)} dot={STATUS_META[k].color} count={byCat.filter((r) => r.status === k).length}>
            {STATUS_META[k].label}
          </Chip>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        <Stat label="Revised budget" value={money(t.revised)} sub={`${rows.length} sub-items`} />
        <Stat label={hasInvest ? "Spent + invested" : "Spent"} value={money(t.spent)} sub={`${pctLabel(t.spent, t.revised)} of revised`} />
        <Stat label="Set aside" value={money(t.set_aside)} sub="Saved for future spend" />
        <Stat label="Overspent" value={money(t.overspent)} tone={t.overspent > 0 ? "var(--neg)" : undefined} sub={`${overCount} of ${rows.length} sub-items`} />
        <Stat label="Available" value={money(t.available)} tone={t.available < 0 ? "var(--neg)" : undefined} sub="Set aside − overspent" />
        <Stat label="Remaining" value={money(t.remaining)} tone={t.remaining < 0 ? "var(--neg)" : undefined} sub="Revised − spent − set aside" />
      </div>

      <CategoryMix data={data} rows={byStatus} />

      {rows.length === 0 ? (
        <div className={`${panelCls} p-10 text-center text-sm text-dim`}>No sub-items match these filters.</div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className={`${panelCls} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented value={tab} onChange={setTab} options={[{ key: "bva", label: "Budget vs actual" }, { key: "overspend", label: "Overspend" }, { key: "setaside", label: "Set-aside health" }]} />
              {tab === "bva" && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-dim">Scale</span>
                  <Chip on={scale === "pct"} onClick={() => setScale("pct")}>% of budget</Chip>
                  <Chip on={scale === "amount"} onClick={() => setScale("amount")}>₹ amount</Chip>
                </div>
              )}
            </div>

            {tab === "bva" && <BudgetVsActual rows={sorted} scale={scale} scope={scopeLabel} sel={sel} onSelect={setSelId} sort={sort} onSort={setSort} />}
            {tab === "overspend" && <Overspend rows={sorted} scope={scopeLabel} sel={sel} onSelect={setSelId} />}
            {tab === "setaside" && <SetAsideHealth rows={sorted} scope={scopeLabel} sel={sel} onSelect={setSelId} />}
          </div>

          {sel && <Detail row={sel} idx={selIdx} total={sorted.length} all={all} data={data} onStep={step} />}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── category mix ─────────────────────────────

function CategoryMix({ data, rows }: { data: Rollup; rows: Row[] }) {
  const secs = data.sections
    .map((s) => {
      const rs = rows.filter((r) => r.section === s.name);
      return { name: s.name, kind: s.kind, n: rs.length, revised: sum(rs, "revised"), spent: sum(rs, "spent"), overspent: sum(rs, "overspent") };
    })
    .filter((s) => s.n > 0);
  const outflow = secs.reduce((a, s) => a + s.spent, 0);
  if (!secs.length) return null;

  return (
    <div className={`${panelCls} grid grid-cols-1 gap-5 p-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`}>
      <div>
        <h3 className="text-[16px] font-bold tracking-tight">Category mix</h3>
        <div className="mt-0.5 text-[12.5px] text-dim">Share of total outflow (spent + invested) · <span className="num">{money(outflow)}</span></div>
        <div className="mt-3 flex h-7 gap-[3px] overflow-hidden rounded-md">
          {secs.map((s) => {
            const share = ratio(s.spent, outflow);
            return share > 0 ? (
              <div key={s.name} className="flex items-center px-2 text-[11px] font-bold text-white" style={{ flexGrow: share, flexBasis: 0, background: sectionColor(s.name) }} title={`${s.name}: ${money(s.spent)}`}>
                {share >= 0.06 && `${Math.round(share * 100)}%`}
              </div>
            ) : null;
          })}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {secs.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-[12px] text-dim">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: sectionColor(s.name) }} />{s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {secs.map((s) => {
          const c = sectionColor(s.name);
          return (
            <div key={s.name} className={`rounded-[var(--radiusSm)] border border-line p-3.5 ${s.kind === "investment" ? "md:col-span-3" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13.5px] font-bold"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{s.name}</span>
                <span className="text-[11.5px] text-dim">{s.n} items</span>
              </div>
              <div className="num mt-1.5 text-[19px] font-bold tracking-tight">{money(s.spent)}</div>
              <div className="mt-1 text-[11.5px] text-dim">{pctLabel(s.spent, s.revised)} of <span className="num">{money(s.revised)}</span> {spentWord(s.kind)}</div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: soft(c, 18) }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(1, ratio(s.spent, s.revised)) * 100}%`, background: c }} />
              </div>
              <div className="mt-2 text-[11.5px]" style={{ color: s.overspent > 0 ? "var(--neg)" : "var(--dim)" }}>
                {s.overspent > 0 ? <><span className="num">{money(s.overspent)}</span> overspent</> : "No overspend"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────── chart tabs ─────────────────────────────

interface ListProps {
  rows: Row[];
  scope: string;
  sel?: Row;
  onSelect: (id: number) => void;
}

function Legend({ items }: { items: { label: string; color: string; tick?: boolean }[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[12px] text-dim">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.tick && <span className="-ml-1 h-3 w-[2px] bg-ink" />}
          {i.label}
        </span>
      ))}
    </div>
  );
}

function SectionLegend({ rows }: { rows: Row[] }) {
  const names = [...new Set(rows.map((r) => r.section))];
  return <Legend items={names.map((n) => ({ label: n, color: sectionColor(n) }))} />;
}

/** One clickable chart row: name · bar · right-hand label. */
function ChartRow({ row, sel, onSelect, children, right }: { row: Row; sel?: Row; onSelect: (id: number) => void; children: ReactNode; right: ReactNode }) {
  const on = sel?.subcategory_id === row.subcategory_id;
  return (
    <button
      onClick={() => onSelect(row.subcategory_id)}
      className={`grid w-full grid-cols-[170px_minmax(0,1fr)_110px] items-center gap-3 rounded-[var(--radiusXs)] px-2 py-1.5 text-left transition ${on ? "bg-surface2" : "hover:bg-surface2/60"}`}
    >
      <span className={`flex min-w-0 items-center gap-2 text-[13px] ${on ? "font-bold" : "font-medium"}`}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: sectionColor(row.section) }} />
        <span className="truncate">{row.name}</span>
      </span>
      {children}
      <span className="num text-right text-[11.5px] leading-tight">{right}</span>
    </button>
  );
}

function Axis({ ticks, caption }: { ticks: { at: number; label: string }[]; caption: string }) {
  return (
    <div className="grid grid-cols-[170px_minmax(0,1fr)_110px] gap-3 px-2 pt-1.5">
      <span />
      <div className="relative h-4">
        {ticks.map((t) => (
          <span key={t.label} className="num absolute -translate-x-1/2 text-[10.5px] text-dim" style={{ left: `${t.at * 100}%` }}>{t.label}</span>
        ))}
      </div>
      <span className="text-right text-[10.5px] text-dim">{caption}</span>
    </div>
  );
}

/** Faint vertical gridlines behind the bars. */
function Gridlines({ at }: { at: number[] }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-[calc(170px+1.25rem)] right-[calc(110px+1.25rem)]">
      {at.map((x) => <div key={x} className="absolute inset-y-0 w-px bg-line" style={{ left: `${x * 100}%` }} />)}
    </div>
  );
}

function BudgetVsActual({ rows, scale, scope, sel, onSelect, sort, onSort }: ListProps & { scale: Scale; sort: SortKey; onSort: (s: SortKey) => void }) {
  // Domain: in % mode each row is scaled to its own revised budget (tick always at 100%);
  // in ₹ mode all rows share one amount axis (tick at that row's revised).
  const val = (r: Row, x: number) => (scale === "pct" ? ratio(x, r.revised) : x);
  const peak = Math.max(...rows.map((r) => Math.max(val(r, r.revised), val(r, r.spent + r.set_aside))), scale === "pct" ? 1 : 0);
  const max = scale === "pct" ? Math.ceil(peak) || 1 : peak || 1;
  const pctStep = Math.max(1, Math.ceil(max / 5));
  const ticks = scale === "pct"
    ? Array.from({ length: Math.floor(max / pctStep) + 1 }, (_, i) => ({ at: (i * pctStep) / max, label: `${i * pctStep * 100}%` }))
    : [0, 0.25, 0.5, 0.75, 1].map((f) => ({ at: f, label: f === 0 ? "₹0" : money(max * f) }));

  return (
    <>
      <h3 className="mt-5 text-[16px] font-bold tracking-tight">Budget vs actual by sub-item</h3>
      <div className="mt-0.5 text-[12.5px] text-dim">
        {scope} · {rows.length} sub-items · {scale === "pct" ? "each bar is scaled to its own revised budget, so the tick is always 100%" : "all bars share one ₹ axis; the tick marks each sub-item's revised budget"}
      </div>
      <Legend items={[
        ...[...new Set(rows.map((r) => r.section))].map((n) => ({ label: n, color: sectionColor(n) })),
        { label: "Spent", color: "var(--dim)" },
        { label: "Set aside", color: soft("var(--dim)", 35) },
        { label: "Revised budget (grey = still unused)", color: TRACK, tick: true },
      ]} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-dim">Sort by</span>
        {SORTS.map((s) => <Chip key={s.key} on={sort === s.key} onClick={() => onSort(s.key)}>{s.label}</Chip>)}
      </div>

      <div className="relative mt-3">
        <Gridlines at={ticks.map((t) => t.at)} />
        {rows.map((r) => {
          const c = sectionColor(r.section);
          const f = (x: number) => val(r, x) / max;
          const left = r.revised - r.spent - r.set_aside;
          return (
            <ChartRow key={r.subcategory_id} row={r} sel={sel} onSelect={onSelect}
              right={<>
                <div className="font-bold">{pctLabel(r.spent, r.revised)} {spentWord(r.kind)}</div>
                <div style={{ color: left < 0 ? "var(--neg)" : "var(--dim)" }}>{money(left)} left</div>
              </>}
            >
              <Track
                h={14}
                tick={f(r.revised)}
                segs={[
                  { from: 0, to: f(r.revised), color: TRACK },
                  { from: f(r.spent), to: f(r.spent + r.set_aside), color: soft(c, 40) },
                  { from: 0, to: f(r.spent), color: c },
                ]}
              />
            </ChartRow>
          );
        })}
      </div>
      <Axis ticks={ticks} caption={scale === "pct" ? "of revised budget" : "amount"} />
    </>
  );
}

function Overspend({ rows, scope, sel, onSelect }: ListProps) {
  const over = [...rows].filter((r) => r.overspent > 0).sort((a, b) => b.overspent - a.overspent);
  const max = Math.max(...over.map((r) => r.overspent), 1);
  return (
    <>
      <h3 className="mt-5 text-[16px] font-bold tracking-tight">Overspend by sub-item</h3>
      <div className="mt-0.5 text-[12.5px] text-dim">{scope} · {over.length} of {rows.length} sub-items spent more than their revised budget</div>
      <SectionLegend rows={over} />
      {over.length === 0 ? (
        <div className="py-10 text-center text-sm text-dim">Nothing overspent here.</div>
      ) : (
        <div className="mt-3">
          {over.map((r) => (
            <ChartRow key={r.subcategory_id} row={r} sel={sel} onSelect={onSelect}
              right={<><div className="font-bold" style={{ color: "var(--neg)" }}>{money(r.overspent)}</div><div className="text-dim">{pctLabel(r.overspent, r.revised)} of budget</div></>}
            >
              <Track segs={[{ from: 0, to: r.overspent / max, color: "var(--neg)" }]} />
            </ChartRow>
          ))}
        </div>
      )}
    </>
  );
}

function SetAsideHealth({ rows, scope, sel, onSelect }: ListProps) {
  const list = [...rows].sort((a, b) => a.available - b.available);
  const max = Math.max(...list.map((r) => Math.max(r.set_aside, r.overspent)), 1);
  return (
    <>
      <h3 className="mt-5 text-[16px] font-bold tracking-tight">Set-aside health by sub-item</h3>
      <div className="mt-0.5 text-[12.5px] text-dim">{scope} · set aside vs overspent; available = set aside − overspent (most depleted first)</div>
      <Legend items={[{ label: "Set aside", color: soft("var(--dim)", 35) }, { label: "Overspent", color: "var(--neg)" }]} />
      <div className="mt-3">
        {list.map((r) => (
          <ChartRow key={r.subcategory_id} row={r} sel={sel} onSelect={onSelect}
            right={<><div className="font-bold" style={{ color: r.available < 0 ? "var(--neg)" : "var(--pos)" }}>{money(r.available)}</div><div className="text-dim">available</div></>}
          >
            <div className="flex flex-col gap-1">
              <Track h={7} segs={[{ from: 0, to: r.set_aside / max, color: soft(sectionColor(r.section), 45) }]} />
              <Track h={7} segs={[{ from: 0, to: r.overspent / max, color: "var(--neg)" }]} />
            </div>
          </ChartRow>
        ))}
      </div>
    </>
  );
}

// ───────────────────────────── detail panel ─────────────────────────────

function DetailBar({ label, value, segs, tick, tone }: { label: string; value: number; segs: { from: number; to: number; color: string }[]; tick?: number; tone?: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)_84px] items-center gap-2.5 py-1.5">
      <span className="text-[12.5px] text-dim">{label}</span>
      <Track h={12} segs={segs} tick={tick} />
      <span className="num text-right text-[12.5px] font-bold" style={{ color: tone }}>{money(value)}</span>
    </div>
  );
}

function Detail({ row: r, idx, total, all, data, onStep }: { row: Row; idx: number; total: number; all: Row[]; data: Rollup; onStep: (d: number) => void }) {
  const c = sectionColor(r.section);
  const meta = STATUS_META[r.status];
  const committed = r.spent + r.set_aside;
  const span = Math.max(r.revised, committed, 1);
  const f = (x: number) => x / span;
  const fundMax = Math.max(r.set_aside, r.overspent, 1);
  const secSpent = data.sections.find((s) => s.name === r.section)?.totals.spent ?? 0;
  const overRanked = all.filter((x) => x.overspent > 0).sort((a, b) => b.overspent - a.overspent);
  const rank = overRanked.findIndex((x) => x.subcategory_id === r.subcategory_id);
  const word = spentWord(r.kind);

  const fundMsg =
    r.overspent > 0
      ? { tone: "neg", text: <>{word === "spent" ? "Spent" : "Invested"} <span className="num">{money(r.overspent)}</span> more than the <span className="num">{money(r.revised)}</span> revised budget, so nothing is set aside.</> }
      : r.pace_gap > 0
        ? { tone: "warn", text: <>{word === "spent" ? "Spending" : "Investing"} is <span className="num">{money(r.pace_gap)}</span> ahead of the budget for the months so far, so nothing is set aside yet.</> }
        : { tone: "pos", text: <><span className="num">{money(r.set_aside)}</span> of past months' budget went unspent and is set aside.</> };

  return (
    <div className={`${panelCls} p-5 xl:sticky xl:top-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-dim">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} />{r.section} <span className="font-medium">· {idx + 1} of {total}</span>
          </div>
          <h3 className="mt-1 truncate text-[20px] font-bold tracking-tight">{r.name}</h3>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => onStep(-1)} aria-label="Previous sub-item" className="grid h-8 w-8 place-items-center rounded-[var(--radiusXs)] border border-line hover:bg-surface2"><ChevronLeft size={16} /></button>
          <button onClick={() => onStep(1)} aria-label="Next sub-item" className="grid h-8 w-8 place-items-center rounded-[var(--radiusXs)] border border-line hover:bg-surface2"><ChevronRight size={16} /></button>
        </div>
      </div>
      <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold" style={{ background: soft(meta.color, 15), color: meta.color }}>
        {r.status !== "ok" && <AlertTriangle size={12} />}{meta.label}
      </span>

      <div className="mt-4 text-[12.5px] text-dim">Remaining budget</div>
      <div className="num text-[28px] font-bold tracking-tight" style={{ color: r.remaining < 0 ? "var(--neg)" : undefined }}>{money(r.remaining)}</div>
      <div className="mt-0.5 text-[12px] text-dim">
        {r.remaining < 0
          ? <>{word === "spent" ? "Spent" : "Invested"} is <span className="num">{money(-r.remaining)}</span> more than the <span className="num">{money(r.revised)}</span> revised budget</>
          : <><span className="num">{money(r.remaining)}</span> of the <span className="num">{money(r.revised)}</span> revised budget is left for the coming months</>}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-[13.5px] font-bold">Where the budget went</span>
        <span className="text-[11px] text-dim">tick = revised budget</span>
      </div>
      <DetailBar label="Revised budget" value={r.revised} tick={f(r.revised)} segs={[{ from: 0, to: f(r.revised), color: soft("var(--faint)", 55) }]} />
      <DetailBar label={word === "spent" ? "Spent" : "Invested"} value={r.spent} tick={f(r.revised)} segs={[{ from: 0, to: f(r.spent), color: c }]} />
      <DetailBar label="Set aside" value={r.set_aside} tick={f(r.revised)} segs={[{ from: f(r.spent), to: f(committed), color: soft(c, 40) }]} />
      <DetailBar label="Remaining" value={r.remaining} tone={r.remaining < 0 ? "var(--neg)" : undefined} tick={f(r.revised)}
        segs={[r.remaining < 0 ? { from: f(r.revised), to: f(committed), color: "var(--neg)" } : { from: f(committed), to: f(r.revised), color: soft("var(--pos)", 55) }]} />

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[13.5px] font-bold">Set-aside fund</span>
        <span className="text-[11px] text-dim">set aside = unspent budget of past months</span>
      </div>
      <DetailBar label="Set aside" value={r.set_aside} segs={[{ from: 0, to: r.set_aside / fundMax, color: soft(c, 40) }]} />
      <DetailBar label="Overspent" value={r.overspent} segs={[{ from: 0, to: r.overspent / fundMax, color: "var(--neg)" }]} />
      <div className="mt-2 rounded-[var(--radiusXs)] px-3 py-2.5 text-[12.5px]" style={{ background: soft(`var(--${fundMsg.tone})`, 12), color: `var(--${fundMsg.tone})` }}>
        {fundMsg.text}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <MiniStat label={`Budget ${word}`} value={pctLabel(r.spent, r.revised)} sub={<><span className="num">{money(r.spent)}</span> of <span className="num">{money(r.revised)}</span></>} />
        <MiniStat label="Committed" value={pctLabel(committed, r.revised)} tone={committed > r.revised ? "var(--neg)" : undefined} sub={`${word} + set aside`} />
        <MiniStat label={`Share of ${r.section}`} value={pctLabel(r.spent, secSpent)} sub={<>of <span className="num">{money(secSpent)}</span> {word}</>} />
        <MiniStat label="Overspend rank" value={rank >= 0 ? `#${rank + 1}` : "—"} sub={rank >= 0 ? `of ${overRanked.length} overspent sub-items` : "not overspent"} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, tone }: { label: string; value: string; sub: ReactNode; tone?: string }) {
  return (
    <div className="rounded-[var(--radiusXs)] bg-surface2 px-3 py-2.5">
      <div className="text-[11.5px] text-dim">{label}</div>
      <div className="num mt-0.5 text-[18px] font-bold" style={{ color: tone }}>{value}</div>
      <div className="mt-0.5 text-[10.5px] text-dim">{sub}</div>
    </div>
  );
}
