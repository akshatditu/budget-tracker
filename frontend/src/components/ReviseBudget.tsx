import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Sparkles, ChevronRight, ArrowUp, ArrowDown, Minus, Lightbulb, X, Loader2 } from "lucide-react";
import { useApp } from "../lib/AppContext";
import {
  useBudgetRevisionDraft,
  useGenerateRevision,
  useAcceptRevision,
  useDiscardRevision,
} from "../api/hooks";
import { money, sectionColor } from "../lib/format";
import { Button } from "./ui";
import type { BudgetRevisionDraft, RevisionItem } from "../types/api";

const LOADING_LINES = [
  "Reading how you actually spend…",
  "Spotting your over- and under-spends…",
  "Rebalancing within your income…",
  "Drafting your revised budget…",
];

/** "Revise with AI" — for users who already have a budget + spending history. Opens a side
 *  drawer that asks what's changed, then shows the AI's revised budget vs the current one as a
 *  draft the user can accept or discard. */
export default function ReviseBudget({ className = "", banner = false }: { className?: string; banner?: boolean }) {
  const { year } = useApp();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const draftQuery = useBudgetRevisionDraft(year);
  const draft = draftQuery.data ?? null;
  const generate = useGenerateRevision(year);
  const accept = useAcceptRevision(year);
  const discard = useDiscardRevision(year);

  const busy = generate.isPending || accept.isPending || discard.isPending;

  const submit = () => generate.mutate({ user_note: note.trim() || undefined });
  const close = () => {
    setOpen(false);
    setNote("");
    generate.reset();
  };

  return (
    <>
      {banner ? (
        <button
          onClick={() => setOpen(true)}
          className={`flex w-full items-center gap-3.5 rounded-[var(--radius)] p-[17px] text-left text-white ${className}`}
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))", boxShadow: "0 10px 26px color-mix(in srgb, var(--accent) 35%, transparent)" }}
        >
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-white/20">
            <Sparkles size={20} />
          </span>
          <span className="flex-1">
            <span className="block text-[15.5px] font-extrabold tracking-tight">Revise with AI</span>
            <span className="mt-0.5 block text-xs font-semibold opacity-90">Tune your budget to how you actually spend.</span>
          </span>
          <ChevronRight size={18} className="opacity-90" />
        </button>
      ) : (
        <Button variant="outline" className={className} onClick={() => setOpen(true)}>
          <Sparkles size={16} /> Revise with AI
        </Button>
      )}

      {open && (
        <Drawer onClose={close}>
          {draftQuery.isLoading ? (
            <Centered><Loader2 className="animate-spin text-dim" size={26} /></Centered>
          ) : generate.isPending ? (
            <LoadingPane onClose={close} />
          ) : draft ? (
            <ReviewPane
              draft={draft}
              onAccept={() => accept.mutate(undefined, { onSuccess: close })}
              onDiscard={() => discard.mutate(undefined, { onSuccess: () => setNote("") })}
              busy={busy}
              onClose={close}
            />
          ) : (
            <AskPane note={note} setNote={setNote} onSubmit={submit} isError={generate.isError} onClose={close} />
          )}
        </Drawer>
      )}
    </>
  );
}

/** Right-side slide-over drawer. Full-height column: sticky header + scrollable body + sticky footer
 *  are provided by the panes themselves. */
function Drawer({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 anim-fade" onClick={onClose} />
      <div className="anim-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-[var(--shadow)]">
        {children}
      </div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid flex-1 place-items-center p-8">{children}</div>;
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
      <h3 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-ink">
        <Sparkles size={16} style={{ color: "var(--accent)" }} /> {title}
      </h3>
      <button onClick={onClose} className="grid h-[30px] w-[30px] place-items-center rounded-full bg-surface2 text-dim hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}

function LoadingPane({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <Header title="Revise budget with AI" onClose={onClose} />
      <Centered>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent)" }} />
          <p className="text-sm font-bold text-ink">{LOADING_LINES[i]}</p>
        </div>
      </Centered>
    </>
  );
}

function AskPane({
  note,
  setNote,
  onSubmit,
  isError,
  onClose,
}: {
  note: string;
  setNote: (v: string) => void;
  onSubmit: () => void;
  isError: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <Header title="Revise budget with AI" onClose={onClose} />
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <p className="text-sm font-medium text-dim">
          The AI studies your actual spending this year — plus your goals, income trend and life
          profile — and reallocates your budget within your income; fixed bills stay put. Tell it
          anything that's changed so the recommendation fits your life.
        </p>
        <div>
          <span className="mb-1.5 block text-[11.5px] font-bold text-dim">What's changed since your last budget?</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="e.g. My income went up, I started a car EMI, planning a vacation in December, want to save more…"
            className="w-full min-w-0 rounded-[var(--radiusXs)] border border-line px-3.5 py-3 text-sm font-medium text-ink outline-none transition focus:border-[var(--accent)]"
            style={{ background: "var(--bg)" }}
          />
        </div>
        {isError && (
          <p className="text-xs font-bold" style={{ color: "var(--neg)" }}>
            Couldn't generate a revision. Please try again.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={onSubmit}>Nothing's changed — continue</Button>
        <Button onClick={onSubmit}><Sparkles size={16} /> Generate revision</Button>
      </div>
    </>
  );
}

function ReviewPane({
  draft,
  onAccept,
  onDiscard,
  busy,
  onClose,
}: {
  draft: BudgetRevisionDraft;
  onAccept: () => void;
  onDiscard: () => void;
  busy: boolean;
  onClose: () => void;
}) {
  // Group items by section, preserving the order they arrive in.
  const groups = useMemo(() => {
    const out: { section: string; items: RevisionItem[] }[] = [];
    for (const it of draft.items) {
      let g = out.find((x) => x.section === it.section);
      if (!g) {
        g = { section: it.section, items: [] };
        out.push(g);
      }
      g.items.push(it);
    }
    return out;
  }, [draft.items]);

  const changed = draft.items.filter((it) => Math.abs(it.delta) >= 1).length;

  return (
    <>
      <Header title="Your AI-revised budget" onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-4 text-sm font-medium text-dim">
          {changed > 0
            ? `Reallocated across ${changed} ${changed === 1 ? "category" : "categories"} — fixed bills untouched. Accepting updates your full-year budget. Review, then accept or discard.`
            : "Your budget already matches your spending — no meaningful changes suggested."}
        </p>

        {draft.insights.length > 0 && (
          <div className="mb-5 rounded-[var(--radiusSm)] border border-line p-4" style={{ background: "color-mix(in srgb, var(--accent) 7%, transparent)" }}>
            <div className="mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[.04em]" style={{ color: "var(--accent)" }}>
              <Lightbulb size={14} /> AI insights
            </div>
            <ul className="space-y-1.5">
              {draft.insights.map((s, idx) => (
                <li key={idx} className="flex gap-2 text-[13px] font-medium leading-snug text-ink">
                  <span style={{ color: "var(--accent)" }}>•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.section}>
              <div className="mb-1.5 flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[.04em] text-dim">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(g.section) }} />
                {g.section}
              </div>
              <div className="divide-y divide-[var(--border)] rounded-[var(--radiusSm)] border border-line">
                {g.items.map((it) => (
                  <ComparisonRow key={it.subcategory_id} item={it} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5">
        <Button variant="danger" onClick={onDiscard} disabled={busy}>Discard</Button>
        <Button onClick={onAccept} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Accept revised budget
        </Button>
      </div>
    </>
  );
}

function ComparisonRow({ item }: { item: RevisionItem }) {
  const up = item.delta >= 1;
  const down = item.delta <= -1;
  const color = up ? "var(--pos)" : down ? "var(--neg)" : "var(--dim)";
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  const deltaLabel = up || down ? `${up ? "+" : "−"}${money(Math.abs(item.delta))}` : "No change";

  return (
    <div className="px-3.5 py-3">
      {/* Name gets its own full-width line so it's never squeezed. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-[14px] font-bold leading-snug text-ink">{item.name}</div>
        <div className="flex shrink-0 items-center gap-1 text-[12px] font-bold" style={{ color }}>
          <Icon size={13} /> {deltaLabel}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="num text-[13px] font-semibold text-dim line-through">{money(item.current_annual)}</span>
        <ChevronRight size={14} className="text-faint" />
        <span className="num text-[14.5px] font-extrabold text-ink">{money(item.revised_annual)}</span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">/yr</span>
      </div>
      {item.reason && <div className="mt-1 text-[11.5px] font-medium leading-snug text-dim">{item.reason}</div>}
    </div>
  );
}
